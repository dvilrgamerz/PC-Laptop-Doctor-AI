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
