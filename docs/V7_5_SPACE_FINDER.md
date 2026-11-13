# V7.5 — Large Downloads Space Finder + GPU Monitor

## User workflow

1. Install the unsigned public beta on Windows 10 or 11 x64.
2. Open **Boost & Play**. A local CPU / GPU / RAM / storage / temperature monitor runs only while the page is shown.
3. When storage is low, click **Find large Downloads**. The app scans only ordinary files directly inside the current user's standard Downloads directory (not subfolders). Nothing is deleted by the scan.
4. Select only large files you know you no longer need. Confirm and click **Move selected files to Recycle Bin**. The app checks file size, modification time, file identity and regular-file status again just before the move.
5. Review Recycle Bin. Windows does not reclaim disk space simply because a file was recycled. Emptying the bin is the user's separate decision; PC Doctor does **not** empty it automatically.
6. Re-scan storage after actual cleanup. Use Windows Storage Sense or uninstall unused apps for broader space reclamation.

## Precise implementation

- **Scope:** standard `%USERPROFILE%\Downloads` folder only; symlinks / junction redirects and unfamiliar roots are refused. This deliberately does not crawl all drives.
- **Bounded inspection:** at most 1,200 directory entries reviewed, with up to 60 largest regular files of at least 100 MiB shown.
- **Safety:** rejects partial download extensions, symbolic links, folders, files that changed since preview, duplicate IDs, reused confirmation tokens and unsupported platforms.
- **Action:** Electron's `shell.trashItem` only, with no `unlink` or `rm` fallback. Maximum 20 selected files and 20 GiB per operation. No personal file content reads, uploads or auto-deletions.
- **Privacy:** file names and size are shown only to the current user during inspection. No persistent saved list or background scan.
- **Live GPU:** reports the maximum valid utilization reported by the graphics subsystem; unavailable readings are displayed as unknown. GPU activity under load is normal and does not indicate a fault.
- **Autopilot:** existing Game Focus and weekly recoverable Temp care remain opt-in. The app does not forcibly kill apps, disable Windows security or install third-party tweak packs.
- **Release:** Windows Setup and Portable unsigned binaries, tests, checksums and GitHub prerelease. Source and CI validation are not substitutes for a Windows device test.

## Limits and competing software

The app is **not** proven faster than Hone or Razer Cortex and does not implement every competitor feature. No measured gaming FPS improvement has been claimed. A user with a 98%-full system drive may have most disk consumption in installed games or other folders, which this narrowly scoped Space Finder will **not** inspect. For those, Windows Cleanup recommendations and Installed Apps management remain useful.

## Public-release gate

- [x] Typed source checks and regression tests (once validated by CI)
- [x] Windows Setup and Portable pipeline with SHA256 (once validated by CI)
- [ ] Physical Windows 10/11 device and security tests
- [ ] Independently measured matched FPS comparisons
- [ ] Signed Windows installer and installer reputation
- [ ] Accessibility/manual UI testing at multiple resolutions
- [ ] Anti-cheat compatibility tests on real games

**Status: Public beta until all mandatory physical safety and installer-trust gates are complete.**
