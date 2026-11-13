# PC Laptop Doctor AI V8.2 — Public beta tester guide

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

## V7.5 checks — GPU and Downloads review

- [ ] Compare live GPU utilization (where available) with Task Manager on an actual Windows PC; unavailable sensors must stay unavailable, not read as zero.
- [ ] Test empty Downloads and a Downloads folder containing normal, oversized, partial, and subfolder-only files.
- [ ] Confirm Space Finder lists only top-level files >=100 MiB and never modifies anything during scanning.
- [ ] Select two *disposable* large files, approve moving to Recycle Bin and confirm no unselected files moved. Restore a test file.
- [ ] Modify a selected test file after scanning and confirm the app refuses to move it.
- [ ] Check that Downloads symlinks and redirected directories are not followed.
- [ ] Verify no file content or absolute Downloads path is uploaded or included in the routine report.
- [ ] Confirm Recycle Bin moves do not count as free space in the dashboard. Compare C: free capacity in Windows Storage.
- [ ] Test installer and Portable editions on two Windows 10/11 x64 devices with different CPUs/GPUs.
- [ ] Record adverse effects, anti-cheat compatibility and security warnings; do not claim stable release or FPS gains until independent validation.


## V8 Daily Monster beta evaluation

- [ ] Open the Dashboard; verify CPU/RAM and C: drive free space against Task Manager/Windows Storage.
- [ ] Confirm GPU utilization or CPU temperature reports **Unknown** if not supported, instead of displaying 0.
- [ ] Open Daily monitoring. Both history and notifications should initially be **off**.
- [ ] Enable local history, click Check now, verify a local sample was saved, and confirm no IP address, filenames, or process identifiers appear in daily history.
- [ ] Turn on storage notifications only with separate approval. Check that alerts are not repeated more than once daily.
- [ ] Disable history; verify further daily samples are not saved. Test the separate delete-history confirmation.
- [ ] Navigate directly from a low-storage warning to Boost & Play and the Space Finder; verify the app never silently deletes Downloads or game files.
- [ ] Use Boost & Play for a supported game; restore settings and confirm the original Windows values return.
- [ ] Close PC Doctor and check that background collection stops.
- [ ] On a smaller 1366×768 laptop display, check that dashboard, toggles, focus outlines and long metric values remain readable.
- [ ] Log crashes, hardware sensor inaccuracies, incorrect warnings, untrusted prompts, or failed cleanup. Report negative benchmark outcomes.

**Status:** Public beta, not signed/stable certification. Test on noncritical PCs before using irreversible advanced cleanup.

## V8.1 in-app Safe Care and UI evaluation

- [ ] Open the app on Windows; verify PC Monster Dashboard is the default page and the artwork renders without covering metrics.
- [ ] Click **Inspect & prepare Safe Care**. Verify the number and size of eligible user-Temp files matches a manual inspection of disposable test files.
- [ ] Choose recoverable mode and approve once. Confirm PC Doctor performs both its app HTTP-cache cleanup and eligible Temp recycling without opening Windows Settings.
- [ ] Verify files moved to Recycle Bin can be restored and are **not** reported as disk-space freed.
- [ ] Use disposable old .tmp samples to test the *separately approved* permanent mode; 30+ day files may be removed, but newer files, logs, folders, Downloads and documents must remain.
- [ ] Force an unavailable cache service or locked Temp file; the app should report partial failures, not falsely claim success.
- [ ] Verify hardware snapshots update after cleanup; no fabricated improvement in benchmark or FPS data.
- [ ] Test a 1366×768 laptop, keyboard navigation, reduced motion preferences and the image alt text.
- [ ] Check version V8.1 in the app and README, along with actual Setup/Portable filenames on the published GitHub release.


## V8.2 Monster Mode QA — additional release gates

- [ ] On a physical Windows 10/11 x64 machine, open PC Monster and check the illustrated Monster Mode panel.
- [ ] Click **Power up Monster Mode**. Confirm the preview itself makes no registry edits or file moves.
- [ ] With a disposable old top-level .tmp test file in user Temp, approve once; verify it is moved to Recycle Bin and can be restored.
- [ ] Verify only user Temp files at least 30 days old are eligible; recent .tmp files, .log, directories, Downloads, game saves and Windows security files remain untouched.
- [ ] Close a recognized game and check managed Game Mode changes restore; also test normal app exit and error recovery.
- [ ] Switch Monster Mode off and confirm automatic gaming and weekly Temp care are disabled.
- [ ] Check that app-cache cleaning and permanent deletion require independent approval and never show Recycle Bin moves as immediately recovered disk space.
- [ ] Verify 1366x768 and 1920x1080 layouts, keyboard focus and high-DPI scaling with the hero illustration.
- [ ] Validate Windows Defender and SmartScreen compatibility. Do not disable protections to install unsigned third-party builds.
- [ ] Repeat comparable FPS/frametime trials and record positive, negative or neutral outcomes. Without such evidence, do not advertise FPS improvements.

**Distribution decision:** Share the GitHub release as a *public tester beta* until code signing, independent security review and real-hardware QA finish; do not label it a certified stable release.

## V8.2 final in-app controls validation

- [ ] Verify the default dashboard shows **Monster Mode**, **Direct Game Focus** and **Safe Care**, with readable layout on a 1366×768 laptop and no stale V7 version label.
- [ ] Start Direct Game Focus after reviewing the proposed settings. Use Stop & Restore from the same dashboard, not Windows Settings. Verify the exact previous values return.
- [ ] Enable Monster Mode once. Verify trusted-game Auto-Boost activates only for a verified installed game and that weekly Temp care runs only while PC Doctor is open.
- [ ] Validate both original vector illustrations in Setup and Portable editions, including keyboard zoom and low-memory machines.
- [ ] Check the README points to the **exact** published V8.2 Setup/Portable filenames, not old V7.5 files.
