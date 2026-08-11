import type { BuildingParams, CostItem, CostSection } from "@/types/tariff";
import { totalElevators } from "@/lib/calculate";

/* ─────────────────────────────────────────────
   Связки ТЭП → затраты.
   - Триггер (bool): признак в ТЭП → обязательная статья (manual) появляется/прячется.
   - Драйвер (number): кол-во в ТЭП → статья ТО, qty подставляется автоматически.
   - Спец: площадь МОП → area роли уборщиков (раздел «Клининг»).
   Статьи живут в авто-разделах OPTIONS / AUTO_TO. Пользователь правит только суммы/ставки.
   ───────────────────────────────────────────── */

const OPTIONS_ID = "options";
const OPTIONS_LABEL = "20. Опции по ТЭП";
const AUTO_TO_ID = "auto_to";
const AUTO_TO_LABEL = "21. ТО по ТЭП (слаботочка / инженерия)";

interface TriggerLink {
  param: keyof BuildingParams; // bool
  id: string;
  label: string;
}
interface DriverLink {
  param: keyof BuildingParams; // number
  id: string;
  label: string;
}

// bool-признак → обязательная manual-статья
const TRIGGERS: TriggerLink[] = [
  { param: "courtFountain",   id: "opt_fountain",     label: "Обслуживание фонтана" },
  { param: "autoIrrigation",  id: "opt_irrigation",   label: "Обслуживание автополива" },
  { param: "hasPool",         id: "opt_pool",         label: "Бассейн / СПА" },
  { param: "hasGym",          id: "opt_gym",          label: "Фитнес-зал" },
  { param: "hasWinterGarden", id: "opt_wintergarden", label: "Зимний сад" },
  { param: "hasChiller",      id: "opt_chiller",      label: "ТО чиллера" },
  { param: "ownBoiler",       id: "opt_boiler",       label: "Крышная котельная" },
  { param: "heatedRamps",     id: "opt_heatramp",     label: "Обогрев рамп / водостоков" },
  { param: "snowMelt",        id: "opt_snowmelt",     label: "Снеготаялка" },
  { param: "waterTreatmentStation", id: "opt_watertreat", label: "Станция водоподготовки" },
];

// number-признак → статья ТО, qty = значение из ТЭП
const DRIVERS: DriverLink[] = [
  { param: "cctvCameras",         id: "to_cctv",      label: "ТО видеонаблюдения" },
  { param: "accessControlPoints", id: "to_skud",      label: "ТО СКУД" },
  { param: "intercoms",           id: "to_intercom",  label: "ТО домофонов" },
  { param: "meteringDevices",     id: "to_metering",  label: "Поверка / снятие ОДПУ" },
  { param: "pumpStations",        id: "to_pumps",     label: "ТО насосных станций" },
  { param: "gates",               id: "to_gates",     label: "ТО ворот" },
  { param: "barriers",            id: "to_barriers",  label: "ТО шлагбаумов" },
];

const num = (v: unknown) => (typeof v === "number" ? v : 0);

/** Карта существующих item'ов по id — чтобы сохранить введённые суммы/ставки при пересинхроне. */
function indexItems(sections: CostSection[]): Map<string, CostItem> {
  const m = new Map<string, CostItem>();
  for (const s of sections) for (const it of s.items) m.set(it.id, it);
  return m;
}

// id статьи "to" → как считать qty из ТЭП (кол-во лифтов, ИТП, лицевых счетов и т.п.)
const TO_QTY_LINKS: Record<string, (p: BuildingParams) => number> = {
  cb2_2_5_8_1: totalElevators,
  cb2_2_5_8_2: totalElevators,
  cb2_2_5_8_3: totalElevators,
  cb2_2_5_8_4: totalElevators,
  cb2_2_5_3_1: (p) => num(p.itp),
  cb2_2_6_2: (p) => num(p.apartments) + num(p.nonResidentialUnits) + num(p.storageUnits) + num(p.parkingSpots),
};

export function syncLinks(params: BuildingParams, sections: CostSection[]): CostSection[] {
  const prev = indexItems(sections);

  // базовые разделы (без авто-разделов) + спец-драйвер площади МОП + qty лифтов/ИТП/л.счетов из ТЭП
  const base = sections
    .filter((s) => s.id !== OPTIONS_ID && s.id !== AUTO_TO_ID)
    .map((s) => ({
      ...s,
      items: s.items.map((it) => {
        if (it.id === "cleaning_fot" && it.kind === "labor") {
          return { ...it, auto: true, role: { ...it.role, area: num(params.areaMop) } };
        }
        const qtyFn = TO_QTY_LINKS[it.id];
        if (qtyFn && it.kind === "to") {
          return { ...it, auto: true, qty: qtyFn(params) };
        }
        return it;
      }),
    }));

  // OPTIONS: активные триггеры → manual, обязательные
  const optItems: CostItem[] = TRIGGERS.filter((t) => !!params[t.param]).map((t) => {
    const ex = prev.get(t.id);
    const monthly = ex && ex.kind === "manual" ? ex.monthly : 0;
    return { kind: "manual", id: t.id, label: t.label, monthly, required: true };
  });

  // AUTO_TO: активные драйверы (>0) → to, qty из ТЭП, ставка сохраняется
  const toItems: CostItem[] = DRIVERS.filter((d) => num(params[d.param]) > 0).map((d) => {
    const ex = prev.get(d.id);
    const rate = ex && ex.kind === "to" ? ex.rate : 0;
    return { kind: "to", id: d.id, label: d.label, rate, qty: num(params[d.param]), required: true, auto: true };
  });

  const out = [...base];
  if (optItems.length) out.push({ id: OPTIONS_ID, label: OPTIONS_LABEL, items: optItems });
  if (toItems.length) out.push({ id: AUTO_TO_ID, label: AUTO_TO_LABEL, items: toItems });
  return out;
}
