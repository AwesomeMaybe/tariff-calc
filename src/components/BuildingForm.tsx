"use client";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildingParams, SectionGroup, ElevatorGroup } from "@/types/tariff";

interface Props {
  params: BuildingParams;
  onChange: (p: BuildingParams) => void;
}

type Val = number | string | boolean;

function NumField({ label, unit, value, field, color = "#94a3b8", hint, onChange }: {
  label: string; unit: string; value: number; field: keyof BuildingParams;
  color?: string; hint?: string;
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}{hint && <span className="text-[10px] opacity-50">({hint})</span>}
      </Label>
      <div className="relative">
        <Input type="number" value={value || ""} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} className="pr-12 text-sm font-mono" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">{unit}</span>
      </div>
    </div>
  );
}

function BoolField({ label, value, field, color = "#94a3b8", onChange }: {
  label: string; value: boolean; field: keyof BuildingParams; color?: string;
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <button type="button" onClick={() => onChange(field, !value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-[18px]" : "translate-x-0"}`} />
      </button>
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 cursor-pointer" onClick={() => onChange(field, !value)}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}
      </Label>
    </div>
  );
}

function SelectField({ label, value, field, options, color = "#94a3b8", onChange }: {
  label: string; value: string; field: keyof BuildingParams; options: string[]; color?: string;
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}
      </Label>
      <select value={value} onChange={(e) => onChange(field, e.target.value)}
        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SectionGroupEditor({ groups, onChange }: {
  groups: SectionGroup[];
  onChange: (g: SectionGroup[]) => void;
}) {
  const total = groups.reduce((s, g) => s + g.count, 0);
  const floors = groups.map((g) => g.floors);
  const minF = floors.length ? Math.min(...floors) : 0;
  const maxF = floors.length ? Math.max(...floors) : 0;
  const avgF = total > 0 ? (groups.reduce((s, g) => s + g.count * g.floors, 0) / total).toFixed(1) : "0";

  function upd(i: number, field: keyof SectionGroup, val: number) {
    onChange(groups.map((g, idx) => idx === i ? { ...g, [field]: val } : g));
  }

  return (
    <div className="col-span-2 space-y-2">
      <div className="grid grid-cols-[1fr_1fr_28px] gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        <span>Секций</span><span>Этажей</span><span />
      </div>
      <div className="space-y-1.5">
        {groups.map((g, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_28px] gap-1.5 items-center">
            <div className="relative">
              <Input type="number" value={g.count || ""} onChange={(e) => upd(i, "count", parseFloat(e.target.value) || 0)} className="pr-8 text-sm font-mono h-8" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">шт</span>
            </div>
            <div className="relative">
              <Input type="number" value={g.floors || ""} onChange={(e) => upd(i, "floors", parseFloat(e.target.value) || 0)} className="pr-7 text-sm font-mono h-8" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">эт</span>
            </div>
            <button type="button" onClick={() => onChange(groups.filter((_, idx) => idx !== i))}
              className="h-8 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...groups, { count: 1, floors: 25 }])}
        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/70 transition-colors">
        <Plus className="h-3 w-3" /> Добавить группу
      </button>
      {groups.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Итого: {total} сек · {minF === maxF ? `${minF} эт` : `${minF}–${maxF} эт`} · ср. {avgF} эт
        </p>
      )}
    </div>
  );
}

function ElevatorGroupEditor({ groups, onChange }: {
  groups: ElevatorGroup[];
  onChange: (g: ElevatorGroup[]) => void;
}) {
  const total = groups.reduce((s, g) => s + g.count, 0);

  function upd(i: number, field: keyof ElevatorGroup, val: number) {
    onChange(groups.map((g, idx) => idx === i ? { ...g, [field]: val } : g));
  }

  return (
    <div className="col-span-2 space-y-2">
      <div className="grid grid-cols-[1fr_1fr_28px] gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        <span>Лифтов</span><span>Этажей</span><span />
      </div>
      <div className="space-y-1.5">
        {groups.map((g, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_28px] gap-1.5 items-center">
            <div className="relative">
              <Input type="number" value={g.count || ""} onChange={(e) => upd(i, "count", parseFloat(e.target.value) || 0)} className="pr-8 text-sm font-mono h-8" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">шт</span>
            </div>
            <div className="relative">
              <Input type="number" value={g.floors || ""} onChange={(e) => upd(i, "floors", parseFloat(e.target.value) || 0)} className="pr-7 text-sm font-mono h-8" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">эт</span>
            </div>
            <button type="button" onClick={() => onChange(groups.filter((_, idx) => idx !== i))}
              className="h-8 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...groups, { count: 1, floors: 25 }])}
        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/70 transition-colors">
        <Plus className="h-3 w-3" /> Добавить группу
      </button>
      {groups.length > 0 && (
        <p className="text-[10px] text-muted-foreground">Итого лифтов: {total}</p>
      )}
    </div>
  );
}

function Block({ title, color, cols = 3, span2, children }: { title: string; color: string; cols?: number; span2?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-border/60 overflow-hidden ${span2 ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: `${color}14` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{title}</p>
      </div>
      <div className={`p-4 bg-card grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {children}
      </div>
    </div>
  );
}

function BlockMixed({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: `${color}14` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{title}</p>
      </div>
      <div className="p-4 bg-card space-y-2">{children}</div>
    </div>
  );
}

export function BuildingForm({ params, onChange }: Props) {
  const set = (field: keyof BuildingParams, v: Val) => onChange({ ...params, [field]: v });

  return (
    <div className="grid grid-cols-2 gap-4 items-start">

      <Block title="Площади объекта" color="#3b82f6" cols={4} span2>
        <NumField label="Жилые"        unit="м²" value={params.areaResidential}    field="areaResidential"    color="#3b82f6" onChange={set} />
        <NumField label="Нежилые"      unit="м²" value={params.areaNonResidential} field="areaNonResidential" color="#6366f1" onChange={set} />
        <NumField label="Кладовые"     unit="м²" value={params.areaStorage}        field="areaStorage"        color="#8b5cf6" onChange={set} />
        <NumField label="Машиноместа"  unit="м²" value={params.areaParkingSpots}   field="areaParkingSpots"   color="#06b6d4" onChange={set} />
      </Block>

      <Block title="Основные параметры" color="#10b981" cols={2}>
        <NumField label="Квартиры"     unit="шт" value={params.apartments} field="apartments" color="#10b981" onChange={set} />
        <NumField label="Мусорокамеры" unit="шт" value={params.trashRooms} field="trashRooms" color="#84cc16" onChange={set} />
        <SectionGroupEditor
          groups={params.sectionGroups}
          onChange={(g) => onChange({ ...params, sectionGroups: g })}
        />
      </Block>

      <Block title="Лифтовое хозяйство" color="#f59e0b" cols={2}>
        <ElevatorGroupEditor
          groups={params.elevatorGroups}
          onChange={(g) => onChange({ ...params, elevatorGroups: g })}
        />
        <NumField label="Грузоподъёмность" unit="кг"  value={params.elevatorCapacity} field="elevatorCapacity" color="#f97316" onChange={set} />
        <NumField label="Скорость"         unit="м/с" value={params.elevatorSpeed}    field="elevatorSpeed"    color="#fb923c" onChange={set} />
        <div className="col-span-2 flex items-center">
          <BoolField label="ДДС к лифтам" value={params.elevatorDDS} field="elevatorDDS" color="#f59e0b" onChange={set} />
        </div>
      </Block>

      <Block title="Входные группы и МОП" color="#a855f7" cols={4}>
        <NumField label="Входных групп" unit="шт" value={params.entryGroups} field="entryGroups" color="#a855f7" onChange={set} />
        <NumField label="Домофоны"      unit="шт" value={params.intercoms}   field="intercoms"   color="#c084fc" onChange={set} />
        <NumField label="Двери МОП"     unit="шт" value={params.mopDoors}    field="mopDoors"    color="#d946ef" onChange={set} />
        <NumField label="Доводчики"     unit="шт" value={params.doorClosers} field="doorClosers" color="#e879f9" onChange={set} />
      </Block>

      <Block title="Инженерные системы" color="#0ea5e9" cols={4}>
        <NumField label="ВРУ"                  unit="шт" value={params.vru}              field="vru"              color="#0ea5e9" onChange={set} />
        <NumField label="ИТП"                  unit="шт" value={params.itp}              field="itp"              color="#38bdf8" onChange={set} />
        <NumField label="Уст. вентиляции"      unit="шт" value={params.ventilationUnits} field="ventilationUnits" color="#06b6d4" onChange={set} />
        <div />
        <div className="col-span-2">
          <BoolField label="Станция водоподготовки" value={params.waterTreatmentStation} field="waterTreatmentStation" color="#0ea5e9" onChange={set} />
        </div>
        <div className="col-span-2">
          <BoolField label="Чиллер" value={params.hasChiller} field="hasChiller" color="#38bdf8" onChange={set} />
        </div>
        <div className="col-span-2">
          <BoolField label="Кондиционирование лобби" value={params.lobbyAC} field="lobbyAC" color="#0ea5e9" onChange={set} />
        </div>
        {params.lobbyAC && (
          <NumField label="Кол-во кондиционеров" unit="шт" value={params.lobbyACCount} field="lobbyACCount" color="#0ea5e9" onChange={set} />
        )}
      </Block>

      <Block title="Парковка и рампы" color="#f43f5e" cols={4}>
        <NumField label="Рампы"              unit="шт" value={params.ramps}              field="ramps"              color="#f43f5e" onChange={set} />
        <NumField label="Ворот"              unit="шт" value={params.gates}              field="gates"              color="#fb7185" onChange={set} />
        <NumField label="Шлагбаумов"         unit="шт" value={params.barriers}           field="barriers"           color="#f43f5e" onChange={set} />
        <NumField label="Вызывных устройств" unit="шт" value={params.parkingCallDevices} field="parkingCallDevices" color="#fda4af" onChange={set} />
      </Block>

      <Block title="Территория и благоустройство" color="#22c55e" cols={4}>
        <NumField label="Площадь зеленки" unit="м²" value={params.greenArea}  field="greenArea"  color="#22c55e" onChange={set} />
        <NumField label="Площадь резинки" unit="м²" value={params.rubberArea} field="rubberArea" color="#86efac" onChange={set} />
        {params.mafPresent && (
          <NumField label="Кол-во МАФов" unit="шт" value={params.mafCount} field="mafCount" color="#4ade80" onChange={set} />
        )}
        <div className="col-span-4 grid grid-cols-2 gap-x-6 gap-y-1">
          <BoolField label="Ограждённая территория" value={params.fencedTerritory} field="fencedTerritory" color="#22c55e" onChange={set} />
          <BoolField label="Наличие МАФов"          value={params.mafPresent}      field="mafPresent"      color="#4ade80" onChange={set} />
          <BoolField label="Система автополива"     value={params.autoIrrigation}  field="autoIrrigation"  color="#16a34a" onChange={set} />
          <BoolField label="Фонтан во дворе"        value={params.courtFountain}   field="courtFountain"   color="#15803d" onChange={set} />
        </div>
      </Block>

      <Block title="Фасады и эвакуация" color="#64748b" cols={4}>
        <div className="col-span-3">
          <SelectField
            label="Система обслуживания фасадов"
            value={params.facadeSystem}
            field="facadeSystem"
            options={["Без системы", "Строительные люльки", "Маршруты альпинистов", "Фасадные подъёмники", "Комбинированная"]}
            color="#64748b"
            onChange={set}
          />
        </div>
        <NumField label="Эвак. лестницы" unit="шт" value={params.evacuationStaircases} field="evacuationStaircases" color="#94a3b8" onChange={set} />
      </Block>

      <Block title="Финансовые коэффициенты" color="#6366f1" cols={2} span2>
        <NumField label="Коэф. прибыли" hint="обычно 1.10" unit="×" value={params.profitCoef} field="profitCoef" color="#6366f1" onChange={set} />
        <NumField label="НДС"           hint="обычно 1.22" unit="×" value={params.vatCoef}    field="vatCoef"    color="#818cf8" onChange={set} />
      </Block>

    </div>
  );
}
