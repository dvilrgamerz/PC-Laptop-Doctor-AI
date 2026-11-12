# PC Laptop Doctor AI V7 — Public beta tester guide

**Build:** Windows 10/11 x64, Setup.exe or Portable.exe. **Signed publisher:** no. **Status:** public beta for controlled testing, not a certified gaming optimization application.

## Before installing

1. Download the executables only from the official GitHub Release page for this repository. Compare SHA256SUMS.txt with the downloaded binary if sharing it.
2. Don't turn off Windows Defender, SmartScreen, Memory Integrity or anti-cheat protections for this app. Because the builds are unsigned, Windows might show an unknown-publisher warning. If you cannot verify the download, do not install it.
3. Save your work and create a Windows restore point using the built-in System Protection UI if you plan to change preferences.
4. Keep your normal game launcher and graphics driver updated from official vendors. No third-party tweaks are needed.

## Suggested 20-minute evaluation

- [ ] Run **Full Diagnosis** and compare displayed CPU/RAM/disk information against Windows Task Manager and Storage Settings.
- [ ] Open **Game Boost & Cleanup** and choose **Standard**. Check the preview and approve. Confirm Windows Game Mode is enabled when supported. Press **Stop & Restore** and confirm the original preference returns.
- [ ] If your laptop is plugged in and Windows offers the standard High performance plan, test **Plugged-in gaming**. Confirm the power plan returns after Stop.
- [ ] Start a new session, close the application normally, reopen it and check the Windows preference was restored. A prior crash should trigger a guarded recovery attempt on next launch.
- [ ] Use **Find my games** to discover installed Steam games. Only launch a game you own and want to open; verify that the launcher responds. Other platforms may not be discovered.
- [ ] Use **Find old temporary files**; confirm that Downloads, documents, game saves and directories are absent. Try selecting one unimportant old .tmp file, then moving it to Recycle Bin. Restore it from the Windows Recycle Bin if desired. **No disk space is reclaimed by moving files to the bin**.
- [ ] Run a comparable in-game benchmark at least 3 times before and after Game Focus. Export frame-time CSV logs using a recorder you trust. Repeat in the same scene, graphics settings and hardware state. **Do not assume higher FPS**.
- [ ] Check **Optimization Studio**, **Ask Doctor**, **History & Bench**, **Fix & Gaming**, and **Network** still work.
- [ ] Check keyboard-only navigation, scrolling, 1366×768 screen size, and text readability.

## Report problems

Open [a GitHub bug report](https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/issues/new?template=bug_report.yml).

Include Windows edition/build, app version, Setup vs Portable, expected behavior, actual behavior, and steps to reproduce. If a reversible setting fails, provide whether **Stop & Restore** succeeded. Avoid sharing your username, IP, serial number, private file names, save games, logs containing passwords, or full screenshots with personal data. CPU/RAM percentages and a redacted screenshot are enough for most reports.

For performance reports include game/version, resolution, graphics preset, driver version, power mode, number of benchmark repeats, mean FPS and 1% lows. Positive, negative and null results are all useful. One short run cannot prove a speed improvement.

## Release blockers for a broadly trusted stable version

- A trusted Authenticode code-signing certificate and reproducible Windows installation/uninstallation tests.
- Manual hardware testing on at least two Windows computers, including a low-memory laptop, with recovery checks.
- Verified behavior after crash, app termination, power plan unavailable, battery unplugging and conflicting external settings.
- Independent security and malware screening; device-specific game and anti-cheat compatibility testing.
- Tested accessibility, high-DPI scaling, network disconnections and clean uninstall.
- Repeatable FPS data for real-world value claims, ideally 3–5 before and after runs, with failures disclosed.

Until these are completed, **do not describe this build as verified safe for every PC or guaranteed to accelerate games**. The code is available for review and the installer is a public beta.
