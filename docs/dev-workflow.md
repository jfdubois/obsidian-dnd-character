# Development workflow and runtime refresh (S2)

Canonical runtime-refresh checklist for manual testing in the dedicated
development vault. Per `AGENTS.md` ("Manual Obsidian testing gate"), every task
that requests manual Obsidian acceptance starts from this document, keeps the
**Current state** section accurate, and gives the user the acceptance steps and
evidence list below.

## Fixed facts

| Fact | Value |
| --- | --- |
| Development vault | `character-plugin-vault/` (gitignored; never test in any other vault) |
| Plugin id | `dnd-character` (must equal `manifest.json` `id`) |
| Development plugin dir | `character-plugin-vault/.obsidian/plugins/dnd-character/` |
| Install mode | Copy-based via `scripts/dev-install.mjs` (architecture §1). No symlinks: the pinned G2 evidence does not cover Obsidian loader behavior with symlinks. |
| Files installed | `main.js`, `manifest.json`, `styles.css` — overwritten on every refresh |
| Never touched | `data.json` (plugin settings) and any other file Obsidian writes into the plugin dir (the script never deletes) |
| Build artifact | `main.js` is gitignored and must be rebuilt before every install |

## One-time setup (per machine / per clone)

```bash
git branch --show-current   # must print dev
git status --short
npm ci                       # requires Node >= 22 (package.json engines)
```

## Full runtime refresh — exact commands

Run from the repository root, in this order:

```bash
# 1. Verify branch and working tree
git branch --show-current
git status --short

# 2. Dependencies (only when node_modules is missing or package-lock.json changed)
npm ci

# 3. Verify the code
npm test            # full suite; focused run: npm test -- tests/<file>
npm run typecheck
npm run lint

# 4. Build, then install into the dev vault
npm run build:dev   # produces main.js (unminified, inline sourcemap); build:prod for minified
npm run dev:install # copies main.js, manifest.json, styles.css into the dev vault plugin dir; preserves data.json
```

Then, in Obsidian:

1. Reload the plugin: Settings → Community plugins → "D&D Character" → toggle
   off → toggle on. A full application reload or restart always works too, but
   a code refresh only needs the disable/enable toggle.
2. If a custom view was open: close and reopen it. (No custom views exist yet;
   see Current state.)

### Gate checklist (every item required by `AGENTS.md`)

| Gate item | Required at S2? | Exact command / action |
| --- | --- | --- |
| Dependency installation | Yes, once | `npm ci` |
| Focused tests | Yes | `npm test -- tests/<file>` |
| Full tests | Yes | `npm test` |
| Typecheck | Yes | `npm run typecheck` |
| Lint | Yes | `npm run lint` |
| Production rebuild and `main.js` refresh | Yes | `npm run build:dev` (or `npm run build:prod`) |
| Generated SRD catalog rebuild | No — not until S3 (no generated catalog artifacts exist yet) | — |
| Copy build into `character-plugin-vault/.obsidian/plugins/<plugin-id>/` | Yes | `npm run dev:install` |
| `manifest.json` refresh | Yes — done by `dev:install` (one of the three copied files) | — |
| `styles.css` refresh | Yes — done by `dev:install` (one of the three copied files) | — |
| Plugin disable/enable, application reload, or full restart | Yes | Settings → Community plugins → toggle "D&D Character" off/on |
| Custom view close/reopen | No — not until S5 (no views registered yet) | — |

## Current state (after S2) — manual acceptance

The plugin registers one settings tab and five stub commands. There are no
custom views, no SRD catalog, and no character files yet. Every stub command
shows a `Notice` saying the feature is not available yet.

### Acceptance steps

1. Open `character-plugin-vault/` as a vault in Obsidian (desktop; any app
   version ≥ 1.13.0).
2. Settings → Community plugins → turn off "Restricted mode" if prompted →
   enable "D&D Character".
3. Settings → "D&D Character" tab. Expect:
   - "Character folder" text field, default `Characters`;
   - "Default ruleset" dropdown, default "D&D 5e (2024 rules)".
4. Change "Character folder" to `MyChars`, close settings, reopen the
   "D&D Character" tab: the value must still be `MyChars` (settings persist in
   `character-plugin-vault/.obsidian/plugins/dnd-character/data.json`).
5. Open the command palette (Ctrl/Cmd+P) and run each of the five commands;
   each must show a notice:
   - `D&D Character: Open character sheet` → "Opening the character sheet is not available yet."
   - `D&D Character: Open character creator` → "Opening the character creator is not available yet."
   - `D&D Character: Take a short rest` → "Short rests are not available yet."
   - `D&D Character: Take a long rest` → "Long rests are not available yet."
   - `D&D Character: Level up` → "Leveling up is not available yet."
6. Refresh loop: in the repository run `npm run build:dev && npm run dev:install`,
   then toggle the plugin off/on in Obsidian. The plugin must load without
   console errors.
7. Unload/reload: disable the plugin, then re-enable it. No duplicate settings
   tab or commands, no console errors.

### Evidence to report back

- Current branch and `git status --short` result.
- Obsidian console output (F12 → Console) after enabling the plugin and after
  the refresh loop — expected: no errors.
- The "Character folder" value before and after the step 4 round-trip.
- The exact notice text from one stub command.
- The output lines of `npm run dev:install` (installed path, copied files,
  data.json line).

## Day-to-day short loop

```bash
npm run build:dev && npm run dev:install
```

Then in Obsidian: Settings → Community plugins → toggle "D&D Character"
off/on.
