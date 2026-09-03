# AGENTS.md — Obsidian Character Sheet plugin

## Instruction authority

- The repository root is the current working directory containing this file and `.git/`.
- Explicit user instructions have highest authority.
- `AGENTS.md` is the single source of truth for repository-wide operating rules and architecture invariants.
- `docs/implementation-plan.md` is the single source of truth for task sequence, task deliverables, dependencies, and approval gates.
- After task G1 is approved, `docs/contracts/character-sheet-srd-baseline.md` is the source of truth for product requirements and acceptance boundaries.
- After task G5 is approved, `docs/architecture/character-sheet-architecture.md` is the source of truth for approved technical design within the invariants of this file.
- If these documents conflict, do not guess. Stop the affected task, identify the conflict, and update the lower-authority document after user approval.
- Do not duplicate operating rules in task documents or prompts. Task prompts should reference this file and include only task-specific scope.

## Repository boundary and development vault

All project work must remain within the repository root and its descendants.

- Do not inspect, search, read, write, delete, move, or execute project operations in parent or sibling directories.
- Do not use `..` or absolute filesystem paths to escape the repository root.
- Invoking installed tools from `PATH` and consulting approved internet sources is allowed, but do not inspect or modify their files outside the repository.
- Any temporary checkout, cache, fixture source, or generated work directory required by this project must be created under the repository root and ignored when appropriate.
- Never edit files inside `.git/` directly; use Git commands.

The repository begins with this layout:

```text
./
├── AGENTS.md
├── character-plugin-vault/
│   └── .obsidian/
├── docs/
│   └── implementation-plan.md
├── .git/
├── .gitignore
└── README.md
```

`character-plugin-vault/` is the dedicated development and acceptance-test vault.

- Keep the entire development vault out of Git. At minimum, `.gitignore` must ignore `character-plugin-vault/`.
- The installed development plugin must live at `character-plugin-vault/.obsidian/plugins/<plugin-id>/`, where `<plugin-id>` exactly matches `manifest.json`.
- Keep source code and canonical generated artifacts in the repository source tree, not in the development vault.
- Install or refresh the development plugin through a documented copy or symlink workflow created by the implementation plan.
- Do not use or modify any other Obsidian vault for development testing.

## Project scope

Build an Obsidian Community Plugin that creates, levels, persists, displays, and operates D&D 5e characters using only freely redistributable SRD content and structured mechanics metadata from the public official `foundryvtt/dnd5e` repository.

The functional baseline and implementation sequence are defined in `docs/implementation-plan.md`. Do not broaden the project beyond that approved baseline.

Out of scope unless the user explicitly approves a later plan:

- paid, private, or non-SRD content;
- runtime web scraping or remote content retrieval;
- imports from proprietary character services;
- multiplayer or VTT combat automation;
- monster encounter management;
- a natural-language rules parser;
- unrestricted scripting or dynamic code execution;
- cloud synchronization or telemetry.

## Git workflow

This is a fresh repository with `main` and `dev` branches.

- Perform all project work on `dev`.
- Before editing, run `git branch --show-current` and `git status --short`.
- If the current branch is not `dev`, switch to `dev` only when it is safe. If uncommitted work prevents a safe switch, stop and report the blocker.
- Never commit directly to `main`.
- Never push to `main`.
- Never merge into `main` without explicit user approval.
- Never force-push, rewrite shared history, delete branches, or discard unrelated changes unless the user explicitly instructs it.
- Preserve unrelated user changes and exclude them from task commits.
- The agent owns creation and maintenance of `.gitignore` as the toolchain evolves.
- The agent writes a focused commit message for every completed and verified non-gate task, commits only that task's changes, and pushes the commit to `origin/dev`.
- For a task marked **gate**, prepare and verify the deliverable, then stop for user approval before committing or pushing it. After approval, commit and push the approved deliverable on `dev`, report the commit, and do not start the next task automatically.
- Use concise, descriptive commit messages. Prefer conventional prefixes such as `docs:`, `chore:`, `test:`, `feat:`, and `fix:` when they accurately describe the change.
- Commit the package-manager lockfile.
- Do not assume generated release artifacts belong in or out of Git; follow the approved release workflow and ensure required release files are produced and verified.

## Source authorities

### Obsidian

For Obsidian architecture, APIs, lifecycle, UI, vault access, plugin packaging, and Community Plugin release requirements, use current official sources as authority:

- https://docs.obsidian.md/Home
- https://docs.obsidian.md/Plugins/Getting%20started/Build%20a%20plugin
- https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- https://docs.obsidian.md/community-directory/developer-policies
- https://docs.obsidian.md/community-directory/submission-requirements-for-plugins
- https://docs.obsidian.md/plugins/guides/lifecycle-management
- https://docs.obsidian.md/plugins/guides/load-time
- https://docs.obsidian.md/plugins/guides/defer-views
- https://docs.obsidian.md/Plugins/Vault
- https://docs.obsidian.md/Plugins/User%20interface/HTML%20elements
- https://docs.obsidian.md/plugins/releasing/submit-plugin
- https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts
- https://github.com/obsidianmd/obsidian-sample-plugin
- https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Releasing/Plugin%20guidelines.md

Do not rely on remembered Obsidian APIs. Verify symbols and signatures against current official documentation, the installed `obsidian` package, and official `obsidian.d.ts` before use. If they disagree, compile against the installed package, document the discrepancy, and make an evidence-based compatibility decision.

### Foundry D&D5e

Use only the public official repository as the source of the free SRD structured mechanics model:

- https://github.com/foundryvtt/dnd5e

Before importing content:

- inspect relevant source files and license/provenance information;
- resolve and record an exact commit SHA;
- never use a moving branch as the reproducibility anchor;
- import only content demonstrably released as free SRD material;
- exclude premium/private content;
- exclude images, icons, fonts, and other assets unless their licenses are separately reviewed and explicitly approved;
- preserve required attribution notices.

The plugin must not require Foundry VTT, a Foundry installation, or a Foundry checkout at runtime.

## Architecture vocabulary

Use these terms consistently:

- **Foundry source records** — free public compendium source definitions.
- **Structured mechanics metadata** — advancements, activities, uses, recovery, consumption, duration, effects, formulas, restrictions, scaling, and related structured fields.
- **Catalog generator** — build-time tool that converts a pinned Foundry source checkout into the deterministic SRD catalog bundled with the plugin.
- **Catalog adapter** — validates and exposes supported catalog/source structures without running Foundry VTT.
- **Advancement interpreter** — applies supported character-creation and leveling advancements.
- **Rules runtime** — pure application logic for derived values and supported universal rules.
- **Effect interpreter** — applies explicitly supported structured effect families.
- **Character state** — player choices and mutable gameplay state persisted in the vault.
- **Derived character** — calculated values produced from catalog definitions plus character state.

Do not call every component an interpreter when a more precise term exists.

## Core architecture rules

Keep these boundaries explicit:

```text
Pinned Foundry source records
        ↓ build-time
Generated immutable SRD catalog
        ↓ runtime lookup
Character state
        ↓ pure rules/advancement/effect logic
Derived character
        ↓
Obsidian UI
```

- Do not copy complete source definitions into each saved character.
- Persist player choices and mutable state; recompute safe derived values.
- Keep rules logic out of UI components.
- Use universal rules in code only when the rule truly applies uniformly.
- Use structured mechanics metadata for entity-specific grants, costs, recovery, scaling, activities, restrictions, and effects.
- Do not branch on class, spell, feat, or item names when source metadata expresses the behavior.
- Do not use `eval`, `Function`, or equivalent dynamic code execution for formulas.
- Inventory the observed formula corpus and implement only a safe, bounded grammar.
- Do not implement a generic arbitrary-property Active Effect mutator. Allowlist one verified semantic family at a time.
- Unsupported structures must remain visible through explicit diagnostics.
- The catalog generator must be deterministic, revision-locked, provenance-preserving, and coverage-reporting.
- Do not emulate the complete Foundry runtime.

## Obsidian engineering rules

- Use TypeScript and a default plugin class extending `Plugin`.
- Keep `main.ts` small and split responsibilities into focused modules.
- Use `this.app`; never use global `app` or `window.app`.
- Use Obsidian lifecycle registration helpers for commands, events, DOM events, intervals, and views.
- Clean resources up on unload.
- Keep `onload()` inexpensive and defer heavier initialization.
- Account for Deferred Views and verify view types before use.
- Prefer the Vault API over raw filesystem or Adapter APIs.
- Use `normalizePath()` for constructed or user-controlled vault paths.
- Use `Plugin.loadData()` and `Plugin.saveData()` for plugin settings.
- Use atomic file operations such as `Vault.process()` when modifying background files.
- Do not iterate the entire vault when a direct path lookup exists.
- Do not use `innerHTML`, `outerHTML`, or `insertAdjacentHTML` for user or source content.
- Build UI using DOM APIs and Obsidian helpers.
- Render imported descriptions through a tested allowlist/sanitization pipeline.
- Keep styles in scoped `styles.css` classes and use Obsidian CSS variables.
- Do not hardcode visual styles in TypeScript unless an official API specifically requires it.
- Use sentence case for visible UI text.
- Do not assign default hotkeys.
- Do not add telemetry.
- Do not self-install, self-update, or install runtime dependencies.
- Keep the SRD baseline offline at runtime.
- Minimize dependencies.
- Make `isDesktopOnly`, `minAppVersion`, and mobile-support claims evidence-based.

## Agent workflow and context control

The available coding model has an approximately 64k context window. Keep work bounded and repository-backed.

### Before every parent or subagent task

1. Read this `AGENTS.md`.
2. Read only the relevant task entry in `docs/implementation-plan.md` and the canonical project documents it identifies.
3. Search only within the repository root for any more-specific `AGENTS.md` governing files in scope and read them.
4. Run `git branch --show-current` and `git status --short` before editing.
5. Preserve unrelated user changes.
6. Read only the documents and source files required for the current task.
7. Report which instruction files were read.

### Task sizing

- Execute one task ID at a time.
- Do not automatically begin the next task.
- Each task must produce one independently testable deliverable.
- Prefer roughly five or fewer production files plus one focused test family per normal implementation task.
- Split a task if it introduces more than one new mechanics semantic family, requires broad unrelated refactoring, cannot be fully tested in isolation, or would require most of the repository in one context.
- Keep large research outputs in repository documents rather than parent-agent context.

### Disposable subagents

- Use fresh, disposable subagents for bounded work.
- Do not run subagents in parallel, only in sequential.

**Research subagents:**

- answer one narrow question;
- do not edit production code;
- provide exact evidence and source paths;
- distinguish facts from inference;
- keep reports compact.

**Implementation subagents:**

- receive one task ID;
- receive explicit allowed files and interfaces;
- write tests first;
- stop rather than redesign adjacent interfaces without approval.

**Review subagents:**

1. requirements review;
2. code-quality review.

Do not run parallel implementation agents on overlapping files or interfaces. The parent agent remains responsible for integration, verification, commits, pushes, and final claims.

## Test and verification discipline

For implementation tasks:

1. State a compact task-specific micro-plan.
2. Write the smallest failing test or deterministic fixture assertion.
3. Run it and confirm the expected failure.
4. Implement the minimum behavior.
5. Run the focused test.
6. Run related tests.
7. Run the repository typecheck, lint, build, and other relevant commands that actually exist.
8. Review the diff for unrelated changes.
9. Run requirements and code-quality reviews.
10. Resolve accepted findings.
11. Rerun verification before claiming completion.
12. Update canonical handoff/interface documents when required by the task.
13. Follow the Git workflow above.

Never claim a task is complete, fixed, or passing without fresh command output proving it.

## Source-data implementation discipline

For each new Foundry semantic family:

1. Inventory real free-SRD occurrences.
2. Select representative fixtures.
3. Document the source shape and semantics.
4. Define the smallest typed subset required.
5. Write failing tests.
6. Implement only that family.
7. Add or update coverage diagnostics.
8. Leave unknown structures unsupported and visible.

## Persistent project memory

Use repository documents instead of relying on chat history. Maintain the canonical files established by `docs/implementation-plan.md`, including current task/status handoff and stable interface/schema documentation.

Keep handoff documents concise. Record exact verification commands, current blockers, stable interfaces, and the next eligible task.

## Manual Obsidian testing gate

Before asking the user to test manually in Obsidian, inspect the actual repository and provide a complete runtime-refresh checklist using exact commands. At minimum determine and report whether each is required:

- dependency installation;
- focused tests;
- full tests;
- typecheck;
- lint;
- production rebuild and `main.js` refresh;
- generated SRD catalog rebuild;
- copy or symlink into `character-plugin-vault/.obsidian/plugins/<plugin-id>/`;
- `manifest.json` refresh;
- `styles.css` refresh;
- plugin disable/enable, application reload, or full restart;
- custom view close/reopen.

Also provide:

- current branch and `git status --short` result;
- exact plugin ID and development plugin directory;
- exact acceptance steps and expected visible results;
- exact evidence the user should report back.

Do not invent commands. Derive them from repository scripts and the actual development setup. Never direct development testing at another vault.
