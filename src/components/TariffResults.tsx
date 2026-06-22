"use client";
import { TrendingUp } from "lucide-react";
import { fmt, fmtRub } from "@/lib/calculate";
import type { CalcOutput } from "@/types/tariff";
import { SECTION_PALETTE as SECTION_COLORS } from "@/lib/colors";

export function TariffResults({ output }: { output: CalcOutput }) {
  const { results, totalArea, grandTotalMonthly, grandTariffFinal, grandTariffBase, indexProjection } = output;
  const idxRatio = indexProjection?.length > 1 && indexProjection[0].tariff > 0
    ? indexProjection[1].tariff / indexProjection[0].tariff
    : 1;
  const idxPct = (idxRatio - 1) * 100;
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

      {/* Индексация тарифа */}
      {indexProjection?.length > 1 && idxRatio !== 1 && (
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Индексация тарифа</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary tabular-nums">
              ×{idxRatio.toFixed(2)} / год · +{idxPct.toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {indexProjection.map((p) => {
              const delta = ((p.tariff / indexProjection[0].tariff) - 1) * 100;
              const isNow = p.year === 0;
              return (
                <div key={p.year} className={`rounded-xl p-3 border ${isNow ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/30"}`}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {isNow ? "Текущий" : `+${p.year} год${p.year > 1 ? "а" : ""}`}
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-tight">{fmt(p.tariff)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    р/м²{!isNow && <span className="text-primary font-medium"> · +{delta.toFixed(1)}%</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
