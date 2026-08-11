import type { BuildingParams, CostSection, CostItem, CalcOutput, TariffResult, PayrollContext } from "@/types/tariff";
import { payrollFrom, roleFot } from "@/lib/payroll";

export function totalArea(p: BuildingParams): number {
  return p.areaResidential + p.areaNonResidential + p.areaStorage + p.areaParkingSpots;
}

/** Сумма одного item'а, ₽/мес. sectionFot нужен материалам в режиме "percent". */
export function itemMonthly(item: CostItem, pc: PayrollContext, sectionFot: number): number {
  switch (item.kind) {
    case "manual":
      return item.monthly || 0;
    case "labor":
      return roleFot(item.role, pc);
    case "to":
      return (item.rate || 0) * (item.qty || 0);
    case "material":
      if (item.mode === "percent") return (item.value || 0) / 100 * sectionFot;
      if (item.mode === "perArea") return (item.value || 0) * (item.area || 0);
      return item.value || 0; // fixed → ₽/мес
  }
}

/** ФОТ раздела — сумма labor-item'ов (база для материалов в %). */
export function sectionFotTotal(section: CostSection, pc: PayrollContext): number {
  return section.items.reduce(
    (s, it) => s + (it.kind === "labor" ? roleFot(it.role, pc) : 0),
    0
  );
}

export function sectionMonthly(section: CostSection, pc: PayrollContext): number {
  const fot = sectionFotTotal(section, pc);
  return section.items.reduce((s, it) => s + itemMonthly(it, pc, fot), 0);
}

/** Накопленный множитель индексации из журнала. */
export function indexMultiplier(params: BuildingParams): number {
  return (params.indexLog ?? []).reduce((m, e) => m * (1 + (e.pct || 0) / 100), 1);
}

/**
 * Наценка на статью, ₽/мес → итоговая цена.
 * Обычная статья (себестоимость УК): платформа × прибыль × НДС × индексация.
 * vatOnly (услуга подряда, где платформа/наценка уже в цене подрядчика): только НДС × индексация.
 */
function itemMarkup(item: CostItem, params: BuildingParams, idxMult: number): number {
  return item.vatOnly
    ? params.vatCoef * idxMult
    : params.platformCoef * params.profitCoef * params.vatCoef * idxMult;
}

function sectionMonthlyFinal(section: CostSection, pc: PayrollContext, params: BuildingParams, idxMult: number): number {
  const fot = sectionFotTotal(section, pc);
  return section.items.reduce(
    (s, it) => s + itemMonthly(it, pc, fot) * itemMarkup(it, params, idxMult),
    0
  );
}

export function calculate(params: BuildingParams, sections: CostSection[]): CalcOutput {
  const area = totalArea(params);
  const idxMult = indexMultiplier(params);

  const pc = payrollFrom(params);

  const results: TariffResult[] = sections.map((sec) => {
    const monthly = sectionMonthly(sec, pc);
    const monthlyFinal = sectionMonthlyFinal(sec, pc, params, idxMult);
    const tariffBase = area > 0 ? monthly / area : 0;
    const tariffFinal = area > 0 ? monthlyFinal / area : 0;
    return {
      sectionId: sec.id,
      sectionLabel: sec.label,
      totalMonthly: monthly,
      tariffBase,
      tariffFinal,
    };
  });

  const grandTotalMonthly = results.reduce((s, r) => s + r.totalMonthly, 0);
  const grandTotalMonthlyFinal = sections.reduce((s, sec) => s + sectionMonthlyFinal(sec, pc, params, idxMult), 0);
  const grandTariffBase = area > 0 ? grandTotalMonthly / area : 0;
  const grandTariffFinal = area > 0 ? grandTotalMonthlyFinal / area : 0;

  return { totalArea: area, results, grandTotalMonthly, grandTariffBase, grandTariffFinal, indexMultiplier: idxMult };
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
