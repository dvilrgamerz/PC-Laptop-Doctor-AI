# PC Laptop Doctor AI v7.5.0-beta.6 — Space Finder and Live GPU Monitoring

Public Windows 10/11 x64 beta. Unsigned binaries. No claimed gaming FPS gain.

## Additions
- On-demand **Large Downloads Space Finder**, limited to ordinary files at the top level of the current Windows user's default Downloads folder. Only files >=100 MiB are listed, top 60, with fixed scan limit. No recursive crawling or private file-content reads.
- Explicit selected-file Recycle Bin operation after consent, limited to 20 files and 20 GiB, with metadata revalidation and no permanent-delete fallback. Files moved to Recycle Bin do **not** release disk space until emptied.
- New numeric-only **GPU utilization** card in the 8-second live PC monitor, if the graphics subsystem makes it available. Values may be unknown on some hardware. UI remains local and does not upload system data.
- Critical storage alert now jumps to the in-app Space Finder.
- Existing Steam/Epic/custom-game detection, opt-in Game Focus Autopilot, weekly recoverable Temp cleanup and external FPS testing are retained.

## Public tester warnings
- A near-full drive often requires uninstalling unnecessary apps or reviewing large personal files. The app cannot safely delete personal data without review.
- The portable and installer EXEs are unsigned. Do not weaken Windows security protections. Use SHA256SUMS.txt and obtain binaries only from this repository's release.
- Physical Windows hardware testing, anti-cheat tests, professional code signing and verified FPS improvements are not complete. Do not call this an independently certified stable release or superior to other optimizers.
- See docs/V7_5_SPACE_FINDER.md and docs/FRIEND_TESTING.md.
