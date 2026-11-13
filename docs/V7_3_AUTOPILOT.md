# PC Laptop Doctor AI V7.3 — Autopilot implementation and testing

Autopilot is a **local, opt-in background assistant**, not a universal game FPS accelerator. The interface defaults to off. There are two independent permissions: exact-match game preference management and recoverable weekly old-Temp maintenance.

## What runs automatically

**Auto Game Focus** checks Windows process listings approximately every 15 seconds, but only when explicitly enabled. A process must have a readable executable path either exactly matching an EXE previously selected through PC Doctor's Windows file picker, or located inside a Steam/Epic game directory derived from a bounded read-only installed-game manifest. Two consecutive matches cause the pre-existing, tested Standard Game Focus logic to preview internally and enable supported Windows Game Mode preferences (no process killing, no power-plan changes). Three missing matches prompt guarded restoration. The session has a maximum two-hour safety timer and existing crash/restart recovery. If process paths are unavailable, the feature does nothing. The app must be open.

**Weekly Safe Temp Care**, when separately enabled, checks roughly every seven days while the app is open. It scans the current Windows user's standard Local AppData Temp folder with the pre-existing scoped cleaner. It excludes subdirectories, links, documents, all .log files, and .tmp files younger than 30 days, and respects existing 300-file/1-GiB limits. Eligible files are moved to the Windows Recycle Bin, not permanently deleted. Auto Care does not free space until the bin is emptied. A game in progress or an unavailable process inventory prevents unattended cleanup.

## Design decisions

- No use of process-name-only matching: a random program named 'Game.exe' should not activate a gaming profile.
- No automatic generic services, GPU or timer tweaks. Windows security, updates, Defender, VBS, drivers and anti-cheat are left alone.
- Game Focus never assumes FPS increases. On an already-enabled Game Mode system the session might change nothing.
- Two different Temp-cleaner instances are used so background scans cannot invalidate manual cleanup previews.
- First app launch opens Boost & Play and automatically starts a read-only hardware snapshot; high disk/RAM utilization is prioritized.
- Steam/Epic titles can be detected and launched with the existing one-approval flow. Automatic background detection also recognizes processes under verified installed-game directories. Other launchers can be added using the trusted executable picker. Not all games expose reliable process paths.

## Honest comparison with commercial optimizers

Razer Cortex and Hone advertise broader game auto-detection, gameplay-tied start/stop and background resource management. PC Doctor V7.3 provides a narrower exact-match workflow and recoverable old-Temp care, not feature or benchmark parity. Do not market measured FPS improvements before repeated independent field tests.

Research sources: [Razer Cortex Booster](https://www.razer.com/cortex/booster), [Razer Cortex Launcher](https://www.razer.com/cortex/launcher), [Hone Game Mode](https://support.hone.gg/hc/en-gb/articles/6031122574367-Game-Mode-What-It-Is-How-to-Use-It).

## Release gates for testers

- Node tests, frontend build and Windows x64 Setup/Portable packaging in GitHub Actions.
- Manual tests on physical Windows 10 and 11 systems including normal exit, forced interruption, process path unavailable, watched game exit, and timer restoration.
- Safe-cleanup fixtures with known .tmp ages, symlinks, writable/locked files and verification that personal folders are never scanned.
- Real FPS/frame-time comparison on unchanged scenes, drivers and power states with at least three captures per condition.
- A publisher code-signing certificate and independent security review before calling it a broadly trusted stable release.

**Status:** The feature can be shared as a clearly labeled unsigned public beta only after CI passes. A release build is not proof that it is better than Hone or Razer Cortex, and it does not validate every laptop.