# Stable Interfaces (task G5)

Authoritative for module boundaries. Implementations must match these
signatures; changing one is a handoff event (update this file in the same
task). Types mirror the Foundry source structure (AGENTS source-structure
preservation) — they describe a supported subset, never a replacement format.

All modules are pure unless marked. No module imports `obsidian` except
`src/main.ts`, `src/plugin/settings-tab.ts`, `src/ui/*`, and
`src/character/repository.ts`.

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
// S3 emits the 2-record fixture set only; full traversal (4,578 envelopes) is a later task
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

## 11. Plugin shell (`src/plugin/`, task S1)

```ts
// settings.ts — pure (no obsidian import)
// `Ruleset` matches §10 (defined here until a shared types module exists)
interface DndCharacterSettings {
  characterFolder: string;               // vault-relative path, no leading "/", no "\\" or "." / ".." segments
  defaultRuleset: Ruleset;               // ruleset for new characters
}
const DEFAULT_SETTINGS: DndCharacterSettings;   // { characterFolder: "Characters", defaultRuleset: "2024" }
function validateCharacterFolder(value: string): string | void;  // non-empty string => reject, shown inline under the setting
function loadSettings(raw: unknown): DndCharacterSettings;       // sanitized per-field merge over DEFAULT_SETTINGS (bad/missing fields fall back per field)

// commands.ts — pure (no obsidian import); main.ts maps specs to obsidian Command objects
const COMMAND_IDS: { openSheet: "open-sheet"; openCreator: "open-creator"; shortRest: "short-rest"; longRest: "long-rest"; levelUp: "level-up" };
interface PluginCommandSpec { id: string; name: string; callback: () => void; }
function createCommandSpecs(notify: (message: string) => void): PluginCommandSpec[];
// exactly the 5 specs above, stable order; S1 callbacks notify "<feature> is not available yet."
// S4+ replaces callbacks with real feature wiring (ids and names stay stable)

// settings-tab.ts — the only plugin module importing obsidian (extends PluginSettingTab)
class DndCharacterSettingTab extends PluginSettingTab {
  plugin: DndCharacterPlugin;            // base class declares no plugin field (G2-27 pattern)
  getSettingDefinitions(): SettingDefinitionItem[];
  // 2 items, stable order:
  //  [0] text  "Character folder"  key "characterFolder", placeholder+default "Characters", validate => validateCharacterFolder
  //  [1] dropdown "Default ruleset" key "defaultRuleset", default "2024", options: "2014" => "D&D 5e (2014 rules)", "2024" => "D&D 5e (2024 rules)"
}
// main.ts: onload() = settings <- loadSettings(await loadData()); addSettingTab; addCommand x5 (no hotkeys)
// persistence is obsidian data.json via loadData/saveData; no manual onunload (registration helpers clean up)
```

## 12. Development install (scripts/, task S2)

Build tooling — not part of the plugin bundle, not imported by `src/`.
Zero dependencies (Node >= 22, `node:` builtins only).

```js
// dev-install.mjs — Node ESM (.mjs: package.json has no "type": "module")
export function devInstall({ repoRoot, vaultRoot }): {
  pluginId: string;             // manifest.json id, validated
  pluginDir: string;            // <vaultRoot>/.obsidian/plugins/<pluginId>
  copiedFiles: string[];        // always ["main.js", "manifest.json", "styles.css"]
  dataJsonPreserved: boolean;   // true when an existing data.json was kept
}
// Reads manifest.json from repoRoot; throws unless id matches
// /^[a-z0-9]+(?:-[a-z0-9]+)*$/ (rejects traversal such as "../evil").
// Copies (overwrites) the three files from repoRoot into pluginDir; never
// deletes, so an existing data.json (plugin settings) survives re-runs.
// Throws with actionable messages:
//   manifest.json missing      -> "manifest.json not found in <root>. Pass --repo-root pointing at the repository root."
//   manifest.json invalid JSON -> "manifest.json is not valid JSON: ..."
//   id missing/unsafe          -> 'manifest.json id <shown> is not a safe plugin id (expected lowercase letters, digits, and hyphens, e.g. "dnd-character").'
//   a built file missing       -> '<file> not found in <root>. Run "npm run build:dev" first.'

// CLI: node scripts/dev-install.mjs [--repo-root <dir>] [--vault <dir>]
//   Defaults: repoRoot = parent of scripts/; vault = <repoRoot>/character-plugin-vault
//   Unknown args or empty values -> error.
//   Success (stdout): 'Installed plugin "<id>" into <pluginDir>' /
//     'Copied: main.js, manifest.json, styles.css' /
//     'Preserved existing data.json (plugin settings kept).' or
//     'No existing data.json to preserve.'
//   Failure: 'dev-install: <message>' on stderr, exit code 1.
// npm script: "dev:install": "node scripts/dev-install.mjs"
// Workflow (docs/dev-workflow.md): npm run build:dev && npm run dev:install
```
