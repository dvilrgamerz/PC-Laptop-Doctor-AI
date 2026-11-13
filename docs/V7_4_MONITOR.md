# PC & Laptop Doctor AI — V7.4 Resource Monitor and Accessible Autopilot

## What has been implemented

- A new **Live PC Monitor** on Boost & Play: CPU utilization, RAM utilization, main system drive percentage/free GiB, CPU temperature (only if exposed by Windows), and current network transfer rates (only when available).
- Short, **in-memory-only** 20-snapshot trends for CPU, memory, storage and temperature. Read-only and not sent to external servers.
- Samples are requested at most every eight seconds while the monitor page is mounted; the main-process collector has a **5.5-second cache** and shares in-flight sensor requests. No ping tests, startup-app inventory, remote endpoint, telemetry or persistent logs.
- High-priority warnings for drive space (95% used or under 10 GiB free), RAM usage (90%+), and CPU utilization (95%+). These are *capacity triage thresholds*, **not hardware-failure diagnoses or proof of gaming FPS improvements**.
- Focused shortcuts to the existing Boost & Play cleanup, upgrade analysis and performance diagnostics, rather than dozens of settings links on the primary page.
- Simplified Autopilot selection: **Prepare safe automatic care** preselects optional trusted-game Auto Focus and weekly recoverable Temp care, but both still require user approval before activation. **Turn both off** remains accessible.
- Existing game discovery, custom EXE picker, guarded Game Focus settings, and safe Temp cleanup from V7.3 remain available.

## What is not claimed or included

- There is **no** invisible Windows optimization or universal game-specific FPS improvement. Existing automatic Game Focus only manages supported reversible Windows preferences while the app runs.
- The weekly background cleanup is **recoverable**, moving scoped old user Temp files to Recycle Bin; it does **not** increase free disk space until they are removed from Recycle Bin.
- Permanent cleanup remains a separate irreversible user-approved action. PC Doctor never automatically deletes documents, downloads, game saves or Windows system files.
- CPU temperatures may be unavailable; **Unknown** is not equivalent to safe.
- There is no trained bundled language model; local Ollama remains separately optional.
- Live network throughput is measured only from OS adapter counters when available. It does not prove Wi-Fi quality, internet speed or game latency.
- No physical-machine FPS benchmarks, multi-device QA, code signing or independent security audit have been completed in this coding environment.

## Priorities for computers with a nearly full disk

A Windows PC reporting roughly **98% disk utilization** and **5 GiB free** should prioritize cleaning genuine unneeded large applications/files through Windows storage tools, or increasing disk capacity, **before** speculatively changing gaming settings. The limited user-Temp cleaner will not necessarily reclaim enough space. PC Doctor does **not** automatically delete unknown user data to hit a free-space target.

## Tester release checklist

1. Install/launch on Windows 10 x64 and Windows 11 x64; record any SmartScreen warning (the binary remains unsigned).
2. Compare CPU, memory and drive readings with Task Manager / Windows Settings and note discrepancies.
3. Confirm temperature displays **Not available** when not exposed by the hardware.
4. Leave Boost & Play open for a minute: confirm the monitor updates around every eight seconds, without freezing the UI or consuming excessive CPU.
5. Navigate away and back: confirm monitoring does not accumulate polling loops or persist snapshots.
6. Verify heavy disk use produces a warning and a working cleanup shortcut, without deleting anything.
7. Prepare Autopilot automatic mode; verify it **does not activate** before approval and Save.
8. Run a game with a verified Steam/Epic/custom executable, confirm automatic profile changes when supported and restoration after game exit/restart.
9. Verify weekly cleanup stays off until approved and moves only eligible old user-Temp .tmp files to Recycle Bin.
10. Verify Setup and Portable editions on distinct devices; report crashes, anti-cheat conflicts, and performance regressions.

**Publication rule:** This is a publicly downloadable **beta**, not an independently verified stable release or established competitor to Razer Cortex/Hone.gg. Pass automated CI, verify both EXE assets and SHA-256, and collect real Windows QA before claiming stable.
