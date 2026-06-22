"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Building2, Settings2, BarChart3,
  Plus, Trash2, ChevronRight, FolderOpen, Save, Pencil, Check, X,
} from "lucide-react";
import { BuildingForm } from "@/components/BuildingForm";
import { BuildingPassport } from "@/components/BuildingPassport";
import { SectionsEditor } from "@/components/SectionsEditor";
import { TariffResults } from "@/components/TariffResults";
import { fmt, fmtRub, totalArea as calcArea, sectionMonthly, calculate, totalEntrances, totalElevators, floorRange } from "@/lib/calculate";
import { DEFAULT_SECTIONS } from "@/lib/default-sections";
import {
  loadObjects, saveObjects, createObject, updateObject, deleteObject, formatDate,
  type SavedObject,
} from "@/lib/storage";
import type { BuildingParams, CostSection } from "@/types/tariff";
import { SECTION_PALETTE } from "@/lib/colors";

const DEFAULT_PARAMS: BuildingParams = {
  areaResidential: 68051.2,
  areaNonResidential: 4568.73,
  areaStorage: 566.63,
  areaParkingSpots: 6350.67,
  apartments: 1412,
  nonResidentialUnits: 0,
  storageUnits: 0,
  parkingSpots: 0,
  sectionGroups: [{ count: 2, floors: 25 }, { count: 1, floors: 17 }],
  trashRooms: 3,
  elevatorGroups: [{ count: 8, floors: 25 }, { count: 4, floors: 17 }],
  elevatorCapacity: 1000,
  elevatorSpeed: 1.6,
  elevatorDDS: false,
  entryGroups: 3,
  mopDoors: 30,
  doorClosers: 30,
  intercoms: 3,
  ventilationUnits: 4,
  hasChiller: false,
  ramps: 1,
  gates: 2,
  barriers: 2,
  parkingCallDevices: 4,
  fencedTerritory: true,
  greenArea: 2500,
  mafPresent: true,
  mafCount: 12,
  rubberArea: 400,
  facadeSystem: "Маршруты альпинистов",
  evacuationStaircases: 6,
  vru: 1,
  itp: 1,
  waterTreatmentStation: false,
  lobbyAC: false,
  lobbyACCount: 0,
  autoIrrigation: false,
  courtFountain: false,
  profitCoef: 1.1,
  vatCoef: 1.22,
  indexationCoef: 1.05,
};

type Tab = "params" | "costs" | "results";

const NAV: { id: Tab; label: string; sub: string; icon: React.ElementType }[] = [
  { id: "params",  label: "ТЭП",     sub: "Параметры объекта", icon: Building2 },
  { id: "costs",   label: "Затраты", sub: "19 разделов",       icon: Settings2 },
  { id: "results", label: "Тариф",   sub: "Итоговый расчёт",   icon: BarChart3 },
];

const SECTION_ACCENTS = [
  "accent-blue","accent-indigo","accent-violet","accent-purple","accent-rose",
  "accent-orange","accent-amber","accent-yellow","accent-lime","accent-green",
  "accent-emerald","accent-teal","accent-cyan","accent-sky","accent-slate",
  "accent-pink","accent-fuchsia","accent-red","accent-stone",
];

/* Aggregate stats across ALL saved objects */
function useAggregates(objects: SavedObject[]) {
  return useMemo(() => {
    if (objects.length === 0) return null;
    let totalArea = 0;
    let totalCosts = 0;
    let totalApts = 0;
    let totalLifts = 0;
    for (const obj of objects) {
      totalArea  += calcArea(obj.params);
      totalCosts += obj.sections.reduce((s, sec) => s + sectionMonthly(sec), 0);
      totalApts  += obj.params.apartments;
      totalLifts += obj.params.elevatorGroups.reduce((s, g) => s + g.count, 0);
    }
    return { totalArea, totalCosts, totalApts, totalLifts, count: objects.length };
  }, [objects]);
}

/* Растягиваемая панель: drag по разделителю, clamp, сохранение ширины */
function useResizable(key: string, initial: number, min: number, max: number, side: "left" | "right") {
  const [w, setW] = useState(initial);
  useEffect(() => {
    const s = localStorage.getItem(key);
    if (s) setW(Math.min(max, Math.max(min, parseFloat(s) || initial)));
  }, [key, initial, min, max]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = w;
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const next = side === "left" ? startW + dx : startW - dx;
      setW(Math.min(max, Math.max(min, next)));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setW((cur) => { localStorage.setItem(key, String(cur)); return cur; });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  return { w, onMouseDown };
}

function Resizer({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 flex-shrink-0 cursor-col-resize bg-border/40 hover:bg-primary/60 active:bg-primary transition-colors"
      title="Потяните, чтобы изменить ширину"
    />
  );
}

export default function TariffPage() {
  const left  = useResizable("ui.leftW", 224, 180, 480, "left");
  const right = useResizable("ui.rightW", 208, 170, 480, "right");
  const [objects, setObjects]   = useState<SavedObject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [params, setParams]     = useState<BuildingParams>(DEFAULT_PARAMS);
  const [sections, setSections] = useState<CostSection[]>(DEFAULT_SECTIONS);
  const [tab, setTab]           = useState<Tab>("params");
  const [newName, setNewName]   = useState("");
  const [showNew, setShowNew]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [dirty, setDirty]         = useState(false);
  const newInputRef  = useRef<HTMLInputElement>(null);
  const pendingSave  = useRef<ReturnType<typeof setTimeout>>(undefined);

  function scheduleAutosave(saveId: string, p: BuildingParams, s: CostSection[]) {
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => {
      setObjects((prev) => {
        const updated = updateObject(prev, saveId, p, s);
        saveObjects(updated);
        return updated;
      });
      setDirty(false);
    }, 600);
  }

  useEffect(() => {
    const saved = loadObjects();
    setObjects(saved);
    if (saved.length > 0) {
      const first = saved[0];
      setActiveId(first.id);
      setParams(first.params);
      setSections(first.sections);
    }
  }, []);

  const output     = useMemo(() => calculate(params, sections), [params, sections]);
  const aggregates = useAggregates(objects);
  const activeObj  = objects.find((o) => o.id === activeId);

  function handleParamsChange(p: BuildingParams) {
    setParams(p);
    setDirty(true);
    if (activeId) scheduleAutosave(activeId, p, sections);
  }
  function handleSectionsChange(s: CostSection[]) {
    setSections(s);
    setDirty(true);
    if (activeId) scheduleAutosave(activeId, params, s);
  }

  function handleSave() {
    if (!activeId) return;
    const updated = updateObject(objects, activeId, params, sections);
    setObjects(updated);
    saveObjects(updated);
    setDirty(false);
  }

  function handleCreate() {
    const name = newName.trim() || "Новый объект";
    const obj = createObject(name, DEFAULT_PARAMS, DEFAULT_SECTIONS.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, monthly: 0 })) })));
    const updated = [obj, ...objects];
    setObjects(updated);
    saveObjects(updated);
    setActiveId(obj.id);
    setParams(obj.params);
    setSections(obj.sections);
    setNewName("");
    setShowNew(false);
    setDirty(false);
    setTab("params");
  }

  function handleSelect(obj: SavedObject) {
    if (dirty && activeId) handleSave();
    setActiveId(obj.id);
    setParams(obj.params);
    setSections(obj.sections);
    setDirty(false);
  }

  function handleDelete(id: string) {
    const updated = deleteObject(objects, id);
    setObjects(updated);
    saveObjects(updated);
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
        setParams(updated[0].params);
        setSections(updated[0].sections);
      } else {
        setActiveId(null);
        setParams(DEFAULT_PARAMS);
        setSections(DEFAULT_SECTIONS);
      }
      setDirty(false);
    }
  }

  function handleRename(id: string) {
    if (!editName.trim()) { setEditingId(null); return; }
    const updated = objects.map((o) => o.id !== id ? o : { ...o, name: editName.trim() });
    setObjects(updated);
    saveObjects(updated);
    setEditingId(null);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ───── Left Sidebar ───── */}
      <aside
        className="flex-shrink-0 flex flex-col h-full overflow-hidden"
        style={{ width: left.w, background: "hsl(var(--sidebar-bg))" }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src="/mr-logo.png" alt="MR Group" className="h-7 w-auto flex-shrink-0" />
            <span className="w-px h-7 bg-white/25 flex-shrink-0" />
            <p className="text-white font-semibold text-[17px] leading-tight tracking-tight">Тарифный калькулятор</p>
          </div>
        </div>

        {/* Objects list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 min-h-0">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "hsl(var(--sidebar-fg))" }}>
              Объекты
            </span>
            <button
              onClick={() => { setShowNew((v) => !v); setTimeout(() => newInputRef.current?.focus(), 50); }}
              className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              title="Новый объект"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {showNew && (
            <div className="mb-2 px-1 flex gap-1">
              <input
                ref={newInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false); }}
                placeholder="Название объекта"
                className="flex-1 h-7 rounded-lg px-2.5 text-[12px] bg-white/10 text-white placeholder:text-white/30 border border-white/10 focus:outline-none focus:border-primary"
              />
              <button onClick={handleCreate} className="h-7 w-7 rounded-lg bg-primary hover:opacity-90 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          )}

          {objects.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-20 text-white" />
              <p className="text-[11px] text-white/30">Нет объектов</p>
              <p className="text-[10px] text-white/20 mt-0.5">Нажмите + чтобы создать</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {objects.map((obj) => {
                const isActive = obj.id === activeId;
                return (
                  <div
                    key={obj.id}
                    className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all ${isActive ? "bg-primary shadow-md" : "hover:bg-white/7"}`}
                    onClick={() => handleSelect(obj)}
                  >
                    {editingId === obj.id ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(obj.id); if (e.key === "Escape") setEditingId(null); }}
                          className="flex-1 h-6 rounded-md px-2 text-[12px] bg-white/20 text-white border border-white/30 focus:outline-none"
                        />
                        <button onClick={() => handleRename(obj.id)} className="text-white/70 hover:text-white"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditingId(null)} className="text-white/50 hover:text-white"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[13px] font-medium leading-tight truncate pr-10 ${isActive ? "text-white" : "text-white/80"}`}>
                          {obj.name}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? "text-violet-200/80" : "text-white/30"}`}>
                          {formatDate(obj.updatedAt)}
                        </p>
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(obj.id); setEditName(obj.name); }}
                            className="p-1 rounded-md hover:bg-white/20 text-white/60 hover:text-white"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Удалить «${obj.name}»?`)) handleDelete(obj.id); }}
                            className="p-1 rounded-md hover:bg-red-500/40 text-white/60 hover:text-red-300"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aggregate stats — all objects */}
        {aggregates && (
          <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: "hsl(var(--sidebar-fg))" }}>
              Сводка по УК
            </p>
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,.05)" }}>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px]" style={{ color: "hsl(var(--sidebar-fg))" }}>Объектов</span>
                <span className="text-xs font-semibold text-white">{aggregates.count}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px]" style={{ color: "hsl(var(--sidebar-fg))" }}>Площадь</span>
                <span className="text-xs font-semibold text-white tabular-nums">{fmt(aggregates.totalArea, 0)} м²</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px]" style={{ color: "hsl(var(--sidebar-fg))" }}>Затраты</span>
                <span className="text-xs font-semibold text-white tabular-nums">{fmtRub(aggregates.totalCosts)}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      <Resizer onMouseDown={left.onMouseDown} />

      {/* ───── Main content ───── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Topbar */}
        {activeObj && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-2.5 bg-background/90 backdrop-blur border-b border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span className="font-medium text-foreground">{activeObj.name}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{NAV.find((n) => n.id === tab)?.label}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${dirty ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground cursor-default"}`}
            >
              <Save className="h-3.5 w-3.5" />
              {dirty ? "Сохранить" : "Сохранено"}
            </button>
          </div>
        )}

        {!activeId && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="p-4 rounded-2xl bg-muted">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Нет активного объекта</p>
              <p className="text-muted-foreground text-sm mt-1">Создайте объект через кнопку + в сайдбаре</p>
            </div>
          </div>
        )}

        {activeId && tab === "params"  && <ParamsView  params={params}   onChange={handleParamsChange}   />}
        {activeId && tab === "costs"   && <CostsView   sections={sections} onChange={handleSectionsChange} />}
        {activeId && tab === "results" && <ResultsView output={output}   params={params}                 />}
      </main>

      {/* ───── Right panel: nav + current object ───── */}
      {activeId && activeObj && (
        <>
        <Resizer onMouseDown={right.onMouseDown} />
        <aside className="flex-shrink-0 border-l border-border/60 bg-card overflow-y-auto" style={{ width: right.w }}>
          {/* Object header */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-0.5">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Объект</p>
            </div>
            <p className="text-[12px] font-semibold truncate mt-0.5">{activeObj.name}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(activeObj.updatedAt)}</p>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Tariff hero */}
            <div className="rounded-xl p-3 grad-blue text-white">
              <p className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Тариф итого</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">{fmt(output.grandTariffFinal)}</p>
              <p className="text-[10px] text-white/60">р/м²</p>
            </div>

            {/* Key metrics */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Площадь</p>
                <p className="text-lg font-bold tabular-nums">{fmt(calcArea(params), 0)}</p>
                <p className="text-[10px] text-muted-foreground">м²</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Затраты / мес</p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {fmtRub(sections.reduce((s, sec) => s + sectionMonthly(sec), 0))}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Базовый тариф</p>
                <p className="text-base font-bold tabular-nums">{fmt(output.grandTariffBase)}</p>
                <p className="text-[10px] text-muted-foreground">р/м² без наценки</p>
              </div>
            </div>

            {/* Building snapshot */}
            <div className="border-t border-border/40 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Параметры</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {[
                  { label: "Квартиры", value: String(params.apartments) },
                  { label: "Лифты",    value: String(totalElevators(params)) },
                  { label: "Секции",   value: String(totalEntrances(params)) },
                  { label: "Этажей",   value: floorRange(params) },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className="text-xs font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Navigation */}
          <div className="px-2.5 py-3 border-t border-border/50 space-y-0.5">
            {NAV.map(({ id, label, sub, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-tight">{label}</p>
                  <p className={`text-[10px] truncate ${tab === id ? "text-white/60" : "text-muted-foreground/60"}`}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
        </>
      )}
    </div>
  );
}

/* ─── ТЭП ─── */
function ParamsView({ params, onChange }: { params: BuildingParams; onChange: (p: BuildingParams) => void }) {
  const area = calcArea(params);
  return (
    <div className="fade-in pl-5 pr-6 pt-5 pb-10">
      <div className="flex gap-6 items-start">

        {/* левая колонка — заголовок, KPI, форма */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-4">
            <h1 className="text-lg font-bold tracking-tight">Технико-экономические показатели</h1>
            <span className="text-xs text-muted-foreground">параметры объекта</span>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 shadow-sm grid grid-cols-5 divide-x divide-border/60 mb-4">
            {[
              { label: "Жилые",       value: fmt(params.areaResidential, 1)    },
              { label: "Нежилые",     value: fmt(params.areaNonResidential, 1) },
              { label: "Кладовые",    value: fmt(params.areaStorage, 1)        },
              { label: "Машиноместа", value: fmt(params.areaParkingSpots, 1)   },
              { label: "Итого",       value: fmt(area, 1), total: true         },
            ].map((c) => (
              <div key={c.label} className="px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{c.label}</p>
                <p className={`text-sm font-bold tabular-nums leading-tight ${c.total ? "text-primary" : ""}`}>{c.value}</p>
                <p className="text-[10px] text-muted-foreground/70">м²</p>
              </div>
            ))}
          </div>

          <BuildingForm params={params} onChange={onChange} />
        </div>

        {/* правая колонка — живая модель МКД */}
        <div className="w-[440px] flex-shrink-0 sticky top-14 pt-10">
          <BuildingPassport params={params} />
        </div>

      </div>
    </div>
  );
}

/* ─── Затраты ─── */
function CostsView({ sections, onChange }: { sections: CostSection[]; onChange: (s: CostSection[]) => void }) {
  const total = sections.reduce((s, sec) => s + sectionMonthly(sec), 0);
  const max   = Math.max(...sections.map(sectionMonthly), 1);
  return (
    <div className="fade-in">
      <div className="grad-hero facet-br px-8 pt-8 pb-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #8b5cf6 0%, transparent 60%)" }} />
        <div className="relative flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-white/10"><Settings2 className="h-4 w-4 text-white" /></div>
              <span className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Затраты</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Расходы по разделам</h1>
            <p className="text-violet-200/70 text-sm">Укажите ежемесячные затраты по каждому разделу</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white tabular-nums">{fmtRub(total)}</p>
            <p className="text-violet-200/60 text-sm">суммарно в месяц</p>
          </div>
        </div>
      </div>

      <div className="px-8 mt-6 mb-6">
        <div className="glass rounded-2xl p-4 shadow-md">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Структура затрат</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {sections.map((sec, i) => {
              const pct = (sectionMonthly(sec) / (total || 1)) * 100;
              if (pct < 0.5) return null;
              return <div key={sec.id} style={{ width: `${pct}%`, background: SECTION_PALETTE[i % SECTION_PALETTE.length] }} title={`${sec.label}: ${fmtRub(sectionMonthly(sec))}`} />;
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>{sections.filter(s => sectionMonthly(s) > 0).length} активных разделов</span>
            <span>{fmtRub(total)} / мес</span>
          </div>
        </div>
      </div>
      <div className="px-8 pb-10">
        <SectionsEditor sections={sections} onChange={onChange} accents={SECTION_ACCENTS} max={max} />
      </div>
    </div>
  );
}

/* ─── Results ─── */
function ResultsView({ output, params }: { output: ReturnType<typeof calculate>; params: BuildingParams }) {
  return (
    <div className="fade-in">
      <div className="grad-hero facet-br px-8 pt-8 pb-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #a78bfa 0%, transparent 60%)" }} />
        <div className="relative flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-white/10"><BarChart3 className="h-4 w-4 text-white" /></div>
              <span className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Результат</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Тарифная таблица</h1>
            <p className="text-violet-200/70 text-sm">
              Прибыль {params.profitCoef}× · НДС {params.vatCoef}× · Множитель {(params.profitCoef * params.vatCoef).toFixed(3)}×
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white tabular-nums">{fmt(output.grandTariffFinal)}</p>
            <p className="text-violet-200/60 text-sm">р/м² · итоговый тариф</p>
          </div>
        </div>
      </div>
      <div className="px-8 mt-6 pb-10">
        <TariffResults output={output} />
      </div>
    </div>
  );
}
