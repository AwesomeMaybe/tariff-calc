"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmtRub, sectionMonthly } from "@/lib/calculate";
import type { CostSection } from "@/types/tariff";

interface Props {
  sections: CostSection[];
  onChange: (sections: CostSection[]) => void;
  accents?: string[];
  max?: number;
}

function SectionCard({
  section,
  accent,
  pct,
  onUpdate,
}: {
  section: CostSection;
  accent: string;
  pct: number;
  onUpdate: (sectionId: string, itemId: string, val: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = sectionMonthly(section);

  return (
    <div className={cn("border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm", accent)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        {/* colored accent dot */}
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
          style={{ background: "var(--ac, #3b82f6)" }}
        />
        <span className="flex-1 text-sm font-medium">{section.label}</span>

        {/* mini bar */}
        {total > 0 && (
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--ac, #3b82f6)" }}
            />
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
          {section.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 rounded-b-xl">
              <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
              <div className="relative w-48">
                <Input
                  type="number"
                  value={item.monthly || ""}
                  placeholder="0"
                  onChange={(e) => onUpdate(section.id, item.id, parseFloat(e.target.value) || 0)}
                  className="pr-14 text-sm h-8 text-right font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                  р/мес
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionsEditor({ sections, onChange, accents = [], max = 1 }: Props) {
  const handleUpdate = (sectionId: string, itemId: string, val: number) => {
    onChange(
      sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : { ...sec, items: sec.items.map((item) => (item.id !== itemId ? item : { ...item, monthly: val })) }
      )
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {sections.map((sec, i) => {
        const monthly = sectionMonthly(sec);
        const pct = (monthly / (max || 1)) * 100;
        return (
          <SectionCard
            key={sec.id}
            section={sec}
            accent={accents[i] ?? ""}
            pct={pct}
            onUpdate={handleUpdate}
          />
        );
      })}
    </div>
  );
}
