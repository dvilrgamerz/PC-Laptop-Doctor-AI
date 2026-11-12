# PC Laptop Doctor AI — V1 to V5 implementation audit

**Current target: V5.1 preview.** Every main roadmap area has a user-facing workflow, but “complete” does not mean certified autonomous repairs, fully verified upgrades, or hardware-independent benchmark accuracy.

## V1 — Read-only diagnostics

- [x] Local Windows CPU, RAM, disk, battery, GPU, network and uptime snapshots
- [x] Deterministic warning scoring; explicit missing-sensor readings
- [x] Export privacy-conscious summary; session before/after comparison
- [x] Windows x64 Setup and Portable EXE build pipeline with SHA-256
- [ ] Independent hardware-fault verification across vendors and firmware
- [ ] Production code signing and broad Windows/ARM64 compatibility

## V2 — Safe repair

- [x] Guided Windows Storage, Installed Apps, Startup Apps, Windows Update and graphics preferences
- [x] Network troubleshooters, network status and System Protection shortcuts
- [x] User-confirmed Game Mode and High-performance changes with persisted rollback
- [x] Explicit preview + one-time confirmation for clearing DNS resolver cache and app-only HTTP cache
- [x] Local bounded maintenance log with action type/time/outcome
- [x] Strict fixed-action IPC: no arbitrary commands, process kills or raw file paths
- [ ] Per-file Windows temporary cleanup with recovery and exclusion logic
- [ ] Automatic system restore point creation (currently manual)
- [ ] Full network reset with connectivity recovery (intentionally not automated)
- [ ] Admin/UAC integration for privileged procedures

## V3 — Offline Doctor

- [x] Offline rules covering RAM, storage, startup, heat, power, Wi-Fi, gaming and upgrades
- [x] Optional real LLM inference through separately installed Ollama on 127.0.0.1:11434
- [x] Explicit model selection and consent to send question and numeric-only scan summary locally
- [x] Request allowlist limited to /api/tags and /api/generate; bounded responses and timeouts
- [x] No execution of generated text or user-supplied shell commands
- [ ] Bundled, independently trained and evaluated model (not provided; Ollama required)
- [ ] Guaranteed diagnostic accuracy and verified root-cause reasoning

## V4 — Hardware advisor

- [x] Workloads: everyday, gaming and creative
- [x] System/board manufacturer and model, BIOS version, detected RAM modules and drives
- [x] On-demand top memory-heavy processes displayed locally (no auto termination)
- [x] Exclude serial numbers, UUIDs and asset IDs from inventory returns
- [x] Explicit unknown upgrade constraints and compatibility caveats
- [ ] Proven total/free memory slot count or maximum supported RAM
- [ ] OEM service manual or hardware-specific upgrade compatibility verification
- [ ] Live pricing or validated part catalog

## V5 — History, CPU/disk checks and measured frame-time analysis

- [x] History opt-in (off by default), max 30 local sanitized scans and 10 synthetic CPU results
- [x] Snapshot CSV export and deletion; no cloud account
- [x] Fixed JavaScript CPU check with 3 repetitions and workload version
- [x] Temporary-file disk I/O microcheck (8 MiB default, two runs, free-space validation and cleanup)
- [x] Import external user-recorded FPS/frame-time CSV data
- [x] Average FPS, slowest-frame-time 1%-low, P95 frame time and before/after comparison
- [x] User confirmation of comparable game settings and test scene before reporting deltas
- [ ] First-party real-time FPS capture without third-party recorders
- [ ] Native GPU shader/compute test with thermal/power baselines
- [ ] Hardware-normalized CPU/GPU/SSD benchmark standards and uncertainty bounds
- [ ] Field-trial evidence for performance claims

## V5.1 — Optimization Studio and competitive feature coverage

- [x] 23 reviewed options with official links, risk and rollback descriptions
- [x] Searchable categories for Gaming, Windows, Storage and Network
- [x] 5 locally saved, non-automatic gaming and PC presets; favorite options
- [x] Prioritize storage, RAM, CPU and thermals using last scan
- [x] Route Windows settings through existing Electron IPC allowlist
- [x] Route real setting changes through the existing Fix & Gaming approval flow
- [x] Vendor research and performance-evaluation protocol in docs/COMPETITIVE_RESEARCH.md
- [ ] Measured comparison against Hone.gg; no independent head-to-head results yet
- [ ] Verified per-game configuration presets or automatic game process management
- [ ] Windows device-matrix validation and signed installers

## Beyond V5

- Windows code signing, vetted update service and installer trust reputation
- Portable app profile/data lifecycle and improved local encryption
- Manufacturer service-manual index with device identifiers and citations
- Device fleet tests, automated UI smoke tests, accessibility and translation
- Selectively redacted diagnostic exports with per-field approval
- Multi-session controlled performance tests with repeatability analysis

## Minimum security and release gates

1. Run npm test, npm run build and the Windows Setup/Portable workflow. A web build alone does not verify Windows.
2. Test sensors on real hardware; screenshots are not benchmark evidence.
3. No renderer Node.js access, arbitrary shell commands, unattended deletion or unapproved changes.
4. No external AI endpoint. Local Ollama must be present and explicitly approved. Output may be dangerous or wrong.
5. Cache clearing and DNS flushing have no undo; Game Mode and supported power-plan changes do.
6. Disk-test files must remain size-bounded and be deleted even after most errors.
7. FPS analysis depends on capture-tool definitions and truly comparable game scenes.
8. Local scan history is stored as plaintext in the app/browser profile, not encrypted.

## Release checklist

- [x] CI and security regression tests
- [x] Automated Windows Setup/Portable executables and checksum generation
- [ ] Code-signed executables and independent penetration testing
- [ ] Measured repeatable gaming improvement across hardware
- [ ] OEM-verified full upgrade compatibility

**Status:** V5 feature coverage is broad, but research and verification work remains incomplete. Publish as a preview rather than claiming certification.
