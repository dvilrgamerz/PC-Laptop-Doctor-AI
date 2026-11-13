# PC & Laptop Doctor AI — v9.0.0-beta.1

**Windows 10/11 x64 — unsigned, experimental public beta**

## What changed since v8.2.0-beta.4

- Added **Background Boost**, a real Windows EcoQoS option scoped to recognized game sessions. It is **OFF until a person explicitly approves each eligible executable** in Monster Mode.
- Added an in-app running-process list with **Keep** / **Reduce during games** controls, session status and **Restore original QoS**.
- Added system/game/security/anti-cheat/launcher protections. Unknown processes are kept by default. No arbitrary termination or service disabling.
- Added write-ahead JSON recovery journals: save original QoS, recheck exact process path/start time before mutation, restore only if the applied state still matches, skip exited/reused PIDs, and retry incomplete restoration at next app launch.
- Connected Auto-Boost activation and restore to trusted detected Steam/Epic/user-added games, app shutdown, and disabling Monster Mode.
- Added regression tests, source validation and disclosure of capabilities and limits.

## Scope, hardware and Windows compatibility

- Only a maximum of **four** explicitly approved running processes are considered for each gaming session. Windows may refuse the operation; that is a safe skip, not an excuse to force permissions.
- Windows 10 and older Windows 11 versions may not expose the **GetProcessInformation / ProcessPowerThrottling** query needed for a reversible prior-state snapshot. Those versions may show no supported background changes. This beta does **not** force a change without a readable original state.
- The feature does **not** close/relaunch applications, terminate or suspend processes, stop Windows services, disable security or anti-cheat, alter hardware, overclock, or guarantee FPS/latency gains. It does not control every game launcher.
- The existing Game Mode and recoverable Temp care remain. Temp recycling still does not free space until Recycle Bin is emptied.
- Actual Windows 10/11 tests, anti-cheat compatibility tests, PresentMon benchmarks, code signing, source security review and cross-hardware QA remain outstanding. **Not a stable production release.**

## Test gates

1. GitHub Actions regression tests, Electron source validation, Vite build, setup + portable packaging, checksums and artifact publication must pass.
2. On a noncritical Windows 11 22H2+ test PC, test exact-executable consent, background EcoQoS apply, game exit restore, and force quit/relaunch recovery.
3. Verify Windows 10 and unsupported machines **skip without modification**.
4. Verify that protected processes cannot be selected and that failed restoration is visible.
5. Repeat baseline/boosted FPS and 1%-low measurements before making performance claims.

See [V9 beta test plan](docs/V9_GAME_SESSION_BETA_TEST_PLAN.md).
