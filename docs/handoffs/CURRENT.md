# CURRENT — task/status handoff

- Last updated: 2026-09-03 (task G5)
- Current branch: `dev`

## Current milestone / task

- Milestone: G — Governance, evidence, and exact plan
- Current task: **G5 — Architecture and file/interface map (gate)** — deliverables prepared, reviewed, and verified; **awaiting user approval before commit/push** (not yet complete).
- G5 deliverables (uncommitted):
  - `docs/architecture/character-sheet-architecture.md` — 16 sections covering every plan G5 decision item: retained record format + closed transformation register (T1 YAML→JSON lossless, T2 envelope, T3 premium scope filter); deterministic generated artifacts (`srd-catalog.full.json`, `srd-catalog.runtime.json`, `srd-catalog.provenance.json`, `srd-catalog.coverage.json` computed per load); single static-import bundle strategy (no code-split — pinned `obsidian.d.ts`/dev docs describe no additional-JS mechanism); 13-pack runtime set (2,989 records ≈ 10.4 MiB apparent / ≈ 17 MB disk) with 10 excluded packs; record identity `sourcePath` + `uuid → recordId` load map; character file `Characters/<name>.json` v1 schema + atomic `Vault.process()` single-write updates, two-phase pure `planLevel`; bounded formula EBNF (incl. grouped parens for the D-11 formula `(max(1,@abilities.cha.mod))`); effect allowlist with verbatim `{key,value,priority,type}` string-type encoding (Tier-1: name add/override, `damage.base.types` add, `activities[<type>].attack.bonus` add with `n|formula` values, `traits.<id>.value` add, roll-mode ±1; Tier-2 `upgrade`/`multiply`/`downgrade`/`subtract` ⇒ C5); advancement transaction model (824 entries / 8 types, choice replay); uses/recovery closed vocab; diagnostics `{code,severity,message,source?,context?}`; no-framework DOM UI + allowlist sanitizer + 5-arg `MarkdownRenderer.render`; `isDesktopOnly: false`, `minAppVersion: "1.13.0"`; module map (only `main.ts`, `ui/*`, `character/repository.ts` import `obsidian`); exit-criterion demonstration (routing by structure only).
  - `docs/handoffs/INTERFACES.md` — 10-section interface map (catalog, formulas, effects, advancements, character state/repository, derived, diagnostics, UI, build-time, shared types).
  - `docs/implementation-plan.md` — DAG materialized from the inventories: L1–L8 (one advancement family per task) and C5–C8 (coverage-driven semantic tasks) rows.
- Key locked facts (G5):
  - **Size gate (S3):** if built `main.js` > 25 MB or > 3 s main-thread startup → stop and re-decide (do not proceed to chunking without a new gate).
  - **Effect encoding:** runtime mirrors Foundry change entries verbatim, string `type` vocabulary {add, override, upgrade, multiply, downgrade, subtract}; no numeric mode mapping.
  - **Effect application:** pure `applyEffects(target, resolvedEffects) → {patched, diagnostics}` in caller-supplied (recordId, instanceId) order; `attack.bonus` formula values evaluated by the caller's derived-character pipeline (§7) before `applyEffects`.
  - **D-11 proof:** 2024 Sacred Weapon = proof fixture (its `attack.bonus` change value `(max(1,@abilities.cha.mod))` parses under the §7.1 grammar); 2014 record = canonical narrative-only gap case (C7).
  - **Deferred (not G5-blocking):** `preparation.mode: always` (22 spells) slot semantics and `pact` slot model → confirm at A8 contract point; `@flags.*` tokens (2 occurrences) ⇒ C8 `FORMULA_UNSUPPORTED_TOKEN`.
- Last completed task: **G4 — Foundry mechanics capability matrix (not a gate)**
- G4 deliverable:
  - `docs/audits/foundry-mechanics-capability-matrix.md` — per-family matrix (counts, representative files, proposed support levels, gaps) for all 8 families: advancements, activities, uses/recovery/consumption, formulas, equipment, spellcasting, active effects, source references.
- Key locked facts (G4):
  - **Corpus:** 4,578 free records (G3's 4,579 minus premium `possession.yml`); era 2,105 `2014` / 2,101 `2024` / 372 unmarked; 2,399 records with 3,389 activities; 1,319 embedded Active Effects + 173 `effects` pack docs.
  - **Advancements:** 88 records, 824 entries, 8 types (`ItemGrant` 342, `Trait` 172, `AbilityScoreImprovement` 142, `ScaleValue` 65, `ItemChoice` 37, `HitPoints` 23, `Subclass` 23, `Size` 20) — all **direct**.
  - **Activities:** 11 types; `attack`/`save`/`check`/`teleport`/`damage`/`heal` **direct**; `cast`/`summon`/`enchant`/`transform` **indirect**; `utility` **conditional**. `summon.identifier` never non-empty (0/136).
  - **Uses/recovery:** 390 recovery entries; closed `period` vocab (`dawn` 123, `lr` 101, `day` 63, `recharge` 58, `sr` 42, `dusk` 2, `initiative` 1) and `type` vocab (`recoverAll` 279, `formula` 106, empty 3, `loseAll` 2) — **direct**.
  - **Formulas:** bounded grammar sufficient — dice `NdM + K`, functions `max`/`ceil`/`floor` only, 58 distinct `@` tokens (top: `@mod` 89, `@prof` 68, `@scaling` 12) — **direct**, allowlisted. `@flags.*` (2 occurrences) **unsupported**/diagnostic.
  - **Equipment:** closed `properties[]` and damage-`types[]` vocabularies; weapon `type.value` = `martialM`/`simpleM`/`martialR`/`simpleR`/`natural`; armor = `medium`/`heavy`/`light`/`shield` — **direct** (static + activities).
  - **Spellcasting:** class-side `progression` = `full` 10 / `half` 4 / `pact` 2 / `none` 32; 661 spell-pack records (659 `type: spell`, 51 cantrips); 2024 preparation = `@scale.<class>.max-prepared`, 2014 = `@abilities.<a>.mod + @classes.<c>.levels` — **direct**; `preparation.mode: always` (22) and `pact` slot model need contract confirmation before G5.
  - **Active Effects:** `changes[].type` = `add` 1,068 / `override` 506 / `upgrade` 150 / `multiply` 38 / `downgrade` 13 / `subtract` 3; first allowlisted families: name-append, `damage.base.types` add, `activities[attack].attack.bonus` add (bracket key), `traits.*.value`, `roll.mode` overrides — **indirect**.
  - **D-11 proof fixture (designated):** `classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml` (enchant activity; consumes `feat:channel-divinity-paladin`; weapon restrictions `simpleM`/`martialM`; embedded effect with 3 changes incl. `(max(1,@abilities.cha.mod))` and radiant; 600 s `turnStart` expiry). 2014 counterpart `classfeatures/paladin/oath-of-devotion-features/channel-divinity-sacred-weapon.yml` is prose-only → canonical 2014 under-specification gap (conditional/diagnostic).
- Previous task: **G3 — Free Foundry source, license, and pack inventory (not a gate)**
- G3 deliverables:
  - `scripts/foundry-catalog/source-lock.json` — machine-readable reproducibility anchor.
  - `docs/audits/foundry-srd-inventory.md` — source, license, and pack inventory audit.
- Key locked facts (G3):
  - **Source lock (SP-1):** `https://github.com/foundryvtt/dnd5e` @ **`655d9c189025b9f8d313c93501c8dd5f71180dcf`** (Thu Sep 3 01:25:36 2026 +0100; branch `6.0.x` is reference-only, NOT the anchor). System `dnd5e` v6.0.0; Foundry compat min `14.367` / verified `14`.
  - **License (SP-7, re-verified at pin):** SRD 5.1 & 5.2 = CC-BY-4.0; software = MIT (Copyright 2021 Andrew Clayton); assets = various; `foundryvtt.json` `premium: false`. Required attribution preserved from `content24/legal-information.yml`.
  - **Source format:** `packs/` holds only `packs/_source/` per-record **YAML** (dir = pack). Pack `.db`/`.index` are build-time artifacts via `utils/packs.mjs`; the catalog generator consumes YAML directly (no SQLite).
  - **Inventory:** 23 packs, 4,579 records. 11 packs SRD 5.1, 7 packs SRD 5.2, 5 unflagged reference packs (`rules`, `tables`, `content24`, `tables24`, `effects`).
  - **Premium boundary (LC-1):** exactly one premium record — `monsterfeatures24/actions/possession.yml` (`book: MM 2024`) — EXCLUDED with coverage entry. 4 other empty-`license` records are in-scope SRD data gaps (documented).
  - **Free Rules:** separate private module `dnd-free-rules`, ABSENT from public repo, non-redistributable → out of scope. No Free Rules records can be (or are) bundled.
  - **Excluded assets (CB-3):** `icons/` (190), `fonts/` (13), `tokens/` (662), `ui/` (81).
  - **Semantic note:** `Divine Smite` = feat (2014) vs spell (2024); do not key records on name alone.
- Previous task: **G2 — Official Obsidian compliance audit (not a gate)**
  - `docs/audits/obsidian-compliance.md` (pinned `obsidian-api` @ `cc1744324150c632416857c98964f87b1574a5fc`, developer-docs @ `c56c7e770ba25dd0ea392aacf4588f9425970d36`; rows G2-01..G2-30; G5-fixed decisions: minAppVersion 1.13.0, settings API, Vault-only persistence, no-hotkeys/offline/innerHTML bans, deferred views, MarkdownRenderer.render 5-arg).
- Prior: **G1 — New SRD Character Sheet contract (gate, approved)** — `docs/contracts/character-sheet-srd-baseline.md` (incl. [D-19]: catalog preserves Foundry record structure; runtime interprets semantic families directly).

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
| commit updating this file (G5, after gate approval) | G5 architecture + interface map (`docs/architecture/character-sheet-architecture.md`, `docs/handoffs/INTERFACES.md`) + plan DAG update + this handoff |

## Repository state at G5 gate (uncommitted)

- `docs/contracts/character-sheet-srd-baseline.md` remains the source of truth for product requirements/acceptance boundaries (AGENTS.md instruction authority) until superseded by an approved amendment.
- `scripts/foundry-catalog/source-lock.json` is the reproducibility anchor for all later catalog work; re-verify the SHA before any catalog build.
- `docs/audits/foundry-mechanics-capability-matrix.md` (G4) is the capability baseline every later runtime task (advancement interpreter, rules runtime, effect interpreter, catalog adapter) must point into.
- G5 deliverables uncommitted: ` M docs/implementation-plan.md`, `?? docs/architecture/`, `?? docs/handoffs/INTERFACES.md` (plus this file after the G5 edit).
- Still no `package.json`, no lockfile, no `src/`, no `tests/`, no build/test/lint configuration (S0 creates them).
- No committed Foundry source data or generated catalog yet (checkout lives only in git-ignored `.tmp/g3/`).
- Development vault `character-plugin-vault/` exists with a fresh `.obsidian/`; no plugin installed. Plugin id locked by G5: **`dnd-character`** (dev install path `character-plugin-vault/.obsidian/plugins/dnd-character/`; copy-based dev install via `scripts/dev-install.mjs`, S1/S2).
- Toolchain: git 2.55.0, node v22.23.1, npm 10.9.8 (pnpm/yarn/bun not installed).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work on `dev`.
- `.tmp/` (pinned Foundry checkout under `.tmp/g3/`, plus G2 `obsidian.d.ts`/doc pages) is git-ignored.
- Working tree: only G5 changes pending (no unrelated user changes).

## Exact verification commands for G5 (pre-gate)

```text
git branch --show-current            # dev
git status --short                   # M docs/implementation-plan.md; ?? docs/architecture/; ?? docs/handoffs/INTERFACES.md; M docs/handoffs/CURRENT.md
test -f docs/architecture/character-sheet-architecture.md && echo ok
test -f docs/handoffs/INTERFACES.md && echo ok
grep -c '655d9c189025b9f8d313c93501c8dd5f71180dcf' docs/architecture/character-sheet-architecture.md   # >= 1
grep -c 'cc1744324150c632416857c98964f87b1574a5fc' docs/architecture/character-sheet-architecture.md   # >= 1
grep -n 'G2-20\|G2-08' docs/architecture/character-sheet-architecture.md | head
grep -rn 'G2 §7' docs/architecture/ docs/handoffs/INTERFACES.md   # expect: no matches
```

## Key facts for later tasks

- **S0 (next):** create `package.json` + lockfile, `tsconfig`, esbuild, typecheck, lint, unit-test baseline per plan §S0 and architecture §1/§14 (plugin id `dnd-character`; single `main.js` IIFE/CJS; no UI framework).
- **S1/S2:** plugin lifecycle shell (`getSettingDefinitions()`, no hotkeys) and copy-based dev install via `scripts/dev-install.mjs` into `character-plugin-vault/.obsidian/plugins/dnd-character/`.
- **S3 (catalog generator):** clone at the locked SHA `655d9c1…`; read `packs/_source/**` YAML; apply the G3 scope rule (include SRD 5.1/5.2 + unflagged reference packs; exclude premium `source.book`; exclude assets; no Free Rules). Emit an LC-1 coverage entry for `possession.yml`. Preserve the CC-BY-4.0 attribution statement. The matrix §8 reference table (489 advancement item + 149 pool + 352 cast `spell.uuid` + 205 non-empty of 243 `profiles[].uuid` + 50 target UUID + 14 target identifier refs) is the build-time normalization checklist. **Size gate: `main.js` > 25 MB or > 3 s startup ⇒ stop and re-decide (architecture §4.2).**
- **Runtime tasks (later):** D-11 end-to-end proof = 2024 Sacred Weapon (matrix §9); 2014 Sacred Weapon is the canonical narrative-fallback/diagnostic case (C7).
- **Open items (deferred, not blocking):** `preparation.mode: always` (22 spells) slot semantics and `pact` slot model → confirm at A8; `@flags.*` tokens (2 occurrences) ⇒ C8 `FORMULA_UNSUPPORTED_TOKEN`; exotic recovery periods `dusk`/`initiative` (3 occurrences) ⇒ C8.

## Blockers

- None. G5 gate: deliverables prepared and verified; awaiting user approval (no commit/push yet).

## Next eligible task

- **G5 gate approval** — on approval, commit the three deliverables + this handoff on `dev` and push to `origin/dev`.
- Then **S0 — Build, typecheck, lint, and unit-test baseline**, per `docs/implementation-plan.md`.
