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
