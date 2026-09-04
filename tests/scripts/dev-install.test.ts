import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "dev-install.mjs");

const MANIFEST = {
  id: "dnd-character",
  name: "D&D Character",
  version: "0.1.0",
  minAppVersion: "1.13.0",
  description: "Test manifest.",
  isDesktopOnly: false
};
const MANIFEST_TEXT = JSON.stringify(MANIFEST, null, 2) + "\n";

interface Fixture {
  root: string;
  repo: string;
  vault: string;
}

const fixtures: Fixture[] = [];

function makeFixture(): Fixture {
  const root = mkdtempSync(path.join(REPO_ROOT, ".tmp", "dev-install-"));
  const repo = path.join(root, "repo");
  const vault = path.join(root, "vault");
  mkdirSync(repo, { recursive: true });
  mkdirSync(path.join(vault, ".obsidian"), { recursive: true });
  writeFileSync(path.join(repo, "manifest.json"), MANIFEST_TEXT);
  writeFileSync(path.join(repo, "main.js"), 'console.log("main v1");\n');
  writeFileSync(path.join(repo, "styles.css"), ".dnd-character { color: red; }\n");
  const fixture: Fixture = { root, repo, vault };
  fixtures.push(fixture);
  return fixture;
}

function pluginDirOf(vault: string): string {
  return path.join(vault, ".obsidian", "plugins", "dnd-character");
}

interface InstallResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runInstall(repo: string, vault: string): InstallResult {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT_PATH, "--repo-root", repo, "--vault", vault], {
      encoding: "utf8"
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? -1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? ""
    };
  }
}

afterEach(() => {
  while (fixtures.length > 0) {
    const fixture = fixtures.pop();
    if (fixture) rmSync(fixture.root, { recursive: true, force: true });
  }
});

describe("scripts/dev-install.mjs", () => {
  it("copies main.js, manifest.json, and styles.css into the manifest-id plugin directory", () => {
    const fixture = makeFixture();
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(0);
    const pluginDir = pluginDirOf(fixture.vault);
    expect(readFileSync(path.join(pluginDir, "main.js"), "utf8")).toBe('console.log("main v1");\n');
    expect(readFileSync(path.join(pluginDir, "manifest.json"), "utf8")).toBe(MANIFEST_TEXT);
    expect(readFileSync(path.join(pluginDir, "styles.css"), "utf8")).toBe(".dnd-character { color: red; }\n");
    expect(result.stdout).toContain(pluginDir);
    expect(result.stdout).toContain("No existing data.json");
  });

  it("refreshes copied files on re-run and preserves the plugin data.json", () => {
    const fixture = makeFixture();
    expect(runInstall(fixture.repo, fixture.vault).status).toBe(0);
    const pluginDir = pluginDirOf(fixture.vault);
    const dataJson = JSON.stringify({ characterFolder: "MyChars", defaultRuleset: "2024" });
    writeFileSync(path.join(pluginDir, "data.json"), dataJson);
    writeFileSync(path.join(fixture.repo, "main.js"), 'console.log("main v2");\n');
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(0);
    expect(readFileSync(path.join(pluginDir, "main.js"), "utf8")).toBe('console.log("main v2");\n');
    expect(readFileSync(path.join(pluginDir, "data.json"), "utf8")).toBe(dataJson);
    expect(result.stdout).toContain("Preserved existing data.json");
  });

  it("fails with the build hint when main.js is missing", () => {
    const fixture = makeFixture();
    rmSync(path.join(fixture.repo, "main.js"));
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("npm run build:dev");
    expect(existsSync(path.join(fixture.vault, ".obsidian", "plugins"))).toBe(false);
  });

  it("rejects a manifest id that could escape the plugins directory", () => {
    const fixture = makeFixture();
    writeFileSync(path.join(fixture.repo, "manifest.json"), JSON.stringify({ ...MANIFEST, id: "../evil" }, null, 2) + "\n");
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id");
    expect(existsSync(path.join(fixture.vault, ".obsidian", "plugins"))).toBe(false);
    expect(existsSync(path.join(fixture.vault, ".obsidian", "evil"))).toBe(false);
  });

  it("creates the vault plugin directory when the vault does not exist yet", () => {
    const fixture = makeFixture();
    rmSync(fixture.vault, { recursive: true, force: true });
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(0);
    expect(existsSync(path.join(pluginDirOf(fixture.vault), "main.js"))).toBe(true);
  });

  it("fails when manifest.json is missing", () => {
    const fixture = makeFixture();
    rmSync(path.join(fixture.repo, "manifest.json"));
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("manifest.json not found");
    expect(existsSync(path.join(fixture.vault, ".obsidian", "plugins"))).toBe(false);
  });

  it("fails when manifest.json is not valid JSON", () => {
    const fixture = makeFixture();
    writeFileSync(path.join(fixture.repo, "manifest.json"), "{ not json\n");
    const result = runInstall(fixture.repo, fixture.vault);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not valid JSON");
    expect(existsSync(path.join(fixture.vault, ".obsidian", "plugins"))).toBe(false);
  });
});
