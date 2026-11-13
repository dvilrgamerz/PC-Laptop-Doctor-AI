# PC Laptop Doctor AI v7.2.0-beta.3 — Automatic Recovery and Quick Cleanup

A public beta for Windows 10/11 x64 testers. The local-only optimizer is free to use. Builds remain unsigned.

## Changes
- Game Focus can automatically restore its supported Windows preferences after **30 minutes, 1 hour, 2 hours (default), or 4 hours**. The timer never closes the game. It is a safety cutoff, **not** detection that the game has exited.
- The session state persists the planned restore deadline and the app checks status while its Boost & Play page is open.
- Closing PC Doctor normally and starting after an interrupted session already trigger guarded recovery. Users can also manually Stop & Restore earlier.
- Opening Boost & Play automatically scans read-only Steam/Epic/custom game libraries and eligible old user Temp file candidates. The user still has to approve changing Windows preferences or cleaning files.
- Auto-clean after approval moves only eligible old user Temp .tmp/.log files to Recycle Bin. Separate advanced permanent deletion of 30+ day .tmp files is irreversible, requires additional consent, and remains bounded.
- Improved clear timers and test coverage, including injected fake timer tests for startup/stop/automatic restoration.

## Important limits
- **No guaranteed FPS improvement, universal auto game optimization or proven superiority to Razer Cortex and Hone.**
- Games outside Steam/Epic still require using the native Windows executable chooser once; no automatic scan of arbitrary executable folders.
- Do not close applications or disable Windows security to claim memory gains. PC Doctor never forces such actions.
- Moving files to Recycle Bin does not reclaim space. Permanent old .tmp removal can reclaim a limited amount but is irreversible.
- Windows installers are unsigned. These tests are source/build validation, not multiple physical Windows device or anti-cheat compatibility certification.
