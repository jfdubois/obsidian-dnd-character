import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const generatorPath = path.join(repoRoot, "scripts", "foundry-catalog", "generate.mjs");
const lockPath = path.join(repoRoot, "scripts", "foundry-catalog", "source-lock.json");
const generatedDir = path.join(repoRoot, "src", "catalog", "generated");
const defaultSourceRoot = path.join(repoRoot, ".tmp", "g3", "foundry-dnd5e");

const ARTIFACTS = [
  "srd-catalog.full.json",
  "srd-catalog.runtime.json",
  "srd-catalog.provenance.json",
  "srd-catalog.coverage.json",
] as const;

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runGenerate(args: string[] = []): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile("node", [generatorPath, ...args], { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      const rawCode = error ? (error as { code?: string | number }).code : 0;
      resolve({
        code: typeof rawCode === "number" ? rawCode : 1,
        stdout: String(stdout),
        stderr: String(stderr),
      });
    });
  });
}

async function sha256(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

interface SourceLock {
  commit: string;
  repository: string;
  packNames: string[];
  premiumExclusions: { path: string; sourceBook: string; reason: string }[];
  attribution: string;
}

async function readLock(): Promise<SourceLock> {
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  return {
    commit: lock.source.commit,
    repository: lock.source.repository,
    packNames: lock.packs.map((pack: { name: string }) => pack.name),
    premiumExclusions: lock.premiumExclusions,
    attribution: lock.licenses.srdContent.attributionRequired,
  };
}

describe("foundry catalog generator (S3)", () => {
  it("extracts the S3 fixture set at the pinned revision", async () => {
    const lock = await readLock();
    expect(existsSync(defaultSourceRoot), "pinned checkout missing at .tmp/g3/foundry-dnd5e — re-clone at the locked commit").toBe(true);
    const head = execFileSync("git", ["-C", defaultSourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    expect(head, "pinned checkout is not at the locked commit").toBe(lock.commit);

    const run = await runGenerate();
    expect(run.stderr).toBe("");
    expect(run.code).toBe(0);

    const full = JSON.parse(await readFile(path.join(generatedDir, "srd-catalog.full.json"), "utf8"));
    expect(full.map((entry: { sourcePath: string }) => entry.sourcePath)).toEqual([
      "classes24/paladin",
      "classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon",
    ]);
    for (const entry of full) {
      expect(entry.pack).toBe("classes24");
      expect(typeof entry.record).toBe("object");
      expect(entry.record).not.toBeNull();
    }
    expect(full[0].record.name).toBe("Paladin");
    expect(full[0].record.type).toBe("class");
    expect(full[1].record.name).toBe("Sacred Weapon");
    expect(full[1].record.type).toBe("feat");

    const runtime = JSON.parse(await readFile(path.join(generatedDir, "srd-catalog.runtime.json"), "utf8"));
    expect(runtime.map((entry: { sourcePath: string }) => entry.sourcePath)).toEqual(
      full.map((entry: { sourcePath: string }) => entry.sourcePath),
    );

    const provenance = JSON.parse(await readFile(path.join(generatedDir, "srd-catalog.provenance.json"), "utf8"));
    expect(provenance.foundrySha).toBe(lock.commit);
    expect(provenance.repository).toBe(lock.repository);
    expect(provenance.generationCommand).toBe("npm run catalog:generate");
    expect(provenance.packs.classes24).toEqual({ records: 2, inRuntime: true });
    expect(provenance.attribution).toEqual([lock.attribution]);
    const exclusion = provenance.exclusions.find((entry: { sourcePath: string }) => entry.sourcePath === "monsterfeatures24/actions/possession");
    expect(exclusion, "LC-1 exclusion for possession missing from provenance").toBeDefined();
    expect(exclusion.reason).toContain("LC-1");

    const coverage = JSON.parse(await readFile(path.join(generatedDir, "srd-catalog.coverage.json"), "utf8"));
    expect(coverage.premiumExclusions).toEqual([
      expect.objectContaining({
        sourcePath: "monsterfeatures24/actions/possession",
        book: "MM 2024",
      }),
    ]);
    expect(coverage.runtimePackExclusions.map((entry: { pack: string }) => entry.pack).sort()).toEqual([
      "actors24",
      "content24",
      "heroes",
      "monsterfeatures",
      "monsterfeatures24",
      "monsters",
      "rules",
      "tables",
      "tables24",
      "tradegoods",
    ]);
    for (const entry of coverage.runtimePackExclusions) {
      expect(entry.reason).toBe("no baseline consumer");
    }
    expect(coverage.eraSplit).toEqual({ "2014": 0, "2024": 2 });
  });

  it("rejects a source checkout at a different revision with expected and actual SHAs", async () => {
    const lock = await readLock();
    const tempRoot = await mkdtemp(path.join(repoRoot, ".tmp", "s3-generator-"));
    try {
      const fixtureDir = path.join(tempRoot, "packs", "_source", "classes24", "paladin");
      await mkdir(fixtureDir, { recursive: true });
      await writeFile(path.join(fixtureDir, "paladin.yml"), "name: Paladin\ntype: class\n");
      execFileSync("git", ["init", "-q"], { cwd: tempRoot });
      execFileSync("git", ["add", "-A"], { cwd: tempRoot });
      execFileSync(
        "git",
        ["-c", "user.email=s3@localhost", "-c", "user.name=s3", "commit", "-qm", "fixture"],
        { cwd: tempRoot },
      );
      const actualSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: tempRoot, encoding: "utf8" }).trim();
      expect(actualSha, "synthetic fixture commit must differ from the pinned revision").not.toBe(lock.commit);

      const run = await runGenerate(["--source", tempRoot]);
      expect(run.code).toBe(1);
      expect(run.stderr).toContain(lock.commit);
      expect(run.stderr).toContain(actualSha);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("writes byte-identical artifacts across repeated runs", async () => {
    const firstRun = await runGenerate();
    expect(firstRun.code).toBe(0);
    const first = [];
    for (const name of ARTIFACTS) {
      first.push(await sha256(path.join(generatedDir, name)));
    }
    const secondRun = await runGenerate();
    expect(secondRun.code).toBe(0);
    for (let i = 0; i < ARTIFACTS.length; i += 1) {
      const hash = await sha256(path.join(generatedDir, ARTIFACTS[i]));
      expect(hash, `${ARTIFACTS[i]} differs between runs`).toBe(first[i]);
    }
  });

  it("rejects a missing source root and a non-git directory", async () => {
    const missing = await runGenerate(["--source", path.join(repoRoot, ".tmp", "s3-does-not-exist")]);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain("not found");

    const tempRoot = await mkdtemp(path.join(repoRoot, ".tmp", "s3-nongit-"));
    try {
      await mkdir(path.join(tempRoot, "packs"), { recursive: true });
      const run = await runGenerate(["--source", tempRoot]);
      expect(run.code).toBe(1);
      expect(run.stderr).toContain("not a git checkout");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
