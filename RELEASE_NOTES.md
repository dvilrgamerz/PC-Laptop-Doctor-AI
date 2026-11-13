# PC Laptop Doctor AI v7.1.0-beta.2 — Boost & Play and Automatic Temp Cleanup

Unsigned public beta for friends and willing Windows 10/11 x64 testers.

## New in V7.1
- Installed Steam and Epic Games Launcher discovery from read-only manifests; fresh validation before launching.
- One approved Boost & Play workflow: apply supported reversible Game Focus preferences, hand off to selected launcher, attempt rollback on failed launch.
- Auto-clean scoped old temporary files to Windows Recycle Bin, without individually selecting each candidate.
- Optional immediate disk-space reclamation limited to 30+ day top-level .tmp files (max 300 candidates / 1 GiB). This is permanent deletion, requires extra consent and has no undo.
- Simpler primary UI with advanced actions collapsed; improved tests and tester instructions.

## Limitations
- Game Focus does not guarantee better FPS or automatically detect when every game process closes. Stop & Restore or close PC Doctor to return to prior settings.
- Recycle Bin moves do not free disk space. Real space reclamation is narrow and irreversible.
- Other game launchers, specific in-game settings, GPU overclock, service termination or antivirus changes are not supported.
- Installer is unsigned; independent Windows hardware, anti-cheat, accessibility and security testing are outstanding. Keep preview/prerelease status.
- See docs/FRIEND_TESTING.md and docs/V7_RELEASE.md for test instructions and scope.
