# CURRENT — task/status handoff

- Last updated: 2026-09-02 (task G2)
- Current branch: `dev`

## Current milestone / task

- Milestone: G — Governance, evidence, and exact plan
- Last completed task: **G2 — Official Obsidian compliance audit (not a gate)**
- G2 deliverable: `docs/audits/obsidian-compliance.md`
  - Pinned evidence: `obsidian-api` @ `cc1744324150c632416857c98964f87b1574a5fc` (`obsidian.d.ts`, 8498 lines); developer-docs @ `c56c7e770ba25dd0ea392aacf4588f9425970d36` (fetched `Vault.md`, `HTML elements.md`).
  - Contains the guideline → requirement → source → planned enforcement → release-time-check mapping (rows G2-01..G2-30), a 13-item structural-findings list, full `@deprecated` inventory, doc summaries, verbatim API appendix, and verified-absence list.
  - Exit satisfied: **no unresolved policy question blocks the baseline architecture** (§7 of the audit).
  - Audit fixes for G5: `minAppVersion "1.13.0"`; settings via `Plugin.settings` + `getSettingDefinitions()` (subclass assigns its own `plugin` ref); persistence via `Vault.process/cachedRead/trash/getFileByPath` + `normalizePath`; no default hotkeys; no `requestUrl` at runtime; `innerHTML`/`outerHTML`/`insertAdjacentHTML` banned in `src/`; deferred views via `WorkspaceLeaf.isDeferred`/`loadIfDeferred()`/`Workspace.revealLeaf()`; descriptions via sanitizer + 5-arg `MarkdownRenderer.render`.
- Previous task: **G1 — New SRD Character Sheet contract (gate, approved)**
  - `docs/contracts/character-sheet-srd-baseline.md` (approved product contract: 15 sections, 19 product decisions [D-1]..[D-19], milestone exit criteria, deferrals)
  - Both required reviews completed before approval: requirements review PASS, code-quality review PASS (all findings resolved or rejected with reasons)
  - Pre-approval user-directed amendment recorded in §15 amendment log: [D-19] catalog preserves Foundry record structure; build generates only indexes/provenance/coverage/minimal accelerators; runtime interprets Foundry semantic families directly

## Commits

| Commit | Meaning |
| --- | --- |
| `fe19b9a4b6430cb5132a50302a1cf07a587e5120` | Initial commit (pre-G0 state): `AGENTS.md`, `docs/implementation-plan.md`, `.gitignore`, empty `README.md` |
| `ba23473debb924baec66a74139dca4331118516b` | G0 baseline audit (`docs/audits/repository-baseline.md`) |
| `ea842ea` (resolve: `git log -1 --format='%H' -- docs/handoffs/CURRENT.md`) | G0 handoff (`docs/handoffs/CURRENT.md`) |
| `211e9095b21f79b3c18bdae2a6bfb7d2c2413cda` | G1 approved contract (`docs/contracts/character-sheet-srd-baseline.md`) |
| commit updating this file (immediately after `211e909`) | G1 handoff update (this file) |
| commit updating this file (G2) | G2 compliance audit (`docs/audits/obsidian-compliance.md`) + `.gitignore` (ignore `.tmp/`) + this handoff |

## Repository state at G2 completion

- `docs/contracts/character-sheet-srd-baseline.md` is the source of truth for product requirements and acceptance boundaries (AGENTS.md instruction authority) until superseded by an approved amendment.
- Still no `package.json`, no lockfile, no `src/`, no `tests/`, no build/test/lint configuration.
- No Foundry checkout, no source data, no generated catalog.
- Development vault `character-plugin-vault/` exists with a fresh `.obsidian/`; no plugin installed; `<plugin-id>` not yet chosen (G5).
- Toolchain available: git 2.55.0, node v22.23.1, npm 10.9.8 (pnpm/yarn/bun not installed).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work is on `dev`.
- `.tmp/` (agent scratch; pinned `obsidian.d.ts` + fetched doc pages under `.tmp/g2/`) is git-ignored.

## Exact verification commands for G2

```text
git branch --show-current            # dev
git status --short                   # clean (after G2 commit)
test -f docs/audits/obsidian-compliance.md && echo ok
grep -c '^| G2-' docs/audits/obsidian-compliance.md   # 30 (mapping rows G2-01..G2-30)
grep -n 'cc1744324150c632416857c98964f87b1574a5fc' docs/audits/obsidian-compliance.md   # pinned evidence SHA
grep -n 'minAppVersion' docs/audits/obsidian-compliance.md | head -5
```

## Key contract facts for later tasks

- G3 must re-verify Foundry license files at the exact pinned SHA (current evidence is from branch `6.0.x`, provisional per contract line "Evidence base").
- G5 must consume `docs/audits/obsidian-compliance.md` §7 (fixed decisions: minAppVersion 1.13.0, settings API, Vault-only persistence, no-hotkeys/offline/innerHTML bans, deferred-view handling, MarkdownRenderer.render 5-arg). Re-pin `obsidian-api` if the master SHA moved before implementation starts.
- G5 architecture must stay within the contract and may specify: character file field layout, view types, catalog file organization and index formats, formula grammar details, effect allowlist order, advancement transaction model, diagnostics rendering model — and must honor [D-19] (no proprietary mechanics schema).

## Blockers

- None.

## Next eligible task

- **G3 — Foundry D&D5e source audit** (not a gate), per `docs/implementation-plan.md`.
