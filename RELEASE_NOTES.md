# PC & Laptop Doctor AI — v9.0.0-beta.2

**Windows 10/11 x64 — unsigned, experimental public beta**

## Main changes since v9.0.0-beta.1

- Windows-native, fixed-command **C++ EcoQoS helper** replaces per-process PowerShell. It is compiled locally with MSVC during Windows builds and shipped alongside the packaged Electron app. This is a normal-user process, not an elevated driver or service.
- The helper validates exact PID, executable path and start time, and independently rejects Windows service-owned and cross-logon-session processes. Known anti-cheat, Windows, game-launcher and security processes are blocked by both layers.
- Auto-Boost game reconciliation checks every **5 seconds** with two sightings to confirm the game. This reduces delay but is still polling, not yet event-driven.
- Added an explicitly preview-approved, default-off AC-only High Performance plan option for recognized automatic game sessions. Battery and unsupported configurations skip power changes; original setting uses the existing Game Focus restoration journal.
- Write-ahead journal **fsyncs** before each action, records a UUID, and distinguishes intent, confirmed and uncertain results. Failed operations aren't counted as successful. Revoking an approved app immediately attempts to restore current background adjustments.
- The UI displays a read-only sample of protected processes with explanations and confirmed vs attempted QoS counts. The README fixes the obsolete V8.2 installer filename references and links to beta.2 assets.

## Scope and limitations

- User must explicitly approve an executable for reduction; unknown apps are kept. This version reduces Windows background-process EcoQoS **but never force-closes apps**, suspends threads, disables services, alters firewall/Defender/anti-cheat, or forces Windows updates to stop. Unsaved user work is never intentionally closed.
- No code-signing certificate has been provisioned. Native helper and setup EXE remain unsigned. Do not represent this as a production-stable release.
- If the OS cannot safely query the original EcoQoS state (including some Windows 10 builds), no process adjustment is applied.
- Crash recovery happens **when PC Doctor next runs**; there is no always-on separate watchdog that repairs settings while PC Doctor is closed.
- Game detection still uses Steam/Epic/custom EXE paths. Multi-game process ancestry, other launchers, temperature-aware power-mode control, PresentMon integration and real FPS benchmarks are not included.
- A benchmark victory over Razer Cortex or 2×–10× FPS gain is unproven; do not claim either.

## Required quality gates

1. Windows CI compiles the C++ helper from source; all tests and a disposable-child real Win32 apply-and-restore smoke test pass.
2. Vite build, Windows Setup and Portable EXE packages, SHA-256 list and GitHub release upload all pass.
3. A noncritical physical Windows laptop is tested for startup, per-executable consent, game detection, restoration on game exit, force-quit and reboot recovery.
4. Protect user data and security components in real games/anti-cheat scenarios, and obtain a code-signing identity before any stable public launch.

Detailed plan: [V9 Game Session beta testing](docs/V9_GAME_SESSION_BETA_TEST_PLAN.md).
