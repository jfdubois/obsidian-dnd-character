# Stable Interfaces (task G5)

Authoritative for module boundaries. Implementations must match these
signatures; changing one is a handoff event (update this file in the same
task). Types mirror the Foundry source structure (AGENTS source-structure
preservation) — they describe a supported subset, never a replacement format.

All modules are pure unless marked. No module imports `obsidian` except
`src/main.ts`, `src/ui/*`, and `src/character/repository.ts`.

## 1. Catalog (`src/catalog/`)

```ts
// types.ts — envelope over the Foundry-shaped record
interface CatalogEntry {
  sourcePath: string;              // stable record id, e.g. "classes24/paladin"
  pack: string;                    // "classes24"
  record: FoundryRecord;           // lossless JSON image of the source YAML doc
}
type FoundryRecord = { type?: string; uuid?: string; _id?: string; name?: string; system?: Record<string, unknown>; [k: string]: unknown };

// adapter.ts — load + validate + index (runs once, at plugin start, deferred)
interface SrdCatalog {
  entries: readonly CatalogEntry[];        // sorted by sourcePath
  byPath: ReadonlyMap<string, CatalogEntry>;
  byUuid: ReadonlyMap<string, string>;     // uuid -> sourcePath
  provenance: Provenance;
}
function loadCatalog(runtimeJson: unknown): SrdCatalog;  // throws CatalogError on structural failure

interface Provenance {
  foundrySha: string;
  packs: Record<string, { records: number; inRuntime: boolean }>;
  exclusions: { sourcePath: string; reason: string }[];
  attribution: string[];                   // preserved SRD 5.1 / 5.2 CC-BY-4.0 statements
}

// coverage.ts — pure, per-load; never persisted
interface CoverageReport {
  totalRecords: number;
  supported: Record<string, number>;       // family -> count interpreted
  unsupported: { code: string; count: number; examples: string[] };
}
function computeCoverage(catalog: SrdCatalog): CoverageReport;
```

## 2. Formulas (`src/rules/formulas/`)

```ts
type FormulaValue = number | null;        // null => failed, diagnostic emitted

interface FormulaScope { readonly tokens: ReadonlyMap<string, number>; }
function buildFormulaScope(derived: Partial<DerivedCharacter>, itemContext?: ItemContext): FormulaScope;

interface FormulaResult { value: FormulaValue; diagnostics: Diagnostic[]; }
function evaluateFormula(source: string, scope: FormulaScope): FormulaResult;
// value null + FORMULA_UNKNOWN_TOKEN / FORMULA_UNPARSEABLE on failure; never 0
// dice NdM => N*M (deterministic max); functions max|ceil|floor only
```

## 3. Effects (`src/rules/effects/`)

```ts
// source change shape mirrored verbatim (G4 §7) — string type, no numeric mode mapping
type EffectType = "add" | "override" | "upgrade" | "multiply" | "downgrade" | "subtract";
interface EffectData { key: string; value: unknown; type: EffectType; priority: number | null; }

interface EffectInstance { instanceId: string; recordId: string; activityIndex: number; duration: Duration; active: boolean; }
interface ResolvedEffect { instanceId: string; recordId: string; effect: EffectData; }
interface EffectTarget {
  name?: string;                                       // key "name"
  traits: Record<string, number>;                      // key system.traits.<id>.value
  damageTypes: string[];                               // key system.damage.base.types
  activities: { type: string; attackBonus: number }[]; // key activities[<type>].attack.bonus
  rollModes: {                                          // type "add", value ±1
    checks: Partial<Record<Ability, 1 | -1>>;          // system.abilities.<a>.check.roll.mode
    saves: Partial<Record<Ability, 1 | -1>>;           // system.abilities.<a>.save.roll.mode
    initiative: 1 | -1 | null;                         // system.attributes.init.roll.mode
  };
}
interface EffectOutcome { patched: EffectTarget; diagnostics: Diagnostic[]; }
function applyEffect(target: EffectTarget, resolved: ResolvedEffect): EffectOutcome;
function applyEffects(target: EffectTarget, resolved: readonly ResolvedEffect[]): EffectOutcome;
// allowlisted (key-shape, type) families only (A9); else EFFECT_UNSUPPORTED diagnostic
// caller resolves state.effects instances against the catalog and sorts by (recordId,
// instanceId); applyEffects applies in given order; this module is pure and catalog-free
```

## 4. Advancements (`src/rules/advancements/`)

```ts
type AdvancementType = "Size" | "HitPoints" | "ScaleValue" | "Trait"
  | "ItemGrant" | "ItemChoice" | "AbilityScoreImprovement" | "Subclass";

interface AdvancementInput {
  state: CharacterState;
  catalog: SrdCatalog;
  level: number;                       // target level
  selections?: { advancement: AdvancementRef; selection: string | string[] }[];  // one per unresolved choice entry
}
interface AdvancementRef { recordId: string; entryIndex: number; }
interface PlannedLevel {
  state: CharacterState | null;        // full new state; null on failure (error diagnostics set)
  diagnostics: Diagnostic[];
  summary: { granted: string[]; choicesNeeded: { ref: AdvancementRef; options: { recordId: string; name: string }[] }[] };
}
function planLevel(input: AdvancementInput): PlannedLevel;  // pure
// persist only when planLevel succeeds with zero error diagnostics (repo.applyPlannedLevel)
```

## 5. Character state and repository (`src/character/`)

```ts
interface CharacterState {            // persisted file body; version 1
  version: 1;
  id: string;                          // uuid v4
  name: string;
  ruleset: "2014" | "2024";
  creation: CreationState;             // origin/klass/subclass/background/abilities/equipment selections
  leveling: { level: number; choices: { level: number; advancement: AdvancementRef; selection: string | string[] }[] };
  state: MutableState;                 // hp, hitDice, deathSaves, resources, slots, preparedSpells, inventory, effects
}
type CharacterStateInput = Omit<CharacterState, "version">;

// repository.ts — the only module that touches obsidian.Vault
interface CharacterRepository {
  list(): Promise<{ path: string; id: string; name: string }[]>;
  load(path: string): Promise<{ state: CharacterState; diagnostics: Diagnostic[] }>;
  create(name: string, state: CharacterStateInput): Promise<string>;          // returns path
  update(path: string, transform: (s: CharacterState) => CharacterState): Promise<void>; // atomic Vault.process
  applyPlannedLevel(path: string, planned: PlannedLevel): Promise<void>;      // no-op + diagnostics on invalid plan
  rename(path: string, newName: string): Promise<string>;
  remove(path: string): Promise<void>;                                        // Vault.trash
}
function sanitizeFileName(name: string, id: string): string;
```

## 6. Derived character (`src/rules/derived.ts`)

```ts
interface DerivedCharacter {
  abilities: { raw: Record<Ability, number>; mods: Record<Ability, number>; dc: number };
  proficiency: number;
  saves: Record<string, number>;
  skills: Record<string, number>;
  hp: { max: number; current: number; temp: number };
  ac: number; initiative: number; speed: number;
  hitDie: { faces: number; max: number };
  resources: { recordId: string; max: number; used: number; recovery: Recovery[] }[];
  slots: { level: number; max: number; used: number }[];
  prepared: { mode: "prepared" | "always" | "none"; cap: number | null };
  scales: ReadonlyMap<string, number>;      // @scale.* resolution source
  activityAvailability: { activity: unknown; ready: boolean; reason?: string }[];
  effectsApplied: EffectTarget;
  diagnostics: Diagnostic[];
}
function deriveCharacter(state: CharacterState, catalog: SrdCatalog): DerivedCharacter;  // pure
```

## 7. Diagnostics (`src/rules/diagnostics.ts`)

```ts
interface Diagnostic {
  code: string;                          // stable registry: SCHEMA_*, FORMULA_*, EFFECT_*, REF_*, COVERAGE_*
  severity: "error" | "warning";
  message: string;                       // sentence case
  source?: { pack: string; recordId: string; fieldPath: string };
  context?: Record<string, unknown>;
}
```

## 8. UI (`src/ui/`)

```ts
const VIEW_TYPE_SHEET = "dnd-character/sheet";
const VIEW_TYPE_CREATOR = "dnd-character/creator";
class CharacterSheetView extends ItemView { /* renders DerivedCharacter + CoverageReport; emits intents */ }
class CharacterCreatorView extends ItemView { /* creation wizard; emits CreateIntent */ }
class DetailsModal extends Modal { /* single record detail, sanitized description */ }
// intents are data objects consumed by main.ts wiring (ui never writes files)
interface CreateIntent { name: string; ruleset: Ruleset; creation: CreationStateInput; }
```

## 9. Build-time (`scripts/foundry-catalog/`)

```ts
// generate.mjs — entry; reads pinned checkout path from source-lock.json
generate(): {
  "src/catalog/generated/srd-catalog.full.json",      // 4,578 envelopes, sorted
  "src/catalog/generated/srd-catalog.runtime.json",   // runtime pack set, sorted
  "src/catalog/generated/srd-catalog.provenance.json",
  "src/catalog/generated/srd-catalog.coverage.json",
};
// deterministic: same checkout + same lock => byte-identical artifacts; no timestamps
```

## 10. Shared types

```ts
type Ruleset = "2014" | "2024";
type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

interface Duration { value: number; units: string; }   // units = source unit vocabulary, verbatim

class CatalogError extends Error {
  constructor(readonly code: string, message: string, readonly sourcePath?: string);
}

interface ItemContext { recordId: string; item: FoundryRecord; }  // bound by the activity/equipment interpreter for @item.* / @mod

interface Recovery {
  period: "dawn" | "lr" | "day" | "recharge" | "sr" | "dusk" | "initiative";
  type: "recoverAll" | "formula" | "loseAll" | "empty";
  formula?: string;
}

interface CreationState {
  origin: { recordId: string };
  klass: { recordId: string };
  subclass: { recordId: string } | null;
  background: { recordId: string };
  abilities: { method: "pointBuy" | "manual"; raw: Record<Ability, number> };
  equipment: { selections: { source: string; chosen: string[] }[] };
}
type CreationStateInput = CreationState;   // creator output; the repository wraps it into CharacterState

interface MutableState {
  hp: { current: number; temp: number };
  hitDice: { spent: number };
  deathSaves: { successes: number; failures: number; stabilized: boolean };
  resources: { recordId: string; usesRef: string; used: number }[];
  slots: { level: number; used: number }[];
  preparedSpells: string[];
  inventory: { instanceId: string; recordId: string; quantity: number; equipped: boolean; label: string | null }[];
  effects: EffectInstance[];
}
```
