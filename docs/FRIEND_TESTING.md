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

## Additional V7.1 friend tests

- [ ] Steam and Epic games appear automatically, without exposing install paths in routine reports.
- [ ] Boost & Play starts Game Focus and hands off to the selected launcher after consent.
- [ ] Closing PC Doctor restores changes, and failed launcher handoff triggers rollback.
- [ ] Auto-clean candidate files in user Temp older than 14 days move to Recycle Bin; restore a disposable file.
- [ ] Advanced permanent deletion removes only disposable 30+ day .tmp files; never recent files, .log, directories or personal data.
- [ ] Verify space on Windows Storage settings only after actual permanent deletion; do not count Recycle Bin moves.
- [ ] Check 1366×768, keyboard navigation and advanced disclosure controls.

Do not use irreversible cleanup on an important work PC until this build has been tested with disposable files. This is a public beta, not certified stable software.

- [ ] Test Add a trusted installed game using a disposable known-safe game EXE. Confirm it appears without showing its directory, opens only after a click, and Remove deletes only the entry.

## V7.2 timed recovery checks

- [ ] Confirm the Boost & Play page automatically scans installed games and eligible Temp candidates (read-only).
- [ ] Test 30-minute and 120-minute Game Focus time limit behavior on a disposable Windows test PC and confirm the saved Windows preferences are restored without closing the game.
- [ ] Confirm manual Stop & Restore cancels the time limit.
- [ ] Test a simulated interruption and reopen PC Doctor; confirm startup recovery returns supported preferences without overwriting unrelated user changes.
- [ ] Keep an important game session running past the selected limit and confirm it continues, even though Game Focus ends.
- [ ] Confirm permanent cleanup remains explicitly approved, irreversible and scoped to old user Temp files only.

## V7.3 Autopilot public testing
- [ ] On first launch, verify the main Boost & Play page appears and the system diagnosis starts automatically without editing Windows settings.
- [ ] Confirm both Autopilot switches default OFF. Leave them off and verify no background Game Focus or cleanup is initiated.
- [ ] Add a trusted disposable game .exe. Opt in to Auto Game Focus; check that Game Mode starts only after the exact game process is detected. Stop the game; verify supported Windows preferences restore.
- [ ] Test an executable with the same filename in a different folder; it must NOT trigger Autopilot.
- [ ] Verify manual Game Focus takes precedence over Autopilot.
- [ ] Verify a hidden/unavailable process path causes no automatic boost.
- [ ] Opt into weekly Temp care on a throwaway Windows account with old .tmp fixtures, and verify only 30+ day top-level .tmp files go to Recycle Bin.
- [ ] Confirm recycling does not decrease disk usage until Recycle Bin is emptied, and verify protected folders/documents/game files are never touched.
- [ ] Test disabling automatic Game Focus while an owned session is running: PC Doctor should attempt restoration immediately.
- [ ] Test session timeout, normal exit, interrupted startup and Windows power-plan changes using a disposable device before distributing broadly.
- [ ] Repeat FPS tests on more than one physical computer. Record negative or zero improvements too.

**Unsigned beta:** Friends who cannot independently verify the EXE should not bypass security warnings or install it. A completed CI build does not replace code signing, malware scanning or device-level testing.
- [ ] Confirm Auto Game Focus recognizes a running Steam or Epic game by a full process path inside its verified installed-game folder, with no need to add the EXE manually.
- [ ] A process under a similarly named folder outside the verified game installation must NOT trigger a boost.

## V7.4 live monitoring tests

- [ ] Compare live CPU/RAM and drive usage against Windows Task Manager/Settings.
- [ ] Confirm a Windows machine with an unavailable CPU thermal sensor shows "Not available" rather than 0°C.
- [ ] Leave Boost & Play open for 2 minutes: resource cards should refresh approximately every 8 seconds, with no growing CPU usage or app freezing.
- [ ] Switch tabs, return, and verify the old polling loop stops when the monitor is not displayed.
- [ ] A drive over 95% full must trigger a serious warning and a path to cleanup, never automatic deletion of personal data.
- [ ] "Prepare safe automatic care" must not turn on game focus or Temp cleanup until explicit consent and Save.
- [ ] Confirm Windows Setup & Portable behavior, and verify SHA-256 against the release manifest.
- [ ] Report hardware-specific readings, crashes, false positives and any gaming slowdowns; do not discard negative results.

V7.4 remains an unsigned public beta pending real-device/security validation.
