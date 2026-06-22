import type { BuildingParams, CostSection } from "@/types/tariff";

export interface SavedObject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  params: BuildingParams;
  sections: CostSection[];
}

const KEY = "tariff_objects";

function migrateParams(p: Record<string, unknown>): BuildingParams {
  if (!p.sectionGroups) {
    p.sectionGroups = [{ count: Number(p.entrances) || 1, floors: Number(p.floors) || 25 }];
  }
  if (!p.elevatorGroups) {
    p.elevatorGroups = [{ count: Number(p.elevators) || 1, floors: Number(p.elevatorFloors) || 25 }];
  }
  return p as unknown as BuildingParams;
}

export function loadObjects(): SavedObject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedObject[];
    return raw.map((o) => ({ ...o, params: migrateParams(o.params as unknown as Record<string, unknown>) }));
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
