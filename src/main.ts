import { Notice, Plugin } from "obsidian";
import { createCommandSpecs } from "./plugin/commands";
import { DEFAULT_SETTINGS, loadSettings } from "./plugin/settings";
import type { DndCharacterSettings } from "./plugin/settings";
import { DndCharacterSettingTab } from "./plugin/settings-tab";

export default class DndCharacterPlugin extends Plugin {
  settings: DndCharacterSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    this.settings = loadSettings(await this.loadData());
    this.addSettingTab(new DndCharacterSettingTab(this.app, this));
    for (const spec of createCommandSpecs((message) => new Notice(message))) {
      this.addCommand({ id: spec.id, name: spec.name, callback: spec.callback });
    }
  }
}
