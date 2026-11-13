# Security Policy

Thanks for helping keep this project safe.

## Report vulnerabilities privately

Do not include passwords, access tokens, private keys, personal records, or exploit details in public GitHub issues, discussions, or pull requests.

Use **Security → Report a vulnerability** on this repository if GitHub private vulnerability reporting is enabled. Otherwise, contact the maintainer through an existing private channel before sharing technical details. No response-time guarantee is implied.

## Secrets and deployment safety

- Never commit local `.env` files, production credentials, private keys, database dumps, or personal data.
- Keep server-only credentials in the hosting provider's protected environment settings.
- Variables built into client-side JavaScript (including `VITE_*` and `NEXT_PUBLIC_*`) are publicly visible. Only publish keys designed for browser use; restrict provider keys where supported.
- If a credential was committed, **revoke or rotate it immediately**. Deleting the file or making the repository private does not invalidate the exposed credential.
- Configure least-privilege access and validate authentication/authorization on the server for any service that stores user data.

`.gitignore` helps prevent accidental new commits, but cannot protect secrets already tracked by Git or published in history.


## V5 desktop threat model and privacy

- The Electron renderer uses sandboxing and context isolation. IPC actions must validate the trusted window frame; user content is not a shell command or file path.
- The optional AI interface only connects to local 127.0.0.1 port 11434 and the two approved Ollama endpoints. There is **no** automatic model installation, Internet model upload or remote server fallback. Another local process could impersonate Ollama; only use a trusted machine.
- Only the user's question and numeric-only, redacted diagnostic fields are passed to the local model after explicit approval. Do not enter secrets in AI questions. The model may return dangerous or inaccurate suggestions; PC Doctor never executes model output.
- The maintenance preview creates a short-lived, single-use confirmation token. DNS-cache flushing and PC Doctor's HTTP-cache clearing do not change user files, installed apps or Windows security options. These cache actions are not reversible.
- History and benchmark summaries are **locally stored, unencrypted** in the browser/Electron profile after opt-in. Do not share your profile or disk without protecting it. The maintenance audit has only action identifiers, timestamps and success/failure.
- Hardware inventory excludes serial numbers and UUIDs but manufacturer/model details and local process names can still be sensitive. They stay in the active app, not in routine summary exports.
- Temporary-file disk tests create a bounded file in the OS temporary directory and delete it when finished; interruptions such as power loss can leave files until OS cleanup. Do not treat results as verified physical SSD speed.
- The FPS CSV analyzer reads user-selected files locally; no file content is uploaded by PC Doctor.

- The optional 8-echo network stability check sends ICMP echo to fixed public IP 1.1.1.1 only after a separate on-screen consent box and button. It does not continuously monitor traffic, run a speed test or access custom addresses. Network routes and ping observations are not saved. ICMP may be blocked and output parsing may be limited by Windows language/locale.


## V6 optimization trust boundaries

V6 native optimization IDs are hard-coded, limited to a short set of HKCU DWORD values and require an explicit read-and-dry-run preview, 60-second one-time token and matching confirmation. No renderer-controlled registry paths, executables, arbitrary URLs or shell commands are accepted. The saved previous Windows preference is persisted locally before applying the change, with verification and a recovery journal for crashes or failed writes. **Restoration is manually triggered**, and Windows changes made outside the app are never overwritten automatically. The journal is stored locally without encryption, so Windows account security still matters.

Steam game discovery reads bounded appmanifest files under detected libraryfolders. It does not modify game files, disable anti-cheat or enumerate arbitrary home directories. Session monitoring samples a limited process listing only when the user explicitly starts the session and stops when the panel unmounts. Visible process names may be sensitive and are not saved by this feature.

The optional network path test contacts the OS-reported IPv4 gateway and fixed public address 1.1.1.1 only after consent. It is an ICMP check, not a speed test or authoritative ISP fault detector. The experiment lab processes user-selected CSV files locally and exports only aggregate results and user-entered experiment descriptions. No capture files are automatically stored.

The changes are audited in automated tests, **not independently security-certified** or proven on multiple physical Windows devices. Users must not treat optimizer settings, FPS intervals or local AI answers as certified repair instructions.


## V7 public-beta safety boundaries

- Game Focus accepts only "standard" and "plugged" profiles. The existing fixed-action Windows settings service decides whether Game Mode or High performance may be applied. A local write-ahead journal tracks only attempted session changes, enabling guarded restoration after crashes and on app exit. It never force-closes applications, disables protected services or runs user-supplied shell commands. It refuses restoration when Windows values were changed externally.
- Steam game launch accepts a numeric ID only when that ID was found in fresh, local read-only Steam manifests. It opens a fixed Steam URL through the main process; it does not accept arbitrary URLs or execute game binaries.
- The selected temporary-file cleaner uses only the standard user's AppData/Local/Temp directory on Windows, and excludes symlinks, subdirectories and files with extensions other than .tmp or .log. Files must be at least 14 days old; preview IDs/confirmation expire, and file metadata is checked again immediately before moving to Recycle Bin.
- The Recycle Bin may fail to accept files, and users must empty it themselves to reclaim disk space. Do not call a successful move "bytes freed." The file list remains in-memory during preview only.
- Both features are desktop-only, require user action, and are covered by automated tests. The unsigned executable still needs physical Windows testing, malware screening and professional security review before being advertised as a stable trusted distribution.

## V7.1 manually added games
Only after clicking Add Game does PC Doctor open the native Windows file chooser. It accepts local .exe files outside Windows system/WindowsApps folders, verifies they are regular files, and saves an opaque reference and local path in the user's app profile. The renderer receives the display name and ID but not the executable path. The user must only add trusted installed games; executable files can be harmful, and a selected game may prompt for Windows permissions. Custom games are not automatically discovered. Remove deletes the list entry, never the game executable.

## V7.2 time-limited session safety

The user chooses an allowlisted duration of 0, 30, 60, 120 or 240 minutes at preview time. The approval token binds the previewed duration to the ensuing session. An active session records its expiration time locally and schedules a restore operation; manual Stop cancels the timer. The timer does not execute arbitrary processes or terminate any game. It only invokes the existing confirmed Game Focus rollback path.

A Windows process crash or machine power loss interrupts in-process timers; guarded recovery occurs the next time PC Doctor starts. The stored journal and original values are retained when restoration is incomplete. The app never claims automatic game-exit recognition.

## V7.3 background automation security boundaries

- Both Autopilot options are OFF by default and require a separate affirmative checkbox before saving enabled status. Preferences live in a local atomic JSON file; no cloud account or upload is used.
- Auto Game Focus compares Windows-reported **full executable paths** with either previously user-selected executable paths or containment within installed Steam/Epic game directories derived from read-only bounded launcher manifests. It does not match process names, commands or game-title strings alone. If paths are absent, no auto-start occurs.
- The watcher never suspends/kills processes, downloads drivers, disables security services, reads game saves or modifies game config. It only invokes the already allowlisted temporary Game Mode service and uses its persistent restoration journal.
- Weekly maintenance runs only with prior opt-in, every seven days while PC Doctor is open. It moves regular .tmp files older than 30 days from the top level of this Windows user's Temp directory to Recycle Bin, excludes folders/symlinks, and skips detected trusted running games.
- The weekly cleaner owns a separate preview state so it cannot invalidate user-confirmed cleanup previews. It never permanently deletes files; Recycle Bin contents remain recoverable, but disk capacity is not reclaimed immediately.
- These background tasks require live Windows API/device QA; CI is not a professional security audit or a guarantee against application-specific conflicts.

## V8 Daily Monster privacy model

- Daily PC monitoring is disabled by default. Enabling it stores a bounded rolling history of numeric CPU/RAM/GPU percentages, temperature if exposed, primary-volume disk used/free amounts, day and sample count.
- No raw systeminformation objects, process identifiers/names, network addresses, file paths, game lists, battery serial numbers or personal documents are persisted by this feature.
- Collection runs no more frequently than once per 30 minutes **only while the application process is running**. It is separate from the existing live on-screen monitor and diagnostic snapshot.
- Windows low-space notifications are disabled by default and require a second explicit opt-in. The app limits them to one per local calendar day.
- Data is stored in local application user-data JSON with atomic replacement and mode 0600 where the OS supports it. This is **not encryption**; Windows account and disk protections remain important.
- Local history can be cleared without disabling monitoring. Disabling monitoring does not delete old history until the user requests deletion.
- These health summaries are not proof of fault, performance uplift, or specific hardware diagnosis; high CPU/RAM use can be normal during games.
