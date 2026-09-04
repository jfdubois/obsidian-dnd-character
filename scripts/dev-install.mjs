import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COPIED_FILES = ["main.js", "manifest.json", "styles.css"];
const PLUGIN_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Copies main.js, manifest.json, and styles.css from the repository root into
 * the development vault plugin directory named after the manifest id.
 * Never deletes files, so an existing data.json (plugin settings) is preserved.
 *
 * @param {object} options
 * @param {string} options.repoRoot Directory containing manifest.json, main.js, and styles.css.
 * @param {string} options.vaultRoot Development vault root (character-plugin-vault).
 * @returns {{pluginId: string, pluginDir: string, copiedFiles: string[], dataJsonPreserved: boolean}}
 */
export function devInstall({ repoRoot, vaultRoot }) {
  const manifestPath = path.join(repoRoot, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${repoRoot}. Pass --repo-root pointing at the repository root.`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `manifest.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  const pluginId = manifest && typeof manifest === "object" ? manifest.id : undefined;
  if (typeof pluginId !== "string" || !PLUGIN_ID_PATTERN.test(pluginId)) {
    const shown = pluginId === undefined ? "is missing" : JSON.stringify(pluginId);
    throw new Error(
      `manifest.json id ${shown} is not a safe plugin id ` +
        "(expected lowercase letters, digits, and hyphens, e.g. \"dnd-character\")."
    );
  }

  for (const file of COPIED_FILES) {
    if (!existsSync(path.join(repoRoot, file))) {
      throw new Error(`${file} not found in ${repoRoot}. Run "npm run build:dev" first.`);
    }
  }

  const pluginDir = path.join(vaultRoot, ".obsidian", "plugins", pluginId);
  const dataJsonPreserved = existsSync(path.join(pluginDir, "data.json"));
  mkdirSync(pluginDir, { recursive: true });
  for (const file of COPIED_FILES) {
    cpSync(path.join(repoRoot, file), path.join(pluginDir, file));
  }

  return { pluginId, pluginDir, copiedFiles: [...COPIED_FILES], dataJsonPreserved };
}

/**
 * @param {string[]} argv
 * @returns {Record<string, string>}
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--repo-root" || arg === "--vault") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error(`${arg} requires a non-empty directory value`);
      }
      args[arg.slice(2)] = value;
      i++;
    } else {
      throw new Error(`Unknown argument: ${arg} (expected --repo-root and/or --vault)`);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(args["repo-root"] ?? path.dirname(scriptDir));
  const vaultRoot = path.resolve(args["vault"] ?? path.join(repoRoot, "character-plugin-vault"));

  const result = devInstall({ repoRoot, vaultRoot });
  console.log(`Installed plugin "${result.pluginId}" into ${result.pluginDir}`);
  console.log(`Copied: ${result.copiedFiles.join(", ")}`);
  console.log(
    result.dataJsonPreserved
      ? "Preserved existing data.json (plugin settings kept)."
      : "No existing data.json to preserve."
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(`dev-install: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
