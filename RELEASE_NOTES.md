# PC Laptop Doctor AI v2.0.0 — Roadmap Suite (preview)

**Windows x64 Setup and Portable editions**. GitHub Actions builds unsigned executables and provides SHA-256 checksums.

## New
- **Offline Doctor:** Local rules answer common troubleshooting questions with specific scan evidence and practical steps. This is **not a trained language model**.
- **Upgrade Advisor:** Workload-specific RAM, SSD, integrated graphics and battery guidance with clear compatibility cautions.
- **History & Bench:** Local summary-only history is explicitly opt-in, stores at most 30 entries, supports export and deletion; optional fixed-workload JavaScript CPU microbenchmark stores up to 10 results when enabled.
- **Safe Repair:** Added native Windows network status/troubleshooters and System Protection restore-point wizard shortcuts, with no implicit changes to OS state.

## Limitations
- A "Fix" shortcut opens Windows tools; it does not silently clean disk, reset networking or create restore points.
- The optional Game Mode / High performance changes from V1.2 remain explicit and reversible.
- No FPS increase, hardware compatibility, real GPU speed or game benchmark has been verified. A CPU microbenchmark is not a standardized performance score.
- Device-specific tests and external signing are still needed. Windows may warn that this preview is from an unknown publisher.
- See docs/ROADMAP.md for what is implemented versus not implemented.
