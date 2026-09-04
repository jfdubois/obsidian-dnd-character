// S3 catalog generator: validates the pinned foundryvtt/dnd5e checkout and
// writes deterministic catalog artifacts to src/catalog/generated/.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lockPath = path.join(repoRoot, "scripts", "foundry-catalog", "source-lock.json");
const outDir = path.join(repoRoot, "src", "catalog", "generated");
const defaultSourceRoot = path.join(repoRoot, ".tmp", "g3", "foundry-dnd5e");

// Runtime pack set (architecture section 4.4).
const RUNTIME_PACKS = new Set([
  "classes",
  "classes24",
  "subclasses",
  "classfeatures",
  "races",
  "origins24",
  "backgrounds",
  "feats24",
  "items",
  "equipment24",
  "spells",
  "spells24",
  "effects",
]);

const RUNTIME_EXCLUDED_REASON = "no baseline consumer";

// S3 minimal fixture extraction. Later tasks replace this list with the full
// scope walk; the pipeline below already handles any entry list.
const S3_FIXTURES = [
  "classes24/paladin/paladin.yml",
  "classes24/paladin/subclass-features/oath-of-devotion/sacred-weapon.yml",
];

function fail(message) {
  console.error(`foundry-catalog: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  let sourceRoot = defaultSourceRoot;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") {
      if (!argv[i + 1]) fail("--source requires a directory argument");
      sourceRoot = path.resolve(argv[++i]);
    } else {
      fail(`unknown argument "${argv[i]}" (usage: generate.mjs [--source <dir>])`);
    }
  }
  return sourceRoot;
}

function validateSourceRoot(sourceRoot, lockedSha) {
  if (!existsSync(sourceRoot)) {
    fail(`source root not found: ${sourceRoot}`);
  }
  if (!existsSync(path.join(sourceRoot, ".git"))) {
    fail(`source root is not a git checkout: ${sourceRoot}`);
  }
  let actualSha;
  try {
    actualSha = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    fail(`cannot resolve HEAD in ${sourceRoot}; is it a valid git repository?`);
  }
  if (actualSha !== lockedSha) {
    fail(`pinned revision mismatch: expected ${lockedSha} but found ${actualSha}`);
  }
}

// Yaml file stem relative to packs/_source. When the file basename equals its
// parent directory name the basename is dropped (paladin/paladin.yml -> paladin).
function toSourcePath(relativeYamlPath) {
  const parts = relativeYamlPath.replace(/\.yml$/, "").split("/");
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }
  return parts.join("/");
}

function readYaml(sourceRoot, relativeSourcePath) {
  const filePath = path.join(sourceRoot, "packs", "_source", ...relativeSourcePath.split("/"));
  if (!existsSync(filePath)) {
    fail(`expected source file missing at pinned revision: packs/_source/${relativeSourcePath}`);
  }
  try {
    const record = load(readFileSync(filePath, "utf8"));
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      fail(`empty or non-mapping source record: packs/_source/${relativeSourcePath}`);
    }
    return record;
  } catch (error) {
    fail(`failed to parse packs/_source/${relativeSourcePath}: ${error.message}`);
  }
}

function extractEntries(sourceRoot) {
  const entries = S3_FIXTURES.map((relativeYamlPath) => ({
    sourcePath: toSourcePath(relativeYamlPath),
    pack: relativeYamlPath.split("/")[0],
    record: readYaml(sourceRoot, relativeYamlPath),
  }));
  entries.sort((a, b) => (a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0));
  return entries;
}

function collectPremiumExclusions(sourceRoot, lock) {
  return lock.premiumExclusions.map((exclusion) => {
    const relative = exclusion.path.replace(/^packs\/_source\//, "");
    const record = readYaml(sourceRoot, relative);
    const book = record?.system?.source?.book ?? "";
    if (book !== exclusion.sourceBook) {
      fail(
        `premium exclusion evidence mismatch for ${exclusion.path}: expected book "${exclusion.sourceBook}" but found "${book}"`,
      );
    }
    return {
      sourcePath: toSourcePath(relative),
      book,
      code: "LC-1",
      reason: exclusion.reason,
    };
  });
}

function collectEmptyLicenseGaps(entries) {
  const gaps = [];
  for (const entry of entries) {
    if (entry.record?.system?.source?.license === "") {
      gaps.push({
        sourcePath: entry.sourcePath,
        note: "empty license field; in scope per G3 LC-2 data-gap rule",
      });
    }
  }
  return gaps;
}

function computeEraSplit(entries) {
  const split = { "2014": 0, "2024": 0 };
  for (const entry of entries) {
    split[entry.pack.endsWith("24") ? "2024" : "2014"] += 1;
  }
  return split;
}

function computePacksTable(entries) {
  const packs = {};
  for (const entry of entries) {
    const row = packs[entry.pack] ?? { records: 0, inRuntime: RUNTIME_PACKS.has(entry.pack) };
    row.records += 1;
    packs[entry.pack] = row;
  }
  return packs;
}

function computeRuntimePackExclusions(lock) {
  return lock.packs
    .filter((pack) => !RUNTIME_PACKS.has(pack.name))
    .map((pack) => ({ pack: pack.name, reason: RUNTIME_EXCLUDED_REASON }))
    .sort((a, b) => (a.pack < b.pack ? -1 : a.pack > b.pack ? 1 : 0));
}

function buildProvenance(lock, entries, premiumExclusions) {
  return {
    foundrySha: lock.source.commit,
    repository: lock.source.repository,
    generationCommand: "npm run catalog:generate",
    sourcePathNormalization:
      "YAML file stem relative to packs/_source; when the file basename equals its parent directory name the basename is dropped (classes24/paladin/paladin.yml -> classes24/paladin)",
    packs: computePacksTable(entries),
    exclusions: premiumExclusions.map((exclusion) => ({
      sourcePath: exclusion.sourcePath,
      reason: `LC-1: ${exclusion.reason}`,
    })),
    attribution: [lock.licenses.srdContent.attributionRequired],
  };
}

function buildCoverage(premiumExclusions, entries, lock) {
  return {
    premiumExclusions,
    emptyLicenseGaps: collectEmptyLicenseGaps(entries),
    runtimePackExclusions: computeRuntimePackExclusions(lock),
    eraSplit: computeEraSplit(entries),
  };
}

function writeJson(fileName, value) {
  writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const sourceRoot = parseArgs(process.argv.slice(2));
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  validateSourceRoot(sourceRoot, lock.source.commit);
  const entries = extractEntries(sourceRoot);
  const premiumExclusions = collectPremiumExclusions(sourceRoot, lock);
  mkdirSync(outDir, { recursive: true });
  const runtimeEntries = entries.filter((entry) => RUNTIME_PACKS.has(entry.pack));
  writeJson("srd-catalog.full.json", entries);
  writeJson("srd-catalog.runtime.json", runtimeEntries);
  writeJson("srd-catalog.provenance.json", buildProvenance(lock, entries, premiumExclusions));
  writeJson("srd-catalog.coverage.json", buildCoverage(premiumExclusions, entries, lock));
  console.log(
    `foundry-catalog: wrote ${entries.length} record(s) to src/catalog/generated (full: ${entries.length}, runtime: ${runtimeEntries.length})`,
  );
}

try {
  main();
} catch (error) {
  fail(`unexpected error: ${error.message}`);
}
