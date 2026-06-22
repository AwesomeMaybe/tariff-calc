"use client";
import {
  Plus, X, Ruler, Building2, MoveVertical, DoorOpen, Cog,
  CarFront, Trees, Layers, Percent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildingParams } from "@/types/tariff";

interface Props {
  params: BuildingParams;
  onChange: (p: BuildingParams) => void;
}

type Val = number | string | boolean;

/* ── Fields ── */

function NumField({ label, unit, value, field, hint, onChange }: {
  label: string; unit: string; value: number; field: keyof BuildingParams;
  hint?: string;
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}{hint && <span className="opacity-60 font-normal"> · {hint}</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
          className="pr-11 text-sm tabular-nums h-9 bg-background border-input shadow-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/70 pointer-events-none">{unit}</span>
      </div>
    </div>
  );
}

function BoolField({ label, value, field, onChange }: {
  label: string; value: boolean; field: keyof BuildingParams;
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(field, !value)}
      className={`flex items-center gap-2.5 h-9 px-3 rounded-lg border text-left transition-colors w-full ${
        value
          ? "border-primary/40 bg-primary/5"
          : "border-input bg-background hover:bg-muted/60"
      }`}
    >
      <span className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/25"}`}>
        <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-[14px]" : "translate-x-0"}`} />
      </span>
      <span className={`text-xs font-medium ${value ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );
}

function SelectField({ label, value, field, options, onChange }: {
  label: string; value: string; field: keyof BuildingParams; options: string[];
  onChange: (f: keyof BuildingParams, v: Val) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Group editor (sections / elevators) ── */

function GroupEditor({ groups, unitLabel, onChange, summary }: {
  groups: { count: number; floors: number }[];
  unitLabel: string;
  onChange: (g: { count: number; floors: number }[]) => void;
  summary?: string;
}) {
  function upd(i: number, field: "count" | "floors", val: number) {
    onChange(groups.map((g, idx) => idx === i ? { ...g, [field]: val } : g));
  }
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[168px_168px_28px] gap-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-1">
        <span>{unitLabel}</span><span>Этажей</span><span />
      </div>
      {groups.map((g, i) => (
        <div key={i} className="grid grid-cols-[168px_168px_28px] gap-3 items-center">
          <div className="relative">
            <Input type="number" value={g.count || ""} onChange={(e) => upd(i, "count", parseFloat(e.target.value) || 0)}
              className="pr-8 text-sm tabular-nums h-9 bg-background shadow-none" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/70 pointer-events-none">шт</span>
          </div>
          <div className="relative">
            <Input type="number" value={g.floors || ""} onChange={(e) => upd(i, "floors", parseFloat(e.target.value) || 0)}
              className="pr-7 text-sm tabular-nums h-9 bg-background shadow-none" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/70 pointer-events-none">эт</span>
          </div>
          <button type="button" onClick={() => onChange(groups.filter((_, idx) => idx !== i))}
            className="h-9 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-0.5">
        <button type="button" onClick={() => onChange([...groups, { count: 1, floors: 25 }])}
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors">
          <Plus className="h-3 w-3" /> Добавить группу
        </button>
        {summary && <p className="text-[10px] text-muted-foreground/70">{summary}</p>}
      </div>
    </div>
  );
}

/* ── Section card ── */

function Section({ icon: Icon, title, aside, children }: {
  icon: React.ElementType; title: string; aside?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card border border-border/70 shadow-sm overflow-hidden break-inside-avoid mb-4">
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {aside && <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{aside}</span>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

/* ── Form ── */

export function BuildingForm({ params, onChange }: Props) {
  const set = (field: keyof BuildingParams, v: Val) => onChange({ ...params, [field]: v });

  const totalSections = params.sectionGroups.reduce((s, g) => s + g.count, 0);
  const totalLifts = params.elevatorGroups.reduce((s, g) => s + g.count, 0);
  const floors = params.sectionGroups.map((g) => g.floors);
  const floorsLabel = floors.length
    ? (Math.min(...floors) === Math.max(...floors) ? `${floors[0]} эт` : `${Math.min(...floors)}–${Math.max(...floors)} эт`)
    : "—";

  return (
    <div>

      <Section icon={Ruler} title="Площади объекта">
        <div className="field-grid">
          <NumField label="Жилые"       unit="м²" value={params.areaResidential}    field="areaResidential"    onChange={set} />
          <NumField label="Нежилые"     unit="м²" value={params.areaNonResidential} field="areaNonResidential" onChange={set} />
          <NumField label="Кладовые"    unit="м²" value={params.areaStorage}        field="areaStorage"        onChange={set} />
          <NumField label="Машиноместа" unit="м²" value={params.areaParkingSpots}   field="areaParkingSpots"   onChange={set} />
        </div>
      </Section>

      <Section icon={Building2} title="Конструктив" aside={`${totalSections} сек · ${floorsLabel}`}>
          <div className="field-grid mb-4">
            <NumField label="Квартиры"      unit="шт" value={params.apartments}          field="apartments"          onChange={set} />
            <NumField label="Нежилые помещ." unit="шт" value={params.nonResidentialUnits} field="nonResidentialUnits" onChange={set} />
            <NumField label="Кладовые"      unit="шт" value={params.storageUnits}        field="storageUnits"        onChange={set} />
            <NumField label="Машиноместа"   unit="шт" value={params.parkingSpots}         field="parkingSpots"        onChange={set} />
            <NumField label="Мусорокамеры"  unit="шт" value={params.trashRooms}          field="trashRooms"          onChange={set} />
          </div>
          <GroupEditor
            groups={params.sectionGroups} unitLabel="Секций"
            onChange={(g) => onChange({ ...params, sectionGroups: g })}
          />
        </Section>

        <Section icon={MoveVertical} title="Лифтовое хозяйство" aside={`${totalLifts} лифтов`}>
          <GroupEditor
            groups={params.elevatorGroups} unitLabel="Лифтов"
            onChange={(g) => onChange({ ...params, elevatorGroups: g })}
          />
          <div className="field-grid mt-4">
            <NumField label="Грузоподъёмность" unit="кг"  value={params.elevatorCapacity} field="elevatorCapacity" onChange={set} />
            <NumField label="Скорость"         unit="м/с" value={params.elevatorSpeed}    field="elevatorSpeed"    onChange={set} />
          </div>
          <div className="bool-grid mt-3">
            <BoolField label="ДДС к лифтам" value={params.elevatorDDS} field="elevatorDDS" onChange={set} />
          </div>
        </Section>

      <Section icon={DoorOpen} title="Входные группы и МОП">
        <div className="field-grid">
          <NumField label="Входных групп" unit="шт" value={params.entryGroups} field="entryGroups" onChange={set} />
          <NumField label="Домофоны"      unit="шт" value={params.intercoms}   field="intercoms"   onChange={set} />
          <NumField label="Двери МОП"     unit="шт" value={params.mopDoors}    field="mopDoors"    onChange={set} />
          <NumField label="Доводчики"     unit="шт" value={params.doorClosers} field="doorClosers" onChange={set} />
        </div>
      </Section>

      <Section icon={Cog} title="Инженерные системы">
        <div className="field-grid mb-3">
          <NumField label="ВРУ"             unit="шт" value={params.vru}              field="vru"              onChange={set} />
          <NumField label="ИТП"             unit="шт" value={params.itp}              field="itp"              onChange={set} />
          <NumField label="Уст. вентиляции" unit="шт" value={params.ventilationUnits} field="ventilationUnits" onChange={set} />
          {params.lobbyAC && (
            <NumField label="Кондиционеров" unit="шт" value={params.lobbyACCount} field="lobbyACCount" onChange={set} />
          )}
        </div>
        <div className="bool-grid">
          <BoolField label="Станция водоподготовки"  value={params.waterTreatmentStation} field="waterTreatmentStation" onChange={set} />
          <BoolField label="Чиллер"                  value={params.hasChiller}            field="hasChiller"            onChange={set} />
          <BoolField label="Кондиционирование лобби" value={params.lobbyAC}               field="lobbyAC"               onChange={set} />
        </div>
      </Section>

      <Section icon={CarFront} title="Парковка и рампы">
          <div className="field-grid">
            <NumField label="Рампы"               unit="шт" value={params.ramps}              field="ramps"              onChange={set} />
            <NumField label="Ворота"              unit="шт" value={params.gates}              field="gates"              onChange={set} />
            <NumField label="Шлагбаумы"           unit="шт" value={params.barriers}           field="barriers"           onChange={set} />
            <NumField label="Вызывные устройства" unit="шт" value={params.parkingCallDevices} field="parkingCallDevices" onChange={set} />
          </div>
        </Section>

        <Section icon={Trees} title="Территория и благоустройство">
          <div className="field-grid mb-3">
            <NumField label="Площадь озеленения" unit="м²" value={params.greenArea}  field="greenArea"  onChange={set} />
            <NumField label="Резиновое покрытие" unit="м²" value={params.rubberArea} field="rubberArea" onChange={set} />
            {params.mafPresent && (
              <NumField label="Кол-во МАФов" unit="шт" value={params.mafCount} field="mafCount" onChange={set} />
            )}
          </div>
          <div className="bool-grid">
            <BoolField label="Ограждённая территория" value={params.fencedTerritory} field="fencedTerritory" onChange={set} />
            <BoolField label="Наличие МАФов"          value={params.mafPresent}      field="mafPresent"      onChange={set} />
            <BoolField label="Система автополива"     value={params.autoIrrigation}  field="autoIrrigation"  onChange={set} />
            <BoolField label="Фонтан во дворе"        value={params.courtFountain}   field="courtFountain"   onChange={set} />
          </div>
        </Section>

      <Section icon={Layers} title="Фасады и эвакуация">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <SelectField
              label="Система обслуживания фасадов"
              value={params.facadeSystem}
              field="facadeSystem"
              options={["Без системы", "Строительные люльки", "Маршруты альпинистов", "Фасадные подъёмники", "Комбинированная"]}
              onChange={set}
            />
            <NumField label="Эвак. лестницы" unit="шт" value={params.evacuationStaircases} field="evacuationStaircases" onChange={set} />
          </div>
        </Section>

        <Section icon={Percent} title="Финансовые коэффициенты">
          <div className="field-grid">
            <NumField label="Коэф. прибыли" hint="обычно 1.10" unit="×" value={params.profitCoef}     field="profitCoef"     onChange={set} />
            <NumField label="НДС"           hint="обычно 1.22" unit="×" value={params.vatCoef}        field="vatCoef"        onChange={set} />
            <NumField label="Индексация"    hint="год, 1.05"   unit="×" value={params.indexationCoef} field="indexationCoef" onChange={set} />
          </div>
        </Section>

    </div>
  );
}
