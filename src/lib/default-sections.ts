import type { CostSection, StaffRole } from "@/types/tariff";

const SHIFTS = 21; // смен сотрудника в месяц по умолчанию

function fixed(oklad: number, headcount: number): StaffRole {
  return { type: "fixed", oklad, shiftsPerMonth: SHIFTS, headcount };
}
function area(oklad: number, areaM2: number, normPerShift: number, cleansPerMonth: number): StaffRole {
  return { type: "area", oklad, shiftsPerMonth: SHIFTS, area: areaM2, normPerShift, cleansPerMonth };
}
function post(oklad: number, posts: number, shiftFactor: number): StaffRole {
  return { type: "post", oklad, shiftsPerMonth: SHIFTS, posts, shiftFactor };
}

export const DEFAULT_SECTIONS: CostSection[] = [
  {
    id: "management",
    label: "1. Управление",
    items: [
      { kind: "labor", id: "management_fot", label: "Управляющий, бухгалтер, ИТР", role: fixed(82000, 3) },
      { kind: "manual", id: "management_ops", label: "Операционные расходы", monthly: 85000 },
    ],
  },
  {
    id: "electrical",
    label: "2. Электрика (ОДИ)",
    items: [
      { kind: "labor", id: "electrical_fot", label: "Электромонтёры", role: fixed(70000, 2) },
      { kind: "material", id: "electrical_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 30 },
      { kind: "to", id: "electrical_to", label: "ТО ВРУ", rate: 30000, qty: 1 },
    ],
  },
  {
    id: "water",
    label: "3. Водоснабжение и канализация",
    items: [
      { kind: "labor", id: "water_fot", label: "Сантехники", role: fixed(68000, 2) },
      { kind: "material", id: "water_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 30 },
      { kind: "to", id: "water_to", label: "ТО оборудования", rate: 40000, qty: 1 },
    ],
  },
  {
    id: "heat",
    label: "4. Тепловые пункты (ИТП)",
    items: [
      { kind: "labor", id: "heat_fot", label: "Инженеры ИТП", role: fixed(75000, 2) },
      { kind: "material", id: "heat_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 25 },
      { kind: "to", id: "heat_to", label: "ТО ИТП", rate: 55000, qty: 1 },
    ],
  },
  {
    id: "ads",
    label: "5. АДС",
    items: [
      { kind: "labor", id: "ads_fot", label: "Аварийная бригада", role: fixed(65000, 2) },
      { kind: "manual", id: "ads_ops", label: "Операционные расходы", monthly: 25000 },
    ],
  },
  {
    id: "structural",
    label: "6. Конструктив",
    items: [
      { kind: "labor", id: "structural_fot", label: "Разнорабочие", role: fixed(60000, 3) },
      { kind: "material", id: "structural_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 35 },
    ],
  },
  {
    id: "elevators",
    label: "7. Лифты",
    items: [
      { kind: "to", id: "elevators_to", label: "ТО лифтов", rate: 12000, qty: 0 },
      { kind: "labor", id: "elevators_fot", label: "Лифтёры", role: fixed(55000, 0) },
    ],
  },
  {
    id: "ventilation",
    label: "8. Вентиляция",
    items: [
      { kind: "labor", id: "ventilation_fot", label: "Вентиляционщик", role: fixed(65000, 1) },
      { kind: "to", id: "ventilation_to", label: "ТО установок", rate: 9000, qty: 4 },
      { kind: "material", id: "ventilation_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 20 },
    ],
  },
  {
    id: "fire",
    label: "9. ПБиСС (пожарная безопасность)",
    items: [
      { kind: "labor", id: "fire_fot", label: "Инженер ПБ", role: fixed(70000, 1) },
      { kind: "to", id: "fire_to", label: "ТО систем ПБ", rate: 60000, qty: 1 },
    ],
  },
  {
    id: "dispatch",
    label: "10. Диспетчеризация",
    items: [
      { kind: "labor", id: "dispatch_fot", label: "Диспетчеры (пост 24/7)", role: post(50000, 1, 4.4) },
      { kind: "manual", id: "dispatch_soft", label: "ПО и связь", monthly: 25000 },
    ],
  },
  {
    id: "filtration",
    label: "11. Фильтрация воды",
    items: [
      { kind: "to", id: "filtration_to", label: "ТО фильтров", rate: 45000, qty: 0 },
      { kind: "manual", id: "filtration_mat", label: "Расходники", monthly: 0 },
    ],
  },
  {
    id: "heatcurtains",
    label: "12. Тепловые завесы",
    items: [
      { kind: "to", id: "heatcurtains_to", label: "ТО завес", rate: 18000, qty: 1 },
      { kind: "manual", id: "heatcurtains_mat", label: "Материалы", monthly: 8000 },
    ],
  },
  {
    id: "cleaning",
    label: "13. Клининг (МОП)",
    items: [
      { kind: "labor", id: "cleaning_fot", label: "Уборщики МОП", role: area(55000, 5000, 2000, 30) },
      { kind: "material", id: "cleaning_mat", label: "Инвентарь и химия (% от ФОТ)", mode: "percent", value: 8 },
    ],
  },
  {
    id: "landscaping",
    label: "14. Благоустройство",
    items: [
      { kind: "labor", id: "landscaping_fot", label: "Дворники", role: area(50000, 3000, 3000, 30) },
      { kind: "material", id: "landscaping_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 30 },
    ],
  },
  {
    id: "alpine",
    label: "15. Альпинистские работы",
    items: [
      { kind: "manual", id: "alpine_services", label: "Услуги альпинистов", monthly: 40000 },
    ],
  },
  {
    id: "security",
    label: "16. Охрана",
    items: [
      { kind: "labor", id: "security_fot", label: "Охрана (посты 24/7)", role: post(55000, 0, 4.4) },
      { kind: "to", id: "security_equip", label: "Оборудование / ТО", rate: 0, qty: 0 },
    ],
  },
  {
    id: "concierge",
    label: "17. Консьерж",
    items: [
      { kind: "labor", id: "concierge_fot", label: "Консьержи (посты 24/7)", role: post(50000, 0, 4.4) },
    ],
  },
  {
    id: "techsupervision",
    label: "18. Технадзор",
    items: [
      { kind: "labor", id: "techsupervision_fot", label: "Инженер технадзора", role: fixed(80000, 1) },
      { kind: "manual", id: "techsupervision_ops", label: "Операционные расходы", monthly: 15000 },
    ],
  },
  {
    id: "extraclean",
    label: "19. Доп. клининг",
    items: [
      { kind: "labor", id: "extraclean_fot", label: "Доп. уборка", role: area(55000, 0, 2000, 12) },
      { kind: "material", id: "extraclean_mat", label: "Материалы (% от ФОТ)", mode: "percent", value: 8 },
    ],
  },
];
