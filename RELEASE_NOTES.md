# PC Laptop Doctor AI v5.0.0 — Advanced Suite (unsigned preview)

Windows x64 Setup.exe and Portable.exe, SHA-256 checksums, source and test suite in this release.

## New in V5

- **Optional local LLM:** Connect to a model the user already installed in Ollama at numeric loopback 127.0.0.1:11434; no automatic downloads, cloud API keys or background calls. A separate approval is required before the user question and numeric-only redacted scan data are sent to the local service.
- **Hardware Inventory:** Read the local machine/board model, BIOS version, installed RAM modules and drives; omit serials and UUIDs. Inspect top memory-heavy processes without killing anything.
- **Gaming Performance Lab:** Import user-recorded game frame-time/FPS CSV logs; calculate average FPS, a documented slowest-frame-time 1% low and P95 frame times, and compare matched captures. This release does not record FPS itself.
- **Storage Check:** Bounded temporary-file read/write microbenchmark with space check and file cleanup. This is not a standardized SSD benchmark; read results may be cached.
- **Consent-gated Maintenance:** Preview and approve DNS cache flush or PC Doctor-only HTTP cache clearing. Confirmation tokens are single use; log records only action/type/date/success. Cache actions are not reversible.
- **Usability:** Integrated panels in existing Ask Doctor, Upgrade Advisor, History & Bench, and Fix & Gaming screens; accessible controls and improved scrolling navigation.

## Existing features

- Scan CPU, RAM, storage, graphics adapters, battery and network; prioritize health-score warnings.
- User-confirmed Game Mode and High performance plan with previous-value Restore.
- Rule-based offline troubleshooting, workload-based hardware guidance, opt-in local summary history.

## Limitations

**This is a preview, not an independently certified PC repair or AI diagnostic product.**
- No trained model bundled. Ollama is optional and must be separately installed by the user.
- No automatic deletion of personal files, arbitrary process killing, Windows Defender changes, GPU overclock or full network reset.
- No verified motherboard/SSD/RAM compatibility, OEM maximum RAM or slot count.
- No native GPU stress test or automatic FPS capture; CSV results are as reliable as the source capture.
- No scientifically established FPS improvements. Disk check and JavaScript CPU test are not hardware rating tools.
- Windows installers are unsigned; SmartScreen may warn. Check the original GitHub release and SHA256SUMS.txt.

Read docs/ROADMAP.md for the feature-by-feature audit and docs/TESTING.md for verification procedures.
