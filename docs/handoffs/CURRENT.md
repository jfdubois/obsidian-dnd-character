# CURRENT — task/status handoff

- Last updated: 2026-09-03 (task S3)
- Current branch: `dev`

## Current milestone / task

- Milestone: S — Obsidian shell and one trusted source record
- Last completed task: **S3 — Catalog generator skeleton and revision lock** (not a gate)
- S3 deliverables (committed):
  - `scripts/foundry-catalog/generate.mjs` — zero-config Node ESM catalog generator (only runtime dep: `js-yaml`, devDependency 5.4.1). CWD-independent (paths derived from `import.meta.url`); optional `--source <dir>` (default `<repoRoot>/.tmp/g3/foundry-dnd5e`). Validates in order: source root exists → is a git checkout → `git rev-parse HEAD` equals the SHA pinned in `source-lock.json` (mismatch prints expected AND actual to stderr, exit 1). Extracts the S3 fixture set (`classes24/paladin/paladin.yml` → `classes24/paladin`; `classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml`), sorted by sourcePath, into `{ sourcePath, pack, record }` envelopes. Emits LC-1 premium exclusion (`monsterfeatures24/actions/possession`, book `MM 2024`) and scans extracted records for LC-2 empty-`license` gaps (`license === ""` only; missing key is not a gap). Computes era split (`24`-suffix pack ⇒ 2024). Writes 4 deterministic JSON artifacts (sorted, `JSON.stringify(v, null, 2) + "\n"`, no timestamps) and prints one stdout summary line.
  - `src/catalog/types.ts` — INTERFACES §1: `FoundryRecord` (open-typed Foundry-shaped record) + `CatalogEntry { sourcePath; pack; record }`.
  - `src/catalog/generated/` — 4 committed artifacts: `srd-catalog.full.json` (2 records), `srd-catalog.runtime.json` (same 2; runtime pack set = 13 packs, excluded 10 with reason `"no baseline consumer"`), `srd-catalog.provenance.json` (foundrySha, repository, generationCommand, sourcePathNormalization note, packs, exclusions, CC-BY-4.0 attribution), `srd-catalog.coverage.json` (premiumExclusions LC-1, emptyLicenseGaps [], runtimePackExclusions, eraSplit {2014: 0, 2024: 2}).
  - `src/catalog/runtime-catalog.ts` — `RUNTIME_CATALOG: readonly CatalogEntry[]` from the generated runtime JSON (bundled into `main.js` per architecture §4.2).
  - `src/main.ts` — `readonly runtimeCatalogEntryCount: number = RUNTIME_CATALOG.length;` (public field so esbuild keeps the inlined JSON).
  - `package.json` — `catalog:generate` script + `js-yaml` devDependency; lockfile committed.
  - `tests/foundry-catalog/generate.test.ts` — 4 black-box CLI tests: T1 fixture extraction at pinned revision (lock-file-driven assertions on both envelopes incl. sourcePath collapse + license/book fields); T2 wrong-revision synthetic git repo (expects both SHAs in stderr, exit 1); T3 byte-identical repeat generation (sha256 of all 4 artifacts); T4 missing root + non-git dir rejection.
  - **sourcePath normalization rule (new, recorded in provenance):** YAML stem relative to `packs/_source/`; when basename equals parent dir name the basename is dropped (`classes24/paladin/paladin.yml` → `classes24/paladin`).
- S3 verification (all passing, fresh output): `npm run catalog:generate` (wrote 2 records; 4 artifacts), `npx vitest run tests/foundry-catalog/generate.test.ts` (4/4), `npm run test` (Test Files 6 passed, Tests 40 passed), `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run build:prod` (`main.js` **17,500 bytes** — size gate 25 MB not approached; both records verified inlined verbatim in the bundle via stub-`obsidian` load: `runtimeCatalogEntryCount === 2`).
- S3 exit criteria met: correct revision succeeds; wrong revision fails with expected/actual commit; repeated generation byte-identical (T3).
- Prior: **S2 — Development install and runtime-refresh workflow** (not a gate)
- S2 deliverables (committed):
  - `scripts/dev-install.mjs` — zero-dependency Node ESM (Node >= 22); exports `devInstall({ repoRoot, vaultRoot })`. Reads `manifest.json`, validates `id` against `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (path-traversal safe), then **copies** (never symlinks, never deletes) `main.js`, `manifest.json`, `styles.css` into `<vault>/.obsidian/plugins/<id>/`, preserving existing `data.json` (plugin settings). CLI `node scripts/dev-install.mjs [--repo-root <dir>] [--vault <dir>]` (defaults: repo root = script's parent dir; vault = `<repoRoot>/character-plugin-vault`); success prints install path + copied files + data.json line; failures print `dev-install: <message>` to stderr, exit 1 (missing built files point at `npm run build:dev`).
  - `package.json` — added `"dev:install": "node scripts/dev-install.mjs"`.
  - `tests/scripts/dev-install.test.ts` — 7 black-box CLI tests (fresh `--repo-root`/`--vault` fixtures under gitignored `.tmp/`): exact-byte copy; refresh + `data.json` preservation (exact stdout lines pinned); missing `main.js` → exit 1 + build hint + no partial dir; `../evil` id → exit 1 + no escape; vault auto-create; missing manifest → exit 1; invalid-JSON manifest → exit 1.
  - `docs/dev-workflow.md` — canonical runtime-refresh checklist covering every AGENTS.md "Manual Obsidian testing gate" item (dep install, focused/full tests, typecheck, lint, build, dev-dir install, manifest/styles refresh, plugin toggle; SRD catalog rebuild not required until S3, custom view close/reopen not required until S5) + exact acceptance steps, expected visible results, and evidence list.
- S2 verification (all passing, fresh output): `npm test -- tests/scripts/dev-install.test.ts` (7/7), `npm test` (Test Files 5 passed, Tests 36 passed), `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run build:dev` (main.js 14.9 kb), `npm run dev:install` (installed into `character-plugin-vault/.obsidian/plugins/dnd-character/`).
- S2 review notes: requirements review — no MUST/SHOULD; NITs resolved (evidence list now includes branch + `git status --short`; palette-label prefixing backed by pinned `obsidian.d.ts` command-prefix docs). Code-quality review — no MUST; SHOULDs resolved (added missing-manifest + invalid-JSON tests; pinned exact `data.json` stdout lines); NITs resolved (`id is missing` message rendering, removed redundant `node:process` import, `existsSync` guard on the direct-run check, empty flag value rejected). Non-atomic `cpSync` deemed acceptable for the single-developer sequential workflow. Suite re-verified green after fixes.
- Prior: **S1 — Plugin lifecycle and settings shell** (not a gate)
- S1 deliverables (committed):
  - `src/plugin/settings.ts` — pure (no obsidian import): `Ruleset` ("2014" | "2024"), `DndCharacterSettings { characterFolder, defaultRuleset }`, `DEFAULT_SETTINGS { characterFolder: "Characters", defaultRuleset: "2024" }`, `validateCharacterFolder(value): string | void` (non-empty message = inline rejection), `loadSettings(raw: unknown)` (sanitized per-field merge over defaults).
  - `src/plugin/commands.ts` — pure (no obsidian import): `COMMAND_IDS` (open-sheet, open-creator, short-rest, long-rest, level-up), `PluginCommandSpec`, `createCommandSpecs(notify)` → exactly 5 stable-order specs; S1 callbacks notify "… is not available yet.".
  - `src/plugin/settings-tab.ts` — `DndCharacterSettingTab extends PluginSettingTab` using the obsidian 1.13.x definitions API (`getSettingDefinitions()`, no imperative `display()`): text "Character folder" (key `characterFolder`, inline `validate`) + dropdown "Default ruleset" (key `defaultRuleset`, options "D&D 5e (2014 rules)" / "D&D 5e (2024 rules)"). Declares its own `plugin` field (base class declares none).
  - `src/main.ts` — `DndCharacterPlugin extends Plugin`: `onload()` = `settings = loadSettings(await loadData())` → `addSettingTab` → `addCommand` ×5 (no hotkeys); cleanup via registration helpers, no manual `onunload()`.
  - `vitest.config.mts` + `tests/stubs/obsidian.ts` — vitest-only runtime stand-in for `obsidian` (Plugin command registry with the documented id/name prefixing per d.ts:4951 + modeled app-internal `unload()` cleanup, tab/loadData/saveData tracking, PluginSettingTab get/setControlValue mirroring the "mutates and persists plugin.settings" contract — `setControlValue` is a documented partial model, Notice instance capture); tsc still resolves the real installed types.
  - `tests/plugin/settings.test.ts` (13 tests), `tests/plugin/commands.test.ts` (4), `tests/plugin/lifecycle.test.ts` (9) — 26 new tests; total suite 29.
- S1 verification (all passing, fresh output): `npm test` (Test Files 4 passed, Tests 29 passed), `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run build:dev` (main.js 14.9 kb), `npm run build:prod` (main.js 2.7 kb, CJS, external `obsidian` only).
- S1 review notes: requirements review — 1 must-fix (handoff test counts) resolved. Code-quality review — all findings resolved: M1 stub models the documented command id/name prefixing (d.ts:4951); M2 stub models app-internal `unload()` cleanup (evidence d.ts:4957-4958) + double onload/unload test asserts no duplicate registrations; m1 `validateCharacterFolder` rejects empty/whitespace-only path segments; m2 `DEFAULT_SETTINGS` is `Readonly`; m3 tests import the stub `Notice` directly (no cast); m4 dropdown options pinned by deep equality; m5 stub `loadData` defaults to `null`; m6 stub `setControlValue` documented as partial model. Suite re-verified green after fixes.
- Prior: **S0 — Build, typecheck, lint, and unit-test baseline** (not a gate) — deliverables (committed):
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
| commit updating this file (S1) | S1 plugin lifecycle + settings shell (`src/plugin/settings.ts`, `src/plugin/commands.ts`, `src/plugin/settings-tab.ts`, `src/main.ts`, `vitest.config.mts`, `tests/stubs/obsidian.ts`, `tests/plugin/settings.test.ts`, `tests/plugin/commands.test.ts`, `tests/plugin/lifecycle.test.ts`) + INTERFACES §11 + this handoff |
| commit updating this file (S2) | S2 dev install + runtime-refresh workflow (`scripts/dev-install.mjs`, `tests/scripts/dev-install.test.ts`, `docs/dev-workflow.md`, `package.json` dev:install) + INTERFACES §12 + this handoff |
| commit updating this file (S3) | S3 catalog generator + revision lock (`scripts/foundry-catalog/generate.mjs`, `src/catalog/types.ts`, `src/catalog/runtime-catalog.ts`, `src/catalog/generated/*` (4 committed artifacts), `src/main.ts` catalog field, `tests/foundry-catalog/generate.test.ts`, `package.json` + lockfile) + this handoff |

## Repository state at S3 completion

- Toolchain in place: npm 10.9.8, node v22.23.1; `node_modules/`, `main.js`, `*.map`, `.tmp/`, `character-plugin-vault/` git-ignored. `src/catalog/generated/` is **committed** (canonical generated artifacts live in the source tree, not the vault).
- Generated `main.js` (CJS) exists in the working tree from the last production build (17.5 KB with the 2-record runtime catalog inlined); it is git-ignored — run `npm run build:dev` before a dev-vault install.
- Plugin registers a settings tab + 5 commands on load; command callbacks are S1 stubs ("…is not available yet."); no views yet (S5).
- Development vault `character-plugin-vault/` has the plugin installed at `.obsidian/plugins/dnd-character/` via `npm run dev:install` (copy-based; `data.json` preserved on re-run). Plugin id locked: **`dnd-character`**.
- Committed catalog: 2 S3 fixture records (Paladin class + Sacred Weapon feat, both `classes24`, era 2024) in `src/catalog/generated/`; the Foundry checkout remains only in git-ignored `.tmp/g3/foundry-dnd5e` at the pinned SHA. Regenerate with `npm run catalog:generate` (requires that checkout to exist at the pinned revision).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work on `dev`.
- Working tree: only S3 changes pending (no unrelated user changes).

## Exact verification commands (S3)

```text
git branch --show-current                            # dev
git status --short                                   # only S3 files + handoffs, pre-commit
npm run catalog:generate                             # requires .tmp/g3/foundry-dnd5e at pinned SHA; writes 4 artifacts, 1 stdout line
npx vitest run tests/foundry-catalog/generate.test.ts # focused: Test Files 1 passed, Tests 4 passed
npm test                                             # full: Test Files 6 passed, Tests 40 passed
npm run typecheck                                    # tsc --noEmit, exit 0
npm run lint                                         # eslint ., exit 0
npm run build:prod                                   # main.js 17,500 bytes (gate 25 MB not approached)
npm run build:dev && npm run dev:install             # dev-vault refresh (see docs/dev-workflow.md)
```

## Key facts for later tasks

- **S1 done:** settings persist in obsidian `data.json` via `loadData`/`saveData` (no character data there); settings tab uses the 1.13 definitions API (`getSettingDefinitions()`, no imperative `display()`); 5 stub commands, no hotkeys; `src/plugin/settings-tab.ts` is the only new obsidian-importing module (INTERFACES §11); vitest tests use `tests/stubs/obsidian.ts` (alias in `vitest.config.mts`) — add stub members there when tests need more of the API.
- **S2 done:** dev workflow is `npm run build:dev && npm run dev:install` (copy-based, `data.json` preserved); `docs/dev-workflow.md` is the canonical refresh checklist — use its exact commands and acceptance steps before any manual Obsidian testing (contract TE-4); dev-install is black-box tested via the CLI (no module import needed in vitest).
- **S3 done:** generator = `npm run catalog:generate` (CWD-independent; `--source` override; pinned-SHA validation prints expected+actual on mismatch). Envelopes are `{ sourcePath, pack, record }` with the sourcePath normalization rule (basename dropped when equal to parent dir). `RUNTIME_CATALOG` (`src/catalog/runtime-catalog.ts`) is the bundle entry point for generated data — keep it a pure JSON import; plugin code must reference it via a **public** field or esbuild tree-shakes the inlined JSON. **Size gate (architecture §4.2): built `main.js` > 25 MB or > 3 s main-thread startup ⇒ stop and re-decide.** Current measurement: 17,500 bytes with 2 records.
- **S4 (one representative mechanics record):** Sacred Weapon is already the in-tree representative (S3 fixture); retain the complete licensed source record (already done — full record in the envelope), type + interpret only the fields S4 requires, leave all other source fields preserved but uninterpreted. Exit: unit test loads the generated record by stable identity (`phbpdnSacredWeap`) and verifies source path, license/provenance, and selected structured fields. Matrix §8 reference table (489 advancement item + 149 pool + 352 cast `spell.uuid` + 205 non-empty of 243 `profiles[].uuid` + 50 target UUID + 14 target identifier refs) remains the build-time normalization checklist for later full-catalog generation.
- **G2 re-pin (L596):** if `obsidian` types are bumped later, re-verify the pinned `obsidian-api` @ `cc1744324150c632416857c98964f87b1574a5fc` and developer-docs @ `c56c7e770ba25dd0ea392aacf4588f9425970d36` evidence and the G2 lint rules.
- **Runtime tasks (later):** D-11 end-to-end proof = 2024 Sacred Weapon (matrix §9); 2014 Sacred Weapon is the canonical narrative-fallback/diagnostic case (C7).
- **Effect encoding (G5):** runtime mirrors Foundry change entries verbatim, string `type` vocabulary {add, override, upgrade, multiply, downgrade, subtract}; no numeric mode mapping.
- **Open items (deferred, not blocking):** `preparation.mode: always` (22 spells) slot semantics and `pact` slot model → confirm at A8; `@flags.*` tokens (2 occurrences) ⇒ C8 `FORMULA_UNSUPPORTED_TOKEN`; exotic recovery periods `dusk`/`initiative` (3 occurrences) ⇒ C8.
- **Lint extension pattern:** later tasks add G2-family rules to `eslint.config.mjs` the same way S0 did (rule + message citing the G2 row); `npm test -- <file>` is the focused-test form.

## Blockers

- None.

## Next eligible task

- **S4 — One representative mechanics record**, per `docs/implementation-plan.md` (see Key facts S4 entry above: Sacred Weapon is the representative; type/interpret only required fields; load by stable identity in a unit test).
