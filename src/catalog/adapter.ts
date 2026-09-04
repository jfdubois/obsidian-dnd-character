import { CatalogError } from "./types";
import type {
  ActivityView,
  CatalogEntry,
  EmbeddedEffectView,
  FeatureRecordView,
  Recovery,
  SourceProvenance,
} from "./types";

const ERROR_CODE = "SCHEMA_INVALID_FEATURE_RECORD";
const RULES_ERA_VALUES = ["2014", "2024"] as const;
const RECOVERY_PERIOD_VALUES = ["dawn", "lr", "day", "recharge", "sr", "dusk", "initiative"] as const;
const RECOVERY_TYPE_VALUES = ["recoverAll", "formula", "loseAll", "empty"] as const;

/**
 * Catalog adapter (S4): validates and exposes the supported subset of a
 * class feature (feat) record. The raw source record is preserved in full on
 * `CatalogEntry.record`; unsupported fields are left uninterpreted.
 */
export function readFeatureRecord(entry: CatalogEntry): FeatureRecordView {
  const v = new Validator(entry.sourcePath);
  const record = entry.record;

  if (record.type !== "feat") {
    throw v.fail(`Record is not a feat record (type: ${record.type === undefined ? "missing" : record.type}).`);
  }

  const recordId = v.str(record._id, "record._id");
  const name = v.str(record.name, "record.name");
  const system = v.obj(record.system, "system");

  const source = v.obj(system.source, "system.source");
  const rulesValue = v.str(source.rules, "system.source.rules");
  if (!RULES_ERA_VALUES.some((value) => value === rulesValue)) {
    throw v.fail(`system.source.rules must be "2014" or "2024" (got: ${rulesValue}).`);
  }
  const provenance: SourceProvenance = {
    custom: v.str(source.custom, "system.source.custom"),
    rules: rulesValue as SourceProvenance["rules"],
    revision: v.num(source.revision, "system.source.revision"),
    license: v.str(source.license, "system.source.license"),
    book: v.str(source.book, "system.source.book"),
  };

  const identifier = v.str(system.identifier, "system.identifier");

  const typeBlock = v.obj(system.type, "system.type");
  const featureType = {
    value: v.str(typeBlock.value, "system.type.value"),
    subtype: v.str(typeBlock.subtype, "system.type.subtype"),
  };

  const prereq = v.obj(system.prerequisites, "system.prerequisites");
  const prerequisites = {
    level: v.num(prereq.level, "system.prerequisites.level"),
    repeatable: v.bool(prereq.repeatable, "system.prerequisites.repeatable"),
  };

  const usesBlock = v.obj(system.uses, "system.uses");
  const uses = {
    max: v.strNum(usesBlock.max, "system.uses.max"),
    spent: v.num(usesBlock.spent, "system.uses.spent"),
    recovery: v.arr(usesBlock.recovery, "system.uses.recovery").map((item, index) =>
      readRecovery(v, item, `system.uses.recovery[${index}]`),
    ),
  };

  const activities: Record<string, ActivityView> = {};
  const activitiesSource = system.activities;
  if (activitiesSource !== undefined) {
    const activitiesObj = v.obj(activitiesSource, "system.activities");
    for (const [key, value] of Object.entries(activitiesObj)) {
      activities[key] = readActivity(v, v.obj(value, `system.activities[${key}]`), key);
    }
  }

  const effectsSource = record.effects;
  if (!Array.isArray(effectsSource)) {
    throw v.fail("record.effects must be an array.");
  }
  const effects: EmbeddedEffectView[] = effectsSource.map((item, index) =>
    readEmbeddedEffect(v, v.obj(item, `record.effects[${index}]`), index),
  );

  return {
    sourcePath: entry.sourcePath,
    pack: entry.pack,
    recordId,
    name,
    recordType: record.type as "feat",
    identifier,
    provenance,
    featureType,
    prerequisites,
    uses,
    activities,
    effects,
  };
}

function readRecovery(v: Validator, raw: unknown, path: string): Recovery {
  const item = v.obj(raw, path);
  const period = v.str(item.period, `${path}.period`);
  if (!RECOVERY_PERIOD_VALUES.some((value) => value === period)) {
    throw v.fail(`${path}.period is not a supported recovery period (got: ${period}).`);
  }
  const type = v.str(item.type, `${path}.type`);
  if (!RECOVERY_TYPE_VALUES.some((value) => value === type)) {
    throw v.fail(`${path}.type is not a supported recovery type (got: ${type}).`);
  }
  const recovery: Recovery = {
    period: period as Recovery["period"],
    type: type as Recovery["type"],
  };
  if (item.formula !== undefined) {
    recovery.formula = v.str(item.formula, `${path}.formula`);
  }
  return recovery;
}

function readActivity(v: Validator, activity: Record<string, unknown>, key: string): ActivityView {
  const prefix = `system.activities[${key}]`;

  const activation = v.obj(activity.activation, `${prefix}.activation`);
  const consumption = v.obj(activity.consumption, `${prefix}.consumption`);
  const scaling = v.obj(consumption.scaling, `${prefix}.consumption.scaling`);
  const consumptionTargets = v.arr(consumption.targets, `${prefix}.consumption.targets`).map((item, index) => {
    const target = v.obj(item, `${prefix}.consumption.targets[${index}]`);
    return {
      type: v.str(target.type, `${prefix}.consumption.targets[${index}].type`),
      value: v.strNum(target.value, `${prefix}.consumption.targets[${index}].value`),
      target: v.str(target.target, `${prefix}.consumption.targets[${index}].target`),
    };
  });
  const duration = v.obj(activity.duration, `${prefix}.duration`);
  const restrictions = v.obj(activity.restrictions, `${prefix}.restrictions`);

  return {
    _id: v.str(activity._id, `${prefix}._id`),
    type: v.str(activity.type, `${prefix}.type`),
    activation: {
      type: v.str(activation.type, `${prefix}.activation.type`),
      value: v.strOrNull(activation.value, `${prefix}.activation.value`),
      override: v.bool(activation.override, `${prefix}.activation.override`),
      condition: v.str(activation.condition, `${prefix}.activation.condition`),
    },
    consumption: {
      scaling: { allowed: v.bool(scaling.allowed, `${prefix}.consumption.scaling.allowed`) },
      spellSlot: v.bool(consumption.spellSlot, `${prefix}.consumption.spellSlot`),
      targets: consumptionTargets,
    },
    duration: {
      units: v.str(duration.units, `${prefix}.duration.units`),
      value: v.strNum(duration.value, `${prefix}.duration.value`),
      concentration: v.bool(duration.concentration, `${prefix}.duration.concentration`),
      override: v.bool(duration.override, `${prefix}.duration.override`),
    },
    restrictions: {
      type: v.str(restrictions.type, `${prefix}.restrictions.type`),
      categories: v.strArray(restrictions.categories, `${prefix}.restrictions.categories`),
      properties: v.strArray(restrictions.properties, `${prefix}.restrictions.properties`),
      allowMagical: v.bool(restrictions.allowMagical, `${prefix}.restrictions.allowMagical`),
    },
    appliedEffects: v.strArray(activity.appliedEffects, `${prefix}.appliedEffects`),
  };
}

function readEmbeddedEffect(v: Validator, effect: Record<string, unknown>, index: number): EmbeddedEffectView {
  const prefix = `record.effects[${index}]`;
  const system = v.obj(effect.system, `${prefix}.system`);
  const changesSource = system.changes;
  if (!Array.isArray(changesSource)) {
    throw v.fail(`${prefix}.system.changes must be an array.`);
  }
  const duration = v.obj(effect.duration, `${prefix}.duration`);

  return {
    _id: v.str(effect._id, `${prefix}._id`),
    name: v.str(effect.name, `${prefix}.name`),
    type: v.str(effect.type, `${prefix}.type`),
    disabled: v.bool(effect.disabled, `${prefix}.disabled`),
    duration: {
      value: v.num(duration.value, `${prefix}.duration.value`),
      units: v.str(duration.units, `${prefix}.duration.units`),
      expiry: v.str(duration.expiry, `${prefix}.duration.expiry`),
      expired: v.bool(duration.expired, `${prefix}.duration.expired`),
    },
    changes: changesSource.map((item, changeIndex) => {
      const change = v.obj(item, `${prefix}.system.changes[${changeIndex}]`);
      const changePrefix = `${prefix}.system.changes[${changeIndex}]`;
      return {
        key: v.str(change.key, `${changePrefix}.key`),
        value: change.value,
        priority: v.numOrNull(change.priority, `${changePrefix}.priority`),
        type: v.str(change.type, `${changePrefix}.type`),
        phase: v.str(change.phase, `${changePrefix}.phase`),
        _id: v.str(change._id, `${changePrefix}._id`),
      };
    }),
  };
}

class Validator {
  constructor(private readonly sourcePath: string) {}

  fail(message: string): never {
    throw new CatalogError(ERROR_CODE, message, this.sourcePath);
  }

  obj(value: unknown, path: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      this.fail(`${path} must be an object.`);
    }
    return value as Record<string, unknown>;
  }

  arr(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) {
      this.fail(`${path} must be an array.`);
    }
    return value;
  }

  str(value: unknown, path: string): string {
    if (typeof value !== "string") {
      this.fail(`${path} must be a string.`);
    }
    return value;
  }

  strOrNull(value: unknown, path: string): string | null {
    if (typeof value !== "string" && value !== null) {
      this.fail(`${path} must be a string or null.`);
    }
    return value;
  }

  num(value: unknown, path: string): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      this.fail(`${path} must be a number.`);
    }
    return value;
  }

  numOrNull(value: unknown, path: string): number | null {
    if (value === null) {
      return null;
    }
    if (typeof value !== "number" || Number.isNaN(value)) {
      this.fail(`${path} must be a number or null.`);
    }
    return value;
  }

  strNum(value: unknown, path: string): string | number {
    if (typeof value !== "string" && typeof value !== "number") {
      this.fail(`${path} must be a string or number.`);
    }
    return value;
  }

  bool(value: unknown, path: string): boolean {
    if (typeof value !== "boolean") {
      this.fail(`${path} must be a boolean.`);
    }
    return value;
  }

  strArray(value: unknown, path: string): readonly string[] {
    const array = this.arr(value, path);
    for (let i = 0; i < array.length; i++) {
      if (typeof array[i] !== "string") {
        this.fail(`${path}[${i}] must be a string.`);
      }
    }
    return array as readonly string[];
  }
}
