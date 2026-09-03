import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Manifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  isDesktopOnly: boolean;
}

function loadManifest(): Manifest {
  const raw = readFileSync(new URL("../manifest.json", import.meta.url), "utf8");
  return JSON.parse(raw) as Manifest;
}

describe("manifest.json (S0 baseline)", () => {
  it("uses the approved plugin id that names the dev-install directory", () => {
    expect(loadManifest().id).toBe("dnd-character");
  });

  it("carries the evidence-based app-version and platform claims", () => {
    const manifest = loadManifest();
    expect(manifest.minAppVersion).toBe("1.13.0");
    expect(manifest.isDesktopOnly).toBe(false);
  });

  it("has a semver version and non-empty name and description", () => {
    const manifest = loadManifest();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.name.trim().length).toBeGreaterThan(0);
    expect(manifest.description.trim().length).toBeGreaterThan(0);
  });
});
