# PC Laptop Doctor AI v1.2.0 — Fix & Gaming preview

- **Fix & Gaming Center** with scan-prioritized storage, RAM and CPU recommendations.
- Working shortcuts to native Windows Storage, Installed Apps, Startup, Game Mode, Graphics, Power, Updates, and Task Manager.
- Explicitly confirmed **one-click Game Mode switch** with a locally saved previous registry value and Restore control.
- Optional **High performance power-plan switch**, only when a standard plan already exists; AC power required on laptops, with Restore control.
- No automatic file deletion, process termination, registry cleaning, overclocking or Defender changes.
- Windows x64 **Setup.exe** and **Portable.exe** generated via GitHub Actions with SHA-256 checksums.

## Limitations and safety

The optional controls really change the specified Windows settings; the diagnostics scan itself remains read-only. This is an **unsigned preview build**, not a verified Windows performance accelerator or a trained AI diagnosis. Review each confirmation before making a change. Gaming FPS improvements are not guaranteed, and power-mode changes can increase heat and power draw.

Verify SHA256SUMS.txt before distributing the installer. Regression tests run in CI, but physical-device performance is not benchmarked here.
