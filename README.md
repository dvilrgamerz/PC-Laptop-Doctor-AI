<!-- DVILR PROJECT COVER v1 -->
<p align="center"><img src="./assets/dvilr-project-banner.svg" width="100%" alt="PC Laptop Doctor AI: local-first Windows diagnostics and controlled automation" /></p>
<p align="center"><a href="https://github.com/dvilrgamerz">DVILR on GitHub</a> · <a href="https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues">Report an issue</a></p>
<!-- /DVILR PROJECT COVER -->

# PC & Laptop Doctor AI — PC Monster

**Version: v8.2.0-beta.4 | Windows 10/11 x64 | Public tester beta (unsigned)**

PC Monster is an actual Windows Electron desktop app, not a browser-only mockup. It measures CPU, RAM, GPU, battery, storage, temperature (when hardware reports it) and gaming-relevant conditions. Its **Monster Mode** performs a narrowly scoped, user-approved sequence inside the app and can keep working automatically.

<p align="center">
  <img src="./assets/monster-machine.svg" width="46%" alt="Original neon PC Monster laptop illustration" />
  <img src="./assets/pc-monster-core.svg" width="46%" alt="Original PC Monster core illustration" />
</p>
<p align="center"><em>Original vector illustrations, not real performance benchmarks.</em></p>

## Download Windows app

**[Latest PC Monster public tester release](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/tag/v8.2.0-beta.4)**

- **[Setup EXE (Windows x64)](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/download/v8.2.0-beta.4/PC-Laptop-Doctor-AI-Setup-8.2.0-beta.4-x64.exe)** — guided install, Start menu shortcuts, uninstall.
- **[Portable EXE (Windows x64)](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/download/v8.2.0-beta.4/PC-Laptop-Doctor-AI-Portable-8.2.0-beta.4-x64.exe)** — run without installing.
- **[SHA-256 checksum list](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/download/v8.2.0-beta.4/SHA256SUMS.txt)** — verify installer integrity before sharing.

These links become available when the tagged Windows GitHub Actions release build succeeds. Until then, [v8.2.0-beta.3](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/tag/v8.2.0-beta.3) is the last confirmed published beta. **Do not share a version whose EXEs have not finished building.**

### Do this once; then let supported automation run

1. Download the real Windows EXE, launch it and check the **Dashboard**. Diagnostics start automatically and are read-only.
2. In **PC Monster**, choose whether to start the app automatically when you sign into Windows (packaged Windows edition only).
3. Select **Power up Monster Mode**, review the exact changes and click **Approve and automate**.
4. Once enabled, PC Doctor monitors verified installed Steam/Epic or personally added game processes. When supported games run, it can temporarily manage Windows Game Mode and restore its own changes afterward. Every week it inspects eligible old Temp files and moves qualifying files to the Recycle Bin. **The app must be running**; enabling start-with-Windows helps with that.
5. Check the live status tiles for startup setting, active game, last cleanup date and number of files recycled. **Turn off automation** disables both modes and attempts to remove its own startup registration.

No repetitive Windows Settings instructions are required for the supported Monster Mode actions. Some activities (driver updates, deleting personal downloads, uninstalling programs, modifying hardware, elevated or risky system changes) deliberately remain outside automatic care.

## What the app actually does

| Area | Implementation | Limitation |
| --- | --- | --- |
| PC dashboard | Read-only live resource and diagnostic snapshots, heuristic warnings | Missing sensors show unknown; a score is not a medical-grade hardware diagnosis |
| Monster Mode | Explicit approval for trusted-game Auto-Boost and weekly recoverable Temp cleanup | Requires app running and verified game process; does not promise more FPS |
| Sign-in automation | Opt-in, reversible Windows launch-at-login registration | Works in packaged Windows build only; Windows startup preferences can override it |
| Game Focus | Temporarily manages available Windows Game Mode; power profile is a separate, reviewed option | Respects unsupported settings and recovery; no arbitrary process closing |
| Safe Care | In-app review and execution for PC Doctor HTTP cache and eligible old user-Temp files | Recycle Bin moves do **not** immediately free disk space |
| Storage / games | Find candidates; detected Steam/Epic launchers; optional user-selected game EXEs | No game-file, anti-cheat or registry-cleaner hacks |
| AI assistance | Offline/local explanatory features and optional local model integration | Not an always-correct model; does not repair unknown hardware faults |
| Benchmarks | Comparison and reporting tools | No independent Razer Cortex/Hone.gg performance victory has been demonstrated |

**Not included:** hidden termination of apps, forced deletion of documents/Downloads, stopping Windows Defender, disabling updates, registry sweeping, overclocking, fake RAM expansion or guaranteed FPS gains. A real laptop cannot exceed its CPU, RAM, GPU, thermal or power limits through a software button.

## Safety and privacy

- Off by default for mutating background automation; explicit reviewed approval precedes enabling it.
- Limited old top-level user Temp `.tmp` files are recycled, with age and path checks. Nothing in personal folders is silently deleted.
- Game preference changes have an undo journal and recovery flow; failed reversals are reported, not silently called successful.
- System readings are processed locally. A requested network check may contact a public ping endpoint; this is not an uploaded scan report.
- No purchased subscription, account, or remote server is required for local diagnostics.
- **Unsigned beta.** Building the EXE in CI is not equivalent to a Windows certification, code-signing validation, malware audit, or multi-device QA. Only share releases after checking the GitHub workflow and SHA-256 sums.

## Test with friends

See [Friend testing checklist](docs/FRIEND_TESTING.md) and [V8.2 beta.4 test gates](docs/V8_2_BETA4_TEST_PLAN.md). Start with a noncritical Windows 10/11 PC, check first launch and uninstall, then test startup opt-in and disable, a trusted Steam/Epic or custom game, recovery after closing a game, and Temp recycling with deliberately created old disposable test files. Test low-RAM/low-storage and offline cases. Submit reproducible problems at [GitHub Issues](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues).

**Release status:** suitable for informed opt-in testers after artifacts are published; **not** independently validated or code signed for broad, unattended public deployment.

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

For Windows setup/portable installers on Windows: `npm run dist:win`. GitHub Actions runs automated tests and builds both `.exe` types; inspect [Actions](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/actions) and [Releases](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases) before distribution. The web build is a clearly labeled **sample-data demo**: it cannot change the viewer's PC.

GitHub Pages auto-deployment is opt-in because repository Pages is not currently configured: first select **Settings → Pages → Build and deployment → GitHub Actions**, then set the repository Actions variable `DVILR_ENABLE_PAGES=true`. A red Pages workflow does not mean the Windows desktop build failed.

## Documentation

- [Security and limitations](SECURITY.md)
- [Tester release notes](RELEASE_NOTES.md)
- [Testing procedures](docs/TESTING.md)
- [Release history and roadmap](docs/ROADMAP.md)
- [Competitive research](docs/COMPETITIVE_RESEARCH.md)

**Licensing note:** There is currently no `LICENSE` file. The source is publicly viewable but should not be described as open source under a specific license until the project owner selects one. Do not assume redistribution/derivative rights from a public repository alone.
