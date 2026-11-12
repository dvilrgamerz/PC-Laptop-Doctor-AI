# PC Laptop Doctor AI — Competitive landscape and safety research

Research snapshot: **November 12, 2026**. Verified against the vendor's own pages and Microsoft's official documentation. This document is a design comparison, not a measured head-to-head benchmark.

## Competitor reviewed: Hone.gg

Hone describes:
- Grouped Windows/gaming optimizations and PC-side responsiveness adjustments.
- Game Mode that changes selected background activity while a game runs.
- Game configuration presets for supported games, and automatic game detection.
- Windows restoration of supported settings.
- Free optimization allowance, with more modes/presets and unlimited optimizations via Premium.

Official references:
- https://hone.gg/
- https://hone.gg/premium
- https://support.hone.gg/hc/en-gb/articles/4758186993183-Using-Hone
- https://support.hone.gg/hc/en-gb/articles/4758238924959-Recommended-Optimizations-to-Use
- https://support.hone.gg/hc/en-gb/articles/6031122574367-Game-Mode-What-It-Is-How-to-Use-It

These are **vendor claims / product descriptions**, not independent measured FPS results. The number of tools offered is not a performance benchmark.

## Opportunity matrix

| User value | Hone.gg described behavior | PC Doctor V5.1 implementation | Further work |
| --- | --- | --- | --- |
| Finding the real bottleneck | Live sensors and optimization categories | Storage/RAM/CPU priority findings from read-only scan; plain-language explanation | Multi-sample thermal & frame-time correlation |
| Windows optimization menu | Multiple grouped performance tweaks | 23 reviewed Windows actions, risk/evidence/restore descriptions, 4 categories and search | Native cross-version verification of every deep link |
| Gaming presets | Supported game profiles and Game Mode | 5 **guided** workload presets: Balanced, Competitive FPS, Low-memory PC, Visual quality, Gaming + streaming | Real game-specific data files and verified compatibility |
| Actually applying a setting | Selected optimizations applied by vendor app | Two existing consented/reversible Windows settings; additional Windows UI links; two maintenance actions separately approved | More safe reversible changes after security review |
| Background process control | Vendor says game mode can limit selected tasks/services | Show which processes use RAM; no auto-kill or service disruption | Optional explicit per-app startup UI without protected process termination |
| Gaming results | Vendor markets FPS/latency improvements (may vary) | Imported frame-time CSV comparison; clear slowest-1% definition, no unsupported boost percentage | Repeated identical-scene tests and confidence intervals |
| Network diagnosis | PC/network delay optimizations described | User-approved 8-echo ICMP latency/loss check to a single fixed public destination | Game-server route analysis and larger statistically meaningful sample sets |
| Privacy and undo | Restorable supported settings | Explicit risk disclosure; restore current Game Mode/power plan; no hidden automatic changes | Independent security audit and Windows code signing |
| Pricing | Free tier with optimization allowance; Premium removes limit | Open-source repository; no in-app paid gating at V5.1 | Sustainable support, documentation and maintainer policies |

## Community feedback as unverified qualitative context

Community discussions report mixed or inconsistent results from PC tuning products, with demands for transparent source code, benchmarking before/after changes and the ability to restore settings. These discussions contain anecdotal claims that **must not** be interpreted as established proof of specific harms or improvements.

Examples (anecdotal, not scientific):
- https://www.reddit.com/r/OptimizedGaming/comments/1kye9u0/warning_avoid_any_tweak_or_optimization_tools/
- https://www.reddit.com/r/OptimizedGaming/comments/1xao425/what_would_make_you_actually_trust_a_pc/
- https://www.reddit.com/r/pcmasterrace/comments/1ovf2mi/dont_use_hone_optimizer/

The practical response is source transparency and reproducible controlled tests, **not** claiming another developer's app is malware or that our app is categorically faster.

## Evidence-based choices

**Microsoft official advice** recommends storage headroom, reviewing startup apps, applying relevant Windows updates and examining resource usage before complex tuning:
- https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows
- https://support.microsoft.com/en-us/windows/experience/startup-boot/configure-startup-applications-in-windows
- https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/storage-settings-in-windows

**Graphics and display:** On Windows 11, Microsoft documents optional windowed game optimizations for supported DirectX 10/11 workloads and per-app GPU selection. Neither setting is a universal FPS multiplier:
- https://support.microsoft.com/en-us/windows/hardware/display-graphics/optimizations-for-windowed-games-in-windows-11

**Settings APIs:** Windows supports a documented set of ms-settings: URI destinations, which differ by Windows version and hardware:
- https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings

## Excluded high-risk claims and modifications

Do not add a single button that:
- disables Windows Defender/updates, memory integrity, credential protections, VBS or core isolation;
- modifies HPET, timer resolution, scheduling interrupts or network adapter offloads without specific supported evidence;
- force-closes apps/processes or disables Windows services;
- deletes files or edits third-party game configs without preview, backup, and unambiguous rollback;
- promises guaranteed latency/FPS gains or invents before/after benchmarks.

Some competing optimization recommendations include disabling security mitigations or VBS. Performance trade-offs and anti-cheat compatibility are contested and hardware-dependent. PC Doctor deliberately does **not** present that as a recommended default.

## Experimental protocol before claiming superiority

1. Choose at least 3 representative systems: a low-memory laptop, integrated-GPU machine and modern gaming desktop.
2. Capture system inventory, Windows build, GPU driver, power supply mode, game version, resolution, graphics preset, temperature and background load.
3. Repeat **the exact same benchmark scene** at least 5 times with baseline settings; capture per-frame times using a separate trusted tool.
4. Apply one reviewed optimization at a time after a system state backup; record every change.
5. Repeat identical captures and compare median of runs, average FPS, 1% low FPS, P95 frame time and run-to-run variability.
6. Restore settings and repeat a baseline to detect drift/thermal or update-related confounding.
7. Report negative, neutral and positive outcomes, not just best-case results. Separate internet ping variance from game rendering performance.

This protocol is **not yet run**; no benchmark results, superior FPS claim, user survey, or compatibility certification exists.

## GitHub research tasks

- [Research and competitor safety matrix](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues/7)
- [Physical validation, signing and performance measurements](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues/8)
