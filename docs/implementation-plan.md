# Character Sheet plugin — SRD 5.2 implementation plan

## 1. Document role

This document defines **what to build**, **in what order**, and **what evidence closes each task or approval gate**.

Repository-wide operating rules are defined only in the root `AGENTS.md`, including:

- repository and filesystem boundaries;
- Git branch, commit, push, and `.gitignore` rules;
- official source authorities;
- architecture vocabulary and invariants;
- Obsidian engineering requirements;
- context limits and subagent use;
- testing, review, verification, and manual-refresh discipline.

Every parent agent and subagent must read `AGENTS.md` before using this plan. This plan does not override those rules.

Sections 2 and 3 define the provisional baseline used to draft task G1. After the G1 contract is approved, the contract controls product requirements and this plan must be kept consistent with it. After G5, the approved architecture document controls technical design.

Execute exactly one task ID at a time. Tasks marked **gate** require user approval before they can be committed, pushed, or followed by another task.

## 2. Product objective

Build an Obsidian Community Plugin that:

1. Bundles only freely redistributable D&D SRD content obtained from the public official `foundryvtt/dnd5e` repository.
2. Uses public structured mechanics metadata to support character creation, leveling, classes, subclasses, species, backgrounds, feats, spells, equipment, advancements, activities, limited uses, consumption, recovery, spellcasting, formulas, and a bounded set of active effects.
3. Persists character choices and mutable gameplay state in the Obsidian vault.
4. Opens each character in an Obsidian custom Character Sheet view.
5. Demonstrates through automated and manual acceptance tests that an SRD-only character can be created, leveled, equipped, persisted, and operated with useful automation.
6. Remains offline at runtime.

## 3. Required baseline

The completed baseline must support:

- discovering all character-facing free SRD definitions in the pinned public source;
- selecting and creating an SRD character;
- applying supported species, background, class, subclass, feat, spell, and equipment advancements;
- leveling one level at a time through the supported SRD range;
- storing character choices and mutable state in versioned character files;
- validating and deliberately migrating supported character-file versions;
- rendering a Character Sheet custom view;
- changing HP and temporary HP;
- spending and recovering supported limited-use resources;
- Short Rest and Long Rest processing;
- spell-slot and Pact Magic spending and recovery where represented by supported metadata or universal SRD rules;
- equipping and unequipping armor, shields, and weapons;
- recalculating Armor Class and supported attacks;
- applying a bounded, audited subset of activities, formulas, advancements, and active effects;
- opening a local modal or popover for bundled, safely rendered SRD descriptions;
- reporting unsupported source structures, invalid character state, and runtime failures through explicit diagnostics.

## 4. Target project structure and canonical documents

Task G0 must inspect the repository before adding this structure. If no established source convention exists, use the following responsibility map:

```text
src/
  main.ts
  plugin/
    commands.ts
    settings.ts
    lifecycle.ts
  catalog/
    foundry-types.ts
    catalog-schema.ts
    catalog-loader.ts
    catalog-index.ts
    generated/
      srd-catalog.generated.json
      srd-catalog.provenance.json
  character/
    character-schema.ts
    character-migrations.ts
    character-repository.ts
    character-service.ts
    derived-character.ts
  rules/
    formulas/
    advancement/
    resources/
    rests/
    equipment/
    spellcasting/
    activities/
    effects/
  ui/
    creator/
    sheet/
    details/
  diagnostics/

scripts/
  foundry-catalog/
    source-lock.json
    inventory.ts
    extract.ts
    validate.ts
    generate.ts

tests/
  fixtures/
  catalog/
  character/
  rules/
  ui/

docs/
  contracts/
  architecture/
  audits/
  handoffs/
```

The dedicated development vault is fixed at:

```text
character-plugin-vault/
```

The installed development plugin location is:

```text
character-plugin-vault/.obsidian/plugins/<plugin-id>/
```

The approved architecture task must finalize `<plugin-id>` and the copy or symlink workflow.

Maintain these canonical project-memory files as their creating tasks complete:

```text
docs/audits/repository-baseline.md
docs/contracts/character-sheet-srd-baseline.md
docs/architecture/character-sheet-architecture.md
docs/audits/obsidian-compliance.md
docs/audits/foundry-srd-inventory.md
docs/audits/foundry-mechanics-capability-matrix.md
docs/handoffs/CURRENT.md
docs/handoffs/INTERFACES.md
```

`CURRENT.md` records the current milestone/task, last completed commit, exact verification commands, blockers, and next eligible task IDs. `INTERFACES.md` records stable cross-task signatures and schemas.

## 5. Milestones and atomic task map

The milestone order is mandatory. Tasks marked **gate** require user review before proceeding.

---

## Milestone G — Governance, evidence, and exact plan

### G0 — Repository reconnaissance

**Purpose:** establish the exact starting state of this new repository without editing production code.

**Actions:**

- read the root `AGENTS.md`, this plan, and any more-specific instruction files within the repository;
- confirm the repository root is the current working directory;
- inspect the `main` and `dev` branches, current branch, status, recent commits, remotes, project tree, README, and `.gitignore`;
- inspect available package scripts, tests, build configuration, and source/data code without assuming they already exist;
- confirm the dedicated development vault at `character-plugin-vault/` and its `.obsidian/` directory;
- confirm or add the required `.gitignore` coverage for the development vault and discovered generated/tooling files;
- write `docs/audits/repository-baseline.md`;
- create or update `docs/handoffs/CURRENT.md` with the exact starting state and next eligible task.

**Exit:** exact repository map, exact commands, risks, and no production-code changes.

### G1 — New SRD Character Sheet contract **gate**

**Purpose:** create the concise authoritative product contract for the SRD Character Sheet baseline.

**Deliverable:**

```text
docs/contracts/character-sheet-srd-baseline.md
```

It must define goals, non-goals, content boundary, source pinning, character persistence, creation, leveling, automation scope, description behavior, diagnostics, licensing, testing, and milestone exit criteria.

**Exit:** user approves the written contract. Do not implement before approval.

### G2 — Official Obsidian compliance audit

**Purpose:** turn current official guidance into enforceable project checks.

**Deliverable:**

```text
docs/audits/obsidian-compliance.md
```

Map each applicable guideline to:

- requirement;
- official source URL/heading or API symbol;
- planned code/test enforcement;
- release-time check.

**Exit:** no unresolved policy question blocks the baseline architecture.

### G3 — Free Foundry source, license, and pack inventory

**Purpose:** identify exactly what public SRD data is available and legal to bundle.

**Deliverables:**

```text
docs/audits/foundry-srd-inventory.md
scripts/foundry-catalog/source-lock.json
```

Record repository URL, exact commit, relevant packs, source markers, licenses, excluded assets, premium-content boundary, and representative file paths.

**Exit:** reproducible free-SRD source boundary.

### G4 — Foundry mechanics capability matrix

**Purpose:** prove on paper which mechanics are present before writing runtime code.

Use parallel research subagents to inventory independently:

- advancement types;
- activity types;
- uses/recovery/consumption shapes;
- formula expressions and property references;
- equipment/armor/weapon structures;
- spellcasting structures;
- Active Effect types and change keys;
- source references and embedded UUIDs.

**Deliverable:**

```text
docs/audits/foundry-mechanics-capability-matrix.md
```

For each semantic family, list occurrence counts, representative files, proposed support level, and known gaps.

**Exit:** every later runtime task points to inventoried real examples.

### G5 — Architecture and file/interface map **gate**

**Purpose:** lock the bounded architecture before implementation.

**Deliverables:**

```text
docs/architecture/character-sheet-architecture.md
docs/handoffs/INTERFACES.md
```

Update the milestone/task DAG in this `docs/implementation-plan.md` using the approved inventories and architecture. Do not create a second roadmap document.

Decide and document:

- generated catalog format and bundle strategy;
- character file format/location and atomic update strategy;
- catalog/character/derived-state boundaries;
- UI approach, preferring no new UI framework unless the existing repository already uses one or a measured spike justifies it;
- safe formula grammar;
- effect allowlisting;
- advancement transaction model;
- diagnostics model;
- mobile/desktop decision;
- exact atomic task DAG derived from the inventories.

**Exit:** user approves architecture and roadmap.

---

## Milestone S — Obsidian shell and one trusted source record

### S0 — Build, typecheck, lint, and unit-test baseline

Normalize or add the smallest toolchain needed to run deterministic tests and production builds. Preserve the existing package manager. Remove sample-plugin placeholder code only within scope.

**Exit:** one command each for focused tests, full tests, typecheck, lint, development build, and production build; all current baseline checks pass.

### S1 — Plugin lifecycle and settings shell

Implement a minimal plugin class, settings persistence, registered commands, and safe lifecycle cleanup using verified Obsidian APIs.

Settings should include only current baseline needs, such as character-folder location. Do not add source-provider settings; the SRD catalog is bundled.

**Exit:** plugin loads/unloads without errors or duplicate registrations, and settings persist across reload.

### S2 — Development vault and runtime-refresh workflow

Create repository scripts/documentation for installing or symlinking the build into `character-plugin-vault/.obsidian/plugins/<plugin-id>/`. Add the exact runtime-refresh checklist required by `AGENTS.md`.

**Exit:** another developer can build, install into the repository-local development vault, load, refresh, unload, and reload the plugin using documented exact commands.

### S3 — Catalog generator skeleton and revision lock

Implement build-time source-root validation, exact Foundry revision validation, deterministic output scaffolding, and a tiny fixture extraction.

**Exit:** correct revision succeeds; wrong revision fails with expected/actual commit; repeated generation is byte-identical.

### S4 — One representative mechanics record

Import one public SRD record that demonstrates structured metadata, preferably Paladin Channel Divinity or Sacred Weapon if present at the pinned revision.

Do not yet implement its full mechanics. Preserve enough fields to prove the source adapter and provenance.

**Exit:** unit test loads the generated record by stable identity and verifies source path, license/provenance, and selected structured fields.

### S5 — Custom Character Sheet view and local details modal

Implement:

- one registered `ItemView`-based custom view;
- a command that opens/reveals the view;
- a read-only rendering of the representative source record;
- a local details modal using the sanitized bundled description.

**Exit:** manual test shows the view and details without runtime network access, unsafe HTML, stale view references, or unload errors.

---

## Milestone V1 — First complete SRD character vertical slice

This milestone proves the full data path with a deliberately small acceptance character before expanding catalog coverage.

### V1.0 — Character schema and validation

Define versioned character state types, runtime validation, and migration scaffolding. Separate catalog references, player choices, mutable state, and derived values.

**Exit:** valid fixture parses; invalid and future-version fixtures return explicit diagnostics without mutation.

### V1.1 — Character repository

Implement create, list, read, update, and rename behavior using Obsidian Vault APIs and normalized visible vault paths. Use plugin data only for settings, not as the sole character store.

**Exit:** repository tests cover collisions, missing folders, malformed JSON, atomic update, and no silent overwrite.

### V1.2 — Minimal acceptance catalog

Import only the public SRD records required for one complete level-1 acceptance character plus direct dependencies:

- one class;
- one species;
- one background;
- required features/feats;
- required starting equipment;
- required spells if the class/feat grants them.

Choose records after source inventory; do not assume an entity exists without evidence.

**Exit:** every reference resolves; coverage report explains included dependencies.

### V1.3 — Core character-creation transaction

Implement a pure transaction that:

- starts an empty character draft;
- selects catalog definitions;
- records choices;
- applies only supported advancements;
- validates completeness;
- produces character state without UI dependencies.

**Exit:** golden test builds the acceptance level-1 character from selections and matches expected grants/choices.

### V1.4 — Ability scores and universal base calculations

Implement manual ability entry plus one bounded official method chosen in the contract. Add ability modifiers, total level, and proficiency bonus as pure calculations.

**Exit:** boundary tests for low/high scores and relevant levels.

### V1.5 — Creator UI for the acceptance character

Implement the smallest multi-step modal/wizard that drives the pure creation transaction. UI components must not contain rules logic.

**Exit:** manual test creates and saves the acceptance character; cancellation writes nothing.

### V1.6 — Read-only character sheet summary

Render identity, level, class, species, background, abilities, proficiency bonus, features, and inventory from the saved character and derived model.

**Exit:** closing/reopening Obsidian and reopening the character reproduces the same sheet.

---

## Milestone A — Automation proof

### A0 — Formula corpus and safe grammar

From the G4 inventory, define the smallest grammar needed by selected SRD automation fixtures. Include literals, approved property references, approved arithmetic, and only observed functions such as `min`/`max` when evidenced.

**Exit:** grammar specification and parser tests; unsupported syntax is explicit; no dynamic evaluation.

### A1 — Safe formula evaluator

Implement the parser/evaluator against a typed evaluation context. Property resolution must be allowlisted and missing properties must not silently become zero.

**Exit:** corpus fixtures pass; malicious and unsupported expressions fail safely.

### A2 — Derived skills, saves, and spellcasting numbers

Implement source-driven proficiencies/expertise plus universal calculations for saving throws, skills, passive values selected by the contract, spell save DC, and spell attack modifier.

**Exit:** golden derived-stat tests for at least two materially different characters.

### A3 — Equipment instances and equipped state

Add inventory instances and equip/unequip transactions. Preserve definition identity separately from instance state.

**Exit:** equipping one instance does not mutate its catalog definition or another instance.

### A4 — Armor Class interpreter

Inventory and implement the bounded armor/shield/Dexterity rules represented by free SRD equipment metadata and universal base rules. Do not branch on item names.

**Exit:** tests cover unarmored, light, medium, heavy, shield, Dexterity caps, and incompatible/invalid equipped states found in the source corpus.

### A5 — Uses, resources, and consumption

Implement limited-use state and supported activity consumption targets. Resource maximums are derived from supported source metadata/formulas; spent values belong to character state.

**Exit:** spending cannot exceed available uses; failed transactions are atomic.

### A6 — Rest recovery engine

Implement inventoried recovery periods and types one family at a time, including full recovery and fixed/formula recovery when present.

**Exit:** Channel Divinity-style partial Short Rest recovery and full Long Rest recovery pass if that fixture exists; unknown recovery types are reported.

### A7 — Spellcasting slots and preparation

Implement supported slot progression, spent-slot state, ordinary Long Rest recovery, Pact Magic recovery, and source-driven preparation/known-spell limits represented in the free catalog.

**Exit:** at least one ordinary caster and one Pact Magic fixture pass creation, spending, and rest tests.

### A8 — Activity execution shell

Implement a transaction shell for supported activity activation, validation, consumption, duration, and effect attachment. It must remain independent of the Obsidian UI.

**Exit:** a utility/activity fixture executes atomically and returns a structured result/diagnostic.

### A9 — Active Effect allowlist, first semantic family

From the G4 key inventory, implement exactly one effect-change semantic family. Do not add a generic arbitrary path setter.

**Exit:** supported change applies; unknown path/type remains visible and does not mutate state.

### A10 — Sacred Weapon end-to-end proof

If Sacred Weapon exists in the pinned free source, implement the minimum additional activity/effect semantics required to:

- consume the linked Channel Divinity resource;
- select a valid equipped melee weapon;
- apply the source-defined duration;
- add the source formula’s minimum Charisma-based attack bonus;
- expose supported damage-type behavior;
- end/remove the effect cleanly.

If the exact feature is absent, select an equivalently demanding free SRD fixture documented in G4.

**Exit:** one golden scenario demonstrates source record → character action → resource consumption → derived weapon update → effect expiry/removal.

### A11 — HP, temporary HP, Hit Dice, and Death Saves

Implement bounded mutable sheet state and universal rules selected in the contract. Keep dice rolling optional/manual unless separately approved.

**Exit:** boundary and persistence tests; rests do not modify values beyond explicitly supported rules.

### A12 — Automation UI

Connect the pure automation services to the sheet:

- use resource;
- cast/spend slot;
- equip/unequip;
- activate/end supported effects;
- Short Rest;
- Long Rest;
- edit HP/temp HP.

**Exit:** UI only dispatches transactions and rerenders from persisted state; no duplicated rules logic.

### A13 — Automation proof gate **gate**

Produce:

```text
docs/audits/srd-automation-proof.md
```

Include automated evidence and manual screenshots/results for:

- equipment and AC;
- resource spending;
- Short Rest and Long Rest;
- ordinary spell slots;
- Pact Magic;
- one metadata-driven active effect;
- persistence across reload.

**Exit:** user confirms the automation foundation is viable before broad SRD expansion.

---

## Milestone L — Leveling proof

### L0 — Advancement transaction inventory and ordering

Define how level-up transactions order grants, choices, scaling, subclass selection, and spellcasting progression based on actual free Foundry advancement records.

**Exit:** documented deterministic ordering and rollback behavior.

### L1 onward — One advancement semantic family per task

Generate one atomic task for each required advancement type discovered in G4. Typical categories may include item grants, trait/proficiency grants, choices, ability-score improvements, scale values, subclass grants, and spell-related advancements, but use exact source types rather than this list as authority.

Every generated task must:

- use real fixtures;
- define typed input/output;
- add failing tests;
- implement only that family;
- update coverage counts;
- preserve transaction rollback.

### L-final — Level-up UI and golden progression **gate**

Add one-level-at-a-time leveling UI and prove several representative characters across levels that trigger different advancement types.

At minimum, include:

- a level that grants a subclass;
- a level that changes resource scaling;
- a level that changes spellcasting slots/preparation;
- a level with an ability/feat choice.

**Exit:** user approves creation + leveling viability.

---

## Milestone C — Expand to all free character-facing SRD content

Expansion remains data-driven and is split by content family.

### C0 — Classes, subclasses, and class features

Import all free character-facing class records and direct dependencies. Do not implement new semantics in this task; unsupported structures appear in coverage output.

### C1 — Species/origins and backgrounds

Import all free character-facing species/race/origin/background records and dependencies.

### C2 — Feats and general features

Import free feats and required feature records.

### C3 — Spells

Import free player-facing spells and spell-list/reference metadata needed by character creation and the sheet.

### C4 — Equipment

Import free player-facing weapons, armor, shields, tools, packs, consumables, and other equipment required by character creation.

### C5 onward — Coverage-driven semantic tasks

After each content import, regenerate the capability report. Create one atomic task per newly encountered baseline-critical semantic family. Never hide unsupported records simply to make coverage appear complete.

### C-final — Full SRD creator coverage **gate**

Prove that every free SRD class can enter the creator and either:

- complete a valid character creation with all required choices; or
- produce a precise, enumerated blocker tied to a remaining task.

The gate passes only when baseline-critical blockers are resolved and the user approves the coverage report.

---

## Milestone U — Complete Character Sheet user experience

### U0 — Sheet composition and navigation

Create focused sheet sections for summary, abilities/saves/skills, combat, actions/features, spells, inventory/equipment, and resources/state. Keep each section in its own component/module.

### U1 — Character selection and multiple sheets

Implement direct character selection, open/reveal behavior, rename/delete with confirmation/trash behavior as allowed by official APIs, and safe handling of missing character files.

### U2 — Description details modal/popover

Make entity names actionable. Open bundled SRD descriptions locally through the sanitized renderer. Support keyboard access and clear close behavior.

### U3 — Diagnostics and unsupported mechanics UX

Show concise diagnostics for unresolved references, unsupported mechanics, stale catalog revisions, migration failures, and invalid user state. Never fail silently.

### U4 — Accessibility, theme, and responsive audit

Test keyboard navigation, focus handling, labels, contrast through Obsidian variables, narrow panes, light/dark themes, and mobile only if the manifest claims mobile support.

### U5 — Load-time and lifecycle audit

Measure production bundle size, plugin load behavior, catalog initialization timing, view reopen behavior, unload/reload cleanup, and large-vault path operations.

**Exit:** no expensive source parsing in `onload`; no duplicate resources; documented measurements.

---

## Milestone R — Community release readiness

### R0 — License and attribution package

Create/update:

```text
LICENSE
THIRD_PARTY_NOTICES.md
README.md
```

Document plugin license, SRD/Foundry provenance, exact source revision, excluded assets, runtime offline behavior, and any required attribution. Get legal review if the planned distribution goes beyond clearly licensed public SRD material.

### R1 — Manifest and Community Plugin compliance

Validate current official requirements for:

- unique plugin ID;
- name and description;
- `minAppVersion`;
- `isDesktopOnly`;
- funding metadata only if applicable;
- no placeholder/sample code;
- release assets;
- disclosures;
- repository layout.

### R2 — Full automated validation

Run catalog regeneration, determinism check, tests, typecheck, lint, production build, package inspection, and coverage reports from a clean dependency install.

### R3 — Manual acceptance matrix

In a dedicated test vault, execute exact documented scenarios for character creation, leveling, persistence, equipment/AC, resources, rests, spellcasting, effects, details modal, unload/reload, and error cases.

### R4 — Release dry run **gate**

Create a local release candidate and verify it contains only intended files and licensed content. Do not publish without explicit user approval.

---

## 6. Baseline acceptance scenarios

The exact fixtures must be chosen from records proven present in the pinned free Foundry source. Prefer the following when available because they test different mechanics:

1. **Paladin/Oath of Devotion scenario**
   - creation and subclass progression;
   - Channel Divinity uses;
   - partial Short Rest and full Long Rest recovery;
   - Sacred Weapon-like weapon effect;
   - armor/shield and attack calculation.
2. **Ordinary full/prepared caster scenario**
   - spell selection/preparation;
   - multiple spell levels;
   - slot spending;
   - Long Rest recovery;
   - spell save DC and attack modifier.
3. **Warlock/Pact Magic scenario**
   - Pact slot progression;
   - slot spending;
   - Short Rest recovery.
4. **Equipment-focused scenario**
   - armor categories;
   - shield;
   - Dexterity interaction;
   - equip/unequip recalculation.
5. **Leveling scenario**
   - subclass grant;
   - resource scale change;
   - spell progression;
   - ability/feat choice.

Do not encode expected results from memory. Cite the pinned Foundry records and official SRD rules used by each golden fixture.

## 7. Required diagnostics

At minimum, design typed diagnostics for:

- wrong Foundry source revision;
- excluded/non-SRD record;
- unresolved source reference;
- unsupported advancement type;
- unsupported activity type;
- unsupported consumption target;
- unsupported recovery type/period;
- unsupported formula syntax/reference;
- unsupported Active Effect change key/type;
- invalid character schema/version;
- stale catalog revision;
- invalid equipment state;
- insufficient resource/slot;
- invalid or incomplete creator choice;
- vault file collision/read/write failure.

Diagnostics must include source identity and enough context to create a bounded follow-up task.

## 8. Task completion report template

Every task ends with this exact structure:

```markdown
# Task report — <task ID>: <title>

## Status
Complete | Blocked | Split required

## Instructions read
- <AGENTS.md paths>

## Official evidence consulted
- <Obsidian URL + heading/API symbol>
- <Foundry commit + file paths>

## Scope delivered
- <brief bullets>

## Files changed
- `<path>` — <reason>

## Interfaces
- Consumed: <exact names/signatures>
- Produced/changed: <exact names/signatures>

## Tests or evidence established first
- Implementation task: <test path, behavior, and initial expected failure>
- Research/documentation task: <evidence or review method, or not applicable>

## Verification
- `<exact command>` — PASS/FAIL, important output

## Manual runtime refresh
Not required | Required

If required, include the complete verified runtime-refresh checklist and exact repository commands.

## Review
- Requirements reviewer: PASS or findings
- Code-quality reviewer: PASS or findings
- Findings resolved: <summary>

## Coverage/diagnostics impact
- <supported/unsupported counts or no change>

## Git state
- Branch: `<branch>`
- Commit: `<sha or not committed>`
- Remaining unrelated changes: <list>

## Risks or blockers
- None | <exact issue>

## Next eligible task
- `<task ID>`
```

## 9. Initial task

Begin with:

```text
Execute task G0 only. Stop after the task report.
```

Do not begin G1 until G0 has been reviewed and explicitly approved to advance.
