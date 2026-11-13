# PC Laptop Doctor AI V7 — implementation and public beta gate

**Version:** 7.1.0-beta.2 (Windows 10/11 x64). **Target audience:** willing early testers and friends who understand unsigned prereleases. Not certified stable software.

## The practical user experience

Open PC Doctor → **Run Full Diagnosis** → **Game Boost & Cleanup**.

1. **Game Focus:** choose Standard or Plugged-in, preview exact Windows changes, approve the session, optionally launch a Steam game, and stop/restore preferences afterward.
2. **Game Library:** detect and launch validated, installed Steam titles. Other launchers require separate verified adapters.
3. **Storage Cleanup:** review old user Temp files individually and move selected ones to Windows Recycle Bin, not permanently delete them. Nothing is preselected. Documents, Downloads, Windows directories, game saves and subfolders are excluded.
4. **Performance Lab:** record game frame times with a separate tool and compare before/after captures with PC Doctor's existing CSV analysis and V6 experiment statistics.
5. **Advanced Studio:** optionally use typed Windows settings, network diagnostics, offline rule-based Doctor and locally installed Ollama.

## Implemented and testable

- [x] Explicit start/stop for two session profiles (Standard = Game Mode; Plugged-in = Game Mode + standard High performance where available).
- [x] Write-ahead attempted-action journal in user's app data; previous values maintained by existing fixed-action service; stop/normal-exit restoration; next-start guarded crash recovery.
- [x] AC-power prerequisite for High performance on battery-powered laptops; unsupported plans skipped.
- [x] One-time session approval token, exact list of adjustments; no arbitrary scripts or unapproved changes.
- [x] Read-only Steam manifests; selected numeric app ID must exist in a fresh scan before a fixed Steam launch deep-link is passed to Windows.
- [x] User Temp scanner: top-level .tmp and .log files at least 14 days old, regular files only, no symlinks or subdirectories; 300-file/1 GiB global preview cap and 128 MiB per file.
- [x] Cleanup requires selected file IDs from a fresh preview, explicit user confirmation, unchanged size/time/device/inode, and Windows Recycle Bin API. No automatic folder deletion.
- [x] Simple interface in Dashboard and Game Boost & Cleanup, friend-testing guide, privacy-aware issue template.
- [x] V6 hardware diagnostics, recovery-aware Windows settings, Steam/resource session monitor, network path test, and FPS comparison retained.

## Limitations and safety considerations

**Game Focus:** Does not change process priorities, RAM allocator, services, GPU clocks, game config files or network stack. Starting with no eligible Windows actions still creates a session, not an FPS boost. High performance may increase temperatures or energy usage. An unexpected power loss or external preference change can prevent clean restoration and require inspection in Windows Settings.

**Cleanup:** Moving to Recycle Bin does not release filesystem space until the bin is emptied. Some locked files cannot be recycled. Never interpret moved file sizes as measured reclaimed storage. The scanner does not cover browser caches, Downloads, Steam shader caches, Windows Update or other game launchers. Broader cleanup is handled by Windows Storage Sense and Cleanup Recommendations.

**Game Launch:** Steam detection excludes Epic, Xbox, Battle.net, Riot, GOG, Ubisoft and standalone games. Steam deep links may fail if the client is absent. No third-party anti-cheat bypasses or injection.

**Production readiness:** Automated tests, web build, Windows packaging and source transparency are necessary but not sufficient for a stable consumer release. Code signing, external antivirus/reputation checks, real hardware Windows QA, accessibility, installer/uninstaller tests and validated end-user FPS testing remain outstanding. Releases remain explicitly marked **prerelease**.

## Comparison with Razer Cortex and Hone (vendor descriptions, not independent tests)

| Capability | Razer Cortex | Hone.gg | PC Doctor V7 |
| --- | --- | --- | --- |
| Background process suspension/closure | Game Booster description | Game Mode description | No; avoids unsaved-data loss |
| Automatic game detection | Game Launcher / Game Booster | Common launchers described | Steam manifests only |
| Game-specific presets | Booster Prime for supported titles | Game-specific controls described | Not implemented |
| Cleanup | System Booster junk cleanup | Optimization/cleanup suite | Selected old user Temp files to Recycle Bin |
| Temporary PC changes | Session control | Session profiles | Game Mode; optional supported power plan with restore |
| Performance evidence | Vendor performance claims | Vendor performance claims | Imported user-provided repeated FPS CSV captures; no native recording |
| Subscription | Vendor offering | Free/Premium | No app subscription for local workflows; open-source |

Sources: https://www.razer.com/cortex/booster ; https://www.razer.com/cortex/booster-prime ; https://support.hone.gg/hc/en-gb/articles/6031122574367-Game-Mode-What-It-Is-How-to-Use-It ; https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/manage-drive-space-with-storage-sense

No head-to-head benchmark was performed. Never claim higher FPS, lower ping or complete feature parity without controlled evidence.

## Acceptance testing

Automated CI must pass the Node test suite, Vite build, Electron source validation, Windows Setup/Portable x64 packaging and SHA-256 checksum generation.

Before moving from beta to a stable release, complete [the Windows tester checklist](FRIEND_TESTING.md) on multiple machines; verify restoration after app exit/crash, recover selected files from Recycle Bin, review executable signing/reputation, and collect repeatable FPS data without cherry-picking.

## V7.1 automation changes

- [x] One-approval Boost & Play handoff for verified Steam/Epic titles, with rollback attempt if launch fails.
- [x] Read-only Epic manifest discovery and validated launcher identifiers.
- [x] Bulk recycling of eligible old user Temp files after one confirmation.
- [x] Optional irreversible deletion of 30+ day top-level .tmp files, bounded and checked against scan metadata.
- [x] Simpler screen and automatic game list refresh.
- [ ] Game-process-specific auto-restore, universal launcher support or native FPS capture.
- [ ] Code signing, independent device tests, head-to-head performance proof and stable certification.

Recycle Bin moves are recoverable but do not reclaim space. The permanent option reclaims some space but has no undo.
