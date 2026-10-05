#!/bin/bash
# Puts Sparkle in Vendor/Sparkle (gitignored): the framework the app embeds, plus generate_keys and
# generate_appcast for releases. A pinned, checksummed release tarball instead of Swift Package Manager:
# SPM clones Sparkle's entire git history (44k objects), and that clone kept dying mid-transfer.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=2.10.0
SHA256=c2bf58aa8387266ac179357b1415d6f2635f044da8be41042af32425dae6da0c   # GitHub's digest for the asset
DEST=Vendor/Sparkle
TARBALL="Vendor/Sparkle-$VERSION.tar.xz"

[ "$(cat "$DEST/.version" 2>/dev/null)" = "$VERSION" ] && exit 0
mkdir -p Vendor
# Resumable, so a dropped connection picks up where it stopped instead of starting over; a transfer
# that stalls (under 2 KB/s for 20 s) is abandoned and resumed rather than waited on forever.
for attempt in 1 2 3 4 5 6 7 8; do
  if echo "$SHA256  $TARBALL" | shasum -a 256 -c - > /dev/null 2>&1; then break; fi
  curl -fL --connect-timeout 20 --speed-limit 2000 --speed-time 20 -C - -o "$TARBALL" \
    "https://github.com/sparkle-project/Sparkle/releases/download/$VERSION/Sparkle-$VERSION.tar.xz" \
    || echo "download interrupted (attempt $attempt), resuming"
done
echo "$SHA256  $TARBALL" | shasum -a 256 -c -
rm -rf "$DEST"
mkdir -p "$DEST"
tar -xJf "$TARBALL" -C "$DEST"
rm "$TARBALL"
echo "$VERSION" > "$DEST/.version"
echo "Sparkle $VERSION is in $DEST"
