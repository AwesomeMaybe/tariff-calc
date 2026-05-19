import type { CostSection } from "@/types/tariff";

export const DEFAULT_SECTIONS: CostSection[] = [
  {
    id: "management",
    label: "1. Управление",
    items: [
      { id: "management_fot", label: "ФОТ (управление)", monthly: 320000 },
      { id: "management_ops", label: "Операционные расходы", monthly: 85000 },
    ],
  },
  {
    id: "electrical",
    label: "2. Электрика (ОДИ)",
    items: [
      { id: "electrical_fot", label: "ФОТ", monthly: 180000 },
      { id: "electrical_mat", label: "Материалы", monthly: 45000 },
      { id: "electrical_to", label: "ТО оборудования", monthly: 30000 },
    ],
  },
  {
    id: "water",
    label: "3. Водоснабжение и канализация",
    items: [
      { id: "water_fot", label: "ФОТ", monthly: 210000 },
      { id: "water_mat", label: "Материалы", monthly: 55000 },
      { id: "water_to", label: "ТО оборудования", monthly: 40000 },
    ],
  },
  {
    id: "heat",
    label: "4. Тепловые пункты (ИТП)",
    items: [
      { id: "heat_fot", label: "ФОТ", monthly: 160000 },
      { id: "heat_mat", label: "Материалы", monthly: 38000 },
      { id: "heat_to", label: "ТО оборудования", monthly: 55000 },
    ],
  },
  {
    id: "ads",
    label: "5. АДС",
    items: [
      { id: "ads_fot", label: "ФОТ", monthly: 140000 },
      { id: "ads_ops", label: "Операционные расходы", monthly: 25000 },
    ],
  },
  {
    id: "structural",
    label: "6. Конструктив",
    items: [
      { id: "structural_fot", label: "ФОТ", monthly: 250000 },
      { id: "structural_mat", label: "Материалы", monthly: 80000 },
    ],
  },
  {
    id: "elevators",
    label: "7. Лифты",
    items: [
      { id: "elevators_to", label: "ТО лифтов", monthly: 0 },
      { id: "elevators_fot", label: "ФОТ лифтёров", monthly: 0 },
    ],
  },
  {
    id: "ventilation",
    label: "8. Вентиляция",
    items: [
      { id: "ventilation_fot", label: "ФОТ", monthly: 90000 },
      { id: "ventilation_to", label: "ТО оборудования", monthly: 35000 },
      { id: "ventilation_mat", label: "Материалы", monthly: 18000 },
    ],
  },
  {
    id: "fire",
    label: "9. ПБиСС (пожарная безопасность)",
    items: [
      { id: "fire_fot", label: "ФОТ", monthly: 120000 },
      { id: "fire_to", label: "ТО систем", monthly: 60000 },
    ],
  },
  {
    id: "dispatch",
    label: "10. Диспетчеризация",
    items: [
      { id: "dispatch_fot", label: "ФОТ диспетчеров", monthly: 130000 },
      { id: "dispatch_soft", label: "ПО и связь", monthly: 25000 },
    ],
  },
  {
    id: "filtration",
    label: "11. Фильтрация воды",
    items: [
      { id: "filtration_to", label: "ТО фильтров", monthly: 45000 },
      { id: "filtration_mat", label: "Расходники", monthly: 20000 },
    ],
  },
  {
    id: "heatcurtains",
    label: "12. Тепловые завесы",
    items: [
      { id: "heatcurtains_to", label: "ТО завес", monthly: 18000 },
      { id: "heatcurtains_mat", label: "Материалы", monthly: 8000 },
    ],
  },
  {
    id: "cleaning",
    label: "13. Клининг (МОП)",
    items: [
      { id: "cleaning_fot", label: "ФОТ уборщиков", monthly: 0 },
      { id: "cleaning_mat", label: "Инвентарь и химия", monthly: 0 },
    ],
  },
  {
    id: "landscaping",
    label: "14. Благоустройство",
    items: [
      { id: "landscaping_fot", label: "ФОТ", monthly: 110000 },
      { id: "landscaping_mat", label: "Материалы", monthly: 35000 },
    ],
  },
  {
    id: "alpine",
    label: "15. Альпинистские работы",
    items: [
      { id: "alpine_services", label: "Услуги альпинистов", monthly: 40000 },
    ],
  },
  {
    id: "security",
    label: "16. Охрана",
    items: [
      { id: "security_fot", label: "ФОТ охраны", monthly: 0 },
      { id: "security_equip", label: "Оборудование / ТО", monthly: 0 },
    ],
  },
  {
    id: "concierge",
    label: "17. Консьерж",
    items: [
      { id: "concierge_fot", label: "ФОТ консьержей", monthly: 0 },
    ],
  },
  {
    id: "techsupervision",
    label: "18. Технадзор",
    items: [
      { id: "techsupervision_fot", label: "ФОТ", monthly: 95000 },
      { id: "techsupervision_ops", label: "Операционные расходы", monthly: 15000 },
    ],
  },
  {
    id: "extraclean",
    label: "19. Доп. клининг",
    items: [
      { id: "extraclean_fot", label: "ФОТ", monthly: 0 },
      { id: "extraclean_mat", label: "Материалы", monthly: 0 },
    ],
  },
];
