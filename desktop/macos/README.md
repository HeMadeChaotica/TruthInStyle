# CHAOTICA for macOS

This is the native macOS shell for the live CHAOTICA application. It opens as its own app window and uses the production app for authenticated saves, HOPEWOOD, and Day Capsule rendering.

## Build the package

From the repository root:

```zsh
./desktop/macos/build-macos-app.sh
```

The installable package is created at `desktop/macos/dist/CHAOTICA-macOS.zip`.

The same build also creates `desktop/macos/dist/CHAOTICA-Shrine-macOS.zip`.
CHAOTICA Shrine is a separate, native desktop companion: a resizeable floating
Day Pulse with the approved CHAOTICA seal and entrances to The Assurer,
THE.SUMMATION, HOPEWOOD, and 525600. It is not a WidgetKit extension and does
not require Xcode.

## Install

1. Double-click `CHAOTICA-macOS.zip`.
2. Drag `CHAOTICA.app` into Applications.
3. Open it from Applications or the Dock.

## Install the Shrine

1. Double-click `CHAOTICA-Shrine-macOS.zip`.
2. Drag `CHAOTICA Shrine.app` to Applications.
3. Open it once. A small `✦` menu appears in the menu bar to show, hide, pin,
   or quit the Shrine.

The first launch may require Control-clicking the app and choosing Open because this local build is not Apple-notarized.
