# CURRENT — task/status handoff

- Last updated: 2026-09-02 (task G3)
- Current branch: `dev`

## Current milestone / task

- Milestone: G — Governance, evidence, and exact plan
- Last completed task: **G3 — Free Foundry source, license, and pack inventory (not a gate)**
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

## Repository state at G3 completion

- `docs/contracts/character-sheet-srd-baseline.md` remains the source of truth for product requirements/acceptance boundaries (AGENTS.md instruction authority) until superseded by an approved amendment.
- `scripts/foundry-catalog/source-lock.json` is now the reproducibility anchor for all later catalog work; re-verify the SHA before any catalog build.
- Still no `package.json`, no lockfile, no `src/`, no `tests/`, no build/test/lint configuration.
- No committed Foundry source data or generated catalog yet (checkout lives only in git-ignored `.tmp/g3/`).
- Development vault `character-plugin-vault/` exists with a fresh `.obsidian/`; no plugin installed; `<plugin-id>` not yet chosen (G5).
- Toolchain: git 2.55.0, node v22.23.1, npm 10.9.8 (pnpm/yarn/bun not installed).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work on `dev`.
- `.tmp/` (pinned Foundry checkout under `.tmp/g3/`, plus G2 `obsidian.d.ts`/doc pages) is git-ignored.
- **Unrelated working-tree change present at G3 time:** `AGENTS.md` (user edit to the subagent section). It is NOT part of G3 and must be preserved and excluded from the G3 commit.

## Exact verification commands for G3

```text
git branch --show-current            # dev
git status --short                   # shows only ' M AGENTS.md' before the G3 commit; clean (for G3 files) after
test -f scripts/foundry-catalog/source-lock.json && echo ok
python3 -m json.tool scripts/foundry-catalog/source-lock.json > /dev/null && echo 'json ok'
grep -n '655d9c189025b9f8d313c93501c8dd5f71180dcf' scripts/foundry-catalog/source-lock.json
grep -n '655d9c189025b9f8d313c93501c8dd5f71180dcf' docs/audits/foundry-srd-inventory.md
test -f docs/audits/foundry-srd-inventory.md && echo ok
```

## Key facts for later tasks

- **G4 (Foundry mechanics capability matrix):** consume `source-lock.json` and the pinned `.tmp/g3/foundry-dnd5e` checkout (re-pin/verify SHA first if stale). Inventory advancement/activity/uses/formula/equipment/effect shapes against the actual YAML.
- **Catalog generator (later):** clone at the locked SHA; read `packs/_source/**` YAML; apply the G3 scope rule (include SRD 5.1/5.2 + unflagged reference packs; exclude premium `source.book`; exclude assets; no Free Rules). Emit an LC-1 coverage entry for `possession.yml`. Preserve the CC-BY-4.0 attribution statement.
- **G5:** re-pin `obsidian-api` if the master SHA moved; consume `docs/audits/obsidian-compliance.md` §7 fixed decisions.

## Blockers

- None.

## Next eligible task

- **G4 — Foundry mechanics capability matrix** (not a gate), per `docs/implementation-plan.md`. Do not start until G3 is committed and the user approves proceeding.
