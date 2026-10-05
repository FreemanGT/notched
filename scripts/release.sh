#!/bin/bash
# Notched release: archive (Developer ID) → export → selftest → styled DMG → notarize + staple →
# Sparkle appcast (+ deltas against earlier releases) → site/downloads → deploy → commit + tag.
#
# One-time setup (yours, not a script's: these hold your keys):
#   1. Sparkle signing key: run
#        scripts/fetch-sparkle.sh && Vendor/Sparkle/bin/generate_keys
#      and paste the printed public key into project.yml as SUPublicEDKey. The private key stays in
#      your login keychain; allow access when generate_appcast first asks for it.
#   2. Notary profile: reuses Claude Meter's ("claude-meter"). Only if notarytool says it's missing:
#        xcrun notarytool store-credentials claude-meter --apple-id <apple id> --team-id 6QWCS23UJ3
#   3. cd site && vercel link --project notched
#
# Every release: bump MARKETING_VERSION and CURRENT_PROJECT_VERSION in project.yml (Sparkle compares
# the build number). Optional release notes: releases/Notched-<version>.html, picked up by generate_appcast.
set -euo pipefail
cd "$(dirname "$0")/.."

TEAM_ID="6QWCS23UJ3"
IDENTITY="Developer ID Application: Yiftach Freeman ($TEAM_ID)"
NOTARY_PROFILE="${NOTARY_PROFILE:-claude-meter}"
SITE_URL="https://notched.vercel.app"   # keep in sync with SUFeedURL in project.yml

VERSION=$(sed -n 's/^ *MARKETING_VERSION: "\(.*\)"/\1/p' project.yml)
BUILD=$(sed -n 's/^ *CURRENT_PROJECT_VERSION: \([0-9]*\)/\1/p' project.yml)
DMG_NAME="Notched-$VERSION.dmg"
[ -n "$VERSION" ] && [ -n "$BUILD" ] || { echo "error: MARKETING_VERSION / CURRENT_PROJECT_VERSION not found in project.yml"; exit 1; }
if grep -q 'SUPublicEDKey: ""' project.yml; then
  echo "error: SUPublicEDKey is empty in project.yml (setup step 1)"; exit 1
fi
# A version that's out doesn't ship twice (../Voice's rule). Bump first.
if [ -e "releases/$DMG_NAME" ]; then
  echo "error: $VERSION was already released (releases/$DMG_NAME). Bump the version in project.yml."; exit 1
fi

echo "==> Notched $VERSION ($BUILD)"
scripts/fetch-sparkle.sh
xcodegen generate

echo "==> Archive: Developer ID, hardened runtime"
rm -rf build/Notched.xcarchive build/export
xcodebuild -project Notched.xcodeproj -scheme Notched -configuration Release -derivedDataPath build \
  -archivePath build/Notched.xcarchive -quiet archive
# Export re-signs every nested piece of Sparkle (XPC services, Autoupdate, Updater.app) the way
# notarization wants; a plain `xcodebuild build` would need those signed by hand.
cat > build/ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>developer-id</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Developer ID Application</string>
</dict></plist>
EOF
xcodebuild -exportArchive -archivePath build/Notched.xcarchive -exportOptionsPlist build/ExportOptions.plist \
  -exportPath build/export -quiet
APP="build/export/Notched.app"

echo "==> Verify"
"$APP/Contents/MacOS/Notched" --selftest
codesign --verify --strict --deep "$APP"
# The notary service rejects the debug entitlement, and nothing earlier catches it (../Voice).
if codesign -d --entitlements - "$APP" 2>/dev/null | grep -q get-task-allow; then
  echo "error: the exported app carries get-task-allow"; exit 1
fi

echo "==> Notarize the app itself"
# The DMG's ticket covers the app only while it's inside the DMG. A stapled app carries its own, so the
# copy people drag to Applications passes Gatekeeper even offline (spctl called the 1.0 copy unnotarized).
ditto -c -k --keepParent "$APP" build/Notched.zip
xcrun notarytool submit build/Notched.zip --keychain-profile "$NOTARY_PROFILE" --wait
xcrun stapler staple "$APP"
spctl -a -vv "$APP"

echo "==> DMG"
# Styled window: dmg/DS_Store was made once with dmgbuild (volume "Notched", 660x400 window, icons at
# 170,190 / 490,190) and points at /.background.tiff; dmg/background.html is the artwork's source.
STAGE=$(mktemp -d)
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"
cp dmg/background.tiff "$STAGE/.background.tiff"
cp dmg/DS_Store "$STAGE/.DS_Store"
mkdir -p releases
hdiutil create -volname Notched -srcfolder "$STAGE" -ov -format UDZO "releases/$DMG_NAME" > /dev/null
rm -rf "$STAGE"
codesign --force --timestamp --sign "$IDENTITY" "releases/$DMG_NAME"

echo "==> Notarize (the DMG's ticket covers the app inside it)"
xcrun notarytool submit "releases/$DMG_NAME" --keychain-profile "$NOTARY_PROFILE" --wait
xcrun stapler staple "releases/$DMG_NAME"
xcrun stapler validate "releases/$DMG_NAME"
spctl -a -vvv -t open --context context:primary-signature "releases/$DMG_NAME"

echo "==> Appcast, with deltas from the earlier DMGs kept in releases/"
Vendor/Sparkle/bin/generate_appcast \
  --download-url-prefix "$SITE_URL/downloads/" --maximum-versions 1 -o site/downloads/appcast.xml releases
# The site carries only the newest DMG and the deltas that update to it.
rm -f site/downloads/*.dmg site/downloads/*.delta
cp "releases/$DMG_NAME" site/downloads/
find releases -name "Notched$BUILD-*.delta" -exec cp {} site/downloads/ \;

echo "==> Site: version + /download"
sed -i '' "s|/downloads/Notched-[0-9.]*\.dmg|/downloads/$DMG_NAME|" site/vercel.json
# Anchored to the new name: a broad match would pass on a line that was already right.
grep -q "\"/downloads/$DMG_NAME\"" site/vercel.json || {
  echo "error: /download was not repointed at $DMG_NAME; refusing to publish a version nobody can download"; exit 1
}
sed -i '' "s|\"softwareVersion\":\"[^\"]*\"|\"softwareVersion\":\"$VERSION\"|" site/index.html
sed -i '' "s|^- Version: .*|- Version: $VERSION (build $BUILD)|" site/llms.txt

echo "==> Deploy"
(cd site && vercel deploy --prod)

echo "==> Commit + tag v$VERSION"
git add site/downloads/appcast.xml site/vercel.json site/index.html site/llms.txt
git commit -m "chore(release): Notched $VERSION" || echo "   (nothing to commit)"
git tag -a "v$VERSION" -m "Notched $VERSION"

echo "==> Done: Notched $VERSION is live."
echo "    - git push origin main v$VERSION"
echo "    - check $SITE_URL/download serves $DMG_NAME"
