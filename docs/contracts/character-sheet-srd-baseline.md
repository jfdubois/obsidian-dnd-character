# Character Sheet plugin — SRD Character Sheet product contract

- Task: G1 (**gate** — approved)
- Date: 2026-09-02
- Status: **APPROVED** (2026-09-02, explicit user approval). This contract is the source of truth for product requirements and acceptance boundaries (see `AGENTS.md`, Instruction authority).
- Evidence base: `AGENTS.md`; `docs/implementation-plan.md` (§2 product objective, §3 required baseline, §6 acceptance scenarios, §7 required diagnostics); `docs/audits/repository-baseline.md` (G0); `docs/handoffs/CURRENT.md` (G0); `foundryvtt/dnd5e` `README.md` and `LICENSE.txt` on branch `6.0.x` (fetched 2026-09-02 — provisional; the exact pinned revision and its license files are verified in G3).

## How to read this contract

- "Must" is a hard requirement of the baseline; "must not" is a prohibition; "should" is a default that a later user-approved change may override.
- Product decisions made in this contract (not merely restated from the plan) are marked **[D-n]** so reviewers can inspect them.
- This contract fixes the product *what* and the acceptance boundary. Technical *how* (character file field layout, view types, catalog file organization, transaction internals, grammar details) is deferred to the G5 architecture, which must stay within this contract. The character file container format is JSON (plan V1.1); only its field layout is deferred.

## Decision index

| Marker | Decision (summary) |
| --- | --- |
| [D-1] | No dice simulation of any kind in the baseline |
| [D-2] | Catalog provenance contains no wall-clock timestamp (determinism) |
| [D-3] | Characters live in a user-visible vault folder, default `Characters/`, configurable |
| [D-4] | Point Buy is the single non-manual ability-score method |
| [D-5] | Supported leveling range is levels 1–20 |
| [D-6] | Level-up is atomic; an unsupported/invalid advancement aborts the whole level |
| [D-7] | HP editable to any value ≤ maximum; 0 HP = unconscious/death saves, below 0 = dying |
| [D-8] | Death saves track 0–3 successes and 0–3 failures; stabilization is a manual toggle |
| [D-9] | Rests are explicit user actions, never inferred |
| [D-10] | Long Rest requires the character alive (HP ≥ 1); HP is never auto-restored by a rest |
| [D-11] | Sacred Weapon (or the G4-documented equivalent) is the end-to-end automation proof |
| [D-12] | Inline roll tokens in SRD text render as inert plain text |
| [D-13] | SRD content is redistributed under CC-BY 4.0 with required attribution |
| [D-14] | Plugin code license finalized at R0; recommended default MIT |
| [D-15] | English content and UI only |
| [D-16] | Stable character `id` independent of the display name |
| [D-17] | Diagnostics are typed data: machine code, severity, source identity, task context |
| [D-18] | `error` blocks the operation; `warning` persists on the sheet |
| [D-19] | Catalog preserves Foundry record structure; build generates only indexes, provenance, coverage, accelerators; runtime interprets Foundry families directly |

## 1. Goals

The product is an Obsidian Community Plugin that:

- **G-1. Content source.** Bundles, at build time, only freely redistributable D&D SRD content taken from the public official `foundryvtt/dnd5e` repository at a pinned revision, and never retrieves content at runtime.
- **G-2. Metadata-driven mechanics.** Drives character creation, leveling, and sheet automation from structured mechanics metadata in the catalog, not from hardcoded per-entity rules.
- **G-3. Vault persistence.** Persists each character's choices and mutable gameplay state in versioned character files inside the user's vault.
- **G-4. Character Sheet view.** Opens each character in a dedicated Obsidian custom Character Sheet view.
- **G-5. Proven acceptance.** Demonstrates, via automated and manual acceptance tests, that an SRD-only character can be created, leveled, equipped, persisted, and operated with useful automation (plan §2 item 5, §6).
- **G-6. Offline runtime.** Remains offline at runtime: no network access, no telemetry, no remote dependencies.

## 2. Non-goals

The baseline excludes (AGENTS.md scope, reaffirmed):

- paid, private, or non-SRD content;
- runtime web scraping or remote content retrieval;
- imports from proprietary character services;
- multiplayer or VTT combat automation;
- monster encounter management;
- a natural-language rules parser;
- unrestricted scripting or dynamic code execution;
- cloud synchronization or telemetry;
- emulation of the complete Foundry VTT runtime (the plugin must not require Foundry VTT, a Foundry installation, or a Foundry checkout at runtime).

Additional baseline non-goals:

- **NG-1. No dice simulation.** The baseline performs no random dice simulation of any kind. Every value that in play would come from dice (healing, ability generation, attack/damage) is entered manually or derived deterministically. [D-1]
- **NG-2. English only.** The baseline ships English content and UI only — the language of the SRD source content. [D-15]
- **NG-3. No other editions or system versions** than the 5e SRD material represented in the pinned source revision.
- **NG-4. No runtime editing of catalog/SRD content.** The bundled catalog is read-only for the plugin; changing SRD content means changing the catalog at build time from a new pinned revision.
- **NG-5. Mobile support is not claimed** unless G5/R1 produce evidence-based grounds for it (`isDesktopOnly` and `minAppVersion` are evidence-based claims, not defaults).

## 3. Content boundary

- **CB-1. Single source.** The only content source is the pinned revision of `foundryvtt/dnd5e` (§4). No other repository, website, or manual transcription.
- **CB-2. In scope — character-facing free SRD definitions:** classes, subclasses, class features, species, backgrounds, feats, spells, equipment (weapons, armor, shields, tools, packs, consumables), and the structured mechanics metadata that drives them: advancements, activities, uses, recovery, consumption, durations, effects, formulas, restrictions, scaling.
- **CB-3. Out of scope:** premium/non-free records; monster and encounter content; NPC-only content; images, icons, fonts, and other binary assets (the source README states assets are under various licenses; the baseline bundles none unless a separate license review explicitly approves one — none is approved in this baseline).
- **CB-4. Build-time vs runtime.** The build pipeline is: pinned Foundry SRD source records → curated/vendored Foundry-shaped content tree → validation + deterministic indexes → Character Sheet runtime. At build time the catalog generator produces the immutable SRD catalog from the pinned source checkout: a curated, vendored copy of the Foundry-shaped source records with their record structure preserved, plus deterministically generated indexes, provenance, coverage data, and minimal runtime accelerators. The plugin ships the generated catalog and at runtime only reads the bundled catalog and local vault files.
- **CB-5. Unsupported is visible, never hidden.** Source structures the runtime does not support must remain in the catalog and be reported through diagnostics (§10). Unsupported records must never be silently dropped to make coverage appear complete.
- **CB-6. Coverage reporting.** Every catalog generation produces a deterministic coverage report listing included records, excluded records with reason, and unsupported structures. The report is a required artifact of generation.
- **CB-7. Record structure preserved; no proprietary mechanics schema.** The catalog preserves the pinned source's record structure. The build step must not rewrite mechanics into a proprietary schema; generated artifacts are limited to indexes, provenance, coverage reports, and minimal runtime accelerators. The Character Sheet runtime interprets the verified Foundry semantic families directly (AS-0) and does not depend on an intermediate proprietary representation. This keeps future compatible private content addable via a later user-approved plan; the baseline itself remains SRD-only (§2). [D-19]

## 4. Source pinning and provenance

- **SP-1. Exact revision pin.** The exact commit SHA of `foundryvtt/dnd5e` is recorded in `scripts/foundry-catalog/source-lock.json`. A moving branch name is never the reproducibility anchor.
- **SP-2. Revision enforcement.** The catalog generator validates the source checkout against the lock; a mismatch fails generation reporting the expected and actual commit (S3).
- **SP-3. Determinism.** Two generations from the same locked revision produce byte-identical catalog and provenance output (verified by test).
- **SP-4. Provenance.** Every catalog record carries source identity: pack, source path, source name, and the locked revision. The catalog provenance file records: source URL, source SHA, catalog generator version, and the SRD license/attribution notices; it contains no wall-clock timestamp, so the determinism guarantee in SP-3 holds. [D-2]
- **SP-5. Runtime catalog check.** On load the plugin verifies the bundled catalog revision matches the revision the plugin build expects. A mismatch produces the stale-catalog-revision diagnostic (§10) and the affected functionality is visibly disabled — never silently degraded.
- **SP-6. Checkouts stay in-repo.** Any temporary source checkout, cache, or generated work directory used by the generator lives under the repository root and is git-ignored.
- **SP-7. License verification at the pin.** G3 re-verifies the license and provenance files at the pinned SHA and records the exact findings in `docs/audits/foundry-srd-inventory.md`; the contract's licensing section (§11) is grounded in that evidence, not only in the current-branch observation.

## 5. Character persistence

- **CP-1. One visible file per character.** Each character is stored as a single versioned JSON file in a user-visible vault folder. Default folder: `Characters/` at the vault root; the folder location is a plugin setting. [D-3] Character data is never stored in `Plugin.loadData()`/`saveData()` data; plugin data holds settings only.
- **CP-2. Identity and naming.** The character file contains a stable character `id` independent of the display name. The file name is derived from the character name, sanitized for path safety (exact sanitization rules are G5). Renaming a character renames the file atomically with collision checking; the `id` is unchanged. [D-16]
- **CP-3. Versioning and migration.** Every character file carries an explicit `schemaVersion` (the baseline starts at version 1). Loading rules: the current version loads directly; older supported versions are migrated deterministically before use; malformed files and future/unknown versions produce an explicit diagnostic and are left unmodified.
- **CP-4. Content split.** The character file stores (a) player choices (catalog references by stable identity plus selected options) and (b) mutable gameplay state (HP, temporary HP, hit dice, spent uses, spent slots, equipment instance state, active effects). It must not store full copies of catalog definitions or derived values; the derived character is recomputed from catalog + state on load.
- **CP-5. Atomic updates.** Every character file update is atomic: a failed or interrupted write either leaves the previous file intact or produces an explicit diagnostic — never a partially written file. The exact mechanism (e.g., `Vault.process()`) is G5.
- **CP-6. Multiple characters.** A vault may hold any number of characters. The user can select and open any character, rename with confirmation, and delete with confirmation (trash behavior where the official API permits), plus safe handling of missing files (U1).
- **CP-7. No silent overwrite.** Any operation that would replace an existing character file (creating a character whose name collides, migration conflicts) fails with a diagnostic.

## 6. Character creation

- **CC-1. Pure transaction, wizard UI.** Creation runs as a pure transaction (starts an empty draft, selects catalog definitions, records choices, applies only supported advancements, validates completeness, produces character state) with no UI dependencies (V1.3). The creator is the smallest multi-step modal/wizard that drives this transaction; UI components contain no rules logic.
- **CC-2. Level-1 selections.** The creator covers: species, class, background, ability scores, and every choice the source requires at level 1, including starting equipment choices and starting spells where granted.
- **CC-3. Ability scores.**
  - Manual entry is always available: integer per ability, validated range 3–20 before species adjustments; out-of-range input produces a diagnostic and is not saved.
  - The single non-manual method in the baseline is **Point Buy** with the SRD cost table (27 points; maximum 15 per ability before species adjustments); Standard Array and roll-based (4d6-drop-lowest) methods are out of the baseline (NG-1). [D-4]
  - Species adjustments apply after the base scores are chosen; final scores may exceed 20; modifiers are `floor((score − 10) / 2)` for any integer score.
- **CC-4. Supported advancements only.** Creation applies only supported advancements from catalog metadata (level-1 class/species/background grants). A required but unsupported advancement produces an explicit diagnostic and blocks completion; the V1 acceptance character must complete cleanly.
- **CC-5. Completeness and cancellation.** The transaction validates completeness before a character can be saved; incomplete selections produce per-step diagnostics. Cancelling writes nothing (V1.5).
- **CC-6. Golden test.** An automated golden test builds the acceptance level-1 character from fixed selections and matches expected grants and choices exactly (V1.3).

## 7. Leveling

- **LV-1. Range.** The supported SRD range is levels 1–20. [D-5]
- **LV-2. One level at a time.** The only way to increase level is a level-up transaction from N to N+1. No bulk leveling, no arbitrary level entry.
- **LV-3. Source-driven.** Grants, choices, scaling, subclass options, and spellcasting progression come from catalog advancements, applied by the advancement interpreter in a documented deterministic order (L0).
- **LV-4. Atomic level-up.** A level-up is one transaction. If any advancement for that level is unsupported or invalid, the transaction fails as a whole with a diagnostic and the character is unchanged; there is no partial level-up. [D-6]
- **LV-5. Choices.** When a level offers choices (subclass selection, feat selection, spell selection, ability-score improvement, etc.), the UI presents exactly the options the catalog defines, and an unchosen required choice blocks completion of the level-up (the character remains at level N with no half-applied state).
- **LV-6. Rollback.** Any mid-transaction failure restores the prior character state exactly (transaction rollback, L0).
- **LV-7. Representative proof (L-final gate).** Leveling is proven with real characters through levels that grant a subclass, change resource scaling, change spellcasting slots/preparation, and present an ability/feat choice.

## 8. Automation scope

**AS-0. Principle.** Automation is metadata-driven: no branching on class, spell, feat, or item names when the source metadata expresses the behavior (AGENTS.md). Universal rules are coded only where the SRD rule truly applies uniformly; entity-specific behavior comes from structured mechanics metadata.

### 8.1 Health (A11)

- **HP.** Mutable integer state, bounded above by the derived maximum HP (universal SRD rule: at level 1, the maximum of the class's hit die plus the Constitution modifier; at each level after, the maximum of the hit die plus the Constitution modifier). HP may be edited to any integer at or below maximum; reaching 0 HP is the unconscious/death-save state, and HP below 0 is the dying state. [D-7]
- **Temporary HP.** Non-negative integer. Universal SRD rules: temporary HP absorbs damage before HP; excess damage does not carry over; gaining new temporary HP replaces the existing amount (no stacking).
- **Hit dice.** Count (maximum and remaining) and die type come from class metadata. Spending a hit die is a manual action: the user records the healed amount; no automatic healing rolls (NG-1).
- **Death saves.** State of successes and failures (each 0–3); three failures = death; the total resets to zero once it reaches three of either kind, per universal SRD rules. Stabilization is a manual state toggle. [D-8]
- **Rests do not heal by default.** A rest changes only what the recovery rules below explicitly support; HP changes come from manual healing or explicitly supported recovery rules (A11 exit criterion).

### 8.2 Limited uses and rests (A5, A6)

- **Uses.** Per-feature use counts (maximum and current) derive from source metadata; spending is atomic and cannot exceed available uses; a failed spend transaction rolls back fully.
- **Rests are explicit user actions** (Short Rest / Long Rest) on the sheet; nothing infers a rest automatically. [D-9]
- **Short Rest.** Recovers exactly what recovery metadata marks as short-rest-recoverable (e.g., Channel Divinity-style features). No HP healing, no hit-dice recovery, no ordinary spell-slot recovery.
- **Long Rest.** Recovers everything the universal SRD long-rest rule and source recovery metadata cover: all hit dice, all spell slots (ordinary and Pact), all long-rest/any-rest uses, and a reset of death saves. HP is not auto-restored (manual healing only). A Long Rest may only begin while the character is alive (HP ≥ 1); attempting it otherwise produces a diagnostic. [D-10]
- Unknown recovery types or periods produce the unsupported-recovery diagnostic; they are never guessed.

### 8.3 Spellcasting (A7)

- **Slots.** Slot progression per class from source metadata; spent-slot state is character state. Recovery follows the source metadata / universal rules: ordinary casters recover on Long Rest; Pact Magic recovers on Short Rest.
- **Preparation and known spells.** Source-driven limits (e.g., prepared = class level + spell-ability modifier; known-spell counts for Pact Magic) are enforced at selection.
- **Derived numbers.** Spell save DC and spell attack modifier are universal calculations (8 + proficiency + ability modifier; proficiency + ability modifier).
- **Casting a spell** spends the slot where the metadata marks it. Spell *effects* are supported only to the extent of the allowlisted effect families (§8.5); a spell effect outside the allowlist remains visible as unsupported, not as a silent no-op.

### 8.4 Equipment and Armor Class (A3, A4)

- **Instances vs definitions.** Inventory holds item instances (with per-instance state such as equipped/consumed) that reference catalog definitions. Equipping one instance must not mutate its catalog definition or any other instance.
- **Equip/unequip.** Armor, shields, and weapons. Two-handed and dual-wielding constraints come from source metadata (no name-based branching). Invalid combinations produce the invalid-equipment-state diagnostic.
- **AC.** Computed from equipped armor/shield and Dexterity under the universal 5e armor rules (including Dexterity caps), plus class features that modify AC only as expressed in source metadata. AC recalculates on any equipment, ability, or relevant state change.
- **Attacks.** Supported attacks compute attack bonus and damage from metadata/formulas (ability score + proficiency, weapon properties, magic bonuses, effect-derived bonuses).
- **Consumables.** Consumable items track quantity; consumption decrements it; a consumed-out item is unavailable.

### 8.5 Activities, formulas, effects (A0–A2, A8–A10)

- **Activities.** A bounded set of structured activity types from the catalog. Activation is a pure transaction (validate → consume → apply → structured result/diagnostic) independent of the Obsidian UI.
- **Formulas.** Only a safe, bounded grammar (A0/A1): literals, allowlisted property references, allowlisted arithmetic, and only observed functions (e.g., `min`/`max`) when evidenced in the G4 corpus. No `eval`/`Function`/dynamic evaluation. A missing property is a diagnostic, never an implicit zero.
- **Effects.** Allowlist-based: exactly one verified semantic family is added at a time; there is no generic arbitrary-property active-effect mutator. Unknown change keys/types remain visible diagnostics and do not mutate state.
- **Durations.** Supported durations are tracked on character state; an effect with a duration can be ended/removed cleanly (expiry or manual end), leaving no residue.

### 8.6 End-to-end proof (A10, A13 gate)

- The baseline end-to-end proof is **Paladin Sacred Weapon** when it exists in the pinned free source: consume the linked Channel Divinity resource → select a valid equipped melee weapon → apply the source-defined duration → add the source formula's minimum Charisma-based attack bonus → expose supported damage-type behavior → end/remove the effect cleanly. If the exact feature is absent at the pin, the equivalently demanding free SRD fixture documented in G4 is used instead. [D-11]
- One golden scenario demonstrates the full chain: source record → character action → resource consumption → derived weapon update → effect expiry/removal.

## 9. Description behavior (U2, S5)

- **DB-1. Actionable names.** Every entity name rendered on the sheet (class, species, background, feature, feat, spell, item) is actionable: click or keyboard activation opens a local details modal/popover.
- **DB-2. Offline source.** Descriptions come only from the bundled catalog. No remote fetching, no user-supplied HTML.
- **DB-3. Sanitized rendering.** Descriptions render through a tested allowlist/sanitization pipeline. `innerHTML`, `outerHTML`, and `insertAdjacentHTML` are never used for source or user content. The safe subset: headings, paragraphs, lists, emphasis, blockquote, and links that resolve to bundled entities (opening nested details).
- **DB-4. Roll tokens inert.** Inline roll notation in SRD text (e.g., `{{…}}`) renders as inert plain text; it is never executed or parsed as a command. [D-12]
- **DB-5. Accessibility.** Details are keyboard-openable, focus-managed, and explicitly closable (Esc and a visible close control).
- **DB-6. Missing text.** A record without description text shows "No description available" — never a blank window or a crash.

## 10. Diagnostics (U3)

- **DG-1. Typed model.** Every diagnostic is typed data with: a stable machine-readable code, a human-readable message, a severity (`error` or `warning`), source identity (catalog record identity, file/line where applicable), and enough context to author a bounded follow-up task. [D-17]
- **DG-2. Never silent.** Every condition in the minimum set below must produce a diagnostic when encountered, and be visible to the user in the sheet (and, where applicable, in logs). A character file that cannot be loaded at all remains visible in the character list with its diagnostic — not hidden, not a crash.
- **DG-3. Minimum set** (plan §7, all required): wrong Foundry source revision; excluded/non-SRD record; unresolved source reference; unsupported advancement type; unsupported activity type; unsupported consumption target; unsupported recovery type/period; unsupported formula syntax/reference; unsupported Active Effect change key/type; invalid character schema/version (including unknown future version); stale catalog revision; invalid equipment state; insufficient resource/slot; invalid or incomplete creator choice; vault file collision/read/write failure.
- **DG-4. Severity semantics.** `error` blocks the affected operation and is shown immediately at the point of the action; `warning` permits the operation but is displayed persistently on the sheet. [D-18]
- **DG-5. Data, not exceptions.** Diagnostics are inspectable data: the UI renders them, and their code + context are sufficient to create a bounded follow-up task without re-diagnosing.

## 11. Licensing and attribution (R0)

**Evidence (fetched 2026-09-02, `foundryvtt/dnd5e` branch `6.0.x`; to be re-verified at the pinned SHA in G3):**

- `README.md` → "Licenses": the system includes material from the **System Reference Document 5.1** (Wizards of the Coast LLC, https://dnd.wizards.com/resources/systems-reference-document) and the **System Reference Document 5.2** (Wizards of the Coast LLC, https://www.dndbeyond.com/srd), both **licensed under the Creative Commons Attribution 4.0 International License** (https://creativecommons.org/licenses/by/4.0/legalcode).
- `README.md` → "Images and other assets are distributed under various terms, please see their `LICENSE` files for full details" → assets stay excluded (CB-3).
- `LICENSE.txt` (repository root): **MIT**, "Copyright 2021 Andrew Clayton" — governs the repository's software component, not the SRD text.

- **LC-1. SRD content is redistributed under CC-BY 4.0** with the attribution that license requires. If G3 finds, at the pinned SHA, any record whose provenance/license is not clearly free SRD under CC-BY 4.0, that record is excluded with a coverage entry and a diagnostic — it is not shipped. [D-13]
- **LC-2. Attribution package.** `THIRD_PARTY_NOTICES.md` (R0) states the SRD 5.1 and 5.2 CC-BY 4.0 attribution with the source URLs, the exact pinned revision SHA, the excluded-assets note, and the Foundry repository software MIT attribution. The catalog provenance file (§4) also carries the notices so the bundled data is self-describing.
- **LC-3. Plugin code license.** Finalized in R0 with a `LICENSE` file consistent with the bundling policy; the recommended default is MIT, and the final selection is a user decision at R0. [D-14]
- **LC-4. Trademarks.** The README and release assets carry the standard notice that Dungeons & Dragons trademarks are the property of Wizards of the Coast LLC and are used without implication of endorsement (R0/R1).
- **LC-5. Legal review trigger.** If the planned distribution ever goes beyond clearly licensed public SRD material, legal review is required before release (plan R0).

## 12. Testing and acceptance

- **TE-1. Automated baseline.** Unit and golden tests for every rules/advancement/effect family; fixtures built from real records of the pinned source; a catalog determinism check (byte-identical regeneration); coverage-report assertions (no silent exclusions). Tests run fully offline against the bundled/fixture catalog.
- **TE-2. One command each** for focused tests, full tests, typecheck, lint, development build, and production build (S0 exit).
- **TE-3. Persistence round-trip.** Automated: a saved character file loads to an identical derived character. Manual: closing and reopening Obsidian reproduces the same sheet (V1.6).
- **TE-4. Manual acceptance.** Performed only in the dedicated development vault `character-plugin-vault/`, always preceded by the documented runtime-refresh checklist required by `AGENTS.md` (exact commands derived from the repository, exact expected visible results, exact evidence to report back).
- **TE-5. Acceptance matrix (plan §6).** The baseline scenarios below are the acceptance matrix. Fixtures are chosen only from records proven present in the pinned source (G3/G4 evidence), and expected values are cited to the pinned Foundry records and official SRD rules — never encoded from memory:
  1. **Paladin / Oath of Devotion** — creation and subclass progression; Channel Divinity uses; partial Short Rest and full Long Rest recovery; Sacred Weapon-like weapon effect; armor/shield and attack calculation.
  2. **Ordinary full/prepared caster** — spell selection/preparation; multiple spell levels; slot spending; Long Rest recovery; spell save DC and attack modifier.
  3. **Warlock / Pact Magic** — Pact slot progression; slot spending; Short Rest recovery.
  4. **Equipment-focused** — armor categories; shield; Dexterity interaction; equip/unequip recalculation.
  5. **Leveling** — subclass grant; resource scale change; spell progression; ability/feat choice.
- **TE-6. Regression discipline.** Each implementation task adds or updates fixtures and coverage counts before it is complete (AGENTS.md verification discipline).

## 13. Milestone exit criteria

**Baseline complete** = milestone R exit = **R4 release dry run approved by the user**: a local release candidate containing only intended files and licensed content; nothing is published without explicit user approval.

Per-milestone product exits (task-level evidence detail remains authoritative in `docs/implementation-plan.md`):

| Milestone | Product exit (gate tasks in bold) |
| --- | --- |
| **G** | **G1 contract approved**; G2 compliance audit unblocks architecture; G3 reproducible free-SRD source boundary; G4 every later runtime task points at inventoried real examples; **G5 architecture and roadmap approved** |
| **S** | One-command toolchain baseline; lifecycle/settings shell; dev-vault refresh workflow; generator skeleton + revision lock; one representative record with provenance; sheet view + details modal (manual) |
| **V1** | Schema validation; repository (collisions, atomicity, no silent overwrite); minimal acceptance catalog (all references resolve); creation transaction golden test; abilities + universal calculations; creator UI (manual); read-only sheet (manual, persistence) |
| **A** | Formula grammar + safe evaluator; derived stats (≥2 materially different characters); equipment instances; AC interpreter; uses/consumption; rest engine; slots + Pact Magic; activity shell; one effect family; Sacred Weapon end-to-end; HP/temp HP/hit dice/death saves; automation UI; **A13 automation proof approved** |
| **L** | Advancement ordering + rollback documented; one advancement family per task; **L-final level-up UI + golden progression approved** |
| **C** | All free character-facing classes/species/backgrounds/feats/spells/equipment imported; coverage-driven semantic tasks; **C-final: every class creatable or has a precise enumerated blocker; coverage report approved** |
| **U** | Sheet composition; multi-character management; description modal; diagnostic UX; accessibility/theme audit; load-time/lifecycle audit (no heavy parsing in `onload`) |
| **R** | License/attribution package; manifest compliance; full clean-install validation; manual acceptance matrix; **R4 release dry run approved** |

Gate tasks requiring user approval before commit/advance: **G1, G5, A13, L-final, C-final, R4**.

## 14. Decisions deferred to later tasks

| Item | Decided in |
| --- | --- |
| Plugin ID and copy/symlink dev-install workflow | G5 |
| Character file field layout and atomic-update mechanism; view types; catalog file organization and index formats; formula grammar details; effect allowlist order; advancement transaction model; diagnostics rendering model | G5 (architecture) |
| Mapping of official Obsidian guidelines to code/test enforcement | G2 |
| Exact pinned SHA, packs, source markers, license verification at the pin, free/premium boundary evidence | G3 |
| Per-family occurrence counts and representative fixtures | G4 |
| `isDesktopOnly` / `minAppVersion` / mobile claim | G5 (evidence-based) + R1 |
| Plugin code license selection | R0 |

## 15. Amendments

After approval, changes to this contract require explicit user approval. If this contract conflicts with `docs/implementation-plan.md`, this contract prevails for product requirements and the plan is updated to match (AGENTS.md instruction authority). Conflicts with `AGENTS.md` are resolved in favor of `AGENTS.md` after user approval of the lower-authority fix.

### Amendment log

- 2026-09-02 (pre-approval, user-directed): added **[D-19]** — the catalog preserves the Foundry record structure; the build generates only indexes, provenance, coverage reports, and minimal runtime accelerators; the runtime interprets verified Foundry semantic families directly (CB-4 rewritten, CB-7 new, G5 deferral updated).
