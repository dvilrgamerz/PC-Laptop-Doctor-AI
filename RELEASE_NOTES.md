# PC Laptop Doctor AI v7.4.0-beta.5 — Live PC Monitor & Simpler Auto Care

Public beta for Windows 10/11 x64 testers. Unsigned; no guaranteed gaming FPS or latency improvement.

## Improvements over V7.3
- **Live PC Monitor:** New main Boost & Play panel shows CPU, RAM, system drive usage/free space, CPU temperature if available, and OS-reported network transfer rates. Short trends are only in memory. No cloud transfer or persistent hardware logs.
- **Better triage:** High-priority low-storage alerts appear for disks at 95%+ usage or less than 10 GiB free; 90%+ RAM and 95%+ CPU use also prompt relevant local troubleshooting.
- **Performance limits:** Live sampling every ~8 seconds while the panel is open, 5.5-second backend cache and coalesced sensor reads. No repeated ping, startup-app scanning or file changes in the monitor.
- **Simplified Autopilot setup:** One button can prepare both existing safe automation modes. Explicit consent and Save remain mandatory before either mode activates. The Turn Both Off shortcut makes disabling easy.
- **Interface:** Compact, higher-contrast monitor cards and trend indicators replace stale one-shot metric cards on the Boost & Play page.

## Preserved
- Existing read-only Steam/Epic/custom-game detection and launcher handoff, reversible Game Focus, opt-in background Auto Focus, weekly *recoverable* Temp care, optional manual cleanup, network tools and FPS CSV comparison.

## Honest limitations
- No independent evidence of better FPS than Hone or Razer Cortex; no automatic game-specific performance injection.
- CPU temperature can be unavailable. Network throughput is adapter data, not internet speed.
- Auto Temp care moves eligible items to Recycle Bin and does **not** free space immediately.
- Windows builds are unsigned beta binaries; physical device testing, code signing, independent security/anti-cheat audit and comprehensive accessibility QA remain incomplete.

Please share the official GitHub release page and SHA256SUMS.txt with testers. See docs/V7_4_MONITOR.md.
