import type { BuildingParams, PayrollContext, StaffRole } from "@/types/tariff";

/** Вытащить ФОТ-надбавки из параметров объекта. */
export function payrollFrom(p: BuildingParams): PayrollContext {
  return {
    insuranceRate: p.insuranceRate ?? 0,
    regionCoef: p.regionCoef ?? 0,
    premiumRate: p.premiumRate ?? 0,
  };
}

/** Численность роли (чел) исходя из её типа. */
export function roleHeadcount(role: StaffRole): number {
  switch (role.type) {
    case "area": {
      const norm = role.normPerShift ?? 0;
      if (norm <= 0) return 0;
      const area = role.area ?? 0;
      const cleans = role.cleansPerMonth ?? 0;
      const shifts = role.shiftsPerMonth > 0 ? role.shiftsPerMonth : 21;
      const manShifts = (area / norm) * cleans;
      return Math.ceil(manShifts / shifts);
    }
    case "post":
      return Math.ceil((role.posts ?? 0) * (role.shiftFactor ?? 1));
    case "fixed":
      return role.headcount ?? 0;
  }
}

/** ФОТ роли, ₽/мес: численность × оклад × надбавки. */
export function roleFot(role: StaffRole, pc: PayrollContext): number {
  const head = roleHeadcount(role);
  const mult = (1 + pc.insuranceRate) * (1 + pc.regionCoef) * (1 + pc.premiumRate);
  return head * role.oklad * mult;
}
