# V5 verification guide

The CI suite checks source logic and installer generation. **No automated test proves compatibility, actual FPS gains or repair effectiveness on every Windows system.**

## Automated checks

1. Node.js 22+: npm install
2. npm test
3. npm run build
4. Windows x64 runner: npm run dist:win
5. Verify output contains two EXEs and SHA256SUMS.txt. Do not release if tests or build checks fail.

## Windows manual QA — actual devices needed

- [ ] Install Setup and Portable on Windows 10 x64 and Windows 11 x64 (two distinct PCs if available).
- [ ] Run read-only scan and verify CPU load, available RAM, drive use, battery and network readings against Task Manager/Windows Settings.
- [ ] Confirm unavailable CPU-temperature sensors are labeled unknown, not reported as safe.
- [ ] Confirm network and Storage Sense shortcuts open the intended settings without changing anything.
- [ ] Validate per-action confirmation and one-time token expiration for DNS and app HTTP cache actions.
- [ ] Run DNS-cache flush on systems with and without relevant privileges; errors must be clear and non-destructive.
- [ ] Clear PC Doctor HTTP cache; history and local AI configuration must not be erased.
- [ ] Verify Game Mode and power-plan restoration after app restart; external Windows changes must not be overwritten.
- [ ] Inspect machine model, RAM modules, disks; serial numbers and UUIDs must not be displayed or exported.
- [ ] Verify top-process names are only displayed on screen, never included in routine JSON report.
- [ ] Run disk check with adequate space, then with very low available space; temp files must be gone after normal completion.
- [ ] Confirm local Ollama list and generation using a small installed model and explicit opt-in; without Ollama, show understandable error.
- [ ] Verify the app never sends data to a non-local endpoint for AI operations.
- [ ] Record a real game capture externally with 100+ frame samples; confirm FPS and 1% lows from the imported CSV against independent calculations.
- [ ] Repeat same game scene several times; report variability, frame pacing, thermal/power state and graphics settings.
- [ ] Verify Windows SmartScreen and unsigned publisher warnings are disclosed; do not instruct users to disable protections.
- [ ] Test keyboard navigation, screen reader labels, 1366×768 layout, high-DPI scaling and reduced motion preference.

## CSV frame-time format

Supported headers include:

- FrameTimeMs (milliseconds between frames)
- msBetweenPresents (milliseconds)
- fps (frames per second, converted to milliseconds)

The first line must contain a header, and the file must have at least **100 positive valid frame records**. Maximum file size 5 MiB. If a capture tool exports microseconds or seconds under an ambiguous header, convert explicitly first; the analyzer does **not** guess units.

For average FPS, the tool divides frame count by total frame time in seconds. For this tool's 1% low metric, it calculates 1000 divided by the mean of the slowest ceiling(1% of frames) frame times in milliseconds. Different tools sometimes use different 1%-low definitions.

Do not compare two captures if the game scene, recording length, hardware state or graphics settings differ materially.

## Important results that still require real evidence

- Automated Windows repair proven effective, with rollback and user validation.
- Hardware upgrade compatibility from the exact manufacturer service manual.
- Real native GPU and storage hardware performance under controlled conditions.
- Demonstrated speedup or FPS improvements across repeated standardized workloads.
- Code signing, installer reputation, firmware support matrix and external audit.
