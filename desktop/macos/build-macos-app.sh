#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DESKTOP_ROOT="$ROOT/desktop/macos"
APP_NAME="CHAOTICA"
APP_BUNDLE="$DESKTOP_ROOT/dist/$APP_NAME.app"
ZIP_PATH="$DESKTOP_ROOT/dist/$APP_NAME-macOS.zip"
SHRINE_NAME="CHAOTICA Shrine"
SHRINE_BUNDLE="$DESKTOP_ROOT/dist/$SHRINE_NAME.app"
SHRINE_ZIP_PATH="$DESKTOP_ROOT/dist/CHAOTICA-Shrine-macOS.zip"

rm -rf "$APP_BUNDLE" "$ZIP_PATH" "$SHRINE_BUNDLE" "$SHRINE_ZIP_PATH"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"
mkdir -p "$SHRINE_BUNDLE/Contents/MacOS" "$SHRINE_BUNDLE/Contents/Resources"

swiftc "$DESKTOP_ROOT/TruthInStyle/Sources/main.swift" \
  -framework Cocoa \
  -framework WebKit \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

cp "$DESKTOP_ROOT/TruthInStyle/Resources/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp "$ROOT/public/icons/CHAOTICA.icns" "$APP_BUNDLE/Contents/Resources/CHAOTICA.icns"
cp "$ROOT/public/opening/chaotica-gate-email.png" "$APP_BUNDLE/Contents/Resources/OpeningGate.png"
codesign --force --deep --sign - "$APP_BUNDLE"

swiftc "$DESKTOP_ROOT/ChaoticaShrine/Sources/main.swift" \
  -framework Cocoa \
  -framework WebKit \
  -o "$SHRINE_BUNDLE/Contents/MacOS/$SHRINE_NAME"

cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/Info.plist" "$SHRINE_BUNDLE/Contents/Info.plist"
cp "$ROOT/public/icons/CHAOTICA.icns" "$SHRINE_BUNDLE/Contents/Resources/CHAOTICA.icns"
cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/shrine.html" "$SHRINE_BUNDLE/Contents/Resources/shrine.html"
cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/ShrineOpen-v3.png" "$SHRINE_BUNDLE/Contents/Resources/ShrineOpen.png"
cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/HopewoodLifeStaff-v1.png" "$SHRINE_BUNDLE/Contents/Resources/HopewoodLifeStaff-v1.png"
codesign --force --deep --sign - "$SHRINE_BUNDLE"

(
  cd "$DESKTOP_ROOT/dist"
  ditto -c -k --sequesterRsrc --keepParent "$APP_NAME.app" "$(basename "$ZIP_PATH")"
  ditto -c -k --sequesterRsrc --keepParent "$SHRINE_NAME.app" "$(basename "$SHRINE_ZIP_PATH")"
)

echo "Built: $APP_BUNDLE"
echo "Packaged: $ZIP_PATH"
echo "Built: $SHRINE_BUNDLE"
echo "Packaged: $SHRINE_ZIP_PATH"
