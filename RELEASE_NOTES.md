# PC Laptop Doctor AI v7.3.0-beta.4 — Autopilot and Bottleneck-First UI

Public beta for Windows 10/11 x64 testers. Unsigned. No guaranteed FPS, latency, CPU or RAM improvement.

## Added
- Opt-in Auto Game Focus for exact personally added executable paths or process paths within Steam/Epic installed-game folders verified from launcher manifests. Only Windows Game Mode in Standard profile; no process termination or service/antivirus changes.
- Session automatically starts after two detections, attempts restore after three misses, and has a two-hour safety cutoff. Existing manual Stop & Restore and startup recovery remain.
- Opt-in weekly Temp care: once every seven days, limited to top-level user Temp .tmp files at least 30 days old, moved only to Recycle Bin; skips recognized running trusted games. Separate cleaner instance preserves any user-created cleanup preview.
- Home screen launches on Boost & Play with automatic read-only PC scan, high RAM/disk bottleneck alerts and a simplified Autopilot on/off interface.
- Added automated regression tests for opt-in, process path matching, manual-session precedence, game exit and weekly cleanup frequency.

## Honest limitations
- Auto-Boost covers installed Steam/Epic games with readable process paths under their verified installed-game folders plus personally added exact EXEs. Unknown launchers and hidden/unreadable paths require manual Boost & Play.
- Autopilot only works while this app is open. Closing the app normally triggers guarded Game Focus recovery.
- Weekly recycling does NOT free disk space until Recycle Bin is emptied; irreversible deletion is not automated.
- Does not promise increased game FPS or establish parity with Razer Cortex and Hone. Physical Windows tests, code signing, accessibility QA, anti-cheat compatibility, and an independent security audit remain unfinished.
- Share links from the official GitHub release with SHA256SUMS.txt; do not disable Windows security protections.