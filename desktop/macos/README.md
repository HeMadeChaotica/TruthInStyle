# TruthInStyle for macOS

This is the native macOS shell for the live TruthInStyle application. It opens as its own app window and uses the production web app for authenticated saves, HOPEWOOD, and Day Capsule rendering.

## Build the package

From the repository root:

```zsh
./desktop/macos/build-macos-app.sh
```

The installable package is created at `desktop/macos/dist/TruthInStyle-macOS.zip`.

## Install

1. Double-click `TruthInStyle-macOS.zip`.
2. Drag `TruthInStyle.app` into Applications.
3. Open it from Applications or the Dock.

The first launch may require Control-clicking the app and choosing Open because this local build is not Apple-notarized.
