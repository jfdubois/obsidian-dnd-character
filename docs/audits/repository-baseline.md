# Repository baseline audit (task G0)

- Task: G0 — Repository reconnaissance
- Date: 2026-09-02
- Branch at inspection: `dev`
- HEAD at inspection: `fe19b9a4b6430cb5132a50302a1cf07a587e5120`

## Instructions read

- `AGENTS.md` (repository root) — only AGENTS.md present in the repository; no more-specific instruction files exist.
- `docs/implementation-plan.md` — task G0 entry and section 4 (target structure / canonical documents).

## Repository identity

| Property | Value |
| --- | --- |
| Root (confirmed = working directory) | `/home/jdubois/Documents/Projects/obsidian-dnd-character` |
| Remote `origin` | `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH) |
| Local branches | `main`, `dev` (HEAD on `dev`) |
| Remote branches | `origin/main`, `origin/dev` |
| Branch tracking | `main` → `origin/main`; `dev` → `origin/dev` |
| Commit positions | `dev` = `main` = `origin/dev` = `origin/main` = `fe19b9a` (single commit, no divergence) |
| Working tree | Clean (`git status --short` empty) |

## Commit history (complete)

```text
fe19b9a (HEAD -> dev, origin/main, origin/dev, main) chore: initialize character sheet plugin
```

Files in initial commit:

| File | Lines |
| --- | --- |
| `.gitignore` | 18 |
| `AGENTS.md` | 307 |
| `README.md` | 0 (empty) |
| `docs/implementation-plan.md` | 775 |

## Complete file tree (excluding `.git/`)

```text
.
├── AGENTS.md
├── README.md                     # empty
├── .gitignore
├── character-plugin-vault/
│   └── .obsidian/
│       ├── appearance.json       # {} (empty)
│       ├── app.json              # {} (empty)
│       ├── core-plugins.json     # default core-plugin toggles only; "sync": true
│       └── workspace.json
└── docs/
    └── implementation-plan.md
```

## Package scripts, tests, build configuration, source/data code

- None exist. There is no `package.json`, no lockfile, no `src/`, no `tests/`, no `scripts/`, no build/lint/typecheck/test configuration of any kind.
- Consequence: the plan's section 4 target structure is entirely uncreated; S0 will establish the toolchain. No existing package manager is present to preserve (npm is installed and is the de-facto default; S0 decides and records).

## Toolchain available on the development machine

| Tool | Version |
| --- | --- |
| git | 2.55.0 |
| node | v22.23.1 |
| npm | 10.9.8 |
| pnpm | not installed |
| yarn | not installed |
| bun | not installed |

## Development vault

- Location confirmed: `character-plugin-vault/` with `.obsidian/` present.
- Fresh vault: no notes, no `plugins/` directory, no `community-plugins.json`, only default `.obsidian` config files.
- No plugin installed yet; `<plugin-id>` is not yet chosen (to be finalized in G5 per plan section 4).
- Note: `core-plugins.json` has `"sync": true` (Obsidian Sync core plugin enabled in this vault). This is a user-level Obsidian setting, not a project file; if the user has an active Sync subscription on this vault, future plugin-directory refreshes may be picked up by Sync. No action taken in G0; flagged for the manual-test gate.

## `.gitignore` assessment

Current contents (18 lines):

```text
node_modules/
main.js
*.map
data.json
character-plugin-vault/
.vscode/
.idea/
*.iml
.DS_Store
```

- Required development-vault coverage: **already present** — `character-plugin-vault/` on line 12. Verified: `git check-ignore -v character-plugin-vault/.obsidian/app.json` → matched by `.gitignore:12`.
- Discovered generated/tooling files: none exist yet, since no toolchain exists. Standard Obsidian plugin build outputs (`main.js`, `*.map`) are already ignored.
- Canonical generated SRD catalog artifacts will live in the repository source tree (`src/catalog/generated/` per plan section 4) and are intentionally **not** ignored.
- **Decision: no `.gitignore` change required in G0.** The agent maintains `.gitignore` as the toolchain evolves (S0 onward).

## Risks and notes for later tasks

1. **No toolchain yet.** S0 must create `package.json`/lockfile and one-command tests/typecheck/lint/build. Lockfile must be committed per AGENTS.md.
2. **SSH-only remote.** Pushing requires working SSH access to `github.com:jfdubois/obsidian-dnd-character.git`; no HTTPS fallback configured locally.
3. **`main` and `dev` are identical at `fe19b9a`.** All work happens on `dev`; `main` is only touched on explicit user approval.
4. **README is empty.** R0 will populate it (license/provenance); until then it is a placeholder.
5. **`core-plugins.json` has `"sync": true`.** See vault section above.
6. **No Foundry checkout or source data exists in the repository yet.** G3 will create `scripts/foundry-catalog/source-lock.json` and any temporary checkout must live under the repository root and be git-ignored.

## Exact reconnaissance commands used

```text
pwd
git branch --show-current
git status --short
git branch -a
git remote -v
git log --oneline --all --decorate -20
git log -1 --stat --format='%H%n%an <%ae>%n%ad%n%s%n%b'
git branch -vv
git diff --stat main dev
git check-ignore -v character-plugin-vault/.obsidian/app.json
git config --local --list
git --version; node --version; npm --version; pnpm --version; yarn --version; bun --version
```

Plus direct reads of: `AGENTS.md`, `docs/implementation-plan.md`, `README.md`, `.gitignore`, and the four `character-plugin-vault/.obsidian/*.json` files.

## Exit criteria check

- Exact repository map: yes (tree above).
- Exact commands: yes (above).
- Risks: yes (above).
- No production-code changes: yes — G0 only adds the two G0 documentation deliverables.
