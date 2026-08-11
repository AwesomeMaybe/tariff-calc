import type { BuildingParams, CostItem, CostSection } from "@/types/tariff";

export interface SavedObject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  params: BuildingParams;
  sections: CostSection[];
}

const KEY = "tariff_objects_v2";

function migrateParams(p: Record<string, unknown>): BuildingParams {
  if (!p.sectionGroups) {
    p.sectionGroups = [{ count: Number(p.entrances) || 1, floors: Number(p.floors) || 25 }];
  }
  if (!p.elevatorGroups) {
    p.elevatorGroups = [{ count: Number(p.elevators) || 1, floors: Number(p.elevatorFloors) || 25 }];
  }
  // ФОТ-надбавки появились позже — дефолты для старых объектов.
  if (p.platformCoef === undefined) p.platformCoef = 1.1;
  if (p.insuranceRate === undefined) p.insuranceRate = 0.302;
  if (p.regionCoef === undefined) p.regionCoef = 0;
  if (p.premiumRate === undefined) p.premiumRate = 0;
  // Расширенные ТЭП — дефолты для старых объектов.
  const numDefaults: Record<string, number> = {
    areaMop: 0, areaRoof: 0, areaFacade: 0, areaHardSurface: 0, parkingLevels: 0,
    playgrounds: 0, sportGrounds: 0, cctvCameras: 0, accessControlPoints: 0,
    meteringDevices: 0, pumpStations: 0,
  };
  for (const k in numDefaults) if (p[k] === undefined) p[k] = numDefaults[k];
  const boolDefaults = ["heatedRamps", "ownBoiler", "snowMelt", "hasPool", "hasGym", "hasWinterGarden"];
  for (const k of boolDefaults) if (p[k] === undefined) p[k] = false;
  if (p.buildingClass === undefined) p.buildingClass = "Бизнес";
  if (!Array.isArray(p.indexLog)) p.indexLog = [];
  delete p.indexationCoef; // устаревшее поле
  return p as unknown as BuildingParams;
}

/** Старый формат item'а {id,label,monthly} → {kind:"manual"}. */
function migrateItem(it: Record<string, unknown>): CostItem {
  if (typeof it.kind === "string") return it as unknown as CostItem;
  return {
    kind: "manual",
    id: String(it.id ?? ""),
    label: String(it.label ?? ""),
    monthly: Number(it.monthly) || 0,
  };
}

function migrateSections(sections: unknown): CostSection[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((sec) => ({
    ...(sec as CostSection),
    items: Array.isArray((sec as { items?: unknown[] }).items)
      ? (sec as { items: Record<string, unknown>[] }).items.map(migrateItem)
      : [],
  }));
}

export function loadObjects(): SavedObject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedObject[];
    return raw.map((o) => ({
      ...o,
      params: migrateParams(o.params as unknown as Record<string, unknown>),
      sections: migrateSections(o.sections),
    }));
  } catch {
    return [];
  }
}

export function saveObjects(objects: SavedObject[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(objects));
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function createObject(name: string, params: BuildingParams, sections: CostSection[]): SavedObject {
  return {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    params,
    sections,
  };
}

export function updateObject(objects: SavedObject[], id: string, params: BuildingParams, sections: CostSection[]): SavedObject[] {
  return objects.map((o) =>
    o.id !== id ? o : { ...o, params, sections, updatedAt: new Date().toISOString() }
  );
}

export function deleteObject(objects: SavedObject[], id: string): SavedObject[] {
  return objects.filter((o) => o.id !== id);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}
