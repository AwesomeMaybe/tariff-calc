export interface SectionGroup {
  count: number;
  floors: number;
}

export interface ElevatorGroup {
  count: number;
  floors: number;
}

export interface BuildingParams {
  // Площади
  areaResidential: number;
  areaNonResidential: number;
  areaStorage: number;
  areaParkingSpots: number;

  // Основные
  apartments: number;
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

  // Коэффициенты
  profitCoef: number;
  vatCoef: number;
}

export interface SectionCostItem {
  id: string;
  label: string;
  monthly: number;
}

export interface CostSection {
  id: string;
  label: string;
  items: SectionCostItem[];
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
}
