import { PluginSettingTab } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import { DEFAULT_SETTINGS, validateCharacterFolder } from "./settings";
import type DndCharacterPlugin from "../main";

export class DndCharacterSettingTab extends PluginSettingTab {
  plugin: DndCharacterPlugin;

  constructor(app: App, plugin: DndCharacterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: "Character folder",
        desc: "Vault folder where character files are stored.",
        control: {
          type: "text",
          key: "characterFolder",
          placeholder: DEFAULT_SETTINGS.characterFolder,
          defaultValue: DEFAULT_SETTINGS.characterFolder,
          validate: (value: string) => validateCharacterFolder(value)
        }
      },
      {
        name: "Default ruleset",
        desc: "Ruleset used for new characters.",
        control: {
          type: "dropdown",
          key: "defaultRuleset",
          defaultValue: DEFAULT_SETTINGS.defaultRuleset,
          options: {
            "2014": "D&D 5e (2014 rules)",
            "2024": "D&D 5e (2024 rules)"
          }
        }
      }
    ];
  }
}
