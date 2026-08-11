"use client";
import { useState } from "react";
import { TrendingUp, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fmt, fmtRub, itemMonthly, sectionFotTotal } from "@/lib/calculate";
import { payrollFrom } from "@/lib/payroll";
import { formatDate } from "@/lib/storage";
import type { CalcOutput, BuildingParams, CostSection } from "@/types/tariff";
import { SECTION_PALETTE as SECTION_COLORS } from "@/lib/colors";

const isUrl = (s: string) => /^https?:\/\//i.test(s);

export function TariffResults({ output, params, sections, onChange }: {
  output: CalcOutput; params: BuildingParams; sections: CostSection[]; onChange: (p: BuildingParams) => void;
}) {
  const { results, totalArea, grandTotalMonthly, grandTariffFinal, grandTariffBase, indexMultiplier } = output;
  const [pct, setPct] = useState("");
  const [comment, setComment] = useState("");

  // обязательные по ТЭП статьи с нулевой суммой
  const pc = payrollFrom(params);
  const unfilled = sections.flatMap((s) => {
    const fot = sectionFotTotal(s, pc);
    return s.items.filter((it) => it.required && itemMonthly(it, pc, fot) <= 0).map((it) => it.label);
  });

  const log = params.indexLog ?? [];
  const idxPct = (indexMultiplier - 1) * 100; // накопленная индексация, %

  function applyIndex() {
    const p = parseFloat(pct);
    if (!p) return;
    const from = grandTariffFinal;
    const to = from * (1 + p / 100);
    onChange({
      ...params,
      indexLog: [...log, { date: new Date().toISOString(), pct: p, comment: comment.trim(), fromTariff: from, toTariff: to }],
    });
    setPct("");
    setComment("");
  }
  function removeEvent(i: number) {
    onChange({ ...params, indexLog: log.filter((_, idx) => idx !== i) });
  }

  const maxMonthly = Math.max(...results.map((r) => r.totalMonthly), 1);
  const nonZero = results.filter((r) => r.totalMonthly > 0);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Общая площадь",  value: `${fmt(totalArea, 0)} м²`,         sub: "объект",          gradient: "grad-blue"    },
          { label: "Всего затрат",   value: fmtRub(grandTotalMonthly),          sub: "в месяц",         gradient: "grad-violet"  },
          { label: "Базовый тариф",  value: `${fmt(grandTariffBase)} р/м²`,     sub: "без наценки",     gradient: "grad-amber"   },
          { label: "Итоговый тариф", value: `${fmt(grandTariffFinal)} р/м²`,    sub: "с прибылью + НДС", gradient: "grad-emerald" },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4 shadow-md">
            <div className={`inline-block w-8 h-1 rounded-full ${c.gradient} mb-3`} />
            <p className="text-xl font-bold tabular-nums leading-tight">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            <p className="text-[10px] text-muted-foreground/60">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Предупреждение: обязательные по ТЭП статьи не заполнены */}
      {unfilled.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700">Не заполнены статьи, обязательные по ТЭП ({unfilled.length})</p>
            <p className="text-amber-700/80 text-[13px] mt-0.5">{unfilled.join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Индексация тарифа — действие + журнал */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Индексация тарифа</p>
            {log.length > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary tabular-nums">
                накоплено {idxPct >= 0 ? "+" : ""}{idxPct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums leading-none">
              {fmt(grandTariffFinal)} <span className="text-xs font-normal text-muted-foreground">р/м²</span>
            </p>
            <p className="text-[10px] text-muted-foreground">текущая ставка</p>
          </div>
        </div>

        {/* форма индексации */}
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <label className="block w-24">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Процент</span>
            <div className="relative">
              <Input
                type="number" step="0.1" value={pct} placeholder="0"
                onChange={(e) => setPct(e.target.value)}
                className="h-9 pr-6 text-sm text-right font-mono tabular-nums"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">%</span>
            </div>
          </label>
          <label className="block flex-1 min-w-[200px]">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Комментарий / ссылка</span>
            <Input
              value={comment} placeholder="Основание: приказ, инфляция, ссылка…"
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyIndex(); }}
              className="h-9 text-sm"
            />
          </label>
          <button
            onClick={applyIndex}
            disabled={!parseFloat(pct)}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-default hover:opacity-90 transition"
          >
            Индексировать
          </button>
        </div>

        {/* журнал */}
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">Журнал пуст. Укажите процент и основание — ставка пересчитается, событие запишется.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Журнал индексаций</p>
            {log.map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                <span className="text-[11px] text-muted-foreground tabular-nums w-20 flex-shrink-0">{formatDate(e.date)}</span>
                <span className={`text-xs font-semibold tabular-nums w-14 flex-shrink-0 ${e.pct >= 0 ? "text-primary" : "text-destructive"}`}>
                  {e.pct >= 0 ? "+" : ""}{e.pct}%
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground w-32 flex-shrink-0">{fmt(e.fromTariff)} → {fmt(e.toTariff)}</span>
                <span className="flex-1 text-[11px] truncate">
                  {e.comment
                    ? (isUrl(e.comment)
                        ? <a href={e.comment} target="_blank" rel="noreferrer" className="text-primary underline">{e.comment}</a>
                        : e.comment)
                    : <span className="text-muted-foreground/50">—</span>}
                </span>
                <button onClick={() => removeEvent(i)} className="text-muted-foreground/50 hover:text-destructive flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        {/* thead */}
        <div className="grid grid-cols-[28px_1fr_160px_90px_110px] gap-2 px-5 py-2.5 bg-muted/40 border-b border-border/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span />
          <span>Раздел</span>
          <span className="text-right">Затраты / мес</span>
          <span className="text-right">Базовый</span>
          <span className="text-right">С НДС, р/м²</span>
        </div>

        <div className="divide-y divide-border/30">
          {results.map((r, i) => {
            const color = SECTION_COLORS[i % SECTION_COLORS.length];
            const pct = (r.totalMonthly / maxMonthly) * 100;
            const active = r.totalMonthly > 0;
            return (
              <div
                key={r.sectionId}
                className={`grid grid-cols-[28px_1fr_160px_90px_110px] gap-2 px-5 py-3 items-center transition-colors ${active ? "hover:bg-muted/20" : "opacity-40"}`}
              >
                {/* color swatch */}
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ background: active ? color : "#cbd5e1" }}
                />

                <div>
                  <p className="text-sm">{r.sectionLabel}</p>
                  {active && (
                    <div className="h-1 mt-1 rounded-full bg-muted overflow-hidden w-3/4">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
                    </div>
                  )}
                </div>

                <p className={`text-sm text-right tabular-nums font-mono ${active ? "" : "text-muted-foreground"}`}>
                  {active ? fmtRub(r.totalMonthly) : "—"}
                </p>
                <p className={`text-sm text-right tabular-nums font-mono ${active ? "" : "text-muted-foreground"}`}>
                  {active ? fmt(r.tariffBase) : "—"}
                </p>
                <p className={`text-sm text-right tabular-nums font-bold ${active ? "" : "text-muted-foreground"}`}
                  style={active ? { color } : {}}>
                  {active ? fmt(r.tariffFinal) : "—"}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-[28px_1fr_160px_90px_110px] gap-2 px-5 py-4 bg-muted/30 border-t border-border/50">
          <span className="flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-sm font-bold">Итого</span>
          <span className="text-sm text-right tabular-nums font-bold font-mono">{fmtRub(grandTotalMonthly)}</span>
          <span className="text-sm text-right tabular-nums font-bold font-mono">{fmt(grandTariffBase)}</span>
          <span className="text-sm text-right tabular-nums font-bold text-primary">{fmt(grandTariffFinal)}</span>
        </div>
      </div>

      {/* Distribution visual */}
      {nonZero.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">Распределение затрат</p>
          <div className="space-y-2">
            {nonZero
              .sort((a, b) => b.totalMonthly - a.totalMonthly)
              .map((r) => {
                const i = results.findIndex((x) => x.sectionId === r.sectionId);
                const color = SECTION_COLORS[i % SECTION_COLORS.length];
                const pct = (r.totalMonthly / grandTotalMonthly) * 100;
                return (
                  <div key={r.sectionId} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-44 truncate">{r.sectionLabel}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold tabular-nums w-16 text-right" style={{ color }}>
                      {fmt(r.tariffFinal)} р
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Тариф = затраты&nbsp;/&nbsp;площадь &times; коэф.&nbsp;прибыли &times; НДС
      </p>
    </div>
  );
}
