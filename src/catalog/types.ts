export interface FoundryRecord {
  type?: string;
  uuid?: string;
  _id?: string;
  name?: string;
  system?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CatalogEntry {
  sourcePath: string;
  pack: string;
  record: FoundryRecord;
}

/**
 * Descriptive views over the supported subset of Foundry source structures
 * (S4: one representative mechanics record). These interfaces mirror source
 * keys; they do not define a replacement mechanics format. All other source
 * fields remain preserved and uninterpreted on `CatalogEntry.record`.
 */

export interface SourceProvenance {
  custom: string;
  rules: "2014" | "2024";
  revision: number;
  license: string;
  book: string;
}

export interface Recovery {
  period: "dawn" | "lr" | "day" | "recharge" | "sr" | "dusk" | "initiative";
  type: "recoverAll" | "formula" | "loseAll" | "empty";
  formula?: string;
}

export interface UsesBlock {
  max: string | number;
  spent: number;
  recovery: readonly Recovery[];
}

export interface FeatureType {
  value: string;
  subtype: string;
}

export interface FeaturePrerequisites {
  level: number;
  repeatable: boolean;
}

export interface ActivityActivation {
  type: string;
  value: string | null;
  override: boolean;
  condition: string;
}

export interface ActivityConsumptionTarget {
  type: string;
  value: string | number;
  target: string;
}

export interface ActivityConsumption {
  scaling: { allowed: boolean };
  spellSlot: boolean;
  targets: readonly ActivityConsumptionTarget[];
}

export interface ActivityDuration {
  units: string;
  value: string | number;
  concentration: boolean;
  override: boolean;
}

export interface ActivityRestrictions {
  type: string;
  categories: readonly string[];
  properties: readonly string[];
  allowMagical: boolean;
}

export interface ActivityView {
  _id: string;
  type: string;
  activation: ActivityActivation;
  consumption: ActivityConsumption;
  duration: ActivityDuration;
  restrictions: ActivityRestrictions;
  appliedEffects: readonly string[];
}

export interface EffectChangeView {
  key: string;
  value: unknown;
  priority: number | null;
  type: string;
  phase: string;
  _id: string;
}

export interface EmbeddedEffectDuration {
  value: number;
  units: string;
  expiry: string;
  expired: boolean;
}

export interface EmbeddedEffectView {
  _id: string;
  name: string;
  type: string;
  disabled: boolean;
  duration: EmbeddedEffectDuration;
  changes: readonly EffectChangeView[];
}

export interface FeatureRecordView {
  sourcePath: string;
  pack: string;
  recordId: string;
  name: string;
  recordType: "feat";
  identifier: string;
  provenance: SourceProvenance;
  featureType: FeatureType;
  prerequisites: FeaturePrerequisites;
  uses: UsesBlock;
  activities: Readonly<Record<string, ActivityView>>;
  effects: readonly EmbeddedEffectView[];
}

export class CatalogError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly sourcePath?: string,
  ) {
    super(message);
    this.name = "CatalogError";
  }
}
