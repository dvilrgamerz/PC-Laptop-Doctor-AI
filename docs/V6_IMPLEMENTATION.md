# PC Doctor V6.0–V6.4 implementation and competitive validation

Status: **implemented as an unsigned V6.4 preview, pending independent Windows device testing**.

This release implements tangible features across all five V6 slices. It does **not** establish full feature parity with Hone, faster gaming performance, or a product certification. The open-source code is the evidence for implemented functions; benchmarks on real PCs remain unperformed.

## V6.0 — Safe optimization engine

- Typed, reviewed per-user Windows DWORD manifests for four preferences:
  - GameDVR_Enabled (Game DVR recording)
  - AppCaptureEnabled (background capture)
  - EnableTransparency (desktop visual effects)
  - TaskbarAnimations (taskbar animations)
- Windows values are read before showing a change. Unsupported/unknown values disable the action.
- Dry-run displays **before → after**, risk, impact, restart note, and official reference.
- Each action needs its own one-time confirmation token and checkbox, expires after 60 seconds.
- Previous values are persisted in an atomic local journal **before** Windows is changed.
- The app rereads Windows to verify apply and restore; a failed or interrupted apply retains a recovery journal.
- Original value can be restored after restarting PC Doctor; external changes cause refusal rather than overwriting user changes.
- These four actions complement (not replace) the existing Game Mode and high-performance power plan options.
- **Not implemented:** generic bulk registry scripts, automatic services changes, patching security mitigations, automatic profile apply, UAC elevation or approved OEM firmware edits.

## V6.1 — Actual status plus advisory profiles

- Existing 23 reviewed options and five guidance profiles retained; they already existed in V5.1.
- New live Windows status for each of four changes: Available, Already set, Unavailable, Restorable, or Recovery needs review.
- Added conservative Safe, Balanced desktop, Gaming recording and Battery-oriented **advisory** profiles. Selection does not apply settings, saving battery is not guaranteed.
- Official reference links and workload measurement suggestions per option.
- **Limit:** six reversible native settings in total including pre-existing Game Mode and power plan, not ten; only four new in the V6 engine. A catalog entry is not counted as an applied optimization.

## V6.2 — Steam game library and manual session mode

- Read-only discovery of up to 150 installed Steam games from known Steam library manifests (other launchers not detected).
- Inspect app manifests only. No game-file writes, executable launching, process injection or anti-cheat workarounds.
- User manually starts/stops a resource session. While active, the panel samples a bounded top-process snapshot about every eight seconds. Monitoring stops when the panel unmounts, and no process is stopped.
- Optional selected-game advice, clearly non-model-specific. No proprietary game configuration packs and no automated cleanup of other apps' files.
- Existing Windows Storage cleanup recommendations and PC Doctor-only cache clear remain available.

## V6.3 — Network path and multi-run FPS evidence

- User-approved six-echo comparison between the OS-reported default gateway and a fixed Cloudflare address 1.1.1.1. No arbitrary destination from the UI.
- Explicit uncertainty: firewalls may block ICMP; gateway-vs-external results do not prove an ISP fault. No live bandwidth saturation or bufferbloat traffic generation.
- The existing one-run FPS CSV comparison remains.
- New experiment workflow accepts **3–8 user-recorded matched captures per condition**, max 5 MiB per file, 100+ frames each.
- Summarizes average FPS, 1% low, 95th-percentile frame time, percent change, run-to-run variability and an **approximate** within-sample bootstrap interval.
- Requires user confirmation of matched game scene, driver, resolution and power state; exports a self-contained JSON report of aggregate statistics.
- **Not implemented:** first-party game frame capture, overlay injection, continuous FPS streaming, GPU stress tests, scientifically validated performance improvements, confidence guarantees, or game-server route diagnosis.

## V6.4 — Release and UX improvements

- Integrated all new panels inside existing Optimization Studio and History & Bench.
- Responsive Windows-oriented cards, explicit loading/approval/error/recovery states.
- Added Node regression tests for preview/restore and interruptions, local library parsing, network probe bounds and repeated-run statistics.
- GitHub Actions builds Setup and Portable x64 executables, checks outputs, publishes a prerelease and SHA-256 checksums.
- Installer is **unsigned**. No independent device compatibility, real FPS improvement, external security audit, or automatic updater verification has been established.

## Explicit comparison with Hone

| Topic | Hone vendor-described functionality | PC Doctor V6 implementation | Still needed to claim parity |
| --- | --- | --- | --- |
| Windows gaming tweaks | Many gaming-related switches and presets | 23 informational guidance options, plus four new native confirmed adjustments and two legacy reversible ones | Wider verified low-risk optimization library |
| Game-specific modes | Detection and game-aware optimization | Read-only Steam app library; general selected-game advice | Verified per-game config adapters with exact backup/undo |
| Session boost | Game Mode with selective background activity | Manually started process monitoring without forced close | Controlled user-approved per-app workflows and session performance testing |
| Network | Latency/ping optimization options | External + local-gateway ICMP comparison with clear caveats | Reproducible game-server and bufferbloat measurements |
| Benchmarks | Marketed gaming performance improvements | User-provided repeated FPS captures with variation/intervals | Independent matched real hardware experiments |
| Privacy/price | Vendor plans with paid tiers | Open-source and local-first, no subscription gate | Reliability, signed release reputation and outside audit |

Do not use this table as a measured head-to-head performance result; competitor capabilities are described from the vendor's own materials, not independently retested here.

Official research baseline: [competitive research](COMPETITIVE_RESEARCH.md), [V1–V5 roadmap](ROADMAP.md), [Windows QA](TESTING.md), [V6 Epic #10](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues/10).

## Reproducibility gate — mandatory before marketing FPS gains

1. Install the **same** signed/known software and compare the same game/graphics/driver on two or more real Windows devices.
2. Capture at least five baseline frame-time runs with a trusted independent recorder.
3. Apply one consented change; capture at least five matched after-runs.
4. Restore original settings, repeat the baseline to detect drift, and include negative/null results.
5. Report average FPS, 1% lows, frame-time distribution, thermal/power mode and run-to-run variance, not just one best result.
6. Record failures and maintainers' hardware-version compatibility tests.
