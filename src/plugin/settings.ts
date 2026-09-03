export type Ruleset = "2014" | "2024";

export interface DndCharacterSettings {
  characterFolder: string;
  defaultRuleset: Ruleset;
}

export const DEFAULT_SETTINGS: Readonly<DndCharacterSettings> = {
  characterFolder: "Characters",
  defaultRuleset: "2024"
};

export function validateCharacterFolder(value: string): string | void {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Enter a folder name.";
  }
  if (trimmed.includes("\\")) {
    return "Use forward slashes in folder paths.";
  }
  for (const segment of trimmed.split("/")) {
    if (segment.trim().length === 0) {
      return "Use a vault-relative folder path.";
    }
    if (segment === "." || segment === "..") {
      return "Folder paths cannot contain . or .. segments.";
    }
  }
}

function isRuleset(value: unknown): value is Ruleset {
  return value === "2014" || value === "2024";
}

export function loadSettings(raw: unknown): DndCharacterSettings {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_SETTINGS };
  }
  const stored = raw as Record<string, unknown>;
  let characterFolder = DEFAULT_SETTINGS.characterFolder;
  if (typeof stored.characterFolder === "string") {
    const trimmed = stored.characterFolder.trim();
    if (validateCharacterFolder(trimmed) === undefined) {
      characterFolder = trimmed;
    }
  }
  const defaultRuleset: Ruleset = isRuleset(stored.defaultRuleset)
    ? stored.defaultRuleset
    : DEFAULT_SETTINGS.defaultRuleset;
  return { characterFolder, defaultRuleset };
}
