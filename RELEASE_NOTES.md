# PC Laptop Doctor AI v8.1.0-beta.2 — PC Monster storage goal

Unsigned Windows 10/11 x64 public beta.

## New

- **One-review Safe Care:** Dashboard inspection previews old user Temp files and PC Doctor's own HTTP cache; after one approval, the app executes the supported cleanup actions and reports successful, skipped and failed steps. No Windows Settings redirection.
- **Default recoverable mode:** Moves eligible 14+ day top-level .tmp/.log files to Recycle Bin. Optional, separately confirmed permanent mode deletes only selected eligible 30+ day top-level .tmp files and reports actual removed bytes. Files are rechecked.
- **New visual identity:** Original scalable PC Monster chipset and diagnostic graph illustration, integrated in the dashboard and Boost & Play.
- **Simple startup:** PC Monster Dashboard is now the opening screen; advanced tools remain available separately.
- Daily PC Monster calculates a concrete storage recovery target from actual free and total drive capacity.
- For very full drives, it displays the additional GiB to recover and links to existing user-approved cleanup workflows.
- Never invents capacity or a target when disk sensors are unavailable.
- Adds regression tests for small/large disks, missing sensors, already-healthy storage and opt-out privacy.
- Existing Steam/Epic/custom-game detection, Boost & Play, live monitoring, weekly recoverable Temp cleanup, Space Finder and FPS CSV comparisons remain.

## Safety and limitations
- No hidden deletion of Downloads, game files or personal data; destructive operations still require explicit approval.
- The 15%/20 GiB target is a practical maintenance guideline, not proof of improved FPS.
- No claim of superiority over Razer Cortex or Hone.gg; no controlled comparative benchmark has been performed.
- Installer and Portable remain unsigned. Physical Windows hardware and anti-cheat validation, independent security review and production code signing are still incomplete. Share with informed testers, not as a certified stable release.
