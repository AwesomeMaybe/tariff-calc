"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Users, Wrench, Package, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmtRub, sectionMonthly, sectionFotTotal, itemMonthly } from "@/lib/calculate";
import { roleHeadcount } from "@/lib/payroll";
import type { CostItem, CostSection, PayrollContext, StaffRole } from "@/types/tariff";

interface Props {
  sections: CostSection[];
  onChange: (sections: CostSection[]) => void;
  accents?: string[];
  max?: number;
  pc: PayrollContext;
}

const SHIFT_OPTIONS = [
  { v: 1, l: "8ч (день)" },
  { v: 2.2, l: "12ч смена" },
  { v: 4.4, l: "24/7 пост" },
];

/* мелкое поле с подписью */
function Field({ label, value, onChange, w = "w-full", suffix, step, disabled }: {
  label: string; value: number; onChange: (v: number) => void;
  w?: string; suffix?: string; step?: string; disabled?: boolean;
}) {
  return (
    <label className={cn("block", w)}>
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">{label}</span>
      <div className="relative">
        <Input
          type="number" step={step} disabled={disabled}
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            "h-8 text-sm text-right font-mono tabular-nums",
            suffix && (suffix.length > 2 ? "pr-14" : "pr-9"),
            disabled && "opacity-60 cursor-not-allowed bg-muted/40"
          )}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function KindIcon({ kind }: { kind: CostItem["kind"] }) {
  const Icon = kind === "labor" ? Users : kind === "to" ? Wrench : kind === "material" ? Package : Pencil;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />;
}

/* редактор полей роли по её типу */
function RoleEditor({ role, auto, onChange }: { role: StaffRole; auto?: boolean; onChange: (r: StaffRole) => void }) {
  const set = (patch: Partial<StaffRole>) => onChange({ ...role, ...patch });
  return (
    <div className="flex flex-wrap gap-2 items-end">
      <label className="block w-28">
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Тип</span>
        <select
          value={role.type}
          onChange={(e) => set({ type: e.target.value as StaffRole["type"] })}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="area">Площадь</option>
          <option value="post">Пост</option>
          <option value="fixed">Штат</option>
        </select>
      </label>

      {role.type === "area" && (
        <>
          <Field label={auto ? "Площадь · ТЭП" : "Площадь"} value={role.area ?? 0} onChange={(v) => set({ area: v })} w="w-24" suffix="м²" disabled={auto} />
          <Field label="Норма" value={role.normPerShift ?? 0} onChange={(v) => set({ normPerShift: v })} w="w-24" suffix="м²/см" />
          <Field label="Уборок/мес" value={role.cleansPerMonth ?? 0} onChange={(v) => set({ cleansPerMonth: v })} w="w-24" />
          <Field label="Смен/мес" value={role.shiftsPerMonth} onChange={(v) => set({ shiftsPerMonth: v })} w="w-20" />
        </>
      )}

      {role.type === "post" && (
        <>
          <Field label="Постов" value={role.posts ?? 0} onChange={(v) => set({ posts: v })} w="w-20" />
          <label className="block w-28">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Режим</span>
            <select
              value={role.shiftFactor ?? 1}
              onChange={(e) => set({ shiftFactor: parseFloat(e.target.value) })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {SHIFT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </label>
        </>
      )}

      {role.type === "fixed" && (
        <Field label="Численность" value={role.headcount ?? 0} onChange={(v) => set({ headcount: v })} w="w-24" suffix="чел" />
      )}

      <Field label="Оклад" value={role.oklad} onChange={(v) => set({ oklad: v })} w="w-28" suffix="₽" />
    </div>
  );
}

/* строка item'а по kind */
function ItemRow({ item, pc, sectionFot, onChange }: {
  item: CostItem; pc: PayrollContext; sectionFot: number; onChange: (it: CostItem) => void;
}) {
  const monthly = itemMonthly(item, pc, sectionFot);
  const unfilled = !!item.required && monthly <= 0;

  return (
    <div className="px-5 py-3 border-b border-border/30 last:border-0 hover:bg-muted/15">
      <div className="flex items-center gap-2 mb-2">
        <KindIcon kind={item.kind} />
        <span className="flex-1 text-sm font-medium">{item.label}</span>
        {item.required && (
          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            по ТЭП
          </span>
        )}
        {item.vatOnly && (
          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600" title="Цена подрядчика уже с платформой и наценкой — сверху только НДС">
            подряд, только НДС
          </span>
        )}
        <span className={cn("text-sm font-bold tabular-nums", monthly > 0 ? "" : "text-muted-foreground/50")}>
          {fmtRub(monthly)}
        </span>
      </div>
      {unfilled && (
        <p className="text-[11px] text-amber-600 mb-1.5">⚠ Есть в ТЭП — заполните сумму/ставку.</p>
      )}

      {item.kind === "manual" && (
        <div className="flex justify-end">
          <Field label="Сумма" value={item.monthly} onChange={(v) => onChange({ ...item, monthly: v })} w="w-40" suffix="₽/мес" />
        </div>
      )}

      {item.kind === "labor" && (
        <>
          <RoleEditor role={item.role} auto={item.auto} onChange={(role) => onChange({ ...item, role })} />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Численность: <b className="text-foreground">{roleHeadcount(item.role)} чел</b>
            {" · "}надбавки ×{((1 + pc.insuranceRate) * (1 + pc.regionCoef) * (1 + pc.premiumRate)).toFixed(3)}
          </p>
        </>
      )}

      {item.kind === "to" && (
        <div className="flex flex-wrap gap-2 items-end justify-end">
          <Field label="Ставка" value={item.rate} onChange={(v) => onChange({ ...item, rate: v })} w="w-32" suffix="₽/ед" />
          <Field label={item.auto ? "Кол-во · ТЭП" : "Количество"} value={item.qty} onChange={(v) => onChange({ ...item, qty: v })} w="w-24" suffix="ед" disabled={item.auto} />
        </div>
      )}

      {item.kind === "material" && (
        <div className="flex flex-wrap gap-2 items-end justify-end">
          <label className="block w-32">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Режим</span>
            <select
              value={item.mode}
              onChange={(e) => onChange({ ...item, mode: e.target.value as "percent" | "perArea" | "fixed" })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="percent">% от ФОТ</option>
              <option value="perArea">₽/м²</option>
              <option value="fixed">Сумма</option>
            </select>
          </label>
          <Field label="Значение" value={item.value} onChange={(v) => onChange({ ...item, value: v })} w="w-28" suffix={item.mode === "percent" ? "%" : item.mode === "perArea" ? "₽/м²" : "₽/мес"} />
          {item.mode === "perArea" && (
            <Field label="Площадь" value={item.area ?? 0} onChange={(v) => onChange({ ...item, area: v })} w="w-32" suffix="м²" />
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, accent, pct, pc, onUpdateItem }: {
  section: CostSection; accent: string; pct: number; pc: PayrollContext;
  onUpdateItem: (sectionId: string, itemId: string, it: CostItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = sectionMonthly(section, pc);
  const fot = sectionFotTotal(section, pc);

  return (
    <div className={cn("border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm", accent)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: "var(--ac, #3b82f6)" }} />
        <span className="flex-1 text-sm font-medium">{section.label}</span>
        {total > 0 && (
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--ac, #3b82f6)" }} />
          </div>
        )}
        <span className={cn("text-sm font-bold tabular-nums min-w-[100px] text-right", total > 0 ? "" : "text-muted-foreground")}>
          {total > 0 ? fmtRub(total) : "не заполнен"}
        </span>
        <span className="text-muted-foreground ml-1">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/40 bg-muted/10">
          {section.items.map((item, idx) => {
            const prevGroup = idx > 0 ? section.items[idx - 1].group : undefined;
            const showGroupHeader = item.group && item.group !== prevGroup;
            return (
              <div key={item.id}>
                {showGroupHeader && (
                  <p className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/30">
                    {item.group}
                  </p>
                )}
                <ItemRow
                  item={item}
                  pc={pc}
                  sectionFot={fot}
                  onChange={(it) => onUpdateItem(section.id, item.id, it)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SectionsEditor({ sections, onChange, accents = [], max = 1, pc }: Props) {
  const handleUpdateItem = (sectionId: string, itemId: string, it: CostItem) => {
    onChange(
      sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : { ...sec, items: sec.items.map((item) => (item.id !== itemId ? item : it)) }
      )
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {sections.map((sec, i) => {
        const monthly = sectionMonthly(sec, pc);
        const pct = (monthly / (max || 1)) * 100;
        return (
          <SectionCard
            key={sec.id}
            section={sec}
            accent={accents[i] ?? ""}
            pct={pct}
            pc={pc}
            onUpdateItem={handleUpdateItem}
          />
        );
      })}
    </div>
  );
}
