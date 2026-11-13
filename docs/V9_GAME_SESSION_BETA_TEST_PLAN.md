# V9 Game Session Engine — beta.1 testing and remaining work

## What is implemented

A consented background-process EcoQoS prototype: user selects exact eligible executables in Monster Mode, Autopilot detects a trusted installed or user-added game, reads each approved process's Windows power throttling state, writes an intent journal, requests EcoQoS, and restores the prior state when the game exits, the user stops the session, the app quits, or the app next launches. Only four processes can be touched per session. If a queried state is unavailable, **no change is applied**. The background-mode UI is inside the app and reports failures.

This is not app-closing functionality. The app does not force-stop, suspend, terminate or automatically reopen background software. The reversible EcoQoS mechanism does not free RAM. The existing Game Mode, optional power profile and Temp care remain separate.

## Windows and security limits

1. Never approve antivirus, EDR, encryption, accessibility, anti-cheat, game executables, game launchers, hardware driver services or PC Doctor itself. The classifier has a defense-in-depth denylist but cannot know every third-party security program. Unsupported and unknown processes stay on Keep.
2. No administrator privilege escalation, Windows services manipulation or registry changes in this feature.
3. The process identity is checked again by full executable path and creation timestamp before modification. A journal is written before each attempted action. Restore only happens when the current state matches the applied state; if a different process now owns the PID, the old record can be discarded.
4. On older Windows 10/11 builds, GetProcessInformation's query for PowerThrottling may not be available. The feature is designed to skip rather than apply a change without capturing the original state. See [Microsoft's API](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocessinformation).
5. Auto-Boost still polls every 15 seconds and must see a game twice. This beta is not yet event-driven. It does not identify every game executable/launcher.

## Noncritical-PC test sequence

- Install on Windows 11 22H2 or newer; launch the Dashboard. In Monster Mode, inspect running user apps and confirm no Windows/antivirus/anti-cheat processes are offered.
- Choose one disposable, nonessential test app, click **Reduce during games**, and confirm the approved count increments. Confirm that choosing Keep removes consent.
- Enable Monster Mode via its preview and explicit approval. Start an already recognized Steam/Epic or manually added game while PC Doctor is running.
- Observe the V9 status and any unavailable API errors. While the game runs, use a diagnostic tool to inspect process EcoQoS if possible. Do not infer a performance gain merely from a displayed "adjustments attempted" count.
- Close the game. Wait for the detection period and verify that the V9 action count clears, the original process state is restored, and no other app was modified.
- Repeat with an approved app ending during a game and with another process taking the same PID (simulate in tests). Repeat with a user-triggered Restore during a session.
- To test crash recovery, use a disposable app and verify journal recovery after force-quitting PC Doctor and restarting it. The app only attempts recovery when launched again; it does not run a separate crash-resident watchdog.
- Test on Windows 10 and unsupported builds: it must not apply an unjournaled setting, and it must show a skipped/unavailable result.
- Run the existing diagnostics and games with/without an active anti-cheat component. The booster must not block game launch or disable anti-cheat; stop testing immediately if interference is observed.
- Test login startup, portable EXE relocation, disabling automation, reboot, uninstall and offline operation. Verify no lost work or startup surprises.

## Reproducible benchmarks — not yet integrated

Use [Intel PresentMon](https://github.com/GameTechDev/PresentMon) externally for now. Run alternating A/B/A/B/A/B captures on the same graphics settings, scene, power source and thermal state. Report average FPS, 1% lows, 99th-percentile frame time, spread across repetitions, and CPU/RAM/GPU/temperature. Do not claim a 2x–10x laptop speedup or benchmark superiority without a reproducible result.

## Remaining V9 roadmap (not delivered in beta.1)

- Independent real-device Windows 10/11 functional testing of the native PowerThrottling API, cross-hardware/anti-cheat matrices, and randomized crash rollback tests.
- An optional safe graceful-close/reopen workflow with explicit user consent and data-loss mitigation. Never force-close user applications with unsaved work.
- Faster process-lifecycle notifications with polling reconciliation.
- PresentMon capture integration and a rigorous before/after comparison screen.
- Vendor-aware power/thermal guards, game-specific configuration backups, expanded launcher detection.
- More comprehensive publisher signature verification and executable identity checks.
- Electron restricted application protocol/CSP hardening, independent security audit, signed release binaries.
- Do not mark stable until the beta's recovery, safety, performance-overhead and device validation gates pass.

## CI

The Windows workflow runs regression tests and Electron source checks before the packaged Setup and Portable x64 EXEs are published with SHA-256 sums. A successful CI run does not replace on-device Windows API, anti-cheat, thermal, or FPS testing.
