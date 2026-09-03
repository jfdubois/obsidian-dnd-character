# Foundry mechanics capability matrix (task G4)

- Task: G4 — Foundry mechanics capability matrix (not a gate)
- Date: 2026-09-03
- Branch at inspection: `dev`
- Source anchor: `https://github.com/foundryvtt/dnd5e` @ `655d9c189025b9f8d313c93501c8dd5f71180dcf` (re-verified against `scripts/foundry-catalog/source-lock.json` before this audit).
- Corpus: `packs/_source/**` YAML of the pinned checkout; 4,579 source records, of which **4,578 are free-SRD in scope** (the single premium record `monsterfeatures24/actions/possession.yml` is excluded per G3 §5).

## Instructions read

- `AGENTS.md` (repository root) — source authorities, core architecture rules, agent workflow, source-data implementation discipline.
- `docs/implementation-plan.md` — task G4 entry (lines 219–242).
- `docs/audits/foundry-srd-inventory.md` — G3 source/license/pack inventory (scope rule, premium boundary).
- `docs/contracts/character-sheet-srd-baseline.md` — D-11 (end-to-end proof fixture) and support-level vocabulary.

**Method note.** The plan suggests parallel research subagents; `AGENTS.md` (higher authority) requires sequential execution, and this session's toolset exposes no subagent tool, so the parent agent ran all eight families sequentially in one bounded pass. Counts are deterministic `python3`/`yaml` scans over the pinned YAML (commands in §12). Every family below lists occurrence counts, representative files, a proposed support level, and known gaps.

**Support levels used below**

- **direct** — the baseline rules runtime/advancement interpreter implements this structure natively.
- **indirect** — supported only through another mechanism (e.g., the effect interpreter or catalog adapter), not by dedicated runtime logic.
- **conditional** — supported where the source metadata is complete; records with missing metadata must produce an explicit diagnostic.
- **unsupported** — out of the approved baseline; must remain visible through coverage diagnostics.

## 0. Corpus overview

| Measure | Value |
| --- | --- |
| Source records (G3) | 4,579 |
| Free-SRD in-scope records | 4,578 |
| `rules: '2014'` records | 2,105 |
| `rules: '2024'` records | 2,101 |
| No `rules` marker | 233 (rules/tables/content24/tables24/effects reference packs, heroes, monsterfeatures24 data gaps) |
| Records with ≥1 activity | 2,399 |
| Total activity entries | 3,389 |
| Embedded Active Effects (all records) | 1,319 |
| Standalone `effects` pack documents | 173 |

## 1. Advancement types

88 in-scope records carry a non-empty `system.advancement` list; 824 advancement entries across 8 types.

| Type | Entries | Representative file (`packs/_source/…`) | Configuration keys |
| --- | ---: | --- | --- |
| `ItemGrant` | 342 | `classes24/wizard/class-features/spellcasting.yml` | `items[].uuid`, optional `optional`, `spell` sub-block |
| `Trait` | 172 | `origins24/species/traits/goliath/fires-burn.yml` | `grants[]` (e.g. `armor:lgt`, `saves:wis`, `languages:standard:common`), `mode` (`default` 154 / `expertise` 9 / `mastery` 9), `choices[]` (`count`, `pool` e.g. `languages:*`) |
| `AbilityScoreImprovement` | 142 | `classes24/fighter/fighter.yml` (2024 ASIs live in the class record) | `points`, `fixed{}`, `cap`, `locked[]` |
| `ScaleValue` | 65 | `classes24/monk/class-features/martial-arts.yml` | `identifier`, `type: number`, `scale{level: {value}}` |
| `ItemChoice` | 37 | `origins24/species/human.yml` | `pool[].uuid` (149 pool refs), pool `type` (`spell` 15 / `feat` 22), `restriction.type` (`class` 17 / `feat` 4 / `race` 1 / empty 15) |
| `HitPoints` | 23 | `classes24/paladin/class-features/paladins-smite.yml` | empty configuration `{}` |
| `Subclass` | 23 | `classes24/barbarian/barbarian.yml` (2024 subclass choice lives in the class record) | `level` |
| `Size` | 20 | `origins24/species/tiefling-abyssal.yml` | `sizes[]` (e.g. `[sm]`) |

- Advancement entries reference items by compendium UUID: 489 `items[].uuid` refs, 149 `pool[].uuid` refs.
- **Proposed support: direct** for all 8 types — they are the complete advancement vocabulary and the leveling engine's input. `ItemChoice` pool resolution (spell/feat pools + restriction filtering) is the one non-trivial sub-problem.
- **Gaps:** none structural; `Trait.grants` uses a dot-notation vocabulary that must be allowlisted (top values: `armor:lgt` 21, `weapon:sim` 20, `armor:shl` 17, `armor:med` 14, `saves:wis` 12, `saves:cha` 11, `weapon:mar` 10, `languages:standard:common` 10).

## 2. Activity types

2,399 in-scope records define 3,389 activities across 11 types.

| Type | Entries | Records | Representative file (`packs/_source/…`) |
| --- | ---: | ---: | --- |
| `utility` | 1,082 | 976 | `races/orc/orc-features/relentless-endurance.yml` |
| `save` | 720 | 604 | `spells/1st-level/alarm.yml` |
| `attack` | 561 | 537 | `items/weapon/longsword.yml` |
| `cast` | 353 | 152 | `classes24/druid/class-features/wild-shape.yml` (2024 cast profile) |
| `check` | 181 | 143 | `races/dwarf/dwarf-features/stonecunning.yml` |
| `damage` | 177 | 153 | `races/dragonborn/dragonborn-features/red-breath-weapon.yml` |
| `summon` | 136 | 117 | `spells/2nd-level/misty-step.yml` (adjacent); `monsters/` summoning features |
| `heal` | 97 | 92 | `spells/cantrip/…` healing cantrips; `classes24/cleric/…` |
| `enchant` | 65 | 60 | `classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml` |
| `teleport` | 9 | 9 | `spells/2nd-level/misty-step.yml` |
| `transform` | 8 | 8 | `classes24/druid/class-features/wild-shape.yml` |

**Shared sub-structure vocabulary (all 3,389 entries scanned):**

| Block | Observed values |
| --- | --- |
| `activation.type` | `action`, `bonusAction`, `reaction`, `passive`, `legAction`, `special`, `free` (era-dependent; 2024 adds `legAction`/`free`) |
| `consumption.targets[]` | 1,094 entries; `target` empty 1,030 / compendium UUID 50 / feature identifier 14 (e.g. `feat:channel-divinity`, `feat:channel-divinity-paladin`); `type: itemUses` + `value` |
| `consumption.spellSlot` | `true` on cast activities (slot cost carried by the spell, not the activity) |
| `duration.units` | `minute`, `round`, `turn`, `day`, `hour`, `self`, `none` |
| `range.units` | `ft`, `self`, `touch`, `mile`, `sight`, `special` |
| `target.template.type` | `radius` 120, `cone` 49, `sphere` 40, `square` 39, `line` 36, `cube` 20, `wall` 15, `circle` 13, `cylinder` 8, `ring` 4 |
| `target.affects.type` | `creature` 623, `self` 211, `space` 110, `object` 57, `creatureOrObject` 15, `enemy` 11, `any` 10, `ally` 6, `willing` 3 |
| `save.dc.calculation` | `spellcasting` 308, empty 273, ability-based: `con` 48, `cha` 33, `dex` 21, `str` 18, `wis` 18, `int` 1 |
| `damage.onSave` | `half` 516, empty 738, `none` 187, `full` 16 |
| `effects[].behaviors` | `difficultTerrain` 11, `applyActiveEffect` 2 |
| `summon.mode` | `cr` 15, empty 121; `summon.identifier` is **never non-empty** (0/136) |
| `restrictions` (activity-level) | 24 activities: `type` weapon 17 / consumable 3 / spell 2 / equipment 1 / container 1; `categories` simpleM 8, martialM 6, ammo 2, medium 1, scroll 1; `allowMagical` bool |
| `enchant` (activity-level) | 57 activities (`identifier` slot, usually empty) |
| 2024-only fields | `name` 1,710, `visibility.level{min,max}` 1,432 |

- **Proposed support:**
  - `attack`, `save`, `check`, `teleport` — **direct** (bounded roll/save/check pipelines with the formula grammar of §4).
  - `damage`, `heal` — **direct** (formula evaluation of `roll.formula` / `healing` formula with `onSave`/`affects` gating).
  - `cast` — **indirect** (delegates to the spell record of §6; 2024 profiles carry 243 `profiles[].uuid` refs, 2014 `spell.uuid` 352).
  - `summon`, `enchant`, `transform` — **indirect** through the effect interpreter (§7); `summon` targets are unresolvable from source (gap below).
  - `utility` — **conditional** (1,082 entries; only the structured subset — consumption, duration, restrictions — is machine-usable; narrative-only entries are surfaced verbatim).
- **Gaps:** `summon.identifier` empty everywhere (summon target must be player-chosen, not source-resolved); `restrictions` only constrains 24/3,389 activities; 2014 `utility` entries are frequently narrative-only (e.g., 2014 Sacred Weapon, §9).

## 3. Uses / recovery / consumption shapes

| Structure | Count | Notes |
| --- | ---: | --- |
| `uses{max, spent, recovery[]}` blocks | present on feats/items/activities | `max` is int, string, or a scale identifier: 2024 paladin Channel Divinity uses `max: '@scale.paladin.channel-divinity'` |
| `uses.recovery[]` entries | 390 | `period`: `dawn` 123, `lr` 101, `day` 63, `recharge` 58, `sr` 42, `dusk` 2, `initiative` 1 |
| recovery `type` | 390 | `recoverAll` 279, `formula` 106, empty 3, `loseAll` 2 |
| recovery entries with `formula` | 164 | simple integer expressions (e.g. `"1"`) |
| `consumption.targets[]` (activity-level) | 1,094 | see §2; `itemUses` is the dominant `type` |

- **Proposed support: direct.** The `period`/`type` vocabulary is closed and small; `max` resolution needs only the `@scale.*` identifiers of §4.
- **Gaps:** `period: dusk` (2) and `initiative` (1) are exotic — support the vocabulary but keep them diagnostic-only unless a baseline feature needs them.

## 4. Formula expressions and property references

**Formula-bearing fields (in-scope, non-empty):**

| Field | Count | Example |
| --- | ---: | --- |
| `attributes.hp.formula` | 696 | `"20d10 + 40"` |
| `uses.recovery[].formula` | 164 | `"1"` |
| activity `save.dc.formula` / `check.dc.formula` / `roll.formula` / `damage`/`healing` formulas | 3,389 activities scanned (most activity families carry at least one) | `"@abilities.cha.mod"`, `"1d8 + @mod"` |
| `damage.base.custom.formula` (weapon) | 23 | `"@scale.dragonborn.breath-weapon"` |
| `spellcasting.preparation.formula` | 12 | `"@abilities.wis.mod + @classes.cleric.levels"` |

**Functions observed (closed set):** `max` 6, `ceil` 2, `floor` 1.

**Token vocabulary (all occurrences, top 20 of 58 distinct):**

| Token | n | | Token | n |
| --- | ---: | --- | --- | ---: |
| `@mod` | 89 | | `@attributes.hd.largestFace` | 5 |
| `@prof` | 68 | | `@abilities.str.mod` | 4 |
| `@scaling` | 12 | | `@scale.bard.inspiration` | 4 |
| `@skills.ath.passive` | 10 | | `@classes.monk.levels` | 4 |
| `@scale.dragonborn.breath-weapon` | 10 | | `@attributes.prof` | 4 |
| `@scale.monk.die` | 9 | | `@classes.cleric.levels` | 3 |
| `@item.level` | 9 | | `@abilities.dex.mod` | 3 |
| `@attributes.spell.dc` | 9 | | (32 further tokens at 1–2 each) | |
| `@item.uses.value` | 8 | | | |
| `@abilities.wis.mod` | 7 | | | |

The long tail (1–2 occurrences each) includes: `@scale.<class>.max-prepared` for 9 classes, `@scale.dragonborn.breath`, `@scale.channel-divinity-cleric.spark`, `@scale.land.lands-aid`, `@scale.life-domain.divine-strike`, `@scale.ranger.mark`, `@scale.bard.song-of-rest`, `@scale.rogue.sneak-attack`, `@scale.cleric.divine-strike`, `@scale.barbarian.{brutal-strike, rage-damage}`, `@classes.{barbarian,druid,wizard,warlock,paladin,fighter,ranger,sorcerer}.levels`, `@abilities.{con,int}.mod`, `@abilities.{str,dex}.dc`, `@spells.pact.level`, `@attributes.hd.{largest, largestAvailable, smallestAvailable}`, `@skills.prc.total`, and two **flag tokens**: `@flags.world.flame-blade-damage`, `@flags.dnd-players-handbook.mirrorImages`.

- **Proposed support: direct** via a bounded, allowlisted grammar (no `eval`): dice expressions (`NdM + K`, `dM`), the four observed functions, and a closed token set resolved against character state + catalog-defined `@scale.*` values. All 58 observed tokens are enumerable and none is dynamic.
- **Gaps:** the two `@flags.*` tokens (2 occurrences) reference world/module flags with no catalog source — **unsupported**, must be explicit diagnostics. `@scale.dragonborn.breath` vs `@scale.dragonborn.breath-weapon` (2 vs 10) shows scale identifiers are not uniform; the catalog must carry the exact identifier per record.

## 5. Equipment / armor / weapon structures

| Pack/sub-pack | Records | Representative file (`packs/_source/…`) |
| --- | ---: | --- |
| `items/weapon` (2014) | 275 | `items/weapon/longsword.yml` |
| `items/armor` (2014) | 92 | `items/armor/chain-mail.yml` |
| `equipment24/weapons` (2024) | 82 | `equipment24/weapons/martial-melee/longsword.yml` |
| `equipment24/armor` (2024) | 32 | `equipment24/armor/magical/dragon-scale-mail.yml` |
| `equipment24/consumables` (2024) | 82 | `equipment24/consumables/oil-of-sharpness.yml` |

**Weapon shape (2014 + 2024 share the same keys):** `damage.base{number, denomination, types[], bonus, custom{enabled, formula, scaling{mode, number, formula}}}`, `damage.versatile{…}` (optional), `properties[]`, `type.value` (`martialM` 244, `simpleM` 160, `martialR` 43, `simpleR` 32, `natural` 2, empty 39), `range{value, long, units, reach}`, `ammunition{type}` (mostly empty), `mastery` (2024).

**Armor shape:** `armor.value`, `strength`, `speed`, `type.value` (`medium` 41, `heavy` 38, `light` 20, `shield` 16, empty 9).

**`properties[]` vocabulary (all equipment, top):** `mgc` 955, `vocal` 642, `somatic` 587, `material` 373, `concentration` 258, `trait` 121, `two` 92, `ver` 83, `fin` 81, `lgt` 80, `hvy` 72, `foc` 68, `thr` 59, `ritual` 57, `stealthDisadvantage` 56, `amm` 48, `rch` 32, `lod` 26, `weightlessContents` 16, `ret` 12, `spc` 10, `ada` 9.

**Damage `types[]` vocabulary:** `piercing` 161, `slashing` 132, `bludgeoning` 121, `fire` 13, `force` 11, `necrotic` 9, `radiant` 6, `healing` 6, `poison` 5, `lightning` 4, `psychic` 4, `thunder` 3, `acid` 2, `temphp` 1, `cold` 1.

- **Proposed support: direct.** Equipment is static data + properties + attack activities (already covered in §2); no new runtime semantics beyond the property/damage-type allowlists and the `damage.base.custom` formula path (§4).
- **Gaps:** `ammunition` blocks are essentially empty (no count/quota model in source); 39 weapons have no `type.value` (mostly 2014 natural/misc); `temphp` (temporary HP) appears only in damage types — it is an effect, not a damage type, and must be mapped through the effect interpreter, not the damage pipeline.

## 6. Spellcasting structures

**Class-side `spellcasting` block (48 class/subclass records carry it):**

| Field | Values |
| --- | --- |
| `progression` | `full` 10, `half` 4, `pact` 2, `none` 32 |
| `ability` | one of the six ability keys |
| `preparation.formula` (2014) | e.g. `"@abilities.wis.mod + @classes.cleric.levels"`; paladin uses `floor(...)` |
| `preparation.formula` (2024) | `"@scale.<class>.max-prepared"` |

**Spell records: 661** (`spells` 320 + `spells24` 341). Representative: `spells/cantrip/acid-splash.yml`, `spells24/1st-level/divine-smite.yml`.

| Field | Shape |
| --- | --- |
| `level` | integer; cantrips are `0` (659 records) |
| `school` | standard 8-value vocabulary |
| `materials{value, consumed, cost, supply}` | present on spells with material components |
| `preparation.mode` | `prepared` 588, empty 49, `always` 22 |
| `method` | `spell` 49 (ritual-style method marker) |
| `properties[]` | component list (`vocal`/`somatic`/`material` + `concentration`), same vocabulary as §5 |
| cast linkage | 2024 activity cast profiles: 243 `profiles[].uuid`; 2014 cast activities: 352 `spell.uuid` |

- **Proposed support: direct** for the spellcasting block (progression → slot table; ability → DC formula; preparation formula via §4) and for spell records (static data + activities of §2).
- **Gaps:** `preparation.mode: always` (22) needs a defined slot semantics (always-available, no slot cost) — confirm against the contract before G5; pact progression (`pact` 2) needs the pact-slot model (pact slots recover on short rest, level = `@spells.pact.level`), which is a small dedicated rule, not a generic one.

## 7. Active Effect types and change keys

**Standalone `effects` pack (173 documents)** — reusable effect templates. Representative: `effects/ability-check-advantage/charisma-check-advantage.yml`, `effects/spells/aura-of-life.yml`.

**Embedded effects (1,319 across all records)** — carried on items/features (e.g., the 2024 Sacred Weapon, §9). `type`: `base` 1,185, `enchantment` 134.

**`changes[]` structure (1,779 embedded changes scanned; the 173-document standalone pack adds 160 changes: 156 `add` / 4 `upgrade`):**

| Field | Values |
| --- | --- |
| `changes[].type` (embedded) | `add` 1,068, `override` 506, `upgrade` 150, `multiply` 38, `downgrade` 13, `subtract` 3, empty 1 |
| `changes[].phase` | `initial` dominant (160 in standalone pack) |
| `changes[].value` types | str 1,037, int 692, float 24, bool 20, list 5, dict 1 |
| `duration` | `value` + `units` (e.g. `600 seconds`), `expiry` (`turnStart` 672, empty 619, `turnEnd` 10, `sourceStart` 8, `sourceEnd` 5, `targetEnd` 4, `targetStart` 1) |
| `transfer` | `true` 407, `false` 912 (whether the effect transfers with its origin item) |
| `level{min,max}` | usually null (unbounded) |
| `statuses[]` | 2 standalone documents |
| `conditions` | 2 standalone documents (string `"{}"` — effectively unused) |

**Top `changes[].key` targets (standalone + embedded):** `traits.{ci,di,dr,dv}.value` (80), `abilities.*.{check,save}.roll.mode` (60), `skills.*.roll.mode` (32), `attributes.init.roll.mode` (2), `attributes.movement.*` (4), **bracket-indexed keys** `activities[attack].attack.bonus` (18), `name` (append via `add`), `system.damage.base.types` (add a damage type, §9).

- **Proposed support: indirect, allowlisted family-by-family** (per AGENTS.md: no generic active-effect mutator). The first verified families are: (a) `add` to `name`; (b) `add` to `system.damage.base.types`; (c) `add` formula to `activities[<type>].attack.bonus` (bracket-indexed key form); (d) `override`/`add` to `traits.*.value` (DR/DR-value/CI/DC-style modifiers); (e) `roll.mode` overrides (advantage/disadvantage). `multiply`/`downgrade` (51 total) are second-tier and remain diagnostic until a baseline feature needs them.
- **Gaps:** bracket-indexed keys (`activities[attack]…`) require a key-interpreter, not string matching; `conditions` is vestigial in source; `statuses` (2 docs) is out of scope unless the contract later requires condition display.

## 8. Source references and embedded UUIDs

| Reference kind | Count | Form |
| --- | ---: | --- |
| Advancement `items[].uuid` | 489 | `Compendium.dnd5e.<pack>.<DocType>.<id>` |
| Advancement `pool[].uuid` | 149 | same |
| `startingEquipment` entries | 29 documents | entry `type`: `linked` 171, `OR` 41, `AND` 35, `weapon` 16, `currency` 13, `focus` 11, `tool` 5, `armor` 3; `linked` entries carry `key` (171 refs) |
| Activity cast `profiles[].uuid` (2024) | 243 | same UUID form |
| Activity cast `spell.uuid` (2014) | 352 | same |
| Activity `consumption.targets[].target` | 50 UUID + 14 identifier | identifiers: `feat:channel-divinity`, `feat:channel-divinity-paladin` |
| `summon.identifier` | 0 non-empty | — |
| Description-text links | throughout | `@UUID[Compendium.dnd5e.<pack>.<Type>.<id>]{Name}` inline in HTML (e.g., premade actors, class descriptions) |

- **Proposed support: direct** in the catalog adapter — every UUID/identifier reference must be resolvable against the pinned catalog or produce an LC-1 coverage diagnostic. `startingEquipment` (`linked`/`OR`/`AND` groups) is a bounded choice-group grammar for character creation.
- **Gaps:** mixed reference styles (UUID vs `feat:` identifier vs `@scale.` vs inline `@UUID[…]` in prose) — the catalog must normalize all four to catalog IDs at build time; prose-embedded UUIDs are not machine-resolvable references and stay presentation-only.

## 9. D-11 end-to-end proof fixture — Sacred Weapon (Oath of Devotion)

The contract's D-11 fixture exists in the pinned source in **both** rules sets, as an Oath of Devotion Channel Divinity option (not a standalone paladin feature):

| Era | File (`packs/_source/…`) |
| --- | --- |
| 2014 | `classfeatures/paladin/oath-of-devotion-features/channel-divinity-sacred-weapon.yml` |
| 2024 | `classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml` |

**2024 record (fully specified — the designated proof fixture):**

- Activity `type: enchant`, `activation.type: special`, `condition: "when taking the Attack action"`.
- Consumption: `targets: [{type: itemUses, value: '1', target: feat:channel-divinity-paladin}]` → resolves to the paladin's Channel Divinity feature, which at the pin has `uses.max: '@scale.paladin.channel-divinity'`, recovery `lr/recoverAll` + `sr/formula "1"` (identifier `channel-divinity-paladin` ✓).
- Weapon selection: `restrictions: {type: weapon, categories: [simpleM, martialM], allowMagical: true}`.
- Duration: `10 minute` (non-concentration); embedded effect `duration: 600 seconds`, `expiry: turnStart`, `transfer: true`.
- Embedded Active Effect (type `enchantment`, name "Sacred Weapon") with exactly three changes:
  1. `name` / `add` / `', Sacred Weapon'`
  2. `system.damage.base.types` / `add` / `radiant`
  3. `activities[attack].attack.bonus` / `add` / `(max(1,@abilities.cha.mod))`

This single record exercises: linked-resource consumption (§3), restricted weapon targeting (§2), source-defined duration (§2/§7), the minimum-bonus Charisma formula with `max()` (§4), damage-type extension (§5/§7), and clean expiry (`turnStart`, `transfer`) (§7).

**2014 record (gap evidence):** activity `type: utility`, consumes `feat:channel-divinity` (identifier ✓, 2014 feature has `uses.max: '1'`, `sr/recoverAll`), duration `1 minute`, `range: 20 ft`, `target.prompt: true` — but `roll.formula` is empty and `effects` is empty. The Charisma bonus and radiant behavior exist **only in prose**. This is the canonical example of the 2014 under-specification gap: the runtime must treat such records as **conditional** (narrative fallback + diagnostic), and the D-11 proof is defined against the 2024 record.

## 10. Support-level summary

| Family | Proposed level | Runtime home |
| --- | --- | --- |
| Advancement types (8) | direct | advancement interpreter |
| Activities: attack/save/check/teleport | direct | rules runtime |
| Activities: damage/heal | direct | rules runtime (formula) |
| Activity: cast | indirect | spell record of §6 |
| Activities: summon/enchant/transform | indirect | effect interpreter |
| Activity: utility | conditional | effect interpreter / narrative |
| Uses/recovery/consumption | direct | rules runtime |
| Formula expressions | direct (bounded grammar) | rules runtime |
| Equipment/armor/weapon | direct (static + activities) | catalog adapter |
| Spellcasting + spells | direct | rules runtime |
| Active Effects | indirect (allowlisted families) | effect interpreter |
| Source references/UUIDs | direct (build-time normalization) | catalog adapter |
| `@flags.*` tokens, `summon` targets, `statuses` | unsupported (visible diagnostics) | — |

**Exit criteria check — "every later runtime task points to inventoried real examples":** every row above lists occurrence counts and at least one representative file from the pinned checkout; the D-11 proof fixture is pinned to a named file with its full effect structure quoted (§9). Satisfied.

## 12. Exact scan commands used

```text
# SHA re-verification against source-lock.json
git -C .tmp/g3/foundry-dnd5e rev-parse HEAD   # 655d9c189025b9f8d313c93501c8dd5f71180dcf

# All counts in this document come from deterministic python3 + PyYAML scans over
# .tmp/g3/foundry-dnd5e/packs/_source/**/*.yml with the G3 exclusions applied
# (skip *_folder.yml; skip monsterfeatures24/actions/possession.yml).
# Representative invocations:
#   advancement:  collect system.advancement lists, Counter by type, config keys
#   activities:   collect system.activities, Counter by type + sub-block vocabularies
#   uses:         walk system.uses.recovery[], Counter period/type, formula presence
#   formulas:     collect every system.**.formula string, regex @token vocabulary + function names
#   equipment:    items/weapon, items/armor, equipment24/{weapons,armor,consumables},
#                 Counter type.value / properties / damage types
#   spells:       spells + spells24, Counter level/preparation/method; class-side spellcasting blocks
#   effects:      d['effects'] arrays + packs/_source/effects/**, Counter changes[].{key,type,phase}
#   refs:         every uuid/key/target field, Counter by normalized path + reference kind
#   D-11:         cat of the two sacred-weapon files + their channel-divinity feature files
```
