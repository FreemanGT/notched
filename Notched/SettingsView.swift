import AppKit
import Sparkle
import SwiftUI

/// The popover. Settings live in UserDefaults through @AppStorage; WallpaperManager watches them,
/// so nothing here has to tell it what changed.
struct SettingsView: View {
    let manager: WallpaperManager
    let updater: SPUUpdater?

    /// Popover width and insets. The top inset is the larger one: macOS 26+ popovers have big corner
    /// radii, and content near the top edge reads as cramped against them.
    static let width: CGFloat = 340
    static let inset: CGFloat = 18
    static let topInset: CGFloat = 24

    @AppStorage(Pref.enabled) private var enabled = false
    @AppStorage(Pref.dynamic) private var dynamic = true
    @AppStorage(Pref.corners) private var corners = true
    @AppStorage(Pref.radius) private var radius = 1
    @AppStorage(Pref.builtInOnly) private var builtInOnly = false
    @AppStorage(Pref.rotate) private var rotate = false
    @AppStorage(Pref.rotateFolder) private var rotateFolder = ""
    @AppStorage(Pref.rotateEvery) private var rotateEvery = 3600
    @AppStorage(Pref.hideIcon) private var hideIcon = false
    @State private var startsAtLogin = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Notched").font(.title3.weight(.semibold))
                Spacer()
                Toggle("Hide the notch", isOn: $enabled).toggleStyle(.switch).labelsHidden()
            }
            ScreenPreview(manager: manager)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                if manager.busy { ProgressView().controlSize(.mini) }
                Text(statusLine).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            }
            .font(.callout)
            if manager.misplaced {
                Text("Move Notched to your Applications folder so updates and Start at login work.")
                    .font(.caption).foregroundStyle(.orange)
            }
            Divider()
            option("Use dynamic wallpapers", $dynamic, "Keeps time- and appearance-based wallpapers changing. Takes longer to process.")
            HStack {
                Toggle("Round corners", isOn: $corners).fixedSize()
                Spacer()
                Picker("Radius", selection: $radius) {
                    Text("Small").tag(0)
                    Text("Medium").tag(1)
                    Text("Large").tag(2)
                }
                .pickerStyle(.segmented).labelsHidden().controlSize(.small).fixedSize().disabled(!corners)
            }
            option("Built-in display only", $builtInOnly, nil)
            option("Rotate wallpapers", $rotate, "macOS can't shuffle under the black bar, so Notched rotates your pictures itself.")
            if rotate { rotation.padding(.leading, 20) }
            Divider()
            Toggle("Start at login", isOn: Binding(get: { startsAtLogin }, set: {
                manager.setStartsAtLogin($0)
                startsAtLogin = manager.startsAtLogin
            }))
            option("Hide menu bar icon", $hideIcon, "Open Notched again to bring it back.")
            Divider()
            HStack {
                Button("Check for Updates…") { updater?.checkForUpdates() }.disabled(updater == nil)
                Spacer()
                Text(version).foregroundStyle(.tertiary)
                Button("Quit") { NSApp.terminate(nil) }
            }
            .controlSize(.small)
        }
        .toggleStyle(.checkbox)
        .padding(.horizontal, Self.inset)
        .padding(.top, Self.topInset)
        .padding(.bottom, Self.inset)
        .frame(width: Self.width)
        .onAppear {
            startsAtLogin = manager.startsAtLogin
            manager.refreshPreview(force: true)
        }
    }

    private var statusLine: String {
        if !manager.status.isEmpty { return manager.status }
        return enabled ? "Notch hidden." : "Turn on to blacken the menu bar so the notch blends in."
    }

    private var version: String {
        "v" + (Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "")
    }

    private func option(_ title: String, _ value: Binding<Bool>, _ note: String?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Toggle(title, isOn: value)
            if let note {
                Text(note).font(.caption).foregroundStyle(.secondary)
                    .padding(.leading, 20).fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var rotation: some View {
        HStack(spacing: 8) {
            Button(rotateFolder.isEmpty ? "Choose Folder…" : URL(fileURLWithPath: rotateFolder).lastPathComponent, action: chooseFolder)
                .lineLimit(1)
            Picker("Every", selection: $rotateEvery) {
                Text("5 min").tag(300)
                Text("15 min").tag(900)
                Text("30 min").tag(1800)
                Text("Hourly").tag(3600)
                Text("Daily").tag(86_400)
            }
            .labelsHidden().fixedSize()
            Spacer()
            Button("Next") { manager.rotateNow() }.disabled(rotateFolder.isEmpty || !enabled)
        }
        .controlSize(.small)
    }

    private func chooseFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.prompt = "Rotate"
        if !rotateFolder.isEmpty { panel.directoryURL = URL(fileURLWithPath: rotateFolder) }
        NSApp.activate()
        guard panel.runModal() == .OK, let url = panel.url else { return }
        rotateFolder = url.path
        manager.rotateNow()
    }
}

/// The main screen in miniature: its wallpaper right now (with the band once processed) under the notch.
private struct ScreenPreview: View {
    let manager: WallpaperManager

    /// The popover's content width. An explicit size: NSPopover sizes itself from the ideal size,
    /// where an aspect-ratio-only view collapses to nothing.
    private let width = SettingsView.width - 2 * SettingsView.inset

    var body: some View {
        Color.clear
            .frame(width: width, height: (width / manager.screenAspect).rounded())
            .overlay {
                if let image = manager.preview {
                    Image(nsImage: image).resizable().scaledToFill()
                } else {
                    Rectangle().fill(.quaternary)
                }
            }
            .overlay {
                GeometryReader { geometry in
                    if let notch = manager.notch {
                        UnevenRoundedRectangle(bottomLeadingRadius: 3, bottomTrailingRadius: 3)
                            .fill(.black)
                            .frame(width: geometry.size.width * notch.width, height: geometry.size.height * notch.height)
                            .position(x: geometry.size.width * notch.midX, y: geometry.size.height * notch.height / 2)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(.separator))
            .accessibilityLabel("Preview of your main screen")
    }
}
