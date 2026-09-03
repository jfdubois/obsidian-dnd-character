// Minimal runtime stand-in for the `obsidian` package, used only by vitest
// (see vitest.config.mts). The TypeScript compiler still resolves the real
// `obsidian` types from node_modules; this stub provides just enough runtime
// behavior for the S1 unit tests.
//
// App-internal behaviors that are modeled here (not part of the plugin-author
// API): the automatic command id/name prefixing documented at
// obsidian.d.ts:4951, and the app-managed removal of a plugin's registered
// commands and setting tabs on plugin unload (obsidian.d.ts:4957-4958 states
// manual `removeCommand` "should not be needed", i.e. plugin-scoped
// registration is managed by the app).

export interface StubCommand {
  id: string;
  name: string;
  callback?: () => void;
}

export interface StubPluginSettingsHost {
  settings: Record<string, unknown>;
  saveData(data: unknown): Promise<void>;
}

export interface StubManifest {
  id: string;
  name: string;
}

export class Plugin {
  app: unknown;
  savedData: unknown = undefined;
  readonly settingTabs: unknown[] = [];
  private loadDataResult: unknown = null;
  private manifest: StubManifest;
  private commandRegistry = new Map<string, StubCommand>();

  constructor(app: unknown, manifest: StubManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  get commands(): StubCommand[] {
    return [...this.commandRegistry.values()];
  }

  setLoadDataResult(value: unknown): void {
    this.loadDataResult = value;
  }

  addCommand(command: StubCommand): StubCommand {
    command.id = `${this.manifest.id}.${command.id}`;
    command.name = `${this.manifest.name}: ${command.name}`;
    this.commandRegistry.set(command.id, command);
    return command;
  }

  addSettingTab(tab: unknown): void {
    this.settingTabs.push(tab);
  }

  unload(): void {
    this.commandRegistry.clear();
    this.settingTabs.length = 0;
  }

  async loadData(): Promise<unknown> {
    return this.loadDataResult;
  }

  async saveData(data: unknown): Promise<void> {
    this.savedData = data;
  }
}

export class PluginSettingTab {
  app: unknown;
  plugin: StubPluginSettingsHost | null = null;

  constructor(app: unknown, plugin: unknown) {
    this.app = app;
    this.plugin = plugin as StubPluginSettingsHost | null;
  }

  getSettingDefinitions(): unknown[] {
    return [];
  }

  getControlValue(key: string): unknown {
    return this.plugin?.settings[key];
  }

  // Partial model of the 1.13 settings-definitions pipeline: the real
  // `setControlValue` also runs the control's `validate` and surfaces inline
  // errors before persisting (Obsidian 1.13 settings definitions docs). The
  // stub applies the value directly; do not assert validate-on-change
  // behavior against it.
  async setControlValue(key: string, value: unknown): Promise<void> {
    if (this.plugin === null) return;
    this.plugin.settings[key] = value;
    await this.plugin.saveData(this.plugin.settings);
  }
}

export class Notice {
  static readonly instances: string[] = [];

  constructor(readonly message: string) {
    Notice.instances.push(message);
  }
}
