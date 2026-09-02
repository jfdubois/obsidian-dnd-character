# G2 — Official Obsidian compliance audit

- Date: 2026-09-02
- Branch: `dev`
- Status: complete (non-gate task)
- Pinned evidence:
  - `obsidianmd/obsidian-api` @ `master`, commit **`cc1744324150c632416857c98964f87b1574a5fc`** (verified 2026-09-02 via `api.github.com/repos/obsidianmd/obsidian-api/commits/master`).
  - `obsidian.d.ts`: **8498 lines**. Raw URL: `https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts`. Scratch copy: `.tmp/g2/api/obsidian.d.ts` (git-ignored).
  - `obsidianmd/obsidian-developer-docs` @ commit **`c56c7e770ba25dd0ea392aacf4588f9425970d36`**; fetched `en/Plugins/Vault.md` (117 lines) and `en/Plugins/User interface/HTML elements.md` (83 lines) to `.tmp/g2/docs/` (git-ignored).

Scope note: guideline statements below come from the AGENTS.md "Obsidian engineering rules" (which cite the official doc URLs listed in §2 of AGENTS.md) and from the contract `docs/contracts/character-sheet-srd-baseline.md` (§5 persistence, §9 description behavior, §11 licensing, §12 testing). API symbols are verified verbatim against the pinned `obsidian.d.ts` (Appendix B). Developer-doc prose was fetched and verified for the two pages listed above; other doc pages are referenced through the AGENTS.md rule text and are to be re-verified at implementation time against the pinned repo.

## 1. Guideline → enforcement mapping (deliverable core)

Legend: Req = requirement (AGENTS.md / contract ID). Source = official URL/heading or pinned API symbol. Enforcement = planned code/test enforcement. Release check = what R0/R4 verifies.

### 1.1 Plugin structure and lifecycle

| # | Requirement | Source | Planned code/test enforcement | Release-time check |
|---|---|---|---|---|
| G2-01 | Single default plugin class extending `Plugin`; `main.ts` stays small; responsibilities in focused modules | `Plugin` class (d.ts L4901); docs "Build a plugin" | `src/main.ts` contains only the class + minimal `onload`; module layout set in G5 | Build produces `main.js` entry exporting the class (sample-plugin convention) |
| G2-02 | Keep `onload()` inexpensive; defer heavy initialization | `Plugin.onload()` (d.ts L4916); docs "load-time" guide; contract §13 milestone U ("no heavy parsing in `onload`") | Catalog parse and character load happen outside `onload` (lazily on first view open / command); load-time audit task in U | Load-time audit result attached to R4 dry-run evidence |
| G2-03 | Use `this.app`; never global `app` / `window.app` | `Plugin.app: App` (d.ts L4912) | No global `app` reference; enforced by code review + lint `no-restricted-globals`-style rule at S0 | n/a (static) |
| G2-04 | Register commands, events, DOM events, intervals, views via lifecycle helpers; clean up on unload | `Component.registerEvent/registerDomEvent/registerInterval` (d.ts L1835+); `Plugin.addCommand/registerView/addSettingTab/addRibbonIcon/addStatusBarItem` | All registrations through `this.register*` / `this.addCommand`; no raw `addEventListener`/`setInterval` outside `registerDomEvent`/`registerInterval` | n/a (static) |
| G2-05 | Settings via `loadData()`/`saveData()`; character data never in plugin data | `Plugin.loadData(): Promise<any>`, `Plugin.saveData(data: any): Promise<void>` (d.ts L5030s); contract CP-1 | Settings module only; character files live in visible vault folder `Characters/` (CP-1) | R0: verify `data.json` holds settings only (manual clean-install validation) |
| G2-06 | Modern settings API (`settings` field, 1.13.0) | `Plugin.settings?: unknown` (d.ts L4924); `PluginSettingTab.getSettingDefinitions()` (L5149+) | Settings subclass assigns `this.settings` in `onload` after `loadData()`; typed on subclass | `minAppVersion` ≥ 1.13.0 in manifest (see G2-17) |
| G2-07 | No default hotkeys | `Command.hotkeys?: Hotkey[]` (d.ts L1821, JSDoc recommends avoiding default hotkeys) | `addCommand` calls never set `hotkeys` | Manifest/command audit at R0 |
| G2-08 | No telemetry; SRD baseline offline at runtime | `requestUrl` (d.ts L~8400s) recorded for existence only | No `requestUrl`/`request` import anywhere in `src/`; full test suite runs offline | R0: grep built `main.js` for `requestUrl`/network calls (must be absent) |
| G2-09 | No self-install / self-update / runtime dependency install | No such API exists in `obsidian.d.ts` (verified absent) | No such code path exists; code review | n/a (static) |
| G2-10 | Minimize dependencies | docs "Build a plugin" | Dependency list reviewed at S0; lockfile committed | Lockfile present and reproducible at R0 |
| G2-11 | `isDesktopOnly` / `minAppVersion` / mobile claims evidence-based | `PluginManifest` (d.ts L5094: `minAppVersion: string; isDesktopOnly?: boolean`) | `minAppVersion: "1.13.0"` (settings API floor; `Vault.process` needs 1.1.0, deferred-views API needs 1.7.2 — all ≤ 1.13.0); `isDesktopOnly` decided with evidence at G5/R0 | Manifest fields verified at R0 |

### 1.2 Vault file access (contract §5 persistence)

| # | Requirement | Source | Planned code/test enforcement | Release-time check |
|---|---|---|---|---|
| G2-12 | Prefer Vault API over raw filesystem/Adapter APIs | docs "Vault" (pinned `Vault.md`); `Vault` class (d.ts L7337) | All character-file I/O through `this.app.vault`; `DataAdapter` (d.ts L2006) used only if a documented need arises (G5 may rule otherwise) | n/a (static) |
| G2-13 | Atomic character-file updates; no partial writes | `Vault.process(file, fn, options?): Promise<string>` (d.ts L7526, since 1.1.0); pinned `Vault.md` "always prefer process() over read()/modify()" | Repository layer (V1) uses only `Vault.process()` for mutations; failure leaves file intact (CP-5) | n/a (covered by V1 tests) |
| G2-14 | Read strategy: `read()` before mutation, `cachedRead()` for display | `Vault.read` (L7428), `Vault.cachedRead` (L7436); pinned `Vault.md` cache-flush semantics | Display paths use `cachedRead`; mutation paths use `process`/`read` | n/a |
| G2-15 | Direct path lookup, no full-vault iteration | `Vault.getFileByPath(path): TFile \| null` (L7367), `getFolderByPath` (L7376), `getAbstractFileByPath` (L7385), `getRoot()` (L7392) | Character list = `getFiles()` filtered by configured folder only (CP-1/CP-6); open/rename/delete resolve by direct path; **note: `Vault.getMarkdownFileByPath` does not exist** — use `getFileByPath` + `instanceof`/extension check | n/a |
| G2-16 | Rename with collision checking and trash delete (CP-2, CP-6, CP-7) | `Vault.rename(file, newPath)` (L7474), `Vault.trash(file, system)` (L7465), `Vault.create` throws if exists (L7402) | Repository: create checks existence first (no silent overwrite, CP-7); delete routes through `trash()`; rename = existence check + `rename` inside `process`-free atomic step (G5 details) | Manual acceptance in dev vault (V1) |
| G2-17 | `normalizePath()` for constructed/user-controlled paths | `export function normalizePath(path: string): string;` (d.ts L4606) | Path helper wraps all constructed vault paths; unit tests for user-supplied name sanitization (CP-2) | n/a |
| G2-18 | Frontmatter access only via FileManager | `FileManager.processFrontMatter(file, fn, options?)` (d.ts L2954, since 1.4.4) | If G5 puts any metadata in frontmatter, use `processFrontMatter`; otherwise character file is plain JSON (no frontmatter dependency) | n/a |
| G2-19 | File events for external changes (U1 missing-file handling) | `Vault.on('create'\|'modify'\|'delete'\|'rename', ...)` overloads (d.ts L7574–7592) | Character repository subscribes via `registerEvent(this.app.vault.on(...))` | n/a |

### 1.3 UI and DOM (contract §9 description behavior, §10 diagnostics)

| # | Requirement | Source | Planned code/test enforcement | Release-time check |
|---|---|---|---|---|
| G2-20 | No `innerHTML`/`outerHTML`/`insertAdjacentHTML` for user or source content (DB-3) | Pinned `obsidian.d.ts` has no innerHTML helpers; DOM built via `createEl/createDiv/createSpan/createFragment` + `DomElementInfo` (d.ts L20–203); `Modal.setContent(content: string \| DocumentFragment)` (L4540) | Lint `no-restricted-syntax` banning the three assignments in `src/`; description rendering goes through the allowlist sanitizer (G5 pipeline) + `MarkdownRenderer.render(app, markdown, el, sourcePath, component)` (L4147) | R0: grep built `main.js` for the three patterns (must be absent) |
| G2-21 | Build UI with DOM APIs and Obsidian helpers | `createEl`/`createDiv`/`createSpan`/`createFragment` (d.ts global block); `Setting.addText/addToggle/addDropdown/addSlider/...` (d.ts L5695+) | All sheet UI built with `createEl*` + `Setting` components; no manual `document.createElement` chains where a helper exists | n/a |
| G2-22 | Styles in scoped `styles.css` classes; Obsidian CSS variables; no hardcoded visual styles in TS | Pinned `HTML elements.md` (styles.css at plugin root; CSS vars `--background-modifier-border`, `--text-muted`; `{ cls: '...' }`) | `styles.css` committed with plugin-scoped class prefixes; theme-variable audit in U | U visual/theme audit before R4 |
| G2-23 | Sentence case for visible UI text | AGENTS.md rule | UI copy review at U | Manual acceptance |
| G2-24 | Details modals keyboard-openable, focus-managed, closable (DB-5) | `Modal` class (d.ts L4477: `scope: Scope`, `open/close/setTitle/setContent/setCloseCallback`); `ItemView.addAction` (L3604) | Details = `Modal` with `setTitle` + `setContent(DocumentFragment)`; Esc-close provided by Obsidian; focus handling reviewed in U | Manual acceptance (U) |
| G2-25 | Notifications without deprecated API | `Notice` (d.ts L4613: `noticeEl` deprecated — use `messageEl`; `containerEl` since 1.8.7) | Use `new Notice(msg, duration)` + `setMessage`; never touch `noticeEl` | n/a |
| G2-26 | Deferred Views accounted for; view types verified before use | `WorkspaceLeaf.isDeferred` / `loadIfDeferred(): Promise<void>` (d.ts L8295/L8301, since 1.7.2); `Workspace.revealLeaf(leaf): Promise<void>` (L~8200s); `Workspace.onLayoutReady(callback)` (L~7820s); `Workspace.activeLeaf` **deprecated** (use `getActiveViewOfType` / `getLeaf`) | Views guard `containerEl` access behind `onLayoutReady` + `isDeferred`/`loadIfDeferred()`; sheet view checks leaf view type before casting (U load-time/lifecycle audit) | Manual acceptance (U) |
| G2-27 | Settings tab without deprecated `display()` | `SettingTab.display()` **deprecated since 1.13.0** (d.ts L6654, use `getSettingDefinitions`); `PluginSettingTab` (L5149) — **no declared `plugin` field; subclass must assign `this.plugin` in its own constructor** (matches official `HTML elements.md` example) | Settings tab subclass stores `plugin` itself and implements `getSettingDefinitions()` | n/a |

### 1.4 Packaging and release (contract §11, §13 milestone R)

| # | Requirement | Source | Planned code/test enforcement | Release-time check |
|---|---|---|---|---|
| G2-28 | Installed dev plugin dir matches `manifest.json` id exactly | docs "Plugin guidelines" / "submit-plugin"; `PluginManifest.id` (d.ts L5096) | Documented copy/symlink workflow (S1 dev-vault task) asserts `character-plugin-vault/.obsidian/plugins/<id>/` == manifest id | R0: directory/manifest id match check |
| G2-29 | Release artifact set (`main.js`, `manifest.json`, `styles.css`) complete | docs "Releasing / Plugin guidelines" | Build scripts emit exactly these (plus `LICENSE`, `THIRD_PARTY_NOTICES.md`, `README` per contract LC-2/LC-3) | R4 dry run: file list verified against contract §13 |
| G2-30 | Attribution and license package ships with catalog | Contract LC-2 (catalog provenance file carries notices), LC-3 (`LICENSE`, user decision at R0) | `THIRD_PARTY_NOTICES.md` + catalog provenance (G3/G5) | R4: notices present and reference pinned Foundry SHA + CC-BY 4.0 + MIT |

## 2. Structural findings from the pinned `obsidian.d.ts` (drive G5/R0 decisions)

1. **`Plugin.settings?: unknown` (since 1.13.0)** replaces the old `options?` pattern — there is **no `options` field and no `projectRoot`** on `Plugin`.
2. **`PluginSettingTab` declares no `plugin` field** — only the constructor takes `plugin: Plugin`. Subclasses must assign it themselves (official example does this).
3. **`SettingTab.display()` is deprecated (1.13.0)** — settings UI must use `getSettingDefinitions()` / `getControlValue` / `setControlValue`.
4. **`Vault` has no `getMarkdownFileByPath`** (only `getFileByPath(path): TFile | null`), **no `list`** (that exists only on `DataAdapter`), and **no `getFolders()`** (use `getAllFolders(includeRoot?)`).
5. **`MarkdownRenderer.renderMarkdown` is deprecated** — use the 5-arg `MarkdownRenderer.render(app, markdown, el, sourcePath, component)`.
6. **`Workspace.activeLeaf` is deprecated/discouraged** — use `getActiveViewOfType()` / `getLeaf()`. Also deprecated: `rightRibbon`, `splitActiveLeaf`, old `duplicateLeaf`/`setActiveLeaf` signatures, `Notice.noticeEl`, `ButtonComponent.setWarning`.
7. **Deferred Views** live on `WorkspaceLeaf` (`isDeferred`, `loadIfDeferred()`), not `Workspace`.
8. **`Platform` is a const object** (`isDesktop`, `isMobile`, `isDesktopApp`, `isMobileApp`, `isIosApp`, `isAndroidApp`, `isPhone`, `isTablet`), not a namespace.
9. **`empty()` is a `Node` interface extension** (declare global), not a standalone function.
10. **`EventRef` is an empty marker interface.**
11. **`App` exposes**: `keymap`, `scope`, `workspace`, `vault`, `metadataCache`, `fileManager`, `lastEvent`, `renderContext`, `secretStorage`, `isDarkMode()`, `loadLocalStorage`, `saveLocalStorage`. No `internalPlugins`/`pluginHost`/`editorExtension`.
12. **`Vault.on`** supports exactly `create | modify | delete | rename` overloads (plus inherited `Events.on(name: string, ...)`).
13. **`requestUrl(request: RequestUrlParam | string): RequestUrlResponsePromise`** exists and is public — recorded for completeness; project must not call it at runtime (G2-08).

## 3. Deprecation inventory (all `@deprecated` hits in pinned file)

| Line | Symbol | Replacement |
|---|---|---|
| 1353 | `ButtonComponent.setWarning()` | `setDestructive()` |
| 2786 | `editorViewField` | `editorInfoField` |
| 3613 | `MetadataCache.iterateCacheRefs()` | (no replacement) |
| 4134 | `MarkdownRenderer.renderMarkdown` | `MarkdownRenderer.render` |
| 4616 | `Notice.noticeEl` | `messageEl` |
| 6654 | `SettingTab.display()` | `getSettingDefinitions()` |
| 6788 | `SliderComponent.setDynamicTooltip()` | tooltip always inline |
| 7781 | `Workspace.rightRibbon` | (no longer used) |
| 7798 | `Workspace.activeLeaf` | `getActiveViewOfType` / `getLeaf` |
| 7864 | `Workspace.splitActiveLeaf()` | `getLeaf(true)` |
| 7871 | `Workspace.duplicateLeaf(leaf, direction?)` old form | new overload |
| 7882 | `Workspace.getUnpinnedLeaf()` | `getLeaf(false)` |
| 7943 | `Workspace.setActiveLeaf(leaf, pushHistory, focus)` | new signature |

None of the APIs this project will use are deprecated.

## 4. Pinned developer-docs summaries (commit `c56c7e7`)

### 4.1 `en/Plugins/Vault.md`
- Vault API covers files visible in the app; hidden folders need the Adapter API.
- `read()` before modification; `cachedRead()` for display. Cache flushes on external-change notifications and Obsidian saves.
- **Always prefer `process()` over `read()`/`modify()` pairs** to avoid data loss. `process()` callback is synchronous; for async work: `cachedRead()` → async work → `process()` and verify inside the callback that data matches what `cachedRead()` returned (retry/confirm otherwise).
- `delete()` removes without trace; `trash()` moves to system or local `.trash`.
- `TAbstractFile` may be file or folder — `instanceof TFile` / `instanceof TFolder` before use.

### 4.2 `en/Plugins/User interface/HTML elements.md`
- Components expose container elements; official `PluginSettingTab` example assigns `this.plugin = plugin` in its own constructor.
- `containerEl.createEl('h1', { text: 'Heading 1' })` — returns the created element for chaining.
- Styles in `styles.css` at plugin root; use CSS variables (`--background-modifier-border`, `--text-muted`) for theme support; set classes via `{ cls: '...' }`; toggle with `toggleClass`.

## 5. Appendix B — verbatim API evidence (pinned `cc17443`, JSDoc trimmed)

```ts
// L406
export class App {
    keymap: Keymap;
    scope: Scope;
    workspace: Workspace;
    vault: Vault;
    metadataCache: MetadataCache;
    fileManager: FileManager;
    lastEvent: UserEvent | null;
    renderContext: RenderContext;
    secretStorage: SecretStorage;
    isDarkMode(): boolean;
    loadLocalStorage(key: string): any | null;
    saveLocalStorage(key: string, data: unknown | null): void;
}
```

```ts
// L1700
export interface Command {
    id: string;
    name: string;
    icon?: IconName;
    mobileOnly?: boolean;
    /** Whether holding the hotkey should repeatedly trigger this command. @defaultValue false */
    repeatable?: boolean;
    callback?: () => any;
    checkCallback?: (checking: boolean) => boolean | void;
    editorCallback?: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => any;
    editorCheckCallback?: (checking: boolean, editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => boolean | void;
    /**
     * Sets the default hotkey. It is recommended for plugins to avoid setting default hotkeys if possible,
     * to avoid conflicting hotkeys with one that's set by the user, even though customized hotkeys have higher priority.
     */
    hotkeys?: Hotkey[];
}

// L3435
export interface Hotkey {
    modifiers: Modifier[];
    key: string;
}
```

```ts
// L1835
export class Component {
    load(): void;
    onload(): void;
    unload(): void;
    onunload(): void;
    addChild<T extends Component>(component: T): T;
    removeChild<T extends Component>(component: T): T;
    register(cb: () => any): void;
    registerEvent(eventRef: EventRef): void;
    registerDomEvent<K extends keyof WindowEventMap>(el: Window, type: K, callback: (this: HTMLElement, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    registerDomEvent<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    registerInterval(id: number): number;
}
```

```ts
// L4901
export abstract class Plugin extends Component {
    app: App;
    manifest: PluginManifest;
    /**
     * Plugin settings. Assign loaded data here in `onload`. Declare a
     * concrete type on your subclass to type it.
     * @since 1.13.0
     */
    settings?: unknown;
    constructor(app: App, manifest: PluginManifest);
    onload(): Promise<void> | void;
    addRibbonIcon(icon: IconName, title: string, callback: (evt: MouseEvent) => any): HTMLElement;
    addStatusBarItem(): HTMLElement;
    addCommand(command: Command): Command;
    removeCommand(commandId: string): void;
    addSettingTab(settingTab: PluginSettingTab): void;
    registerView(type: string, viewCreator: ViewCreator): void;
    registerHoverLinkSource(id: string, info: HoverLinkSource): void;
    registerExtensions(extensions: string[], viewType: string): void;
    registerMarkdownPostProcessor(postProcessor: MarkdownPostProcessor, sortOrder?: number): MarkdownPostProcessor;
    registerMarkdownCodeBlockProcessor(language: string, handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<any> | void, sortOrder?: number): MarkdownPostProcessor;
    registerBasesView(viewId: string, registration: BasesViewRegistration): boolean;
    /** Registers a CodeMirror 6 extension. @since 0.12.8 */
    registerEditorExtension(extension: Extension): void;
    registerObsidianProtocolHandler(action: string, handler: ObsidianProtocolHandler): void;
    registerEditorSuggest(editorSuggest: EditorSuggest<any>): void;
    registerCliHandler(command: string, description: string, flags: CliFlags | null, handler: CliHandler): void;
    /** Load settings data from disk. Data is stored in `data.json` in the plugin folder. */
    loadData(): Promise<any>;
    /** Write settings data to disk. Data is stored in `data.json` in the plugin folder. */
    saveData(data: any): Promise<void>;
    onUserEnable(): void;
    onExternalSettingsChange?(): any;
}
```

```ts
// L5094
export interface PluginManifest {
    dir?: string;
    id: string;
    name: string;
    author: string;
    version: string;
    minAppVersion: string;
    description: string;
    authorUrl?: string;
    isDesktopOnly?: boolean;
}
```

```ts
// L5149
export abstract class PluginSettingTab extends SettingTab {
    constructor(app: App, plugin: Plugin);
    getSettingDefinitions(): SettingDefinitionItem[];   // since 1.13.0
    /** @since 1.13.0 — reads from `this.plugin.settings` */
    getControlValue(key: string): unknown;
    /** @since 1.13.0 — mutates and persists `this.plugin.settings` */
    setControlValue(key: string, value: unknown): void | Promise<void>;
}

// L6565
export class SettingTab extends Component {
    icon: IconName;
    app: App;
    containerEl: HTMLElement;
    settingItems: SettingDefinitionItem[];
    getSettingDefinitions(): SettingDefinitionItem[];
    update(): void;
    /** default reads from `this.app.vault.getConfig` */
    getControlValue(key: string): unknown;
    /** default writes via `this.app.vault.setConfig` */
    setControlValue(key: string, value: unknown): void | Promise<void>;
    refreshDomState(): void;
    /** @deprecated Since 1.13.0. Use getSettingDefinitions instead. */
    display(): void;
    hide(): void;
}
```

```ts
// L5695 (member list; each builder returns `this`)
export class Setting {
    settingEl: HTMLElement;
    infoEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;
    components: BaseComponent[];
    errorEl: HTMLElement | null;   // since 1.13.0
    constructor(containerEl: HTMLElement);
    setErrorMessage(message: string | null): this;
    addDisplayValue(cb: (component: DisplayValueComponent) => any): this;   // since 1.13.1
    setName(name: string | DocumentFragment): this;
    setDesc(desc: string | DocumentFragment): this;
    setClass(cls: string): this;
    setTooltip(tooltip: string, options?: TooltipOptions): this;
    setHeading(): this;
    setDisabled(disabled: boolean): this;
    addButton(cb: (component: ButtonComponent) => any): this;
    addExtraButton(cb: (component: ExtraButtonComponent) => any): this;
    addToggle(cb: (component: ToggleComponent) => any): this;
    addText(cb: (component: TextComponent) => any): this;
    addComponent<T extends BaseComponent>(cb: (el: HTMLElement) => T): this;
    addSearch(cb: (component: SearchComponent) => any): this;
    addTextArea(cb: (component: TextAreaComponent) => any): this;
    addMomentFormat(cb: (component: MomentFormatComponent) => any): this;
    addDropdown(cb: (component: DropdownComponent) => any): this;
    addColorPicker(cb: (component: ColorComponent) => any): this;
    addProgressBar(cb: (component: ProgressBarComponent) => any): this;
    addSlider(cb: (component: SliderComponent) => any): this;
    then(cb: (setting: this) => any): this;
    clear(): this;
}
```

```ts
// L2808
export interface EventRef { }

export class Events {
    on(name: string, callback: (...data: unknown[]) => unknown, ctx?: any): EventRef;
    off(name: string, callback: (...data: unknown[]) => unknown): void;
    offref(ref: EventRef): void;
    trigger(name: string, ...data: unknown[]): void;
    tryTrigger(evt: EventRef, args: unknown[]): void;
}
```

```ts
// L2954
processFrontMatter(file: TFile, fn: (frontmatter: any) => void, options?: DataWriteOptions): Promise<void>;
```

```ts
// L3590 / L7600
export abstract class ItemView extends View {
    contentEl: HTMLElement;
    constructor(leaf: WorkspaceLeaf);
    addAction(icon: IconName, title: string, callback: (evt: MouseEvent) => any): HTMLElement;
}

export abstract class View extends Component {
    app: App;
    icon: IconName;
    navigation: boolean;        // since 0.15.1
    leaf: WorkspaceLeaf;
    containerEl: HTMLElement;
    scope: Scope | null;        // since 1.5.7
    constructor(leaf: WorkspaceLeaf);
    protected onOpen(): Promise<void>;
    protected onClose(): Promise<void>;
    abstract getViewType(): string;
    // + getTitle/getDisplayText/getIcon/setTitle
}
```

```ts
// L4121
export class MarkdownRenderer {
    app: App;
    hoverPopover: HoverPopover | null;
    abstract get file(): TFile;
    /** @deprecated - use {@link MarkdownRenderer.render} */
    static renderMarkdown(markdown: string, el: HTMLElement, sourcePath: string, component: Component): Promise<void>;
    static render(app: App, markdown: string, el: HTMLElement, sourcePath: string, component: Component): Promise<void>;
}
```

```ts
// L4477
export class Modal implements HistoryHandler {
    app: App;
    scope: Scope;
    containerEl: HTMLElement;
    modalEl: HTMLElement;
    titleEl: HTMLElement;
    contentEl: HTMLElement;
    shouldRestoreSelection: boolean;
    constructor(app: App);
    open(): void;
    close(): void;
    onOpen(): Promise<void> | void;
    onClose(): void;
    setTitle(title: string): this;
    setContent(content: string | DocumentFragment): this;
    setCloseCallback(callback: () => any): this;
}
```

```ts
// L4606
export function normalizePath(path: string): string;
```

```ts
// L4613
export class Notice {
    /** @deprecated Use `messageEl` instead */
    noticeEl: HTMLElement;
    containerEl: HTMLElement;   // since 1.8.7
    messageEl: HTMLElement;     // since 1.8.7
    constructor(message: string | DocumentFragment, duration?: number);
    setMessage(message: string | DocumentFragment): this;
    hide(): void;
}
```

```ts
// L~4823
export const Platform: {
    isDesktop: boolean;
    isMobile: boolean;
    isDesktopApp: boolean;
    isMobileApp: boolean;
    isIosApp: boolean;
    isAndroidApp: boolean;
    isPhone: boolean;
    isTablet: boolean;
};
```

```ts
// L2006 (DataAdapter — low-level alternative; `Vault` itself has no `list`)
export interface DataAdapter {
    getName(): string;
    exists(normalizedPath: string, sensitive?: boolean): Promise<boolean>;
    stat(normalizedPath: string): Promise<Stat | null>;
    list(normalizedPath: string): Promise<ListedFiles>;
    read(normalizedPath: string): Promise<string>;
    readBinary(normalizedPath: string): Promise<ArrayBuffer>;
    write(normalizedPath: string, data: string, options?: DataWriteOptions): Promise<void>;
    writeBinary(normalizedPath: string, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    append(normalizedPath: string, data: string, options?: DataWriteOptions): Promise<void>;
    appendBinary(normalizedPath: string, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    process(normalizedPath: string, fn: (data: string) => string, options?: DataWriteOptions): Promise<string>;
    getResourcePath(normalizedPath: string): string;
    mkdir(normalizedPath: string): Promise<void>;
    trashSystem(normalizedPath: string): Promise<boolean>;
    // + trashLocal, rename, remove, removeBinary
}
```

```ts
// L7337
export class Vault extends Events {
    adapter: DataAdapter;
    configDir: string;
    getName(): string;
    getFileByPath(path: string): TFile | null;
    getFolderByPath(path: string): TFolder | null;
    getAbstractFileByPath(path: string): TAbstractFile | null;
    getRoot(): TFolder;
    create(path: string, data: string, options?: DataWriteOptions): Promise<TFile>;
    createBinary(path: string, data: ArrayBuffer, options?: DataWriteOptions): Promise<TFile>;
    createFolder(path: string): Promise<TFolder>;
    read(file: TFile): Promise<string>;
    cachedRead(file: TFile): Promise<string>;
    readBinary(file: TFile): Promise<ArrayBuffer>;
    getResourcePath(file: TFile): string;
    delete(file: TAbstractFile, force?: boolean): Promise<void>;
    trash(file: TAbstractFile, system: boolean): Promise<void>;
    rename(file: TAbstractFile, newPath: string): Promise<void>;
    modify(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    modifyBinary(file: TFile, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    append(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    appendBinary(file: TFile, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    /** Atomically read, modify, and save the contents of a note. */
    process(file: TFile, fn: (data: string) => string, options?: DataWriteOptions): Promise<string>;
    copy<T extends TAbstractFile>(file: T, newPath: string): Promise<T>;
    getAllLoadedFiles(): TAbstractFile[];
    getAllFolders(includeRoot?: boolean): TFolder[];
    static recurseChildren(root: TFolder, cb: (file: TAbstractFile) => any): void;
    getMarkdownFiles(): TFile[];
    getFiles(): TFile[];
    on(name: 'create', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    on(name: 'modify', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    on(name: 'delete', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;
}

export abstract class TAbstractFile {
    vault: Vault;
    path: string;
    name: string;
    parent: TFolder | null;
}
export class TFile extends TAbstractFile {
    stat: FileStats;
    basename: string;
    extension: string;
}
export class TFolder extends TAbstractFile {
    children: TAbstractFile[];
    isRoot(): boolean;
}
```

```ts
// Workspace (L~7740; member selection — deprecated members marked)
export class Workspace extends Events {
    leftSplit: WorkspaceSidedock | WorkspaceMobileDrawer;
    rightSplit: WorkspaceSidedock | WorkspaceMobileDrawer;
    leftRibbon: WorkspaceRibbon;
    /** @deprecated No longer used */
    rightRibbon: WorkspaceRibbon;
    rootSplit: WorkspaceRoot;
    /** @deprecated — use getActiveViewOfType / getLeaf */
    activeLeaf: WorkspaceLeaf | null;
    containerEl: HTMLElement;
    layoutReady: boolean;
    requestSaveLayout: Debouncer<[], Promise<void>>;
    activeEditor: MarkdownFileInfo | null;
    onLayoutReady(callback: () => any): void;          // since 0.11.0
    changeLayout(workspace: any): Promise<void>;
    getLayout(): Record<string, unknown>;
    createLeafInParent(parent: WorkspaceSplit, index: number): WorkspaceLeaf;
    createLeafBySplit(leaf: WorkspaceLeaf, direction?: SplitDirection, before?: boolean): WorkspaceLeaf;
    /** @deprecated — use getLeaf(true) */
    splitActiveLeaf(direction?: SplitDirection): WorkspaceLeaf;
    duplicateLeaf(leaf: WorkspaceLeaf, leafType: PaneType | boolean, direction?: SplitDirection): Promise<WorkspaceLeaf>;
    /** @deprecated — use getLeaf(false) */
    getUnpinnedLeaf(): WorkspaceLeaf;
    getLeaf(newLeaf?: 'split', direction?: SplitDirection): WorkspaceLeaf;
    getLeaf(newLeaf?: PaneType | boolean): WorkspaceLeaf;
    moveLeafToPopout(leaf: WorkspaceLeaf, data?: WorkspaceWindowInitData): WorkspaceWindow;
    openPopoutLeaf(data?: WorkspaceWindowInitData): WorkspaceLeaf;
    openLinkText(linktext: string, sourcePath: string, newLeaf?: PaneType | boolean, openViewState?: OpenViewState): Promise<void>;
    setActiveLeaf(leaf: WorkspaceLeaf, params?: { focus?: boolean }): void;
    getLeafById(id: string): WorkspaceLeaf | null;
    getGroupLeaves(group: string): WorkspaceLeaf[];
    getMostRecentLeaf(root?: WorkspaceParent): WorkspaceLeaf | null;
    getLeftLeaf(split: boolean): WorkspaceLeaf | null;
    getRightLeaf(split: boolean): WorkspaceLeaf | null;
    ensureSideLeaf(type: string, side: Side, options?: { active?: boolean; split?: boolean; reveal?: boolean; state?: any }): Promise<WorkspaceLeaf>;
    getActiveViewOfType<T extends View>(type: Constructor<T>): T | null;
    getActiveFile(): TFile | null;
    iterateRootLeaves(callback: (leaf: WorkspaceLeaf) => any): void;
    iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => any): void;
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    detachLeavesOfType(viewType: string): void;
    /** Bring a leaf to the foreground; await to ensure it is not deferred. @since 1.7.2 */
    revealLeaf(leaf: WorkspaceLeaf): Promise<void>;
    getLastOpenFiles(): string[];
    updateOptions(): void;
    handleLinkContextMenu(menu: Menu, linktext: string, sourcePath: string, leaf?: WorkspaceLeaf): boolean;
}

// L8244
export class WorkspaceLeaf extends WorkspaceItem implements HoverParent {
    /** @since 1.7.2 — true if the leaf currently holds a DeferredView */
    get isDeferred(): boolean;
    /** @since 1.7.2 */
    loadIfDeferred(): Promise<void>;
}
```

```ts
// DOM creation helpers (declare global, d.ts L20–203)
interface DomElementInfo {
    cls?: string | string[];
    text?: string | DocumentFragment;
    attr?: { [key: string]: string | number | boolean | null };
    title?: string;
    parent?: Node;
    value?: string;
    type?: string;
    prepend?: boolean;
    placeholder?: string;
    href?: string;
}
function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: DomElementInfo | string, callback?: (el: HTMLElementTagNameMap[K]) => any): HTMLElementTagNameMap[K];
function createDiv(o?: DomElementInfo | string, callback?: (el: HTMLDivElement) => any): HTMLDivElement;
function createSpan(o?: DomElementInfo | string, callback?: (el: HTMLSpanElement) => any): HTMLSpanElement;
function createFragment(cb: (fr: DocumentFragment) => any): DocumentFragment;
// Node extensions include: empty(), detach(), insertAfter, appendText, setChildrenInPlace, createEl/createDiv/createSpan
```

```ts
// requestUrl — existence evidence only; MUST NOT be used at runtime
export function requestUrl(request: RequestUrlParam | string): RequestUrlResponsePromise;

export interface RequestUrlParam {
    url: string;
    method?: string;
    contentType?: string;
    body?: string | ArrayBuffer;
    headers?: Record<string, string>;
    throw?: boolean;
}
```

## 6. Verified absences (grep-confirmed in the 8498-line file)

- `Plugin.options`, `Plugin.projectRoot`
- `App.internalPlugins`, `App.pluginHost`, `App.editorExtension`
- `Vault.getMarkdownFileByPath`, `Vault.list`, `Vault.getFolders`
- `Workspace.iterLeavesOfType`, `Workspace.getActiveLeavesOfType`
- `SettingTab.plugin` / `PluginSettingTab.plugin` declared fields
- Standalone `empty()` function (it is `Node.empty()`)

## 7. Exit statement

**No unresolved policy question blocks the baseline architecture (G2 exit).** Decisions forced by the audit and now fixed for G5:

1. `minAppVersion: "1.13.0"` (modern settings API floor).
2. Settings via `Plugin.settings` + `getSettingDefinitions()`; subclass assigns its own `plugin` reference.
3. Character persistence via `Vault` only: `process()` for atomic mutation (CP-5), `cachedRead()` for display, `trash()` for delete, `getFileByPath` for lookup, `normalizePath` for all constructed paths.
4. No default hotkeys; no `requestUrl` at runtime; `innerHTML`/`outerHTML`/`insertAdjacentHTML` banned in `src/` by lint.
5. Deferred Views handled via `WorkspaceLeaf.isDeferred` / `loadIfDeferred()` / `Workspace.revealLeaf()`; `Workspace.activeLeaf` never used.
6. Description rendering via allowlist sanitizer + `MarkdownRenderer.render` (5-arg form).

Re-verification obligation: the two fetched developer-doc pages and the pinned `obsidian.d.ts` SHA above are the evidence base; if the `obsidian-api` master SHA moves before implementation starts, G5/S0 must re-pin and re-run this audit's grep checks (commands: `grep -n '@deprecated' obsidian.d.ts`, plus the absence list in §6).
