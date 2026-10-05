import AppKit
import CryptoKit
import ImageIO
import Observation
import ServiceManagement
import UniformTypeIdentifiers

/// UserDefaults keys. SettingsView writes them through @AppStorage; WallpaperManager watches them.
enum Pref {
    static let enabled = "enabled"
    static let dynamic = "useDynamicWallpapers"
    static let corners = "roundCorners"
    static let radius = "cornerRadius"            // index into WallpaperManager.radii
    static let builtInOnly = "builtInOnly"
    static let rotate = "rotate"
    static let rotateFolder = "rotateFolder"
    static let rotateEvery = "rotateEvery"        // seconds
    static let hideIcon = "hideMenuBarIcon"
    static var defaults: [String: Any] { [dynamic: true, corners: true, radius: 1, rotateEvery: 3600] }
}

/// The wallpaper a copy was made from: enough to make the copy again, or to put the original back.
struct Original: Codable, Equatable {
    var url: URL
    var scaling: Int
    var clipping: Bool
    var fill: [Double]?

    /// What macOS reports for Aerials, Colours and built-in thumbnails. Baking the band into one of
    /// these would swap a live wallpaper for a still, so they're left alone.
    private static let standIns = ["/System/Library/Wallpapers/", "/System/Library/CoreServices/", "/.thumbnails/",
                                   "/com.apple.idleassetsd/", "/com.apple.wallpaper/"]

    /// nil unless it's a plain picture file that's safe to edit.
    init?(url: URL, options: [NSWorkspace.DesktopImageOptionKey: Any]?) {
        let values = try? url.resourceValues(forKeys: [.isRegularFileKey, .contentTypeKey])
        let resolved = url.resolvingSymlinksInPath().path
        guard let options, !options.isEmpty,                          // Colours come with no options
              values?.isRegularFile == true, values?.contentType?.conforms(to: .image) == true,
              !Self.standIns.contains(where: resolved.contains) else { return nil }
        self.url = url
        scaling = (options[.imageScaling] as? NSNumber)?.intValue ?? Int(NSImageScaling.scaleProportionallyUpOrDown.rawValue)
        clipping = (options[.allowClipping] as? NSNumber)?.boolValue ?? false
        fill = (options[.fillColor] as? NSColor)?.usingColorSpace(.sRGB)
            .map { [Double($0.redComponent), Double($0.greenComponent), Double($0.blueComponent)] }
    }

    /// The next picture of a rotation, placed the way the current one was.
    init(url: URL, like other: Original?) {
        self.url = url
        scaling = other?.scaling ?? Int(NSImageScaling.scaleProportionallyUpOrDown.rawValue)
        clipping = other?.clipping ?? true
        fill = other?.fill
    }

    var options: [NSWorkspace.DesktopImageOptionKey: Any] {
        var options: [NSWorkspace.DesktopImageOptionKey: Any] = [.imageScaling: scaling, .allowClipping: clipping]
        if let fill { options[.fillColor] = NSColor(srgbRed: fill[0], green: fill[1], blue: fill[2], alpha: 1) }
        return options
    }
}

/// Keeps every screen's wallpaper in line with the settings: swaps originals for banded copies while
/// on, puts originals back while off. Public NSWorkspace calls only, so each Space is fixed up when
/// it's visited (macOS gives no way to reach the others).
@MainActor @Observable
final class WallpaperManager {
    /// One line for the popover; empty means nothing to report.
    private(set) var status = ""
    private(set) var busy = false
    /// The main screen as it looks now, small, for the popover preview. `--snapshot` sets a sample and
    /// locks it, so a website screenshot can never show the real wallpaper.
    var preview: NSImage?
    @ObservationIgnored var previewLocked = false

    /// Corner radius presets in points. Medium matches the 14 pt corners of the hand-made reference wallpaper.
    static let radii: [CGFloat] = [10, 14, 20]
    static let folder = URL.applicationSupportDirectory.appendingPathComponent("Notched", isDirectory: true)

    /// Run from the disk image, or from Downloads under App Translocation: updates and Start at login won't stick.
    let misplaced = Bundle.main.bundlePath.hasPrefix("/Volumes/") || Bundle.main.bundlePath.contains("/AppTranslocation/")

    @ObservationIgnored private let workspace = NSWorkspace.shared
    /// Copy's file name → its original. Never pruned: a Space you haven't visited in months still
    /// points at its copy, and this is how it gets its original back.
    @ObservationIgnored private var manifest: [String: Original] = UserDefaults.standard.data(forKey: "manifest")
        .flatMap { try? JSONDecoder().decode([String: Original].self, from: $0) } ?? [:]
    @ObservationIgnored private var running: Task<Void, Never>?
    @ObservationIgnored private var pending = false
    @ObservationIgnored private var lastSeen: [URL?] = []
    @ObservationIgnored private var settings = ""
    @ObservationIgnored private var rotation: URL?
    @ObservationIgnored private var unreadable: Set<URL> = []
    @ObservationIgnored private var lastSet: [CGDirectDisplayID: (output: URL, at: Date)] = [:]
    @ObservationIgnored private var menuBarHeights: [String: CGFloat] = [:]
    @ObservationIgnored private var previewSource: URL?
    @ObservationIgnored private var lastCleanUp = Date.distantPast
    @ObservationIgnored private var timer: Timer?

    func start() {
        settings = signature()
        workspace.notificationCenter.addObserver(forName: NSWorkspace.activeSpaceDidChangeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.lastSet.removeAll()
                self?.reconcile()
            }
        }
        NotificationCenter.default.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.reconcile() }
        }
        NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.settingsChanged() }
        }
        // macOS posts nothing when the wallpaper changes, so look: one cheap URL read per screen.
        timer = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        timer?.tolerance = 0.5
        reconcile()
    }

    /// Brings every screen in line. Calls during a pass fold into one more pass afterwards;
    /// `restart` abandons the current one (a long render for settings that just changed).
    func reconcile(restart: Bool = false) {
        if restart { running?.cancel() }
        guard running == nil else { pending = true; return }
        running = Task {
            await pass()
            running = nil
            if pending {
                pending = false
                reconcile()
            }
        }
    }

    // MARK: - Passes

    private func tick() {
        guard UserDefaults.standard.bool(forKey: Pref.enabled) else { return }
        rotateIfDue()
        if NSScreen.screens.map({ workspace.desktopImageURL(for: $0) }) != lastSeen { reconcile() }
    }

    /// Settings live in UserDefaults and every write lands here (the manifest's too), so act only
    /// when one that shapes the copies changed.
    private func settingsChanged() {
        let now = signature()
        guard now != settings else { return }
        settings = now
        lastSet.removeAll()
        reconcile(restart: true)
    }

    private func signature() -> String {
        let defaults = UserDefaults.standard
        return [Pref.enabled, Pref.dynamic, Pref.corners, Pref.radius, Pref.builtInOnly]
            .map { "\(defaults.object(forKey: $0) ?? "-")" }.joined(separator: "|")
    }

    private func pass() async {
        let defaults = UserDefaults.standard
        let on = defaults.bool(forKey: Pref.enabled)
        let next = rotation
        rotation = nil
        var notes: [String] = []
        var restored = false
        for screen in NSScreen.screens {
            guard let current = workspace.desktopImageURL(for: screen) else { continue }
            let ours = isOurs(current)
            let found = ours ? manifest[current.lastPathComponent] : Original(url: current, options: workspace.desktopImageOptions(for: screen))
            let included = !defaults.bool(forKey: Pref.builtInOnly) || CGDisplayIsBuiltin(screen.displayID) != 0
            guard on, included, let bar = menuBarHeight(screen) else {
                if ours, let found {
                    if let problem = restore(found, on: screen) { notes.append(problem) } else { restored = true }
                }
                continue
            }
            if found == nil, !ours, adoptShuffle(current) {
                notes.append("Took over your shuffle folder “\(current.lastPathComponent)”: macOS can't shuffle under the black bar.")
                continue
            }
            guard let original = next.map({ Original(url: $0, like: found) }) ?? found else {
                if !ours { notes.append(unsupported(current)) }
                continue
            }
            do {
                if let problem = try await apply(original, on: screen, bar: bar, showing: current) { notes.append(problem) }
            } catch {
                busy = false   // cancelled because settings changed; the follow-up pass takes over
                return
            }
        }
        busy = false
        status = notes.first ?? (on ? "Notch hidden. New wallpapers are handled automatically."
            : restored ? "Wallpaper restored. Other Spaces get theirs back when you visit them." : "")
        lastSeen = NSScreen.screens.map { workspace.desktopImageURL(for: $0) }
        refreshPreview()
        cleanUp()
    }

    /// Makes (or reuses) this screen's copy of `original` and sets it. Returns a problem worth showing.
    private func apply(_ original: Original, on screen: NSScreen, bar: CGFloat, showing current: URL) async throws -> String? {
        guard let job = job(original, screen, bar: bar) else { return "Can't find \(original.url.lastPathComponent) anymore." }
        let files = FileManager.default
        if current.standardizedFileURL == job.output.standardizedFileURL, files.fileExists(atPath: job.output.path) {
            touch(job.output)
            return nil
        }
        // Set moments ago, yet macOS still shows the original: say so instead of setting it again every tick.
        if let last = lastSet[screen.displayID], last.output == job.output, Date().timeIntervalSince(last.at) < 30, !isOurs(current) {
            return "macOS didn't accept the new wallpaper. Try choosing it again in System Settings."
        }
        if unreadable.contains(original.url) { return unsupported(original.url) }
        if !files.fileExists(atPath: job.output.path) {
            busy = true
            status = job.dynamic && frames(original.url) > 1 ? "Processing dynamic wallpaper… this takes a few seconds." : "Processing wallpaper…"
            do {
                try await WallpaperRenderer.renderInBackground(job)
            } catch is CancellationError {
                throw CancellationError()
            } catch {
                unreadable.insert(original.url)
                return unsupported(original.url)
            }
            guard NSScreen.screens.contains(screen) else { pending = true; return nil }   // display unplugged mid-render
        }
        manifest[job.output.lastPathComponent] = original
        UserDefaults.standard.set(try? JSONEncoder().encode(manifest), forKey: "manifest")
        do {
            // "Fill Screen": identical at this exact size, and it crops instead of stretching if the
            // resolution changes before the next pass re-renders.
            try workspace.setDesktopImageURL(job.output, for: screen, options: [
                .imageScaling: NSImageScaling.scaleProportionallyUpOrDown.rawValue, .allowClipping: true,
            ])
            lastSet[screen.displayID] = (job.output, Date())
        } catch {
            return "macOS didn't accept the new wallpaper: \(error.localizedDescription)"
        }
        return nil
    }

    private func job(_ original: Original, _ screen: NSScreen, bar points: CGFloat) -> RenderJob? {
        guard let values = try? original.url.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey]) else { return nil }
        let defaults = UserDefaults.standard, scale = screen.backingScaleFactor
        let width = Int((screen.frame.width * scale).rounded()), height = Int((screen.frame.height * scale).rounded())
        let bar = Int((points * scale).rounded(.up))
        let preset = Self.radii[min(max(defaults.integer(forKey: Pref.radius), 0), Self.radii.count - 1)]
        let radius = defaults.bool(forKey: Pref.corners) ? Int((preset * scale).rounded()) : 0
        let dynamic = defaults.bool(forKey: Pref.dynamic)
        // Stable across launches (Swift's Hasher isn't) and different whenever the copy would come out different.
        let key = ["v1", original.url.path, "\(values.contentModificationDate?.timeIntervalSince1970 ?? 0)", "\(values.fileSize ?? 0)",
                   "\(width)x\(height)", "\(bar)", "\(radius)", "\(dynamic)", "\(original.scaling)", "\(original.clipping)", "\(original.fill ?? [])"]
        let name = SHA256.hash(data: Data(key.joined(separator: "|").utf8)).prefix(10).map { String(format: "%02x", $0) }.joined()
        return RenderJob(source: original.url, output: Self.folder.appendingPathComponent(name + ".heic"), width: width, height: height,
                         bar: bar, radius: radius, scaling: original.scaling, clipping: original.clipping, fill: original.fill, dynamic: dynamic)
    }

    /// This screen's menu bar height in points, or nil when it has none (a second display while
    /// "Displays have separate Spaces" is off). Remembered per display, so a full-screen Space or an
    /// auto-hiding menu bar doesn't change the copy; before it's ever been seen, the notch height.
    private func menuBarHeight(_ screen: NSScreen) -> CGFloat? {
        let key = "\(screen.displayID)@\(screen.frame.size)"
        let showing = screen.frame.maxY - screen.visibleFrame.maxY
        if showing > 0 { menuBarHeights[key] = showing }
        let height = menuBarHeights[key] ?? screen.safeAreaInsets.top
        return height > 0 ? height : nil
    }

    private func restore(_ original: Original, on screen: NSScreen) -> String? {
        do {
            try workspace.setDesktopImageURL(original.url, for: screen, options: original.options)
            return nil
        } catch {
            return "Couldn't put back \(original.url.lastPathComponent): \(error.localizedDescription)"
        }
    }

    private func unsupported(_ url: URL) -> String {
        "Can't edit \(url.lastPathComponent). Aerials, colours and live wallpapers stay as they are; choose a picture or a dynamic wallpaper."
    }

    private func isOurs(_ url: URL) -> Bool {
        url.deletingLastPathComponent().standardizedFileURL.path == Self.folder.standardizedFileURL.path
    }

    private func frames(_ url: URL) -> Int {
        CGImageSourceCreateWithURL(url as CFURL, nil).map(CGImageSourceGetCount) ?? 0
    }

    // MARK: - Rotation (Notched's own shuffle; macOS's can't run under a processed copy)

    /// Shows the next picture from the rotation folder now, and restarts the interval.
    func rotateNow() {
        let defaults = UserDefaults.standard
        guard defaults.bool(forKey: Pref.enabled), defaults.bool(forKey: Pref.rotate),
              let path = defaults.string(forKey: Pref.rotateFolder), !path.isEmpty else { return }
        defaults.set(Date(), forKey: "rotatedAt")
        let folder = URL(fileURLWithPath: path, isDirectory: true)
        let pictures = ((try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: [.contentTypeKey],
                                                                       options: .skipsHiddenFiles)) ?? [])
            .filter { (try? $0.resourceValues(forKeys: [.contentTypeKey]))?.contentType?.conforms(to: .image) == true }
        let showing = Set(NSScreen.screens.compactMap { originalShown(on: $0) })
        guard let next = pictures.filter({ !showing.contains($0.standardizedFileURL) }).randomElement() ?? pictures.first else {
            status = "No pictures in “\(folder.lastPathComponent)”."
            return
        }
        rotation = next
        reconcile()
    }

    private func rotateIfDue() {
        let defaults = UserDefaults.standard
        guard defaults.bool(forKey: Pref.rotate) else { return }
        let last = defaults.object(forKey: "rotatedAt") as? Date ?? .distantPast
        if Date().timeIntervalSince(last) >= max(defaults.double(forKey: Pref.rotateEvery), 60) { rotateNow() }
    }

    /// While shuffling, macOS reports the folder itself. Take it over so the shuffle keeps going.
    private func adoptShuffle(_ url: URL) -> Bool {
        guard (try? url.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory == true else { return false }
        let defaults = UserDefaults.standard
        defaults.set(url.path, forKey: Pref.rotateFolder)
        defaults.set(true, forKey: Pref.rotate)
        rotateNow()
        return true
    }

    private func originalShown(on screen: NSScreen) -> URL? {
        guard let url = workspace.desktopImageURL(for: screen) else { return nil }
        return (isOurs(url) ? manifest[url.lastPathComponent]?.url : url)?.standardizedFileURL
    }

    // MARK: - Housekeeping

    /// Copies nothing has shown for 30 days are deleted. A Space still pointing at one gets it
    /// re-made (or its original back) from the manifest on its next visit.
    private func cleanUp() {
        guard Date().timeIntervalSince(lastCleanUp) > 3600 else { return }
        lastCleanUp = Date()
        let inUse = Set(NSScreen.screens.compactMap { workspace.desktopImageURL(for: $0)?.lastPathComponent })
        let cutoff = Date().addingTimeInterval(-30 * 86_400)
        let copies = (try? FileManager.default.contentsOfDirectory(at: Self.folder, includingPropertiesForKeys: [.contentModificationDateKey])) ?? []
        for copy in copies where !inUse.contains(copy.lastPathComponent) {
            let modified = (try? copy.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast
            if modified < cutoff { try? FileManager.default.removeItem(at: copy) }
        }
    }

    /// Marks a copy as recently shown (at most once a day) so cleanUp keeps it.
    private func touch(_ url: URL) {
        let modified = (try? url.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast
        if Date().timeIntervalSince(modified) > 86_400 {
            try? FileManager.default.setAttributes([.modificationDate: Date()], ofItemAtPath: url.path)
        }
    }

    // MARK: - Popover support

    var startsAtLogin: Bool { SMAppService.mainApp.status == .enabled }

    func setStartsAtLogin(_ on: Bool) {
        do {
            if on { try SMAppService.mainApp.register() } else { try SMAppService.mainApp.unregister() }
        } catch {
            status = "Couldn't change Start at login: \(error.localizedDescription)"
        }
    }

    /// The main screen's notch as fractions of its size (nil without one), for drawing the preview.
    var notch: CGRect? {
        guard let screen = NSScreen.screens.first, let left = screen.auxiliaryTopLeftArea, let right = screen.auxiliaryTopRightArea else { return nil }
        let size = screen.frame.size
        return CGRect(x: left.maxX / size.width, y: 0, width: (right.minX - left.maxX) / size.width, height: screen.safeAreaInsets.top / size.height)
    }

    var screenAspect: CGFloat {
        guard let size = NSScreen.screens.first?.frame.size, size.height > 0 else { return 16 / 10 }
        return size.width / size.height
    }

    func refreshPreview(force: Bool = false) {
        guard !previewLocked, let screen = NSScreen.screens.first, let url = workspace.desktopImageURL(for: screen), force || url != previewSource else { return }
        previewSource = url
        Task { preview = await Self.thumbnail(url).map { NSImage(cgImage: $0, size: .zero) } }
    }

    @concurrent nonisolated private static func thumbnail(_ url: URL) async -> CGImage? {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        return CGImageSourceCreateThumbnailAtIndex(source, CGImageSourceGetPrimaryImageIndex(source), [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: 720,
        ] as CFDictionary)
    }
}

extension NSScreen {
    var displayID: CGDirectDisplayID {
        (deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber)?.uint32Value ?? 0
    }
}
