# Control surfaces and app cleanup — September 13, 2026

## Changes

- Control Panel: 120px glyph controls; normalized visible PNG bounds without stretching the artwork; scrollable rail retained. Shared glyph source also illustrates CLOCK.IT.
- THE.ASSURER: word and definition in the left column; sentence in the right, in compact and expanded Word of the Day. Shared styles apply across all phases. Expanded dialog no longer has a large unused lower area.
- CLOCK.IT: organized legend with actual glyphs and section descriptions, day flow, calendar/recurrence/exception help, option editing, connections and troubleshooting. Existing option editors retained.

## Measured reduction

| Public assets | Bytes | MiB |
| --- | ---: | ---: |
| Before | 270,147,241 | 257.6 |
| After | 118,287,688 | 112.8 |

Shipped public assets reduced by **56.2%**. The largest saving came from superseded artwork and the unused opening animation, not personal records.

- Removed 67 unused public files totaling 148,358,217 bytes, plus two obsolete public README files.
- Moved the native-only CHAOTICA.icns out of public into the Mac app's Resources directory; updated the native build references.
- Removed 31 unused source/scaffold/script files, an unused browser development dependency, and the unused local SVG proof renderer.
- Removed 532 overridden CSS declarations only where selector, conditional context, property, and cascade priority made the earlier declaration redundant.
- Retained all 12 current calendar backgrounds and the other active artwork byte-for-byte. Retained data storage, authentication, real rendering and historical proof rejection safeguards.

## Verification

- Production build passed: compilation, type/lint checks and all 31 generated pages.
- Remaining static asset reference scan: no missing references; all 12 current calendar images present.
- Local visual checks: enlarged glyphs and scrolling; two-column expanded word/definition/example; CLOCK.IT illustrated legend and calendar-help chapter switching.
- Git whitespace checks passed. No environment files or local test credentials included.
- Local review used isolated test configuration with cloud disabled. Its Spotify search warning is explained by absent SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET locally; this does not diagnose production configuration.

## Recovery and limits

Deleted source/assets remain recoverable from Git commit `ef1f54a517496c56f6ee570c94d5b212a6ecc018`. No personal records were deleted. Git history and development dependencies/build caches are not the shipped web app and were not erased to inflate the reduction.

This release is not a claim that every historical app request or external integration has been retested end to end. Production deployment state and URL are reported separately after release.
