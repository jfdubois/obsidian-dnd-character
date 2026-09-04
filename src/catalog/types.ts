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
