# PC & Laptop Doctor AI — v9.0.0-beta.3

**Windows 10/11 x64 — unsigned experimental beta, not a stable release**

## Improvements since beta.2

- **Read-only game start/stop notifications:** a native WMI process-event watcher prompts the existing trusted-game detector to recheck Steam/Epic/manually approved executable paths. It does not trust WMI event names to authorize a boost. The 5-second reconciliation polling remains available if WMI cannot start or fails.
- **PresentMon performance comparison:** the app's Monster Mode now imports local Intel PresentMon CSV frame traces through the Windows file picker. It calculates average presented FPS, 1% and 0.1% low estimates from frame intervals, 95th/99th-percentile frame times, and observed percentage differences. It selects a single process/swap chain rather than merging unrelated processes. A single A/B comparison is **not proof of causation**, and beta.3 does not run the capture tool itself.
- **Manual graceful-close request (experimental):** with a verified active game, users can explicitly choose an eligible user application and confirm a Windows native `WM_CLOSE` request. Both Electron and the helper validate process identity; the helper denies Windows/service/other-session/security targets and requires exactly one visible main window. It never calls `TerminateProcess`, suspends threads or force-closes anything. **No automated close/reopen is implemented.** The application may show Save/Cancel or refuse closure; unsaved state cannot be guaranteed or restored.
- README link cleanup, new native watcher included in Windows packages, and added unit tests for PresentMon parsing, event debouncing, and manual close protections.

## Existing beta.2 functionality preserved

- Explicit per-executable **Reduce during games** approval, reversible Windows EcoQoS, durable journal and recovery attempts on game exit, quit, and next launch.
- Off-by-default, consented AC-only temporary High Performance power plan where supported; no unsupported battery or system tweaks.
- Windows/Defender/firewall/anti-cheat/services protections, local-only diagnostics, and recoverable Temp handling.

## Important limitations

- No 2×–10× laptop or fixed FPS improvements are claimed or verified.
- There is **no automatic close-and-reopen feature**. A manual `WM_CLOSE` does not guarantee the program will save unsaved data or terminate. It cannot restore in-memory session state.
- This app does not yet include integrated live PresentMon capture, OEM-specific thermal rollback, expanded launcher support, unified multi-game sessions or a persistent independent crash watchdog.
- Physical Windows/anti-cheat testing, code signing, trusted installer certificates and third-party security review remain outstanding. CI validation does not replace real-machine testing.
- PresentMon CSV analysis is only meaningful if the game, settings, scene, frame cap and thermal/power conditions are comparable. Repeat A/B/A/B to assess variance.

## Windows beta acceptance checks

1. Confirm native MSVC helper and WMI watcher compile, then run regression tests including a disposable-process EcoQoS apply/restore smoke.
2. Verify the Electron UI builds, both Windows x64 EXEs package, SHA-256 hashes are generated, and GitHub release assets are actually present.
3. On a personal noncritical Windows machine, verify game detection, QoS restoration after exit/crash, battery behavior, manual close dialogs, and real PresentMon captures.
4. Leave the release **prerelease/unsigned** until device testing and signing can be completed.

See [V9 field-test plan](docs/V9_GAME_SESSION_BETA_TEST_PLAN.md).
