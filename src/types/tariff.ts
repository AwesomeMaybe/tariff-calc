/** Событие индексации тарифа. */
export interface IndexEvent {
  date: string;    // ISO
  pct: number;     // процент индексации, напр. 5 = +5%
  comment: string; // мотивация / ссылка
  fromTariff: number; // тариф до
  toTariff: number;   // тариф после
}

export interface SectionGroup {
  count: number;
  floors: number;
}

export interface ElevatorGroup {
  count: number;
  floors: number;
}

export interface BuildingParams {
  // Класс объекта — множитель сервиса/окладов
  buildingClass: string; // "Комфорт" | "Бизнес" | "Премиум" | "Делюкс"

  // Площади
  areaResidential: number;
  areaNonResidential: number;
  areaStorage: number;
  areaParkingSpots: number;
  areaMop: number;          // площадь МОП (холлы, коридоры, лестницы), м²
  areaRoof: number;         // площадь кровли, м²
  areaFacade: number;       // площадь фасада / остекления, м²
  areaHardSurface: number;  // твёрдые покрытия (проезды, тротуары), м²
  parkingLevels: number;    // уровней паркинга (подземных), шт

  // Основные
  apartments: number;
  nonResidentialUnits: number; // кол-во нежилых помещений
  storageUnits: number;        // кол-во кладовых
  parkingSpots: number;        // кол-во машиномест
  sectionGroups: SectionGroup[];
  trashRooms: number;       // мусорокамеры

  // Лифты
  elevatorGroups: ElevatorGroup[];
  elevatorCapacity: number; // грузоподъёмность, кг
  elevatorSpeed: number;    // скорость, м/с
  elevatorDDS: boolean;     // ДДС к лифтам

  // Входные группы и МОП
  entryGroups: number;      // входных групп
  mopDoors: number;         // двери МОП
  doorClosers: number;      // доводчики
  intercoms: number;        // домофоны

  // Вентиляция
  ventilationUnits: number;
  hasChiller: boolean;

  // Парковка / рампы
  ramps: number;
  gates: number;            // ворот
  barriers: number;         // шлагбаумов
  parkingCallDevices: number; // вызывные устройства

  // Территория
  fencedTerritory: boolean;
  greenArea: number;        // м²
  mafPresent: boolean;
  mafCount: number;
  rubberArea: number;       // площадь резинки, м²

  // Фасады и лестницы
  facadeSystem: string;
  evacuationStaircases: number;

  // Электрика и инженерия
  vru: number;                    // ВРУ
  itp: number;                    // ИТП
  waterTreatmentStation: boolean; // станция водоподготовки

  // Кондиционирование
  lobbyAC: boolean;
  lobbyACCount: number;

  // Благоустройство территории
  autoIrrigation: boolean;    // автополив
  courtFountain: boolean;     // фонтан во дворе
  playgrounds: number;        // детские площадки, шт
  sportGrounds: number;       // спортплощадки, шт

  // Безопасность и слаботочка
  cctvCameras: number;          // камеры видеонаблюдения, шт
  accessControlPoints: number;  // точки СКУД, шт
  meteringDevices: number;      // приборы учёта (ОДПУ), шт

  // Инженерные опции
  heatedRamps: boolean;   // обогрев рамп / водостоков
  pumpStations: number;   // насосные станции, шт
  ownBoiler: boolean;     // крышная / встроенная котельная
  snowMelt: boolean;      // снеготаялка

  // Премиум-опции
  hasPool: boolean;         // бассейн / СПА
  hasGym: boolean;          // фитнес-зал
  hasWinterGarden: boolean; // зимний сад / оранжерея

  // Коэффициенты
  platformCoef: number;    // наценка платформы на себестоимость, напр. 1.1 = +10%
  profitCoef: number;
  vatCoef: number;
  indexLog: IndexEvent[];   // журнал индексаций тарифа

  // ФОТ-надбавки (общие для всех ролей объекта)
  insuranceRate: number;    // страховые взносы, напр. 0.302 = 30.2%
  regionCoef: number;       // районный коэффициент, напр. 0 = нет
  premiumRate: number;      // премиальный фонд, напр. 0.15 = +15%
}

/** Глобальные надбавки к ФОТ, вытащенные из BuildingParams. */
export interface PayrollContext {
  insuranceRate: number;
  regionCoef: number;
  premiumRate: number;
}

/** Тип роли определяет, чем считается численность. */
export type RoleType = "area" | "post" | "fixed";

export interface StaffRole {
  type: RoleType;
  oklad: number;          // оклад на 1 сотрудника, ₽/мес (ручной ввод)
  shiftsPerMonth: number; // смен 1 сотрудника в месяц, деф 21

  // area: численность от площади и графика
  area?: number;          // обслуживаемая площадь, м²
  normPerShift?: number;  // норма на 1 смену, м²/смену
  cleansPerMonth?: number; // уборок (циклов) в месяц

  // post: численность от постов и режима
  posts?: number;
  shiftFactor?: number;   // 1 (8ч) / 2.2 (12ч) / 4.4 (24/7)

  // fixed: численность задаётся прямо
  headcount?: number;
}

export type CostItemKind = "manual" | "labor" | "material" | "to";

interface CostItemBase {
  id: string;
  label: string;
  required?: boolean; // обязательна по ТЭП — нельзя удалить, пустая = предупреждение
  auto?: boolean;     // количество/площадь подставляется из ТЭП — поле read-only
  vatOnly?: boolean;  // сумма уже включает платформу и наценку подрядчика — сверху только НДС
  group?: string;     // подраздел внутри раздела (визуальная группировка статей), напр. "2.5.3. ТО инженерных сетей"
}

/** Ручной ввод суммы — поведение как раньше. */
export interface ManualItem extends CostItemBase {
  kind: "manual";
  monthly: number;
}

/** ФОТ роли — сумма считается из StaffRole. */
export interface LaborItem extends CostItemBase {
  kind: "labor";
  role: StaffRole;
}

/** Материалы — % от ФОТ раздела, ₽/м² или фикс. сумма. */
export interface MaterialItem extends CostItemBase {
  kind: "material";
  mode: "percent" | "perArea" | "fixed";
  value: number;  // percent → проценты (8 = 8%); perArea → ₽/м²; fixed → ₽/мес
  area?: number;  // для perArea
}

/** ТО / контракт — ставка × количество. */
export interface TOItem extends CostItemBase {
  kind: "to";
  rate: number;  // ₽/мес за единицу
  qty: number;   // количество единиц
}

export type CostItem = ManualItem | LaborItem | MaterialItem | TOItem;

export interface CostSection {
  id: string;
  label: string;
  items: CostItem[];
}

export interface TariffResult {
  sectionId: string;
  sectionLabel: string;
  totalMonthly: number;
  tariffBase: number;
  tariffFinal: number;
}

export interface CalcOutput {
  totalArea: number;
  results: TariffResult[];
  grandTotalMonthly: number;
  grandTariffBase: number;
  grandTariffFinal: number;
  indexMultiplier: number; // накопленный множитель индексации (произведение всех событий)
}
