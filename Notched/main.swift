import AppKit
import ImageIO
import Sparkle
import SwiftUI
import UniformTypeIdentifiers

// `Notched --selftest` checks the renderer and exits before any UI exists.
if CommandLine.arguments.contains("--selftest") {
    SelfTest.run()
    exit(0)
}

// `Notched --snapshot <dir>` writes the popover as PNGs (light and dark) for the website.
if let flag = CommandLine.arguments.firstIndex(of: "--snapshot") {
    let dir = CommandLine.arguments.dropFirst(flag + 1).first ?? "."
    MainActor.assumeIsolated { Snapshot.run(into: URL(fileURLWithPath: dir, isDirectory: true)) }
    exit(0)
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let manager = WallpaperManager()
    // Off until project.yml carries Sparkle's public key: without it no update could be verified.
    private let updater: SPUStandardUpdaterController? =
        (Bundle.main.object(forInfoDictionaryKey: "SUPublicEDKey") as? String ?? "").isEmpty
            ? nil : SPUStandardUpdaterController(startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)
    private let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    private let popover = NSPopover()

    func applicationDidFinishLaunching(_ notification: Notification) {
        UserDefaults.standard.register(defaults: Pref.defaults)
        // For website screenshots of the real popover: a sample in the preview, never your wallpaper.
        if CommandLine.arguments.contains("--demo-preview") {
            manager.preview = Snapshot.sampleWallpaper()
            manager.previewLocked = true
        }
        if CommandLine.arguments.contains("--dark") { NSApp.appearance = NSAppearance(named: .darkAqua) }
        guard License.accepted() else { return NSApp.terminate(nil) }
        item.button?.image = NSImage(systemSymbolName: "menubar.rectangle", accessibilityDescription: "Notched")
        item.button?.target = self
        item.button?.action = #selector(togglePopover)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(rootView: SettingsView(manager: manager, updater: updater?.updater))
        NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.syncIcon() }
        }
        syncIcon()
        manager.start()
        if !UserDefaults.standard.bool(forKey: "launchedBefore") {
            UserDefaults.standard.set(true, forKey: "launchedBefore")
            showPopover()
        }
    }

    /// Opening Notched again (from Applications or Spotlight) is how a hidden icon comes back.
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        UserDefaults.standard.set(false, forKey: Pref.hideIcon)
        syncIcon()
        Task { showPopover() }   // next run-loop turn, once the icon has a place in the menu bar
        return false
    }

    private func syncIcon() {
        item.isVisible = !UserDefaults.standard.bool(forKey: Pref.hideIcon)
    }

    @objc private func togglePopover() {
        popover.isShown ? popover.performClose(nil) : showPopover()
    }

    private func showPopover() {
        guard item.isVisible, let button = item.button else { return }
        NSApp.activate()
        popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
    }
}

/// First launch: what Notched does to your wallpaper, and the MIT license. Agree or quit.
enum License {
    static let version = 1

    @MainActor static func accepted() -> Bool {
        let defaults = UserDefaults.standard
        if defaults.integer(forKey: "acceptedLicense") >= version { return true }
        let text = NSTextView(frame: NSRect(x: 0, y: 0, width: 420, height: 190))
        text.string = Bundle.main.url(forResource: "LICENSE", withExtension: nil)
            .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? ""
        text.isEditable = false
        text.font = .monospacedSystemFont(ofSize: 10, weight: .regular)
        let scroll = NSScrollView(frame: text.frame)
        scroll.documentView = text
        scroll.hasVerticalScroller = true
        let alert = NSAlert()
        alert.messageText = "Welcome to Notched"
        alert.informativeText = """
            Notched hides the notch by saving edited copies of your wallpapers and setting those as your \
            desktop picture. Your original files are never changed, and switching Notched off puts them back.

            Notched is free and open source under the MIT License:
            """
        alert.accessoryView = scroll
        alert.addButton(withTitle: "Agree")
        alert.addButton(withTitle: "Quit")
        // Floating: a menu bar app often isn't the active app at launch, and the alert must not hide
        // behind other windows while it blocks everything else.
        alert.window.level = .floating
        NSApp.activate()
        guard alert.runModal() == .alertFirstButtonReturn else { return false }
        defaults.set(version, forKey: "acceptedLicense")
        return true
    }
}

/// The popover rendered offscreen with a sample wallpaper, settings from a throwaway defaults suite
/// (your real settings and wallpaper are never touched), in light and dark.
@MainActor
enum Snapshot {
    static func run(into dir: URL) {
        let suite = "com.freeman.notched.snapshot"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        for (key, value) in [Pref.enabled: true, Pref.dynamic: true, Pref.corners: true, Pref.radius: 1, Pref.rotate: false] as [String: Any] {
            defaults.set(value, forKey: key)
        }
        let manager = WallpaperManager()
        manager.preview = sampleWallpaper()
        manager.previewLocked = true
        let updater = SPUStandardUpdaterController(startingUpdater: false, updaterDelegate: nil, userDriverDelegate: nil)
        // Controls only draw in their active (accent-coloured) state in the key window of the active
        // app, so the window is made key while parked far off every screen.
        NSApplication.shared.finishLaunching()
        for (name, appearance) in [("light", NSAppearance.Name.aqua), ("dark", .darkAqua)] {
            let view = NSHostingView(rootView: SettingsView(manager: manager, updater: updater.updater)
                .background(Color(nsColor: .windowBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .defaultAppStorage(defaults))
            let window = KeyableWindow(contentRect: NSRect(origin: .zero, size: view.fittingSize), styleMask: [.borderless, .nonactivatingPanel],
                                       backing: .buffered, defer: false)
            window.appearance = NSAppearance(named: appearance)
            window.isOpaque = false
            window.backgroundColor = .clear
            window.contentView = view
            window.setFrameOrigin(NSPoint(x: -20_000, y: -20_000))
            window.orderFrontRegardless()
            window.makeKey()
            NSApp.activate(ignoringOtherApps: true)   // a one-off dev tool may take focus for a moment
            RunLoop.main.run(until: Date().addingTimeInterval(0.6))
            view.layoutSubtreeIfNeeded()
            print("\(name): app active \(NSApp.isActive), window key \(window.isKeyWindow)")
            defer { window.orderOut(nil) }
            guard let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { continue }
            view.cacheDisplay(in: view.bounds, to: rep)
            try? rep.representation(using: .png, properties: [:])?.write(to: dir.appendingPathComponent("popover-\(name).png"))
        }
        print("wrote popover-light.png and popover-dark.png to \(dir.path)")
    }

    /// A dawn sky put through the real renderer, so the preview shows the band and corners.
    static func sampleWallpaper() -> NSImage? {
        let width = 1728, height = 1117
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                                space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
        let sky = [(0.0, "#ec9a80"), (0.28, "#f4d3b8"), (0.62, "#bcd9f2"), (1.0, "#8fc3f2")]   // bottom to top (y-up)
        let gradient = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: sky.map { hex($0.1) } as CFArray,
                                  locations: sky.map { CGFloat($0.0) })!
        context.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: 0, y: height), options: [])
        let input = FileManager.default.temporaryDirectory.appendingPathComponent("notched-sample.png")
        let output = FileManager.default.temporaryDirectory.appendingPathComponent("notched-sample.heic")
        guard let image = context.makeImage(),
              let destination = CGImageDestinationCreateWithURL(input as CFURL, UTType.png.identifier as CFString, 1, nil) else { return nil }
        CGImageDestinationAddImage(destination, image, nil)
        CGImageDestinationFinalize(destination)
        try? WallpaperRenderer.render(RenderJob(source: input, output: output, width: width, height: height, bar: 33, radius: 14,
                                                scaling: 3, clipping: true, fill: nil, dynamic: false))
        return NSImage(contentsOf: output)
    }

    /// Reports itself as the key window, which is what controls check before drawing in accent colour
    /// (macOS won't activate an app launched from a terminal, so it can't really become key).
    private final class KeyableWindow: NSPanel {
        override var canBecomeKey: Bool { true }
        override var isKeyWindow: Bool { true }
        override var isMainWindow: Bool { true }
    }

    private static func hex(_ value: String) -> CGColor {
        let n = Int(value.dropFirst(), radix: 16)!
        return CGColor(srgbRed: CGFloat(n >> 16 & 255) / 255, green: CGFloat(n >> 8 & 255) / 255, blue: CGFloat(n & 255) / 255, alpha: 1)
    }
}

MainActor.assumeIsolated {
    let delegate = AppDelegate()
    NSApplication.shared.delegate = delegate
    withExtendedLifetime(delegate) { NSApplication.shared.run() }
}
