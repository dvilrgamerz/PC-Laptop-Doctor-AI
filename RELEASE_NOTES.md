# PC Laptop Doctor AI v7.0.0-beta.1 — Game Focus & Safe Cleanup

**PUBLIC BETA for Windows x64. Unsigned preview executables, not yet certified production software.**

## New in V7

- Cleaner first-run dashboard: **Scan → Game Boost & Cleanup → Compare FPS**.
- **Game Focus:** user-started temporary session, Standard (Game Mode) or Plugged-in Gaming (Game Mode + standard High performance when supported and on AC). Explicit preview and confirmation; restore original settings at Stop and attempt recovery when the app closes/reopens. No process killing, overclock or arbitrary registry scripts.
- **Find & Launch Steam Games:** reads known local Steam app manifests, validates selected app IDs, launches via Steam itself. No game save/config edits or anti-cheat integration.
- **Recoverable Temp-file cleanup:** scans only top-level .tmp/.log files in the ordinary Windows user Temp folder, at least 14 days old; max 300 files, max 128 MiB each and 1 GiB total candidate size. No item selected by default. Selected files go to **Windows Recycle Bin** after revalidation; they are *not* permanently deleted. Recycle Bin must be emptied manually to actually reclaim storage.
- Retains V6 optimizer, device and network diagnostics, local optional Ollama, FPS CSV comparisons, settings preview, and bounded audit/history.
- Testing checklist and simple privacy-aware bug report form for public testers.

## Important limitations

- Game Focus optimizes Windows preferences only; **no universal one-click speed boost or FPS gain is guaranteed**. Disabling capture tools can break recording; avoid untested settings if streaming.
- Game Focus does **not** automatically detect every game or manipulate protected game processes.
- Cleanup excludes Downloads, documents, system directories and subfolders. Recycled files may be recoverable from Recycle Bin but moving them does not immediately increase free space.
- Windows Setup/Portable builds are **not signed** and Windows SmartScreen may warn. Download only from this repository and verify SHA256SUMS.txt.
- Automated tests and Windows packaging are not a substitute for testing on actual user PCs. This release is intentionally a **public beta**, not a stable certified rival to Razer Cortex or Hone.

See docs/V7_RELEASE.md and docs/FRIEND_TESTING.md. Share bugs via the GitHub issue template, never private system details.
