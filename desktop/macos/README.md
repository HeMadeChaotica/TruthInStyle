# CHAOTICA for macOS

This folder builds two native macOS bundles:

- `CHAOTICA.app` — the main desktop shell for the live CHAOTICA application. It keeps production authentication, saves, HOPEWOOD, and Day Capsule rendering inside the main app.
- `CHAOTICA Staff.app` — the separate Life Staff companion. It stays out of the Dock, opens the native CHAOTICA app when clicked, and sends the timed pink reminder signals.

The Staff is not a duplicate main app and does not contain a second app window. It stays off-screen while CHAOTICA is active so it cannot cover the app rail. CLOCK.IT owns its reminder schedule. The existing defaults remain 10:00 AM, 2:00 PM, 6:00 PM, and 10:00 PM for information pulses, plus 12:01 AM for THE.SUMMATION; saving new 24-hour times in CLOCK.IT updates the native Staff schedule without changing the Staff artwork.

The ordered native shortcuts are:

- Open CHAOTICA: press Fn, then Control, then Option, then Command while continuing to hold the earlier keys.
- Close CHAOTICA: press Command, then Option, then Control, then Fn while continuing to hold the earlier keys.

The order is intentional. An out-of-order chord does nothing, and one completed chord fires only once until the modifiers are released.

## Build the package

From the repository root:

```zsh
./desktop/macos/build-macos-app.sh
```

The installable packages are created at:

- `desktop/macos/dist/CHAOTICA-macOS.zip`
- `desktop/macos/dist/CHAOTICA-Staff-macOS.zip`

## Install

1. Install `CHAOTICA.app` from `CHAOTICA-macOS.zip` into Applications if the main app needs an update.
2. Install `CHAOTICA Staff.app` from `CHAOTICA-Staff-macOS.zip` into Applications.
3. Open the Staff once so it can install its login launch entry.
4. When macOS asks, allow CHAOTICA Staff under Privacy & Security > Input Monitoring so the entrance chord works while another app is active.
5. Click the Staff or use the ordered entrance chord whenever you want to open the native CHAOTICA app.

The first launch may require Control-clicking an app and choosing Open because these local builds are not Apple-notarized.
