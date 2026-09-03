# CURRENT — task/status handoff

- Last updated: 2026-09-03 (task S0)
- Current branch: `dev`

## Current milestone / task

- Milestone: S — Obsidian shell and one trusted source record
- Last completed task: **S0 — Build, typecheck, lint, and unit-test baseline** (not a gate)
- S0 deliverables (committed):
  - `package.json` — npm scripts: `test` (vitest run), `typecheck` (tsc --noEmit), `lint` (eslint .), `build` + `build:prod` (production), `build:dev` (development); `engines.node >=22`.
  - `package-lock.json` — lockfileVersion 3, committed (G2-10). 9 devDependencies, all required: obsidian 1.13.1 (types), typescript 6.0.3, esbuild 0.28.2, vitest 5.0.0, eslint 10.9.1, @eslint/js 10.0.1, typescript-eslint 8.69.0, globals 17.12.0, @types/node 26.4.1.
  - `tsconfig.json` — strict, noEmit, `moduleResolution: bundler`, include `src/**/*.ts` + `tests/**/*.ts`.
  - `eslint.config.mjs` — ESLint 10 flat config + typescript-eslint; enforces G2-03 (global `app` + `window.app`), G2-08 (no `requestUrl`/`request` imports from `obsidian` in `src/`; plus `requestUrl` property ban covering `this.app.requestUrl(...)`), G2-20 (`innerHTML`/`outerHTML`/`insertAdjacentHTML` banned in `src/`).
  - `esbuild.config.mjs` — single CJS bundle `src/main.ts` → repo-root `main.js`, `obsidian` external, minify + no sourcemap (prod) / inline sourcemap (dev).
  - `manifest.json` — id `dnd-character`, v0.1.0, minAppVersion `1.13.0`, isDesktopOnly `false`; `author` empty (finalize before R0 submission).
  - `src/main.ts` — placeholder `DndCharacterPlugin extends Plugin` (S1 adds lifecycle/settings/commands).
  - `styles.css` — placeholder (S5+ adds scoped classes).
  - `tests/manifest.test.ts` — 3 deterministic manifest tests (id, version/app-version/platform, name/description).
- S0 verification (all passing, fresh output): `npm test -- tests/manifest.test.ts` (3/3), `npm test` (3/3), `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run build:dev` (main.js 1.5 kb), `npm run build:prod` (main.js 529 B, CJS, only external `require("obsidian")`).
- S0 review notes: G2-20 is enforced via `no-restricted-properties` (strict superset of the audit's `no-restricted-syntax` naming — fires on reads too; a future sanitizer that must read `innerHTML` needs a scoped `eslint-disable`); `build` and `build:prod` are deliberate duplicate aliases; unknown esbuild argv mode falls back to dev (matches sample-plugin convention).
- Prior: **G5 — Architecture and file/interface map (gate, approved, committed `3e7d221`)** — `docs/architecture/character-sheet-architecture.md`, `docs/handoffs/INTERFACES.md`, plan DAG (L1–L8, C5–C8). Locked facts remain in "Key facts for later tasks".
- Prior: **G4** capability matrix (`docs/audits/foundry-mechanics-capability-matrix.md`); **G3** source lock + inventory (`scripts/foundry-catalog/source-lock.json`, `docs/audits/foundry-srd-inventory.md`); **G2** Obsidian compliance audit (`docs/audits/obsidian-compliance.md`); **G1** approved contract (`docs/contracts/character-sheet-srd-baseline.md`).

## Commits

| Commit | Meaning |
| --- | --- |
| `fe19b9a4b6430cb5132a50302a1cf07a587e5120` | Initial commit (pre-G0 state): `AGENTS.md`, `docs/implementation-plan.md`, `.gitignore`, empty `README.md` |
| `ba23473debb924baec66a74139dca4331118516b` | G0 baseline audit (`docs/audits/repository-baseline.md`) |
| `ea842ea` (resolve: `git log -1 --format='%H' -- docs/handoffs/CURRENT.md`) | G0 handoff (`docs/handoffs/CURRENT.md`) |
| `211e9095b21f79b3c18bdae2a6bfb7d2c2413cda` | G1 approved contract (`docs/contracts/character-sheet-srd-baseline.md`) |
| commit updating this file (immediately after `211e909`) | G1 handoff update (this file) |
| commit updating this file (G2) | G2 compliance audit (`docs/audits/obsidian-compliance.md`) + `.gitignore` (ignore `.tmp/`) + this handoff |
| commit updating this file (G3) | G3 source lock + inventory audit (`scripts/foundry-catalog/source-lock.json`, `docs/audits/foundry-srd-inventory.md`) + this handoff |
| commit updating this file (G4) | G4 mechanics capability matrix (`docs/audits/foundry-mechanics-capability-matrix.md`) + this handoff |
| `3e7d221` (resolve: `git log --oneline -1 3e7d221`) | G5 architecture + interface map (`docs/architecture/character-sheet-architecture.md`, `docs/handoffs/INTERFACES.md`) + plan DAG update + this handoff |
| commit updating this file (S0) | S0 toolchain baseline (`package.json` + lockfile, `tsconfig.json`, `eslint.config.mjs`, `esbuild.config.mjs`, `manifest.json`, `styles.css`, `src/main.ts`, `tests/manifest.test.ts`) + this handoff |

## Repository state at S0 completion

- Toolchain in place: npm 10.9.8, node v22.23.1; `node_modules/`, `main.js`, `*.map`, `.tmp/`, `character-plugin-vault/` git-ignored.
- Generated `main.js` (CJS) exists in the working tree from the last production build; it is git-ignored — run `npm run build:dev` before a dev-vault install.
- No `src/` behavior beyond the placeholder class; no commands, settings, hotkeys, or views yet (S1).
- Development vault `character-plugin-vault/` exists with a fresh `.obsidian/`; no plugin installed (S1/S2). Plugin id locked: **`dnd-character`** (dev install path `character-plugin-vault/.obsidian/plugins/dnd-character/`; copy-based dev install via `scripts/dev-install.mjs`, S1/S2).
- No committed Foundry source data or generated catalog yet (checkout lives only in git-ignored `.tmp/g3/`).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work on `dev`.
- Working tree: only S0 changes pending (no unrelated user changes).

## Exact verification commands (S0)

```text
git branch --show-current                 # dev
git status --short                        # only S0 files + this handoff, pre-commit
npm test -- tests/manifest.test.ts        # focused: Test Files 1 passed, Tests 3 passed
npm test                                  # full: Test Files 1 passed, Tests 3 passed
npm run typecheck                         # tsc --noEmit, exit 0
npm run lint                              # eslint ., exit 0
npm run build:dev                         # main.js (dev, inline sourcemap, ~1.5 kb)
npm run build:prod                        # main.js (minified CJS, ~529 B)
```

## Key facts for later tasks

- **S1 (next):** plugin lifecycle and settings shell per plan §S1 — minimal plugin class, settings persistence (character-folder location only; no source-provider settings), registered commands, safe lifecycle cleanup; verified Obsidian APIs only (installed `obsidian@1.13.1` types). Exit: load/unload without errors or duplicate registrations; settings persist across reload.
- **S2:** copy-based dev install via `scripts/dev-install.mjs` into `character-plugin-vault/.obsidian/plugins/dnd-character/` + the AGENTS.md runtime-refresh checklist.
- **S3 (catalog generator):** clone at the locked SHA `655d9c189025b9f8d313c93501c8dd5f71180dcf`; read `packs/_source/**` YAML; apply the G3 scope rule (include SRD 5.1/5.2 + unflagged reference packs; exclude premium `source.book`; exclude assets; no Free Rules). Emit an LC-1 coverage entry for `possession.yml`. Preserve the CC-BY-4.0 attribution statement. The matrix §8 reference table (489 advancement item + 149 pool + 352 cast `spell.uuid` + 205 non-empty of 243 `profiles[].uuid` + 50 target UUID + 14 target identifier refs) is the build-time normalization checklist. **Size gate: built `main.js` > 25 MB or > 3 s main-thread startup ⇒ stop and re-decide (architecture §4.2).**
- **G2 re-pin (L596):** if `obsidian` types are bumped later, re-verify the pinned `obsidian-api` @ `cc1744324150c632416857c98964f87b1574a5fc` and developer-docs @ `c56c7e770ba25dd0ea392aacf4588f9425970d36` evidence and the G2 lint rules.
- **Runtime tasks (later):** D-11 end-to-end proof = 2024 Sacred Weapon (matrix §9); 2014 Sacred Weapon is the canonical narrative-fallback/diagnostic case (C7).
- **Effect encoding (G5):** runtime mirrors Foundry change entries verbatim, string `type` vocabulary {add, override, upgrade, multiply, downgrade, subtract}; no numeric mode mapping.
- **Open items (deferred, not blocking):** `preparation.mode: always` (22 spells) slot semantics and `pact` slot model → confirm at A8; `@flags.*` tokens (2 occurrences) ⇒ C8 `FORMULA_UNSUPPORTED_TOKEN`; exotic recovery periods `dusk`/`initiative` (3 occurrences) ⇒ C8.
- **Lint extension pattern:** later tasks add G2-family rules to `eslint.config.mjs` the same way S0 did (rule + message citing the G2 row); `npm test -- <file>` is the focused-test form.

## Blockers

- None.

## Next eligible task

- **S1 — Plugin lifecycle and settings shell**, per `docs/implementation-plan.md`.
