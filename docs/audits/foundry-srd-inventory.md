# Foundry D&D5e source, license, and pack inventory (task G3)

- Task: G3 — Free Foundry source, license, and pack inventory
- Date: 2026-09-02
- Branch at inspection: `dev`
- Companion machine-readable lock: `scripts/foundry-catalog/source-lock.json`

## Instructions read

- `AGENTS.md` (repository root) — source authorities, Foundry import rules, repository boundary.
- `docs/implementation-plan.md` — task G3 entry (lines 204–217).
- `docs/contracts/character-sheet-srd-baseline.md` — SP-1, SP-6, SP-7, LC-1, CB-3.

## 1. Reproducibility anchor (SP-1)

| Property | Value |
| --- | --- |
| Repository | `https://github.com/foundryvtt/dnd5e` |
| **Exact commit** | **`655d9c189025b9f8d313c93501c8dd5f71180dcf`** |
| Commit date | Thu Sep 3 01:25:36 2026 +0100 |
| Commit subject | `[#6899] Default the compendium browser to the items tab (#7125)` |
| Branch (reference only, NOT the anchor) | `6.0.x` |
| System id / version | `dnd5e` / `6.0.0` |
| Foundry compatibility | minimum `14.367`, verified `14` |
| Checkout location (SP-6) | `.tmp/g3/foundry-dnd5e` (git-ignored via `.tmp/`; inside repository root) |
| Checkout method | `git clone --depth 1 --branch 6.0.x`, then pinned verification against the SHA above |

The catalog generator MUST clone this repository at this exact commit. It MUST NOT track a moving branch.

## 2. License verification at the pinned SHA (SP-7)

Verified directly in the pinned checkout:

- **SRD content (CC-BY-4.0).** `README.md` "Licenses" section states the work includes SRD 5.1 (https://dnd.wizards.com/resources/systems-reference-document) and SRD 5.2 (https://www.dndbeyond.com/srd), both "licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode."
- **Software (MIT).** `LICENSE.txt` — MIT, "Copyright 2021 Andrew Clayton."
- **Assets (various).** `README.md`: "Images and other assets are distributed under various terms, please see their `LICENSE` files." Per-asset LICENSE files exist (see §7).
- **Not premium.** `foundryvtt.json` → `{"project":{"type":"system","premium":false}}`.
- **Required attribution** (verbatim from `packs/_source/content24/legal-information.yml`, `_id phbCredits000000`): the SRD 5.2 CC-BY-4.0 attribution statement. This statement (and the equivalent SRD 5.1 statement) must be preserved with the bundled catalog. Do not add other WotC attribution.

## 3. Pack inventory (23 packs, 4,579 source records)

Source records live under `packs/_source/` as per-record YAML files (one directory per pack; directory name = pack name). Pack `.db`/`.index` binaries are not committed; they are generated at build time from the YAML by `utils/packs.mjs` (`node ./utils/packs.mjs package pack`). **The catalog generator consumes the YAML directly; it does not require SQLite.**

`sourceBook` is read from each pack's `flags.dnd5e.sourceBook` in `system.json`.

| Pack | Label | Doc type | sourceBook | Allowed record types | Records |
| --- | --- | --- | --- | --- | --- |
| `heroes` | Starter Heroes | Actor | SRD 5.1 | character | 12 |
| `monsters` | Monsters (SRD) | Actor | SRD 5.1 | npc | 337 |
| `items` | Items (SRD) | Item | SRD 5.1 | weapon, equipment, consumable, tool, loot, feat, container | 872 |
| `tradegoods` | Trade Goods (SRD) | Item | SRD 5.1 | loot | 23 |
| `spells` | Spells (SRD) | Item | SRD 5.1 | spell | 320 |
| `backgrounds` | Backgrounds (SRD) | Item | SRD 5.1 | background, feat | 3 |
| `classes` | Classes (SRD) | Item | SRD 5.1 | class | 12 |
| `subclasses` | Subclasses (SRD) | Item | SRD 5.1 | subclass | 12 |
| `classfeatures` | Class & Subclass Features (SRD) | Item | SRD 5.1 | feat, weapon | 235 |
| `races` | Races (SRD) | Item | SRD 5.1 | race, feat | 35 |
| `monsterfeatures` | Monster Features (SRD) | Item | SRD 5.1 | feat, weapon | 252 |
| `rules` | Rules (SRD) | JournalEntry | — | (rules text) | 20 |
| `tables` | Tables (SRD) | RollTable | — | (roll tables) | 31 |
| `content24` | Rules | JournalEntry | — | (rules text + legal/disclaimer) | 43 |
| `classes24` | Character Classes | Item | SRD 5.2 | class, subclass, feat | 282 |
| `origins24` | Character Origins | Item | SRD 5.2 | race, background, feat | 54 |
| `feats24` | Feats | Item | SRD 5.2 | feat | 17 |
| `spells24` | Spells | Item | SRD 5.2 | spell | 341 |
| `equipment24` | Equipment | Item | SRD 5.2 | weapon, equipment, consumable, tool, loot, feat, container | 633 |
| `tables24` | Roll Tables | RollTable | — | (roll tables) | 45 |
| `actors24` | Actors | Actor | SRD 5.2 | (npc, character, vehicle) | 436 |
| `monsterfeatures24` | Monster Features | Item | SRD 5.2 | feat, weapon | 391 |
| `effects` | Active Effects | ActiveEffect | — | (effect templates) | 173 |

Totals: **23 packs**, **4,579 records**. SourceBook split: 11 packs SRD 5.1, 7 packs SRD 5.2, 5 unflagged reference packs (`rules`, `tables`, `content24`, `tables24`, `effects`) — the unflagged packs carry no premium `source.book` and are free-SRD reference material.

## 4. Source markers

Per-record provenance is in the YAML `system.source` block (`book`, `page`, `license`, `custom`, and top-level `rules` = `'2014'` or `'2024'`).

- **License field distribution (all occurrences):** `license: CC-BY-4.0` × 10,694; `license: ''` × 65; no other values.
- **Rules split (occurrences):** `rules: '2014'` × 4,319; `rules: '2024'` × 6,992.
- **Non-empty `source.book` values (whole corpus):** only two — `SRD 5.1` × 7 (all in `monsters/summons/`, all `license: CC-BY-4.0`) and `MM 2024` × 1 (`monsterfeatures24/actions/possession.yml`). No non-empty `source.custom`.
- **Structural flags:** no `premium` marker anywhere in source; no structural `srd:` flag.

**Empty top-level `license` (data-quality notes — 5 records):**

| Path | Type | book | Disposition |
| --- | --- | --- | --- |
| `actors24/beast/giant-centipede.yml` | npc | (none) | In scope — SRD 5.2 by pack flag; empty license field is a data gap. |
| `classes24/monk/class-features/unarmed-strike.yml` | feat | (none) | In scope — SRD 5.2 by pack flag; data gap. |
| `monsterfeatures24/actions/possession.yml` | feat | **MM 2024** | **EXCLUDED — premium book.** |
| `monsterfeatures24/actions/pummel.yml` | feat | (none) | In scope — SRD 5.2 by pack flag; data gap. |
| `spells/supplemental-items/conjured-flame-blade.yml` | weapon | SRD 5.1 | In scope — explicit SRD 5.1 book; data gap. |

## 5. Free-SRD vs premium vs Free Rules boundary (LC-1, CB-3)

**Scope rule for the catalog generator (deterministic):**

- **INCLUDE** a record if its pack is `sourceBook` ∈ {`SRD 5.1`, `SRD 5.2`} **or** it is in one of the unflagged reference packs (`rules`, `tables`, `content24`, `tables24`, `effects`), **and** its `source.book` is not a premium title.
- **EXCLUDE** any record whose `source.book` is a premium title (currently exactly one: `MM 2024` → `possession.yml`), and record an LC-1 coverage entry for it.
- **EXCLUDE** all image/icon/font/token assets (CB-3).
- **EXCLUDE** all Free Rules records (see below) — none are present in this public repository.

**Premium boundary.** Exactly **one** premium record exists in the public source: `packs/_source/monsterfeatures24/actions/possession.yml` (`book: MM 2024`, `license: ''`). It is the only record to exclude on license grounds.

**Free Rules (2024 PHB-derived).** "Free Rules" content is a **separate private module** (`dnd-free-rules`), merged only at private dist-build time. It is in-game usable but explicitly **not redistributable**, and it is **absent from this public repository**. Evidence:
- `CONTRIBUTING.md` (lines 189–193): `npm run dist -- <tag> <free-rules>`, where `<free-rules>` is "path to a local checkout of the (private) free rules content."
- `utils/dist.mjs:114`: `replaceAll("modules/dnd-free-rules/icons/", "systems/dnd5e/icons/")`.
- `lang/en.json:7180`: `"SOURCE.BOOK.FreeRules": "Free Rules"`.
- `content24/disclaimer.yml`: "Addtional content containing the 'Free Rules' source is not covered by this license, and may not be re-distributed outside the game system."
- `find` for `*free-rules*` in the repository returns nothing.

Consequence: no Free Rules records can be bundled from this repository; none are attempted.

## 6. Representative file paths (evidence)

Both rules sets are present; representative families verified:

| Family | 2014 path | 2024 path |
| --- | --- | --- |
| Class | `classes/paladin.yml` | `classes24/paladin/paladin.yml` |
| Class feature | `classfeatures/paladin/paladin-features/divine-smite.yml` (feat) | `classes24/paladin/class-features/` |
| Subclass feature | `subclasses/` | `classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml` |
| Spell | `spells/1st-level/` | `spells24/1st-level/divine-smite.yml` (spell) |
| Item/Equipment | `items/armor/` | `equipment24/` |
| Race/Origin | `races/` | `origins24/` |
| Background | `backgrounds/` | `origins24/` |
| Monster/Actor | `monsters/` | `actors24/` |
| Rules text | `rules/` | `content24/` |
| Effects | `effects/` | `effects/` |

**Semantic-change note:** `Divine Smite` is a class **feat** in 2014 (`classfeatures/paladin/.../divine-smite.yml`) but a **spell** in 2024 (`spells24/1st-level/divine-smite.yml`). The catalog/runtime must treat the same name as different record types across rules sets; do not key on name alone.

Other fixtures confirmed present in both rules sets: Channel Divinity, Lay on Hands, Pact Magic.

## 7. Excluded assets (CB-3)

| Directory | Files | LICENSE files |
| --- | --- | --- |
| `icons/` | 190 | `icons/LICENSE`, `icons/spell-tiers/LICENSE` |
| `fonts/` | 13 | `fonts/LICENSE`, `fonts/roboto-condensed/LICENSE`, `fonts/roboto-slab/LICENSE` |
| `tokens/` | 662 | `tokens/LICENSE`, `tokens/composite/LICENSE` |
| `ui/` | 81 | `ui/official/LICENSE` |

All image/icon/font/token assets are out of scope and excluded from the catalog.

## 8. Exact reconnaissance commands used

```text
git clone --depth 1 --branch 6.0.x https://github.com/foundryvtt/dnd5e .tmp/g3/foundry-dnd5e
git -C .tmp/g3/foundry-dnd5e rev-parse HEAD          # 655d9c189025b9f8d313c93501c8dd5f71180dcf
git -C .tmp/g3/foundry-dnd5e log -1 --format='SHA=%H %cd %s'
# system.json pack/sourceBook enumeration (python3 json over s['packs'], flags.dnd5e.sourceBook)
# record counts: find packs/_source/<pack> -name '*.yml' ! -name '_folder.yml' | wc -l
# license/book/rules value audit: grep -c over packs/_source/**/*.yml
# per-pack type distribution: grep '^type:' packs/_source/<pack>/**/*.yml | sort | uniq -c
# premium/book audit: grep -rnP '^\s+book:\s*\S' packs/_source | grep -vP 'book:\s*$'
# free-rules absence: find . -iname '*free-rules*'
```

## 9. Exit criteria check

- **Reproducible free-SRD source boundary: satisfied.**
  - Exact commit locked (SP-1): `655d9c189025b9f8d313c93501c8dd5f71180dcf` (in `source-lock.json`).
  - License files re-verified at the pin (SP-7): SRD 5.1/5.2 = CC-BY-4.0, software = MIT, assets = various; `premium: false`.
  - Checkout under repository root and git-ignored (SP-6): `.tmp/g3/foundry-dnd5e`.
  - Non-free records excluded with coverage entries (LC-1): the single premium record `possession.yml` (MM 2024) is excluded; the 4 empty-license SRD records are documented as in-scope data gaps.
  - Free Rules (non-redistributable) confirmed absent from the public repo and out of scope.
  - Premium content and image/icon/font assets excluded (CB-3).
- Representative file paths recorded (§6); excluded assets recorded (§7); source markers recorded (§4); machine-readable lock written (`scripts/foundry-catalog/source-lock.json`).
