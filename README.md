<!-- DVILR PROJECT COVER v1 -->
<p align="center"><img src="./assets/dvilr-project-banner.svg" width="100%" alt="PC & Laptop Doctor: Local-first diagnostics for Windows hardware." /></p>
<p align="center"><a href="https://github.com/dvilrgamerz"><strong>Developer profile</strong></a> · <a href="https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI"><strong>Source</strong></a></p>
<!-- /DVILR PROJECT COVER -->

# PC & Laptop Doctor AI

**Windows PC diagnostics, safe opt-in maintenance, offline troubleshooting, optional local Ollama integration, hardware inspection, and measured frame-time analysis.**

## Download for Windows (v5.0 preview)

[**Get PC Laptop Doctor AI for Windows — GitHub Releases**](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/tag/v5.0.0)

Two 64-bit Windows editions are produced by the verified build pipeline:

| Edition | File | What it does |
| --- | --- | --- |
| Guided setup | PC-Laptop-Doctor-AI-Setup-5.0.0-x64.exe | NSIS setup wizard; choose an installation directory; Start menu/desktop shortcuts; uninstall via Windows |
| Portable | PC-Laptop-Doctor-AI-Portable-5.0.0-x64.exe | Run without installing |

### Setup steps

1. Open **Releases** in the GitHub repository and select the latest release.
2. Under **Assets**, download the Setup.exe (recommended) or Portable.exe.
3. Start the installer, select the installation scope and location, and complete the wizard.
4. Launch the application from Start, the desktop, or directly via the portable file.
5. Press **Run Full Diagnosis** to inspect your computer. Use the new sidebar to review hardware details.
6. Export a privacy-conscious JSON report, if needed. Redacted summaries can still contain identifiable hardware characteristics.

### Safety and publisher verification

**The first builds are unsigned preview programs.** Windows may display an unknown-publisher SmartScreen warning. Download only from this repository's own release assets, optionally compare the executable's SHA-256 to the release's **SHA256SUMS.txt**, and independently review the source. Never disable security protections for unfamiliar files.

The installer may request Windows elevation if you select a system-wide installation. Routine diagnostics do not need admin permissions. The scan is read-only. Optional Fix & Gaming controls can change Windows Game Mode, the active power plan, flush the Windows DNS resolver cache, or clear only PC Doctor's own Electron HTTP cache after a separate explicit confirmation. Previous Game Mode and power-plan values are saved locally and can be restored. Cache clearing has no undo and is described separately. The application never deletes personal files, kills processes, scans other devices, downloads AI models automatically, or applies hidden optimizations.

The built-in diagnostics engine uses **explicit thresholds**. The optional LLM panel can query a separately installed Ollama model on localhost after approval; the app does not train or ship an AI model. Temperature readings, capacity estimates and hardware information may be unavailable on some devices. The health score is a guide, not a guarantee that a computer is fault-free.

### Build locally

Requires Node.js 22+ and npm. On Windows x64:

~~~powershell
npm install
npm test
npm run dist:win
~~~

The generated setup and portable executables are written to **release/**. For development, run **npm run dev**. GitHub Actions also builds the two executables on Windows and publishes a versioned prerelease when merged code passes the pipeline.

## Project overview

**Your local-first AI mechanic for Windows PCs and laptops.**

PC Doctor AI scans your computer, turns confusing system data into a simple health score, and explains the problems that deserve attention first.

## Diagnostic features

- Live CPU load and processor details
- RAM usage and memory-pressure detection
- Drive usage and low-storage warnings
- CPU temperature checks when sensors are available
- GPU detection
- Laptop battery, charging state, and estimated battery wear
- Windows startup-app detection
- Network interface and latency check
- System uptime and Windows information
- 0–100 health score
- Prioritized diagnostic report with plain-English recommendations
- Local-first architecture: diagnostic data stays on the computer
- Read-only diagnosis; optional explicitly approved gaming adjustments are separate from the scan

## 🎬 The demo

**Click “Run Full Diagnosis” → watch the system scan → get a health score → see exactly what needs attention.**

This is designed to make PC troubleshooting understandable even if you do not know what CPU load, memory pressure, thermal throttling, or battery wear mean.

## 🚀 Run it

Requirements:

- Windows 10/11 recommended
- Node.js 22+ recommended
- npm

```bash
git clone https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI.git
cd PC-Laptop-Doctor-AI
npm install
npm run dev
```

The Vite dashboard opens inside Electron, where the secure preload bridge gives the UI access to read-only diagnostics.

## 🧠 How V1 works

The desktop process gathers hardware and operating-system information with `systeminformation` and a small read-only PowerShell query for Windows startup entries.

The local diagnostic engine then checks thresholds for:

- excessive CPU load
- memory pressure
- high temperatures
- low disk space
- battery degradation
- too many startup programs
- long uptime
- high network latency

Those signals are converted into the health score and prioritized Doctor Report.

## 🔐 Safety & privacy

V1 is intentionally read-only.

- No registry edits during diagnostics (opt-in Game Mode changes one documented HKCU value)
- No automatic process killing
- No automatic file deletion
- No hidden system changes; explicit consent and Restore controls for optional adjustments
- No cloud account required
- No telemetry included

V1.2 Fix & Gaming actions describe each proposed change and require confirmation. Undo data is saved locally. If the power plan or Game Mode changes outside the app, the app declines to overwrite it.

## Version 5.0 — Advanced PC Doctor Suite

**Roadmap summary:** User-facing V1–V5 capabilities exist, but **some are partial or experimental**. The code is not an independently verified hardware repair product. See [full roadmap and acceptance criteria](docs/ROADMAP.md).

| Stage | Working features | Not yet verified or fully automated |
| --- | --- | --- |
| V1 Diagnose | Read-only machine scan, health-score heuristics, system summary, battery/network/storage | Diagnosis of every possible hardware fault |
| V2 Safe Repair | Windows cleanup/settings guides, explicit Game Mode/power changes and Restore, approval-gated DNS flush and PC Doctor HTTP-cache clearing, local audit | Arbitrary file cleanup, guaranteed network repair, automatic restore points |
| V3 AI Doctor | Rule-based offline explanation; **optional** installed local Ollama model with limited, redacted metrics and explicit question approval | Bundled or user-trained model, certified root-cause diagnosis |
| V4 Hardware Advisor | Workload-based upgrade advice and on-device system/model, memory-module and drive inspection without serials | Guaranteed free RAM slots, maximum RAM, pricing and OEM-certified compatibility |
| V5 Performance | Opt-in local history, fixed JS CPU check, short temporary-file disk check, game FPS CSV analysis, 1% low and frame-time comparisons | Direct game capture, validated GPU stress test, scientifically controlled performance certification |

### New in V5

**Ask Doctor → Optional local model.** The built-in rules keep working with no model. To enable open-ended text generation, install [Ollama](https://ollama.com/) yourself on Windows, download a model suitable for your hardware and start its local service. Select **Check installed models**, enter a question, and approve sharing the question plus **numeric-only diagnostic metrics** to `127.0.0.1:11434`. No account, external AI API, automatic model download, shell command execution, or telemetry is added by PC Doctor. Model output may be wrong.

**Upgrade Advisor → Inspect hardware.** Reports machine manufacturer/model, board, BIOS version, detected memory modules (capacity/type/speed), physical drives, and optionally the top memory-consuming processes. Omits serials and UUIDs. The detected module count is **not** an authoritative count of physical slots, and compatibility requires the manufacturer's service manual.

**Fix & Gaming → Safe maintenance.** Two approved tasks: flush Windows DNS resolver cache using `ipconfig /flushdns`; clear this app's own HTTP cache using Electron's session API. Both are previewed before they can run, require a single-use confirmation token, and log only action type/date/success locally. Windows may deny DNS flush without permissions. Neither operation guarantees a faster PC or games. They cannot be undone; Game Mode/power plan changes from V1.2 retain their Restore buttons.

**History & Bench → Disk check and FPS CSV lab.** Temporary-file check uses a small bounded file and removes it afterward. Disk reads may come from RAM cache; speed is **not** an SSD specification. To compare actual gaming results, import two CSV recordings collected **by another tool** using an FPS, frame-time-ms or `msBetweenPresents` column. The analysis computes average FPS, a slowest-frame-time **1% low** definition and 95th-percentile frame time. Files are processed locally in the page. It does not capture FPS or inject into games. Compare only equivalent settings and scenes.

### Privacy and limitations

- Opt-in history remains **off by default**; saved snapshots contain only summary percentages/counts and are stored locally, without encryption.
- Do not share raw process names, downloaded executables, or local history from a shared computer.
- AI responses are untrusted advice, not verified diagnoses. Never run unknown commands suggested by an AI model.
- Graphics/temperature/firmware support varies; an unavailable sensor does not prove the component is healthy.
- Code signing, Windows SmartScreen reputation, physical-device testing, automatic repair proof, and OEM-compatible upgrade certification remain open work.

## 🧰 Stack

- Electron
- React
- Vite
- Node.js
- systeminformation
- Lucide icons

## ⚠️ Notes

Some temperature and battery readings depend on what the hardware/driver exposes to Windows. Missing sensor data is shown as unavailable instead of guessed.

---

If this project helps you, consider starring the repo ⭐

## GitHub Pages deployment

The repository has a GitHub Actions workflow (`.github/workflows/pages.yml`) that builds and uploads the static demo. To enable it, open **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source, save the setting, and rerun the failed Pages workflow. If the job fails at `actions/configure-pages` with `Get Pages site failed: Not Found`, the build has already succeeded; Pages is not yet enabled/configured for this repository. Do not add a token to source code to work around this setting.


## Fix & Gaming Center (v1.2)

Use the new **Fix & Gaming** sidebar tab after a diagnosis. The priority list identifies low storage (90%+), high RAM pressure (85%+) and heavy CPU use (90%+) without promising fake speed gains. Open Microsoft Windows Settings in one click to review **Storage recommendations, Startup apps, Installed apps, Game Mode, Graphics preferences, Power and Windows Update**. Task Manager is also available.

**Two optional one-click actions (each requires a separate confirmation):**
- **Enable Windows Game Mode:** changes only `HKCU\\Software\\Microsoft\\GameBar\\AutoGameModeEnabled`, a documented current-user setting. PC Doctor preserves the previous value and offers **Restore original**.
- **High performance power plan:** switches only to an **already installed** standard High performance plan using `powercfg`. It requires AC power on a laptop and offers **Restore original**. If the plan is unavailable, the app refuses and points to Windows settings instead.

These actions save rollback state locally under the application user-data directory; they work in the Windows executable, **not** in the browser sample demo. PC Doctor never uses registry cleaner scripts, deletes files, silently stops services, forces a GPU overclock, or automatically disables Windows Security/Defender. The buttons do not guarantee more FPS. In some workloads, high performance increases fan noise, heat and electricity use. Restore the prior plan when finished gaming.

The measurements shown on the dashboard are point-in-time samples. Re-run diagnostics after manually clearing space or closing applications to observe changes, but a score difference alone does not establish the cause.

## Diagnostic scan comparison and safe export

After a second scan, the dashboard compares health-score changes and shows newly detected and cleared warnings. This is a **session-only** comparison; the program does not upload diagnostic data or silently store scan history.

Use **Export summary** to download a JSON report. It includes scores, warnings, broad hardware information, storage usage, and available sensor measurements, **but excludes** IP/MAC addresses, local interface names, startup-program names and raw system objects. Inspect any report before sharing because hardware descriptions can still be identifying.

The browser-hosted preview creates a clearly labeled **demo** report. A better score between scans is not proof of a permanent fix; CPU load, temperatures and network latency can fluctuate.

Run regression tests with `npm test`; `npm run build` checks the frontend build.
