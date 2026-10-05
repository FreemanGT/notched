import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

/// One wallpaper copy to make. Plain values only, so it can be handed to a background task.
struct RenderJob: Sendable, Equatable {
    var source: URL
    var output: URL
    var width: Int          // canvas in pixels: the screen's frame × backing scale
    var height: Int
    var bar: Int            // the black band the menu bar sits on, in pixels
    var radius: Int         // top-corner fillets under the band, in pixels (0 = square)
    var scaling: Int        // NSImageScaling raw value from the original desktop options
    var clipping: Bool      // original "allow clipping": fill the screen (true) or fit it (false)
    var fill: [Double]?     // original fill colour, sRGB
    var dynamic: Bool       // keep every frame and the time/appearance schedule
}

enum RenderError: Error { case unreadable, unwritable }

enum WallpaperRenderer {
    /// Draws each frame onto a screen-sized canvas with the black band and writes the result as HEIC.
    static func render(_ job: RenderJob) throws {
        guard let source = CGImageSourceCreateWithURL(job.source as CFURL, nil), CGImageSourceGetCount(source) > 0 else {
            throw RenderError.unreadable
        }
        let primary = CGImageSourceGetPrimaryImageIndex(source)
        let schedule = job.dynamic ? desktopSchedule(source, primary) : nil
        let frames = schedule == nil ? [primary] : Array(0..<CGImageSourceGetCount(source))

        let files = FileManager.default
        try files.createDirectory(at: job.output.deletingLastPathComponent(), withIntermediateDirectories: true)
        // Written aside and moved in, so a half-written file is never what the desktop shows.
        let partial = job.output.deletingPathExtension().appendingPathExtension("partial")
        guard let destination = CGImageDestinationCreateWithURL(partial as CFURL, UTType.heic.identifier as CFString, frames.count, nil) else {
            throw RenderError.unwritable
        }
        if schedule != nil {
            CGImageDestinationSetProperties(destination, [kCGImagePropertyPrimaryImage: primary] as CFDictionary)
        }
        let quality = [kCGImageDestinationLossyCompressionQuality: 0.9] as CFDictionary
        for index in frames {
            try Task.checkCancellation()   // settings changed mid-render: stop between frames
            // One decoded frame at a time: a 17-frame 5K wallpaper stays around 100 MB instead of 1 GB.
            try autoreleasepool {
                let canvas = try draw(frame(source, index), job)
                if index == primary, let schedule {
                    CGImageDestinationAddImageAndMetadata(destination, canvas, schedule, quality)
                } else {
                    CGImageDestinationAddImage(destination, canvas, quality)
                }
            }
        }
        guard CGImageDestinationFinalize(destination) else { throw RenderError.unwritable }
        if files.fileExists(atPath: job.output.path) { try files.removeItem(at: job.output) }
        try files.moveItem(at: partial, to: job.output)
    }

    /// Off the main actor, and still cancellable by the pass that awaits it (Task.detached wouldn't be).
    @concurrent static func renderInBackground(_ job: RenderJob) async throws {
        try render(job)
    }

    /// Where macOS puts a picture on a screen, per the desktop options it was set with.
    static func placement(_ picture: CGSize, in screen: CGSize, scaling: Int, clipping: Bool) -> CGRect {
        var size = picture
        switch scaling {
        case 1:     // .scaleAxesIndependently: "Stretch to Fill Screen"
            return CGRect(origin: .zero, size: screen)
        case 2:     // .scaleNone: "Center". ponytail: assumes one picture pixel per screen pixel; compare with System Settings if Center ever looks off.
            break
        default:    // .scaleProportionallyUpOrDown: "Fill Screen" when clipping is allowed, otherwise "Fit to Screen"
            let ratios = [screen.width / picture.width, screen.height / picture.height]
            let k = clipping ? ratios.max()! : ratios.min()!
            size = CGSize(width: picture.width * k, height: picture.height * k)
        }
        return CGRect(x: (screen.width - size.width) / 2, y: (screen.height - size.height) / 2, width: size.width, height: size.height)
    }

    private static func draw(_ image: CGImage, _ job: RenderJob) throws -> CGImage {
        let rgb = image.colorSpace?.model == .rgb ? image.colorSpace : nil
        guard let context = canvas(job, rgb) ?? canvas(job, CGColorSpace(name: CGColorSpace.displayP3)) else {
            throw RenderError.unwritable
        }
        let size = CGSize(width: job.width, height: job.height)
        let fill = job.fill ?? [0, 0, 0]
        context.interpolationQuality = .high
        context.setFillColor(CGColor(srgbRed: fill[0], green: fill[1], blue: fill[2], alpha: 1))
        context.fill(CGRect(origin: .zero, size: size))
        context.draw(image, in: placement(CGSize(width: image.width, height: image.height), in: size, scaling: job.scaling, clipping: job.clipping))

        // The band, then a concave fillet under each end of it so the desktop reads as having rounded
        // corners. CoreGraphics is y-up, so `top` is the band's lower edge.
        let top = size.height - CGFloat(job.bar), r = CGFloat(job.radius), w = size.width
        context.setFillColor(CGColor(gray: 0, alpha: 1))
        context.fill(CGRect(x: 0, y: top, width: w, height: CGFloat(job.bar)))
        if r > 0 {
            let fillets = CGMutablePath()
            for (edge, inward) in [(CGFloat(0), r), (w, w - r)] {
                fillets.move(to: CGPoint(x: edge, y: top))
                fillets.addLine(to: CGPoint(x: edge, y: top - r))
                fillets.addArc(tangent1End: CGPoint(x: edge, y: top), tangent2End: CGPoint(x: inward, y: top), radius: r)
                fillets.closeSubpath()
            }
            context.addPath(fillets)
            context.fillPath()
        }
        guard let result = context.makeImage() else { throw RenderError.unwritable }
        return result
    }

    private static func canvas(_ job: RenderJob, _ space: CGColorSpace?) -> CGContext? {
        guard let space else { return nil }
        return CGContext(data: nil, width: job.width, height: job.height, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                         bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
    }

    /// Frame `index`, upright: phone photos often carry an EXIF rotation instead of rotated pixels.
    private static func frame(_ source: CGImageSource, _ index: Int) throws -> CGImage {
        let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any] ?? [:]
        let image: CGImage?
        if properties[kCGImagePropertyOrientation] as? Int ?? 1 == 1 {
            image = CGImageSourceCreateImageAtIndex(source, index, nil)
        } else {
            let longest = max(properties[kCGImagePropertyPixelWidth] as? Int ?? 0, properties[kCGImagePropertyPixelHeight] as? Int ?? 0)
            image = CGImageSourceCreateThumbnailAtIndex(source, index, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: longest,
            ] as CFDictionary)
        }
        guard let image else { throw RenderError.unreadable }
        return image
    }

    /// Just the apple_desktop tags (h24, solar or apr): the schedule macOS uses to pick a frame.
    private static func desktopSchedule(_ source: CGImageSource, _ index: Int) -> CGImageMetadata? {
        guard let metadata = CGImageSourceCopyMetadataAtIndex(source, index, nil),
              let tags = CGImageMetadataCopyTags(metadata) as? [CGImageMetadataTag] else { return nil }
        let schedule = CGImageMetadataCreateMutable()
        var found = false
        for tag in tags where (CGImageMetadataTagCopyPrefix(tag) as String?) == "apple_desktop" {
            guard let namespace = CGImageMetadataTagCopyNamespace(tag), let name = CGImageMetadataTagCopyName(tag) else { continue }
            CGImageMetadataRegisterNamespaceForPrefix(schedule, namespace, "apple_desktop" as CFString, nil)
            if CGImageMetadataSetTagWithPath(schedule, nil, "apple_desktop:\(name)" as CFString, tag) { found = true }
        }
        return found ? schedule : nil
    }
}

/// `Notched --selftest`: fails loudly if placement, the band, the fillets, or dynamic frames break.
enum SelfTest {
    static func run() {
        // An 800×200 picture on a 400×200 screen, in each desktop scaling mode.
        let picture = CGSize(width: 800, height: 200), screen = CGSize(width: 400, height: 200)
        expect(WallpaperRenderer.placement(picture, in: screen, scaling: 3, clipping: true) == CGRect(x: -200, y: 0, width: 800, height: 200), "fill")
        expect(WallpaperRenderer.placement(picture, in: screen, scaling: 3, clipping: false) == CGRect(x: 0, y: 50, width: 400, height: 100), "fit")
        expect(WallpaperRenderer.placement(picture, in: screen, scaling: 1, clipping: false) == CGRect(x: 0, y: 0, width: 400, height: 200), "stretch")
        expect(WallpaperRenderer.placement(picture, in: screen, scaling: 2, clipping: false) == CGRect(x: -200, y: 0, width: 800, height: 200), "center")

        // A two-frame dynamic HEIC (red, then blue) with an h24 schedule, rendered at 400×200
        // with a 20 px band and 40 px corners.
        let files = FileManager.default
        let dir = files.temporaryDirectory.appendingPathComponent("notched-selftest-\(UUID().uuidString)")
        defer { try? files.removeItem(at: dir) }
        try! files.createDirectory(at: dir, withIntermediateDirectories: true)
        let input = dir.appendingPathComponent("in.heic"), output = dir.appendingPathComponent("out.heic")
        let schedule = CGImageMetadataCreateMutable()
        CGImageMetadataRegisterNamespaceForPrefix(schedule, "http://ns.apple.com/namespace/1.0/" as CFString, "apple_desktop" as CFString, nil)
        CGImageMetadataSetValueWithPath(schedule, nil, "apple_desktop:h24" as CFString, "c2VsZnRlc3Q=" as CFString)
        let destination = CGImageDestinationCreateWithURL(input as CFURL, UTType.heic.identifier as CFString, 2, nil)!
        CGImageDestinationAddImageAndMetadata(destination, solid(800, 400, [1, 0, 0]), schedule, nil)
        CGImageDestinationAddImage(destination, solid(800, 400, [0, 0, 1]), nil)
        expect(CGImageDestinationFinalize(destination), "write the input")

        try! WallpaperRenderer.render(RenderJob(source: input, output: output, width: 400, height: 200, bar: 20, radius: 40,
                                                scaling: 3, clipping: true, fill: nil, dynamic: true))
        let result = CGImageSourceCreateWithURL(output as CFURL, nil)!
        expect(CGImageSourceGetCount(result) == 2, "both frames kept")
        let kept = CGImageSourceCopyMetadataAtIndex(result, 0, nil)
            .flatMap { CGImageMetadataCopyStringValueWithPath($0, nil, "apple_desktop:h24" as CFString) } as String?
        expect(kept == "c2VsZnRlc3Q=", "h24 schedule kept")
        let red = pixels(result, 0), blue = pixels(result, 1)
        expect(isBlack(red(200, 8)), "band")
        expect(isBlack(red(3, 23)) && isBlack(red(396, 23)), "corner fillets")
        expect(isPure(red(20, 30), 0), "picture inside the rounded corner")
        expect(isPure(red(200, 120), 0) && isPure(blue(200, 120), 2), "frames kept in order")

        // Static mode keeps only the primary frame.
        try! WallpaperRenderer.render(RenderJob(source: input, output: output, width: 400, height: 200, bar: 20, radius: 0,
                                                scaling: 3, clipping: true, fill: nil, dynamic: false))
        expect(CGImageSourceGetCount(CGImageSourceCreateWithURL(output as CFURL, nil)!) == 1, "static is one frame")
        print("selftest passed")
    }

    private static func expect(_ ok: Bool, _ what: String) {
        guard ok else { print("selftest FAILED: \(what)"); exit(1) }
    }

    private static func solid(_ width: Int, _ height: Int, _ rgb: [CGFloat]) -> CGImage {
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                                space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
        context.setFillColor(CGColor(srgbRed: rgb[0], green: rgb[1], blue: rgb[2], alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        return context.makeImage()!
    }

    /// Frame `index` read back as sRGB bytes; the closure takes (x, y counted from the top).
    private static func pixels(_ source: CGImageSource, _ index: Int) -> (Int, Int) -> [Int] {
        let image = CGImageSourceCreateImageAtIndex(source, index, nil)!
        let width = image.width, height = image.height
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                                space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        let bytes = Array(UnsafeBufferPointer(start: context.data!.assumingMemoryBound(to: UInt8.self), count: width * height * 4))
        return { x, y in (0..<3).map { Int(bytes[(y * width + x) * 4 + $0]) } }
    }

    private static func isBlack(_ p: [Int]) -> Bool { p.allSatisfy { $0 < 60 } }

    /// Mostly `channel` (HEIC is lossy, so no exact values).
    private static func isPure(_ p: [Int], _ channel: Int) -> Bool {
        p.indices.allSatisfy { $0 == channel ? p[$0] > 160 : p[$0] < 90 }
    }
}
