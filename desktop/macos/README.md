# CHAOTICA for macOS

This folder builds two native macOS bundles:

- `CHAOTICA.app` — the main desktop shell for the live CHAOTICA application. It keeps production authentication, saves, HOPEWOOD, and Day Capsule rendering inside the main app.
- `CHAOTICA Shrine.app` — the separate, retractable Desk Shrine companion. It launches retracted, stays out of the Dock, and can be summoned with Command + Option + Control + Fn or from its menu-bar star.

The Shrine is not a duplicate main app. It reads a tiny local day snapshot that the main app writes: Title of the Day, Mood, Era, real DA.EATER macro progress when meals have been logged, and a saved next commitment when one exists. Empty source data remains empty.

## Build the package

From the repository root:

```zsh
./desktop/macos/build-macos-app.sh
```

The installable packages are created at:

- `desktop/macos/dist/CHAOTICA-macOS.zip`
- `desktop/macos/dist/CHAOTICA-Shrine-macOS.zip`

## Install

1. Install `CHAOTICA.app` from `CHAOTICA-macOS.zip` into Applications if the main app needs an update.
2. Install `CHAOTICA Shrine.app` from `CHAOTICA-Shrine-macOS.zip` into Applications.
3. Open the Shrine once. It starts retracted; use Command + Option + Control + Fn to summon or retract it.
4. Use the Shrine's three portal panes to bring the main app to The Assurer, DA.EATER, or THICC.FITT.

The first launch may require Control-clicking an app and choosing Open because these local builds are not Apple-notarized. The global shortcut may require allowing CHAOTICA Shrine under Privacy & Security > Accessibility; its menu-bar star remains an available fallback.
