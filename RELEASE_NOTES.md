# PC Laptop Doctor AI v8.0.0-beta.1 — PC Monster Daily Dashboard

Windows 10/11 x64 public beta; unsigned installer and portable app.

## New in this release
- New compact **PC Monster** home panel: current CPU, RAM, GPU and free storage; a prioritized actionable alert and direct Boost & Cleanup links.
- Optional private **Daily Health** recording. OFF by default, sampled at most once per 30 minutes only while the app is running; maximum 30 local days of numeric-only summaries.
- Optional native Windows notification, at most once per local day, when main-drive storage is critically low. Requires explicit opt-in, separate from monitoring consent.
- In-app daily storage trend with delete-history control; saved history can be cleared independently of enabling/disabling monitoring.
- Existing live monitor, auto Game Focus/restore, game discovery, recoverable file cleanup and manual FPS experiment remain.
- Previous detailed diagnostic and heuristic-score panels are now collapsed by default; no new hidden system changes.

## Security and reliability
- Monitor IPC requires the trusted app frame. Sanitization and bounded local data persistence are tested.
- No process names, IP addresses, file paths, serial numbers, or user files in the daily history.
- Background sampling stops when PC Doctor exits; disabling the switch prevents collection.
- No automatic Windows security changes, forced application closing, irreversible file deletion, or claimed FPS uplift.

## Before recommending to friends
See docs/FRIEND_TESTING.md. CI passes are not an independent Windows/anti-cheat audit or proof of measured performance gains.
This beta is unsigned. Verify checksums and obtain binaries from the GitHub release page. Do not disable security defenses to install an untrusted file.
