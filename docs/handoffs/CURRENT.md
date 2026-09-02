# CURRENT — task/status handoff

- Last updated: 2026-09-02 (task G1)
- Current branch: `dev`

## Current milestone / task

- Milestone: G — Governance, evidence, and exact plan
- Last completed task: **G1 — New SRD Character Sheet contract (gate, approved)**
- G1 deliverables:
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

## Repository state at G1 completion

- `docs/contracts/character-sheet-srd-baseline.md` is the source of truth for product requirements and acceptance boundaries (AGENTS.md instruction authority) until superseded by an approved amendment.
- Still no `package.json`, no lockfile, no `src/`, no `tests/`, no build/test/lint configuration.
- No Foundry checkout, no source data, no generated catalog.
- Development vault `character-plugin-vault/` exists with a fresh `.obsidian/`; no plugin installed; `<plugin-id>` not yet chosen (G5).
- Toolchain available: git 2.55.0, node v22.23.1, npm 10.9.8 (pnpm/yarn/bun not installed).
- Remote: `origin` = `git@github.com:jfdubois/obsidian-dnd-character.git` (SSH). `main` unchanged; all work is on `dev`.

## Exact verification commands for G1

```text
git branch --show-current            # dev
git status --short                   # clean (after handoff commit)
git log --oneline -3                 # G1 commits on top of ea842ea
test -f docs/contracts/character-sheet-srd-baseline.md && echo ok
grep -c '^\- \*\*CB-' docs/contracts/character-sheet-srd-baseline.md   # 7 (CB-1..CB-7)
grep -o '\[D-19\]' docs/contracts/character-sheet-srd-baseline.md | wc -l   # 3 (index + CB-7 body + amendment log)
```

## Key contract facts for later tasks

- G2 (next) must map official Obsidian guidance to enforcement; the contract's §11 (licensing) and §12 (testing) are its product-side inputs.
- G3 must re-verify Foundry license files at the exact pinned SHA (current evidence is from branch `6.0.x`, provisional per contract line "Evidence base").
- G5 architecture must stay within the contract and may specify: character file field layout, view types, catalog file organization and index formats, formula grammar details, effect allowlist order, advancement transaction model, diagnostics rendering model — and must honor [D-19] (no proprietary mechanics schema).

## Blockers

- None.

## Next eligible task

- **G2 — Official Obsidian compliance audit** (not a gate).
  - Deliverable: `docs/audits/obsidian-compliance.md`.
  - Maps each applicable official guideline to requirement, source URL/heading or API symbol, planned code/test enforcement, and release-time check.
  - Exit: no unresolved policy question blocks the baseline architecture.
