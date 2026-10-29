#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DESKTOP_ROOT="$ROOT/desktop/macos"
APP_NAME="CHAOTICA"
APP_BUNDLE="$DESKTOP_ROOT/dist/$APP_NAME.app"
ZIP_PATH="$DESKTOP_ROOT/dist/$APP_NAME-macOS.zip"
STAFF_NAME="CHAOTICA Staff"
STAFF_BUNDLE="$DESKTOP_ROOT/dist/$STAFF_NAME.app"
STAFF_ZIP_PATH="$DESKTOP_ROOT/dist/CHAOTICA-Staff-macOS.zip"

sign_bundle() {
  local bundle="$1"
  local attempt
  for attempt in 1 2 3; do
    xattr -cr "$bundle"
    xattr -d com.apple.FinderInfo "$bundle" 2>/dev/null || true
    xattr -d 'com.apple.fileprovider.fpfs#P' "$bundle" 2>/dev/null || true
    if codesign --force --deep --sign - "$bundle"; then return 0; fi
  done
  return 1
}

rm -rf "$APP_BUNDLE" "$ZIP_PATH" "$STAFF_BUNDLE" "$STAFF_ZIP_PATH"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"
mkdir -p "$STAFF_BUNDLE/Contents/MacOS" "$STAFF_BUNDLE/Contents/Resources"

swiftc "$DESKTOP_ROOT/Shared/ChaoticaModifierChordRecognizer.swift" \
  "$DESKTOP_ROOT/TruthInStyle/Sources/main.swift" \
  -framework Cocoa \
  -framework WebKit \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

cp "$DESKTOP_ROOT/TruthInStyle/Resources/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp "$DESKTOP_ROOT/TruthInStyle/Resources/CHAOTICA.icns" "$APP_BUNDLE/Contents/Resources/CHAOTICA.icns"
cp "$ROOT/public/opening/chaotica-opening-dormant-v1.png" "$APP_BUNDLE/Contents/Resources/OpeningGate.png"
sign_bundle "$APP_BUNDLE"

swiftc "$DESKTOP_ROOT/Shared/ChaoticaModifierChordRecognizer.swift" \
  "$DESKTOP_ROOT/ChaoticaShrine/Sources/main.swift" \
  -framework Cocoa \
  -framework ApplicationServices \
  -framework QuartzCore \
  -o "$STAFF_BUNDLE/Contents/MacOS/$STAFF_NAME"

cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/Info.plist" "$STAFF_BUNDLE/Contents/Info.plist"
cp "$DESKTOP_ROOT/TruthInStyle/Resources/CHAOTICA.icns" "$STAFF_BUNDLE/Contents/Resources/CHAOTICA.icns"
cp "$DESKTOP_ROOT/ChaoticaShrine/Resources/HopewoodLifeStaff-v2.png" "$STAFF_BUNDLE/Contents/Resources/HopewoodLifeStaff-v2.png"
sign_bundle "$STAFF_BUNDLE"

(
  cd "$DESKTOP_ROOT/dist"
  ditto -c -k --sequesterRsrc --keepParent "$APP_NAME.app" "$(basename "$ZIP_PATH")"
  ditto -c -k --sequesterRsrc --keepParent "$STAFF_NAME.app" "$(basename "$STAFF_ZIP_PATH")"
)

echo "Built: $APP_BUNDLE"
echo "Packaged: $ZIP_PATH"
echo "Built: $STAFF_BUNDLE"
echo "Packaged: $STAFF_ZIP_PATH"
