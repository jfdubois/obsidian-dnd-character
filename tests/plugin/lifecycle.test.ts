import { describe, expect, it } from "vitest";
import type { App, PluginManifest } from "obsidian";
import { Notice } from "../stubs/obsidian";
import DndCharacterPlugin from "../../src/main";
import { DndCharacterSettingTab } from "../../src/plugin/settings-tab";

interface StubHost {
  commands: { id: string; name: string; callback?: () => void }[];
  settingTabs: unknown[];
  savedData: unknown;
  setLoadDataResult(value: unknown): void;
  unload(): void;
}

const app: App = {} as App;
const manifest: PluginManifest = {
  id: "dnd-character",
  name: "D&D Character",
  version: "0.1.0",
  minAppVersion: "1.13.0",
  description: "test",
  author: "test"
};

function hostOf(plugin: DndCharacterPlugin): StubHost {
  return plugin as unknown as StubHost;
}

describe("DndCharacterPlugin lifecycle", () => {
  it("registers the settings tab and the five commands on load", async () => {
    const plugin = new DndCharacterPlugin(app, manifest);
    await plugin.onload();
    const host = hostOf(plugin);
    expect(host.settingTabs).toHaveLength(1);
    expect(host.settingTabs[0]).toBeInstanceOf(DndCharacterSettingTab);
    // obsidian.d.ts:4951 — command ids and names are prefixed with the
    // plugin's id and name.
    expect(host.commands.map((command) => command.id)).toEqual([
      "dnd-character.open-sheet",
      "dnd-character.open-creator",
      "dnd-character.short-rest",
      "dnd-character.long-rest",
      "dnd-character.level-up"
    ]);
    expect(host.commands.map((command) => command.name)).toEqual([
      "D&D Character: Open character sheet",
      "D&D Character: Open character creator",
      "D&D Character: Take a short rest",
      "D&D Character: Take a long rest",
      "D&D Character: Level up"
    ]);
    expect(new Set(host.commands.map((command) => command.id)).size).toBe(5);
  });

  it("survives an unload/reload cycle without duplicate registrations", async () => {
    const plugin = new DndCharacterPlugin(app, manifest);
    await plugin.onload();
    hostOf(plugin).unload();
    await plugin.onload();
    const host = hostOf(plugin);
    expect(host.settingTabs).toHaveLength(1);
    expect(host.commands.map((command) => command.id)).toEqual([
      "dnd-character.open-sheet",
      "dnd-character.open-creator",
      "dnd-character.short-rest",
      "dnd-character.long-rest",
      "dnd-character.level-up"
    ]);
    expect(new Set(host.commands.map((command) => command.id)).size).toBe(5);
  });

  it("loads stored settings over the defaults", async () => {
    const plugin = new DndCharacterPlugin(app, manifest);
    hostOf(plugin).setLoadDataResult({
      characterFolder: "Saved Folder",
      defaultRuleset: "2014"
    });
    await plugin.onload();
    expect(plugin.settings).toEqual({
      characterFolder: "Saved Folder",
      defaultRuleset: "2014"
    });
  });

  it("falls back to defaults for invalid stored settings", async () => {
    const plugin = new DndCharacterPlugin(app, manifest);
    hostOf(plugin).setLoadDataResult({
      characterFolder: "../bad",
      defaultRuleset: "2015"
    });
    await plugin.onload();
    expect(plugin.settings).toEqual({
      characterFolder: "Characters",
      defaultRuleset: "2024"
    });
  });

  it("persists a settings change through saveData", async () => {
    const plugin = new DndCharacterPlugin(app, manifest);
    await plugin.onload();
    const host = hostOf(plugin);
    const tab = host.settingTabs[0] as DndCharacterSettingTab;
    await tab.setControlValue("characterFolder", "New Folder");
    expect(plugin.settings.characterFolder).toBe("New Folder");
    expect(host.savedData).toEqual({
      characterFolder: "New Folder",
      defaultRuleset: "2024"
    });
  });

  it("keeps settings across a simulated reload", async () => {
    const first = new DndCharacterPlugin(app, manifest);
    await first.onload();
    const firstHost = hostOf(first);
    await (firstHost.settingTabs[0] as DndCharacterSettingTab).setControlValue(
      "defaultRuleset",
      "2014"
    );

    const second = new DndCharacterPlugin(app, manifest);
    hostOf(second).setLoadDataResult(firstHost.savedData);
    await second.onload();
    expect(second.settings).toEqual({
      characterFolder: "Characters",
      defaultRuleset: "2014"
    });
  });
});

describe("DndCharacterSettingTab", () => {
  function makeTab(): DndCharacterSettingTab {
    const plugin = new DndCharacterPlugin(app, manifest);
    return new DndCharacterSettingTab(app, plugin);
  }

  it("defines exactly the two baseline settings", () => {
    const definitions = makeTab().getSettingDefinitions();
    expect(definitions).toHaveLength(2);
    const [folder, ruleset] = definitions as {
      name: string;
      control: {
        type: string;
        key: string;
        defaultValue: string;
        options?: Record<string, string>;
      };
    }[];
    expect(folder.name).toBe("Character folder");
    expect(folder.control.type).toBe("text");
    expect(folder.control.key).toBe("characterFolder");
    expect(folder.control.defaultValue).toBe("Characters");
    expect(ruleset.name).toBe("Default ruleset");
    expect(ruleset.control.type).toBe("dropdown");
    expect(ruleset.control.key).toBe("defaultRuleset");
    expect(ruleset.control.defaultValue).toBe("2024");
    expect(ruleset.control.options).toEqual({
      "2014": "D&D 5e (2014 rules)",
      "2024": "D&D 5e (2024 rules)"
    });
  });

  it("validates the folder input inline", () => {
    const [folder] = makeTab().getSettingDefinitions() as {
      control: { validate?: (value: string) => string | void };
    }[];
    expect(folder.control.validate?.("../Characters")).toBeTypeOf("string");
    expect(folder.control.validate?.("Characters")).toBeUndefined();
  });
});

describe("command callbacks", () => {
  it("notify that features are not available yet", async () => {
    Notice.instances.length = 0;
    const plugin = new DndCharacterPlugin(app, manifest);
    await plugin.onload();
    for (const command of hostOf(plugin).commands) {
      command.callback?.();
    }
    expect(Notice.instances).toHaveLength(5);
    for (const message of Notice.instances) {
      expect(message.endsWith(" is not available yet.")).toBe(true);
    }
  });
});
