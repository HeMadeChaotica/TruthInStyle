#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DESKTOP_ROOT="$ROOT/desktop/macos"
APP_NAME="CHAOTICA"
APP_BUNDLE="$DESKTOP_ROOT/dist/$APP_NAME.app"
ZIP_PATH="$DESKTOP_ROOT/dist/$APP_NAME-macOS.zip"

rm -rf "$APP_BUNDLE" "$ZIP_PATH"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"

swiftc -parse-as-library "$DESKTOP_ROOT/TruthInStyle/Sources/main.swift" \
  -framework Cocoa \
  -framework WebKit \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

cp "$DESKTOP_ROOT/TruthInStyle/Resources/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp "$ROOT/public/icons/TruthInStyle.icns" "$APP_BUNDLE/Contents/Resources/CHAOTICA.icns"
codesign --force --deep --sign - "$APP_BUNDLE"

(
  cd "$DESKTOP_ROOT/dist"
  ditto -c -k --sequesterRsrc --keepParent "$APP_NAME.app" "$(basename "$ZIP_PATH")"
)

echo "Built: $APP_BUNDLE"
echo "Packaged: $ZIP_PATH"
