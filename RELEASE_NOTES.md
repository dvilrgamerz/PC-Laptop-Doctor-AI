# PC & Laptop Doctor AI — v8.2.0-beta.4

**Windows 10/11 x64 — unsigned public tester beta**

## Changes since v8.2.0-beta.3
- Fixed a duplicate Monster Mode dashboard panel.
- Added explicitly reviewed, opt-in **Start with Windows** integration for packaged Windows releases. Disabled by default until a person approves Monster Mode; disabling Monster Mode also attempts to remove its login registration.
- Added real automation status tiles: trusted game activity, weekly care, startup state, date and count of previous cleanup.
- Made warnings about failing to apply/remove Windows startup settings visible. An approval token is still short-lived, single-use and bound to the previewed startup option.
- Updated desktop downloads, version labels, UI and friend-testing documentation.
- Paused automatic GitHub Pages deployments until repository Pages is configured. This avoids a failing Pages job incorrectly obscuring successful Windows builds.

## Scope and safety
- The PC must be on and PC Doctor must be running. Starting with Windows is **optional**, not a background system service.
- No arbitrary process termination, security-product disabling, overclocking, permanent personal-file cleanup, or guaranteed FPS gain.
- Temp cleanup only moves eligible files to Recycle Bin; this does not free disk space until the user empties it.
- Preview and approval must occur before enabling automation. Auto-Boost touches only supported Windows preferences; old values have a restore flow.
- Installer is unsigned. Automated CI does not establish real-device stability or third-party code security.

## Minimum public-test gates
1. Node tests and Windows GitHub Actions installer/portable jobs succeed for this commit.
2. Two EXEs plus `SHA256SUMS.txt` are attached to the tagged prerelease.
3. At least two different physical Windows machines complete the tester checklist before broad marketing.
4. Do not claim benchmark superiority over Razer Cortex until controlled before/after comparisons substantiate it.
