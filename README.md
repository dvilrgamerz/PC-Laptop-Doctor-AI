<!-- DVILR PROJECT COVER v1 -->
<p align="center"><img src="./assets/dvilr-project-banner.svg" width="100%" alt="PC & Laptop Doctor: Local-first diagnostics for Windows hardware." /></p>
<p align="center"><a href="https://github.com/dvilrgamerz"><strong>Developer profile</strong></a> · <a href="https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI"><strong>Source</strong></a></p>
<!-- /DVILR PROJECT COVER -->

# PC & Laptop Doctor AI

**Windows hardware diagnostics, guided fix shortcuts, opt-in reversible gaming settings and packaged Windows EXEs.**

## Download for Windows (v1.2)

[**Get PC Laptop Doctor AI for Windows — GitHub Releases**](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/tag/v1.2.0)

Two 64-bit Windows editions are produced by the verified build pipeline:

| Edition | File | What it does |
| --- | --- | --- |
| Guided setup | PC-Laptop-Doctor-AI-Setup-1.2.0-x64.exe | NSIS setup wizard; choose an installation directory; Start menu/desktop shortcuts; uninstall via Windows |
| Portable | PC-Laptop-Doctor-AI-Portable-1.2.0-x64.exe | Run without installing |

### Setup steps

1. Open **Releases** in the GitHub repository and select the latest release.
2. Under **Assets**, download the Setup.exe (recommended) or Portable.exe.
3. Start the installer, select the installation scope and location, and complete the wizard.
4. Launch the application from Start, the desktop, or directly via the portable file.
5. Press **Run Full Diagnosis** to inspect your computer. Use the new sidebar to review hardware details.
6. Export a privacy-conscious JSON report, if needed. Redacted summaries can still contain identifiable hardware characteristics.

### Safety and publisher verification

**The first builds are unsigned preview programs.** Windows may display an unknown-publisher SmartScreen warning. Download only from this repository's own release assets, optionally compare the executable's SHA-256 to the release's **SHA256SUMS.txt**, and independently review the source. Never disable security protections for unfamiliar files.

The installer may request Windows elevation if you select a system-wide installation. Routine diagnostics do not need admin permissions. The scan is read-only. Only the clearly labeled optional Fix & Gaming controls can change Windows Game Mode (one current-user registry value) or the active power plan after confirmation. The previous values are saved locally and can be restored. The application never deletes files, kills processes, scans other devices, or applies hidden optimizations.

The diagnostics engine uses **explicit thresholds, not a trained AI model**. Temperature readings, capacity estimates and hardware information may be unavailable on some devices. The health score is a guide, not a guarantee that a computer is fault-free.

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

## 🗺️ Roadmap

### V1 — Diagnose ✅
Dashboard, live scan, health score, issue detection, hardware snapshot.

### V1.2 — Safe Fix & Gaming Center ✅
Scan-aware storage and RAM priorities, Windows Settings shortcuts, and optional reversible Game Mode and High performance power-plan changes.

### V2 — More advanced safe repair (planned)
Guided cleanup with item-level approval, update checks, restoration guidance and trustworthy before/after metrics. Never remove user files automatically.

### V3 — AI Doctor
Ask questions such as “Why is my laptop slow?” and “What should I upgrade first?”

### V4 — Hardware Advisor
Upgrade recommendations based on the machine and workload.

### V1.1 — Installer and diagnostic workspace ✅
Windows setup and portable EXE builds, interactive diagnostic views, updated Electron runtime and privacy-conscious reports.

### V5 — History and benchmarks
Future work: reproducible benchmarks and user-approved local long-term history.

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
