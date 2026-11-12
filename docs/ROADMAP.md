# PC Laptop Doctor AI — Roadmap and acceptance criteria

This document distinguishes **shipped functionality** from claims that would require external validation. A feature is not "complete" just because a button or screen exists.

## V1.0 / V1.1 — Diagnostics and Windows distribution

- [x] Electron Windows desktop application, local CPU/RAM/storage/battery/network scan
- [x] Condition-based issue scoring and before/after scan comparison in the current session
- [x] Windows Setup x64 and Portable x64 executables, release checksums and CI tests
- [x] Distinguish real machine readings from simulated browser demo
- [ ] Code-signing certificate and SmartScreen reputation
- [ ] Independent compatibility tests on a broad Windows hardware matrix

## V1.2 / V2.0 — Safe Repair

- [x] Native Windows shortcuts for Storage recommendations, Storage Sense, Installed apps, Startup apps, Windows Update, Graphics, Power, Game Mode and Task Manager
- [x] Windows network-status and built-in troubleshooter shortcuts
- [x] System Protection / manual restore-point wizard shortcut
- [x] Confirmed Game Mode and power-plan changes with locally persisted previous settings and guarded rollback
- [x] Scan-based triage for disk, memory and CPU constraints
- [x] Restore remains managed by Windows; no administrative or hidden cleanup
- [ ] Automatic per-file temporary cleanup with audit trail, exclusion list, rollback and recovery checks — intentionally **not shipped**
- [ ] Automated network-stack reset with connectivity recovery — intentionally **not shipped**
- [ ] Automatic Windows restore-point creation (requires OS permissions and may not be enabled)

## V3 — Offline Doctor

- [x] Ask questions in natural language about common PC symptoms
- [x] Ground answers in actual scan readings, caveats and practical steps
- [x] Offline rule-based knowledge; no credentials, remote requests or training files
- [x] Unknown question handling and "cannot determine" caveats
- [ ] Trained or pretrained LLM for open-ended dialogue — **not shipped**
- [ ] Live authoritative driver/firmware diagnosis and model-specific root-cause verification — **not shipped**

## V4 — Hardware Advisor

- [x] Workload categories for everyday, gaming and creative tasks
- [x] Capacity-based SSD and RAM triage, graphics guidance, battery-health prompts
- [x] Explicit cautions for soldered RAM, laptop GPUs and unverified SSD connectors
- [x] Avoid unsupported FPS and upgrade-compatibility promises
- [ ] Verified device model lookup, RAM slot count and maximum capacity, motherboard/SSD compatibility
- [ ] Live inventory/pricing integrations or manufacturer-certified replacement instructions

## V5 — History and Performance Lab

- [x] Explicit opt-in before saving summary-only diagnostic history
- [x] Bounded maximum of 30 snapshots stored in local app/browser profile
- [x] Display change in health score and RAM percentage; export CSV and delete saved data
- [x] Short fixed-workload JavaScript CPU microbenchmark (3 runs; median)
- [x] User-controlled history of up to 10 CPU checks, only with consent
- [ ] Proper sustained CPU, GPU and disk benchmarks with calibration and hardware-specific normalization
- [ ] Rigorous game FPS/1% low frame-time capture with repeatability and automated statistical comparisons
- [ ] Automated repairs proven to improve performance, rather than a heuristic score

## Safety rules

1. Every operation that changes Windows settings is explicit and reversible where feasible. Launching Windows Settings or a troubleshooter is guidance, not an automatic repair.
2. Don't delete personal files, kill processes, disable antivirus, reset networking, overclock or modify unknown registry keys from a one-click "boost" button.
3. A faster benchmark result is not proof of a repair: repeat under similar conditions, account for thermal/power/background noise, and distinguish CPU microbenchmarks from real game FPS.
4. History is stored locally and **not encrypted**; avoid shared-profile access and delete before sharing your PC. The sample web demo can store marked sample history only with opt-in.
5. Unknown temperatures, RAM slot count, GPU upgradability, prices, compatibility or driver support must be explicitly labeled unknown.

## Verification to run before every version release

- GitHub Actions Node test suite and Vite frontend build on supported platforms
- Windows x64 Setup + Portable packaging smoke checks, checksum generation
- Manual testing on at least two real Windows machines, including an 8 GB RAM laptop
- Validate manual restore-point launcher and Windows Settings URIs on Windows 10 and 11
- Security review of Electron IPC and local history storage
- Real, reproducible performance measurement before advertising any FPS improvement

## Future milestones beyond V2.0

- Better diagnostic reliability and thermal sensor fallbacks
- More detailed, user-approved repair operations with logged steps and recovery
- Optional completely offline LLM with provenance and strict resource budgets
- Exact manufacturer service-manual-based upgrade guidance
- Benchmarks for CPU/GPU/storage with comparable baselines and error bars
- Accessibility, Windows code signing, automated update validation and independent security audit
