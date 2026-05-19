import type { BuildingParams, CostSection, CalcOutput, TariffResult } from "@/types/tariff";

export function totalArea(p: BuildingParams): number {
  return p.areaResidential + p.areaNonResidential + p.areaStorage + p.areaParkingSpots;
}

export function sectionMonthly(section: CostSection): number {
  return section.items.reduce((sum, item) => sum + (item.monthly || 0), 0);
}

export function calculate(params: BuildingParams, sections: CostSection[]): CalcOutput {
  const area = totalArea(params);
  const markup = params.profitCoef * params.vatCoef;

  const results: TariffResult[] = sections.map((sec) => {
    const monthly = sectionMonthly(sec);
    const tariffBase = area > 0 ? monthly / area : 0;
    const tariffFinal = tariffBase * markup;
    return {
      sectionId: sec.id,
      sectionLabel: sec.label,
      totalMonthly: monthly,
      tariffBase,
      tariffFinal,
    };
  });

  const grandTotalMonthly = results.reduce((s, r) => s + r.totalMonthly, 0);
  const grandTariffBase = area > 0 ? grandTotalMonthly / area : 0;
  const grandTariffFinal = grandTariffBase * markup;

  return { totalArea: area, results, grandTotalMonthly, grandTariffBase, grandTariffFinal };
}

export function totalElevators(p: BuildingParams): number {
  return p.elevatorGroups.reduce((s, g) => s + g.count, 0);
}

export function totalEntrances(p: BuildingParams): number {
  return p.sectionGroups.reduce((s, g) => s + g.count, 0);
}

export function avgFloors(p: BuildingParams): number {
  const total = totalEntrances(p);
  if (total === 0) return 0;
  return p.sectionGroups.reduce((s, g) => s + g.count * g.floors, 0) / total;
}

export function floorRange(p: BuildingParams): string {
  if (p.sectionGroups.length === 0) return "—";
  const floors = p.sectionGroups.map((g) => g.floors);
  const min = Math.min(...floors);
  const max = Math.max(...floors);
  return min === max ? `${min} эт` : `${min}–${max} эт`;
}

export function fmt(n: number, decimals = 2): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtRub(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}
