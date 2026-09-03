export const COMMAND_IDS = {
  openSheet: "open-sheet",
  openCreator: "open-creator",
  shortRest: "short-rest",
  longRest: "long-rest",
  levelUp: "level-up"
} as const;

export interface PluginCommandSpec {
  id: string;
  name: string;
  callback: () => void;
}

export function createCommandSpecs(
  notify: (message: string) => void
): PluginCommandSpec[] {
  const unavailable = (feature: string) => () => {
    notify(`${feature} is not available yet.`);
  };
  return [
    {
      id: COMMAND_IDS.openSheet,
      name: "Open character sheet",
      callback: unavailable("Opening the character sheet")
    },
    {
      id: COMMAND_IDS.openCreator,
      name: "Open character creator",
      callback: unavailable("Opening the character creator")
    },
    {
      id: COMMAND_IDS.shortRest,
      name: "Take a short rest",
      callback: unavailable("Short rests")
    },
    {
      id: COMMAND_IDS.longRest,
      name: "Take a long rest",
      callback: unavailable("Long rests")
    },
    {
      id: COMMAND_IDS.levelUp,
      name: "Level up",
      callback: unavailable("Leveling up")
    }
  ];
}
