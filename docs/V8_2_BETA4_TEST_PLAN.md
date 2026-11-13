# V8.2.0-beta.4 — physical Windows tester gates

This checklist is **not** a report of completed physical tests.

## Required checks before promoting out of beta

| Test | Expected | Result |
| --- | --- | --- |
| Setup install and uninstall on Windows 10 x64 | EXE launches and can uninstall | Not verified |
| Setup install and uninstall on Windows 11 x64 | EXE launches and can uninstall | Not verified |
| Portable EXE first launch | Works without installation | Not verified |
| Low-spec laptop (8 GB RAM, integrated GPU) | Dashboard responsive, unknown sensors remain unknown | Not verified |
| No games installed | Monster Mode does not invent detected games or performance gains | Not verified |
| Invalid/replayed/expired Monster confirmation | No preference changes | Covered by automated tests; physical test pending |
| Start with Windows not selected | No login registration | Physical test pending |
| Start with Windows selected | Startup entry exists; app runs on next login | Physical test pending |
| Disable Monster Mode | Automated tasks off; startup entry removed or warning shown | Physical test pending |
| Trusted game launches and exits | Preferences applied only when eligible, then restored | Physical test pending |
| Manual recovery / crash with active Game Focus | Changes restored where possible, failures visible | Physical test pending |
| Temp cleanup | Only eligible disposable old user-Temp files moved into Recycle Bin | Physical test pending |
| Defender/SmartScreen evaluation | Record exact warning / detection; no blanket bypass recommendation | Physical test pending |
| Network unavailable | App remains usable for local diagnostics | Physical test pending |
| Windows installer checksums | SHA-256 verified against release checksum file | Pending v8.2 beta.4 artifacts |

## Bug report

Include Windows version, CPU, RAM, GPU, install type, exact steps, expected/actual result, and whether running as administrator. Do not upload serial numbers, IP addresses, private paths, or raw diagnostic data publicly.

## Decision rule

If a core regression, unrecovered Windows preference change, unapproved deletion, startup persistence after confirmed disable, or security flaw is found, **block stable release**. Do not advertise “best booster” without repeatable measured benchmarks on identical settings.
