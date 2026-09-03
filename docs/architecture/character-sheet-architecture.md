# Character Sheet Architecture (task G5)

- Status: proposed for G5 gate approval.
- Authority: subordinate to `AGENTS.md` (invariants, including the source-structure
  preservation constraint, commit `2b0db0a`) and the G1 contract
  (`docs/contracts/character-sheet-srd-baseline.md`, decisions [D-1]–[D-19]).
- Evidence base: G0–G4 audits in `docs/audits/`, pinned at:
  - Foundry `foundryvtt/dnd5e` @ `655d9c189025b9f8d313c93501c8dd5f71180dcf`
    (lock: `scripts/foundry-catalog/source-lock.json`; checkout: `.tmp/g3/foundry-dnd5e`)
  - `obsidianmd/obsidian-api` master @ `cc1744324150c632416857c98964f87b1574a5fc`
    (re-verified 2026-09-03, unchanged)
  - `obsidianmd/obsidian-developer-docs` @ `c56c7e770ba25dd0ea392aacf4588f9425970d36`

## 1. Plugin identity and development workflow

- **Plugin id: `dnd-character`** (matches `manifest.json` id; dev install path
  `character-plugin-vault/.obsidian/plugins/dnd-character/`).
- Build: esbuild → single `main.js` (IIFE, CJS output for Obsidian) + `styles.css`.
- Dev install: **copy-based**, via `scripts/dev-install.mjs`, which copies
  `main.js`, `manifest.json`, `styles.css` into the development vault plugin
  directory. Copy (not symlink) is chosen because Obsidian's plugin loader
  behavior with symlinked files is not in the pinned evidence; copying is
  deterministic and matches the documented plugin-directory layout.
- No hotkeys, no settings beyond `getSettingDefinitions()`, no runtime network
  access, no telemetry (G2 §1.1, row G2-08).

## 2. Retained source-record format

### 2.1 Retention rule

The catalog generator (build-time, `scripts/foundry-catalog/`) consumes the
pinned checkout's `packs/_source/**.yml` and retains exactly the G3 §5 scope
set: **4,578 records** (23 packs minus the single premium record
`monsterfeatures24/actions/possession.yml`). Every retained record is kept
**field-complete**: all YAML fields are preserved, including unsupported ones.
Unsupported fields are uninterpreted at runtime but never removed ([D-19],
AGENTS source-structure preservation).

### 2.2 Record envelope

Each retained record is stored as:

```json
{ "sourcePath": "classes24/paladin", "pack": "classes24", "record": { …record, field-complete… } }
```

`sourcePath` is the normalized YAML path relative to `packs/_source/` (this is
also the record's stable identity, §3). The envelope is an index-level wrapper;
`record` is the lossless YAML→JSON image of the source document.

### 2.3 Transformation register (complete list)

| # | Transformation | Justification | Scope |
| --- | --- | --- | --- |
| T1 | YAML → JSON (lossless, deterministic key order, no field addition/removal/rename) | esbuild bundles JSON; a YAML parser is not available at runtime in the pinned evidence; JSON is the canonical interchange the bundler requires | every retained record |
| T2 | Envelope wrapper `{sourcePath, pack, record}` (§2.2) | the source tree has no per-record manifest; runtime lookup by path/pack needs a uniform container without re-parsing file names | index level only |
| T3 | Scope filter: exclude the 1 premium record (G3 §5) | license boundary | record set |

**No other transformation is permitted.** No flattening, no field projection,
no mechanics normalization, no renamed keys. Typed TypeScript interfaces
(`src/catalog/types.ts`) are *descriptive* views over the supported subset of
the Foundry shape; they mirror source keys and never define a replacement
mechanics format.

## 3. Record identity and references

- **Stable record id = `sourcePath`** (e.g. `classes24/paladin`,
  `items/weapon/longsword`). Unique across both eras because pack directories
  are era-segregated. Never rewritten.
- `_id` (Foundry document id) is preserved in the record and indexed as a
  **secondary** lookup; it is not the stable identity because it is a
  generated value.
-   Cross-record references (`uuid` fields: advancements 489 `items[].uuid` +
  149 `pool[].uuid`; activities `spell.uuid` 352/353; activity
  `profiles[].uuid` 243 across summon/transform, G4 §8) are resolved at catalog-load time through a
  `uuid → recordId` map built from every `uuid` field in the runtime catalog.
  Unresolvable references produce `REF_UNRESOLVED` diagnostics (never silent).

## 4. Generated artifacts and bundle strategy

### 4.1 Artifacts (all deterministic, no timestamps — [D-2])

Under `src/catalog/generated/` (committed; regenerated only by the catalog
generator, never hand-edited):

| Artifact | Content |
| --- | --- |
| `srd-catalog.full.json` | all 4,578 retained records as envelopes, sorted by `sourcePath` |
| `srd-catalog.runtime.json` | the runtime pack set (§4.4), same envelope shape, sorted |
| `srd-catalog.provenance.json` | Foundry commit SHA, generation command, per-pack record counts, the preserved SRD 5.1/5.2 CC-BY-4.0 attribution statements (G3 §2), exclusion list |
| `srd-catalog.coverage.json` | static build coverage: premium exclusion (LC-1), empty-license data gaps (LC-2), pack-level runtime exclusions (§4.4), era split |

**Runtime support coverage is not a file.** It is computed per load by
`src/catalog/coverage.ts` (pure function over the runtime catalog + the
interpreter registry) and rendered in the sheet; it is never persisted.

### 4.2 Bundle strategy

- `main.js` inlines `srd-catalog.runtime.json` via esbuild JSON import
  (one static import; no dynamic import or code-split chunks — the pinned
  `obsidian.d.ts` and developer docs describe no mechanism for a plugin to
  load additional JS files, so the bundle must be self-contained).
- `srd-catalog.full.json` is **not** bundled; it is the canonical audit
  artifact for provenance and for future tasks that need non-runtime packs.
- **Size gate (measured, evidence-based).** The runtime pack set is
  **13 packs / 2,989 records / ≈ 10.4 MiB raw apparent size
  (10,891,033 bytes; ≈ 17 MB disk-block usage)**, measured 2026-09-03 at the
  pinned checkout. If the production `main.js` exceeds **25 MB**, or
  startup profiling on a reference device exceeds **3 s** of main-thread cost
  attributable to the plugin, the S3 task stops and re-decides with the user
  among: (a) shrink the runtime pack set to the V1 acceptance slice, (b) seek
  official guidance on plugin data files, (c) set `isDesktopOnly: true` with
  evidence. No silent fallback.

### 4.3 Why not bundle the full corpus

The full 4,578-record corpus is ≈ 60 MB raw; inlining it into `main.js` would
violate the G2 load-time obligation (keep `onload`/load inexpensive) on every
app launch, on desktop and mobile. The non-runtime packs have **no consumer**
in the approved baseline (monster/creature, table, trade-goods, and hero
content are out of scope per the project scope section and the G1 contract).
Their exclusion from the bundle is deterministic, coverage-reported, and
reversible (§4.4); the full corpus remains the canonical retained artifact.

### 4.4 Runtime pack set (deterministic selection rule)

A record is in the runtime catalog iff its pack is in:

```
classes, classes24, subclasses, classfeatures,   # classes + features, both eras
races, origins24, backgrounds,                    # origins + backgrounds, both eras
feats24, items, equipment24,                      # feats + equipment, both eras
spells, spells24,                                 # spells, both eras
effects                                           # ActiveEffect templates referenced by records
```

(13 packs; 2,989 records — per-pack counts in G3 §3.)
Excluded packs: `heroes, monsters, tradegoods, monsterfeatures,
monsterfeatures24, actors24, tables, tables24, rules, content24` — each with a
coverage entry stating the reason ("no baseline consumer").

**Extension rule:** only a task that implements a feature consuming an
excluded pack may extend the set; C6 (summon/transform, plan DAG) is the first
such task. Any extension must be deterministic (pack list in the generator),
regenerate both catalog artifacts, and update coverage.

## 5. Catalog / character / derived-state boundaries

```text
srd-catalog.runtime.json  (read-only, bundled, immutable)
        ↓ CatalogAdapter (validate, index, diagnostics)
SrdCatalog (in-memory: records, byPath, byUuid)
        ↓ pure interpreters (formula, effect, advancement, rules)
CharacterState (the ONLY persisted player data — one vault file per character)
        ↓ deriveCharacter(state, catalog)   (pure, at load and after each mutation)
DerivedCharacter (in-memory only; recomputed; never written)
        ↓
Obsidian UI
```

- **Catalog:** bundled, version-locked to the Foundry SHA; never written by
  the plugin at runtime.
- **Character state:** player choices + mutable gameplay state only (§6).
  Granted features are **recomputed** from catalog + choices at load — never
  copied into the file (AGENTS core rule: do not copy complete source
  definitions into each saved character).
- **Derived character:** AC, saves, skills, HP max, resources, slots,
  prepared-cap, activity availability, applied effects, and all diagnostics.
  Recomputed on every load and after every state mutation; memory-only.

## 6. Character file format, location, and atomic updates

### 6.1 Location and naming

- Folder: `Characters/` in the vault root (default; configurable via
  settings). Each character is one JSON file: `Characters/<name>.json`.
- `<name>` sanitization (deterministic): replace `/ \ : * ? " < > |` and
  control characters with `-`; trim leading/trailing spaces and dots; collapse
  consecutive `-`; truncate to 120 characters at the last non-separator
  boundary; if empty → `character-<id-prefix>` (first 8 hex of the id).
- Collision with an existing file of a **different** `id`: append `-2`,
  `-3`, … until free. Rename uses `Vault.rename` with the same algorithm and a
  pre-check for target existence.

### 6.2 Schema (version 1)

```jsonc
{
  "version": 1,
  "id": "<uuid v4 — stable character identity>",
  "name": "display name (may differ from file name)",
  "ruleset": "2014" | "2024",          // all record refs resolve within this era
  "creation": {
    "origin":     { "recordId": "origins24/species/goliath" },
    "klass":      { "recordId": "classes24/fighter" },
    "subclass":   { "recordId": "classes24/fighter/class-features/champion" } | null,
    "background": { "recordId": "origins24/backgrounds/acolyte" },
    "abilities":  {
      "method": "pointBuy" | "manual",   // manual = user-set raw scores, no cost check [D-4]
      "raw": { "str": 15, "dex": 10, "con": 14, "int": 8, "wis": 12, "cha": 13 }
    },
    "equipment": {
      "selections": [ { "source": "classes24/fighter#startingEquipment/0", "chosen": ["items/weapon/longsword", "items/armor/chain-mail"] } ]
    }
  },
  "leveling": {
    "level": 1,                          // 1..20
    "choices": [
      { "level": 4, "advancement": { "recordId": "classes24/fighter", "entryIndex": 3 },
        "selection": "items/feat/…" }   // one entry per resolved choice/advancement
    ]
  },
  "state": {
    "hp": { "current": 12, "temp": 0 },
    "hitDice": { "spent": 0 },
    "deathSaves": { "successes": 0, "failures": 0, "stabilized": false },
    "resources": [ { "recordId": "classes24/fighter", "usesRef": "uses", "used": 0 } ],
    "slots": [ { "level": 0, "used": 0 } ],          // levels 0..9 as present
    "preparedSpells": [ "spells24/…" ],
    "inventory": [ { "instanceId": "<uuid>", "recordId": "items/weapon/longsword",
                     "quantity": 1, "equipped": false, "label": null } ],
    "effects": [ { "instanceId": "<uuid>", "recordId": "…", "activityIndex": 0,
                   "duration": { "value": 1, "units": "minute" }, "active": true } ]
  }
}
```

Rules:

- **No timestamps** anywhere in the file ([D-2]).
- The file stores **choices and mutable state only**. Anything derivable
  (granted features, HP max, mods, AC, resource maxes, slot tables) is
  recomputed; the schema above intentionally contains none of it.
- Single class only (baseline); `subclass` is null until chosen. Alignment is
  not tracked (out of scope).
- `leveling.choices` is the append-only log that makes level-up transactions
  reproducible (choice entries are re-resolved from the log, never re-prompted).
- Forward compatibility: unknown fields on load → `SCHEMA_UNKNOWN_FIELD`
  warning (preserved on rewrite); missing required field → `SCHEMA_INVALID`
  error, file left untouched, repair surfaced in the sheet.

### 6.3 Atomic update strategy

- **Create:** `Vault.create` with the full initial state (single write).
- **Update:** `Vault.process(path, file => …)` — read-modify-write in one
  atomic operation; the pure function receives the parsed state, returns the
  new state or throws; on throw the file is unchanged.
- **Level-up:** two-phase. `planLevel(AdvancementInput)` (pure; see
  INTERFACES §4) computes
  the complete new state including all advancement effects and validates it
  (schema + no error-severity diagnostics). Only then one `Vault.process`
  write. Any failure ⇒ **no write, file unchanged** ([D-6]); diagnostics
  returned to the UI. There is no partial state and no undo file; "rollback"
  is the invariant that the pre-transaction state was never mutated.
- **Rename/delete:** `Vault.rename` / `Vault.trash` (trash, not permanent
  delete, for user data).

## 7. Rules runtime and formula grammar

### 7.1 Grammar (bounded; the complete formula corpus, G4 §4)

```ebnf
formula   := term { ("+" | "-") term } ;
term      := factor { ("*" | "/") factor } ;
factor    := ("+" | "-") factor | primary ;
primary   := NUMBER
           | DICE
           | TOKEN { "." IDENT }
           | FUNC "(" formula { "," formula } ")"
           | "(" formula ")" ;
DICE      := [INT] "d" INT ;            // d8 → 1d8; 2d6 → 2d6
FUNC      := "max" | "ceil" | "floor" ; // closed set observed in corpus
TOKEN     := "@" IDENT ;                // e.g. @abilities.wis.mod
NUMBER    := INT [ "." INT ] ;
```

- Implemented as a hand-written tokenizer + recursive-descent parser.
  **No `eval`, no `Function`, no regex-replacement evaluation** (AGENTS).
- **Dice are deterministic: `NdM` evaluates to N×M** (max roll). The plugin
  simulates no dice ([D-1]); the sheet displays the deterministic value and,
  where the rule text implies a roll, the UI presents the range (min–max) as
  static text. `dM` = `1dM`.
- Grouped parentheses occur in the corpus (e.g. the D-11 proof formula
  `(max(1,@abilities.cha.mod))`, G4 §9) and parse as `"(" formula ")"`.
- Rounding: values stay `number`; each consumer applies its rule (e.g. ability
  modifier `floor((x-10)/2)`) explicitly.

### 7.2 Token resolution

- Scope = `Map<string, number>` built by the derived-character pipeline from:
  character abilities/mods (`@abilities.*.mod`, `.dc`), proficiency
  (`@prof`, universal: `floor(level/4)+1`), class levels (`@classes.<c>.levels`),
  scale values (`@scale.*`, produced by the ScaleValue advancement interpreter,
  L3), hit-die facts (`@attributes.hd.*`, `@attributes.prof`,
  `@attributes.spell.dc`), item context (`@item.*`, `@mod` — bound by the
  activity interpreter to the activity's governing ability), skill values
  (`@skills.<s>.passive`), spell level (`@spells.pact.level`).
- All 58 observed tokens (G4 §4) are static and enumerable; the resolver is a
  closed lookup. Unknown token ⇒ `FORMULA_UNKNOWN_TOKEN` diagnostic, formula
  value `null`. Parse failure ⇒ `FORMULA_UNPARSEABLE`. **A failed formula
  never silently becomes 0** — the dependent derived value is `null` with a
  visible diagnostic.
- `@flags.*` (2 corpus occurrences, G4 §4) reference world/module flags with
  no catalog source ⇒ permanently unsupported in this architecture; C8 emits
  the `FORMULA_UNSUPPORTED_TOKEN` diagnostic.

## 8. Effect interpreter allowlist

Active Effects (1,319 embedded + 173 `effects`-pack templates, G4 §7) are
interpreted **only** through an allowlist of semantic families. The source
change shape is `{ key, value, priority, type }` with a **string** `type`
vocabulary — embedded changes (G4 §7): `add` 1,068 / `override` 506 /
`upgrade` 150 / `multiply` 38 / `downgrade` 13 / `subtract` 3 / empty 1;
the standalone pack adds 156 `add` / 4 `upgrade`. The runtime mirrors this
shape verbatim (`EffectData`, INTERFACES §3); there is **no** numeric mode
mapping. Each allowlisted (key-shape, type) family has exactly one dedicated
handler; the same Foundry effect structure with the same semantics always
routes to the same handler (exit criterion).

**Tier 1 (implemented in A9):**

| Family | Source shape | Semantics |
| --- | --- | --- |
| name append | `{key:"name", type:"add", value:"…"}` | append to the record's name |
| name override | `{key:"name", type:"override", value:"…{}…"}` | replace name; `{}` = original name |
| damage type add | `{key:"system.damage.base.types", type:"add", value:[…]}` | add types, dedupe |
| attack bonus add | `{key:"activities[<type>].attack.bonus", type:"add", value:n\|formula}` | add to that activity's attack bonus; formula values (all 5 runtime-set occurrences are formulas, incl. the D-11 proof formula `(max(1,@abilities.cha.mod))`, G4 §9) are evaluated by the caller's derived-character pipeline (§7) before `applyEffects` |
| trait value add | `{key:"system.traits.<id>.value", type:"add", value:n}` | add to trait value |
| roll mode | `{key:<roll-mode key>, type:"add", value:±1}` | advantage/disadvantage marker |

Roll-mode keys: `system.abilities.<a>.check.roll.mode`,
`system.abilities.<a>.save.roll.mode`, `system.attributes.init.roll.mode`.

**Family-scope note (G4 §7 traceability).** G4 §7 lists the *first verified*
families (a)–(e). This Tier-1 set differs in two source-verified ways:
`name`/`override` extends (a) (observed in `spells/1st-level/find-familiar.yml`
and `spells/2nd-level/magic-weapon.yml`, e.g. `'{}, +1'`), and (d)'s
`system.traits.<id>.value`/`override` — 0 occurrences in the runtime set;
2 corpus occurrences, both in excluded packs (`actors24/plant/treant.yml`,
`monsterfeatures24/actions/animate-trees.yml`) — is deferred to Tier 2 ⇒
visible `EFFECT_UNSUPPORTED` (C5) should a future pack-set extension (C6)
admit records carrying them.

Bracketed keys (`activities[attack]`) are resolved by a **key interpreter**
that parses the key into a structural path (segment list + bracket index
resolved against the activity's type), not by string matching.

**Tier 2 (deferred ⇒ diagnostics):** `upgrade` (150 embedded + 4 pack),
`multiply` (38), `downgrade` (13), `subtract` (3), and every other
(key-shape, type) combination ⇒ `EFFECT_UNSUPPORTED` diagnostic naming the
record, key, and type. Tier 2 becomes C5.

Application is pure: `applyEffects(target, resolvedEffects) →
{ patched, diagnostics }`, applied in caller-supplied order — the caller
resolves `state.effects` instances against the catalog and sorts by
(recordId, instanceId) (INTERFACES §3). The effect instance model (§6.2
`state.effects`) only tracks *which* activity/effect is active and for how
long — never a copy of the effect data.

## 9. Advancement transaction model

- Source: `system.advancement[]` on class/subclass/origin records; 824
  entries, 8 types, all direct (G4 §1).
- `planLevel(AdvancementInput)` (pure; signature in INTERFACES §4):
  1. Collect entries with `level == target` from the character's class,
     subclass (if chosen), and origin records, in source-list order;
  2. Run each entry through its dedicated interpreter (8 total — one per G4
     type, no name-based branching):
     `Size`, `HitPoints`, `ScaleValue`, `Trait`, `ItemGrant`, `ItemChoice`,
     `AbilityScoreImprovement`, `Subclass`;
  3. Choice-bearing entries (`ItemChoice`, `Subclass`, and
     `AbilityScoreImprovement` variants that require selection) resolve
     selection from `leveling.choices` (replay) or the UI (first time);
  4. Produce the full new `CharacterState` + diagnostics.
- Validation gate: schema-valid and zero error diagnostics ⇒ persist (§6.3);
  otherwise abort, file untouched, diagnostics rendered.
- Ordering among families within one level is fixed by L0 (documented
  deterministic order: scales before formulas that consume them,
  ability improvements before grants that read mods, subclass entries after
  class entries at the same level).

## 10. Uses / recovery / resources

- `uses{max, spent, recovery[]}` blocks: `max` is int, formula, or
  `@scale.*` identifier (G4 §3) — resolved through the formula pipeline.
  `recovery[].period` ∈ {dawn, lr, day, recharge, sr, dusk, initiative} and
  `type` ∈ {recoverAll, formula, loseAll, empty} — closed vocabularies,
  directly supported. `dusk` (2) and `initiative` (1) are parsed and
  diagnostic-only (C8) unless a baseline feature needs them.
- Mutable counters live in `state.resources` / `state.slots` (§6.2); maxes are
  derived. Short/long rest actions (explicit UI actions, baseline) apply the
  recovery entries whose period matches.
- Spell slots: derived from the class `spellcasting.progression` table
  (full/half/pact/none — G4 §6) for the character level; `preparation.mode:
  always` (22 spells) is treated as **always prepared and not slot-bound at
  cantrip level / per its level otherwise** — recorded here as the baseline
  interpretation, flagged for contract confirmation at A8. Pact slots (2
  records) use the warlock pact progression table; likewise flagged at A8.

## 11. Diagnostics model ([D-17], [D-18])

```ts
interface Diagnostic {
  code: string;            // stable, e.g. "EFFECT_UNSUPPORTED"
  severity: "error" | "warning";
  message: string;         // sentence case, user-visible
  source?: { pack: string; recordId: string; fieldPath: string };
  context?: Record<string, unknown>;
}
```

- Emitted by: catalog adapter, formula evaluator, effect interpreter,
  advancement interpreters, schema validator, coverage.
- `error` ⇒ the operation that produced it is blocked (no write, value null).
  `warning` ⇒ shown persistently on the sheet (recomputed, never persisted to
  the character file).
- Known code registry lives in `src/rules/diagnostics.ts`; tests assert codes,
  not message text.

## 12. UI approach

- **No UI framework.** Vanilla DOM + Obsidian helpers, per G2 §1.3. The
  repository uses no existing framework, so none is introduced.
- Views: `CharacterSheetView` (ItemView, type `dnd-character/sheet`),
  `CharacterCreatorView` (ItemView, type `dnd-character/creator`),
  `DetailsModal` (Modal). All leaves created via `Workspace.getLeaf`/
  `ItemView` registration with deferred-view support (`isDeferred` /
  `loadIfDeferred`); never `Workspace.activeLeaf` assumption.
- Settings: `PluginSettingTab` via `getSettingDefinitions()` (settings:
  character folder, ruleset default).
- Commands (no hotkeys): open sheet, open creator, rest (short/long),
  level up.
- Description text: allowlist sanitizer (neutralizes `{{…}}` roll tokens and
  unknown markdown per [D-12]) → 5-argument `MarkdownRenderer.render`.
   No `innerHTML`/`outerHTML`/`insertAdjacentHTML` anywhere in `src/`
   (G2 §1.3, rule G2-20 lint).
- Styling: scoped `styles.css` classes, Obsidian CSS variables, sentence-case
  visible text.

## 13. Mobile / desktop decision

- **`isDesktopOnly: false`, `minAppVersion: "1.13.0"`.**
- Evidence: the architecture uses only cross-platform APIs — `Plugin`
  lifecycle, `Vault` file APIs, `ItemView`/`Modal`/`Setting` DOM helpers,
  `MarkdownRenderer`, `crypto.randomUUID()`. No Node `fs`, no `requestUrl`,
  no `window` globals. The catalog is inlined (§4.2) precisely so no
  filesystem self-access is required, which is the mechanism with evidence in
  the pinned docs for mobile.
- Re-verification obligation: if any later task needs a desktop-only API, it
  must stop and re-decide the flag with evidence (AGENTS: claims must be
  evidence-based).

## 14. Module map and dependency direction

Matches `docs/implementation-plan.md` §4 target structure. Dependency arrows
point only downward; UI imports rules but never catalog internals:

```
src/main.ts                      → ui/, character/, catalog/ (wiring only)
src/ui/                          → character/, rules/ (no catalog types leak into DOM code beyond display models)
src/character/                   → catalog/, rules/
src/catalog/                     (adapter + generated/ + coverage; no rules, no ui)
src/rules/
  formulas/  (tokenizer, parser, evaluator, scope)
  effects/   (key interpreter, family handlers)
  advancements/ (8 interpreters + transaction)
  derived.ts (deriveCharacter)
  diagnostics.ts
scripts/foundry-catalog/         (build-time only; never imported by src/)
```

## 15. Task DAG materialization

The plan DAG now carries concrete L1–L8 (advancement families, ordered
simple→complex, with G4 fixtures) and C5–C8 (coverage-driven families from the
G4 gap inventory). See `docs/implementation-plan.md`, milestones L and C.

## 16. Exit-criterion demonstration

- **No proprietary mechanics schema:** the only persisted player data is
  choices + counters (§6.2); all mechanics data is the Foundry-shaped record
  (§2); the transformation register (§2.3) contains no mechanics
  normalization; TS interfaces mirror source keys.
- **Same structure + same semantics → same interpreter:** routing is by
  *structure*, not by entity name —

| Foundry structure | Interpreter (single, entity-agnostic) |
| --- | --- |
| `system.advancement` entry of type T | the T advancement interpreter (8 total) |
| formula string (any field) | the single formula evaluator (§7) |
| Active Effect of allowed (key-shape, type) | that family's handler (§8) |
| `uses{…}` block | the single resource resolver (§10) |
| activity of type `attack`/`save`/`check`/… | that activity's family handler |

  Nothing branches on class/spell/feat/item **names**; all branching is on
  source structure fields (key, value, type, priority, period, advancement
  type).
