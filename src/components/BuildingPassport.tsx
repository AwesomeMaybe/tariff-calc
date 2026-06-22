"use client";
import {
  DoorOpen, DoorClosed, Phone, Trash2, Zap, Thermometer, Fan, Droplets,
  Snowflake, CarFront, Fence, Sprout, TreePine, Waves, Wind, Wrench,
} from "lucide-react";
import { totalElevators, totalEntrances, fmt } from "@/lib/calculate";
import type { BuildingParams } from "@/types/tariff";

/* ──────────────────────────────────────────────
   Изометрическая модель МКД (димmetric 2:1)
   Мир: x→вправо, y→в глубину, z→вверх.
   iso(x,y,z) проецирует мир в экранные координаты.
   ────────────────────────────────────────────── */
const S = 24;      // масштаб плитки (гориз.)
const ISO = 0.5;   // сжатие по вертикали (2:1)
const SZ = 5.6;    // пикселей на этаж (высота)
const STEP = 1.7;  // мировой шаг между башнями
const BOX = 1;     // сторона основания башни
const MAX_TOWERS = 6;

type P = { x: number; y: number };
const iso = (x: number, y: number, z: number): P => ({
  x: (x - y) * S,
  y: (x + y) * S * ISO - z * SZ,
});
const poly = (pts: P[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
const ln = (a: P, b: P) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });

const EASE = { transition: "all .45s cubic-bezier(.22,1,.36,1)" } as const;

/** sectionGroups → массив высот башен, высокие в центре */
function towersFrom(params: BuildingParams): { towers: number[]; hidden: number } {
  const all: number[] = [];
  for (const g of params.sectionGroups) {
    for (let i = 0; i < Math.max(0, g.count); i++) all.push(Math.max(1, g.floors));
  }
  all.sort((a, b) => a - b);
  const arranged: number[] = [];
  all.forEach((f, i) => (i % 2 === 0 ? arranged.push(f) : arranged.unshift(f)));
  return { towers: arranged.slice(0, MAX_TOWERS), hidden: Math.max(0, arranged.length - MAX_TOWERS) };
}

/* ── Одна изо-башня ── */
function Tower({ i, floors, maxFloors, hasLift, roofUnits, chiller }: {
  i: number; floors: number; maxFloors: number; hasLift: boolean;
  roofUnits: number; chiller: boolean;
}) {
  const x0 = i * STEP;
  const x1 = x0 + BOX;
  const H = Math.max(2.5, (floors / maxFloors) * 26); // мировая высота
  const id = `tw${i}`;

  // 8 углов
  const A = iso(x0, 0, 0),  B = iso(x1, 0, 0),  C = iso(x1, BOX, 0),  D = iso(x0, BOX, 0);
  const At = iso(x0, 0, H), Bt = iso(x1, 0, H), Ct = iso(x1, BOX, H), Dt = iso(x0, BOX, H);

  // линии сетки окон
  const step = floors > 30 ? 5 : floors > 16 ? 4 : 3;
  const floorLines: { front: P[][]; right: P[][] } = { front: [], right: [] };
  for (let f = 1; f < floors; f += step) {
    const z = (f / floors) * H;
    floorLines.front.push([iso(x0, BOX, z), iso(x1, BOX, z)]);
    floorLines.right.push([iso(x1, 0, z), iso(x1, BOX, z)]);
  }
  const mull = [1, 2].map((k) => k / 3);

  return (
    <g style={EASE}>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(258 85% 80%)" />
          <stop offset="100%" stopColor="hsl(258 80% 70%)" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(258 70% 62%)" />
          <stop offset="100%" stopColor="hsl(260 60% 50%)" />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(260 52% 46%)" />
          <stop offset="100%" stopColor="hsl(262 48% 36%)" />
        </linearGradient>
      </defs>

      {/* Фронтальная грань (y = BOX) — теневая */}
      <polygon points={poly([D, C, Ct, Dt])} fill={`url(#${id}-front)`} stroke="hsl(262 50% 30%)" strokeWidth={0.6} />
      {/* Правая грань (x = x1) — средняя */}
      <polygon points={poly([B, C, Ct, Bt])} fill={`url(#${id}-right)`} stroke="hsl(260 55% 34%)" strokeWidth={0.6} />
      {/* Верхняя грань — светлая */}
      <polygon points={poly([At, Bt, Ct, Dt])} fill={`url(#${id}-top)`} stroke="hsl(258 65% 60%)" strokeWidth={0.6} />

      {/* Сетка окон — фронт */}
      {floorLines.front.map((l, k) => <line key={`ff${k}`} {...ln(l[0], l[1])} stroke="rgba(255,255,255,.16)" strokeWidth={0.7} />)}
      {mull.map((m, k) => (
        <line key={`fv${k}`} {...ln(iso(x0 + m * BOX, BOX, 0), iso(x0 + m * BOX, BOX, H))}
          stroke={hasLift && k === 0 ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.14)"} strokeWidth={hasLift && k === 0 ? 1.1 : 0.7} />
      ))}
      {/* Сетка окон — право */}
      {floorLines.right.map((l, k) => <line key={`rf${k}`} {...ln(l[0], l[1])} stroke="rgba(0,0,0,.10)" strokeWidth={0.7} />)}
      {mull.map((m, k) => (
        <line key={`rv${k}`} {...ln(iso(x1, m * BOX, 0), iso(x1, m * BOX, H))} stroke="rgba(0,0,0,.10)" strokeWidth={0.7} />
      ))}

      {/* Вентустановки на крыше */}
      {Array.from({ length: roofUnits }).map((_, k) => {
        const rx = x0 + 0.18 + k * 0.32, ry = 0.25, rh = 0.18, rb = 0.2;
        const p1 = iso(rx, ry, H), p2 = iso(rx + rb, ry, H), p3 = iso(rx + rb, ry + rb, H), p4 = iso(rx, ry + rb, H);
        const p1t = iso(rx, ry, H + rh), p2t = iso(rx + rb, ry, H + rh), p3t = iso(rx + rb, ry + rb, H + rh), p4t = iso(rx, ry + rb, H + rh);
        return (
          <g key={`ru${k}`}>
            <polygon points={poly([p4, p3, p3t, p4t])} fill="hsl(240 8% 42%)" />
            <polygon points={poly([p2, p3, p3t, p2t])} fill="hsl(240 8% 52%)" />
            <polygon points={poly([p1t, p2t, p3t, p4t])} fill="hsl(240 8% 64%)" />
          </g>
        );
      })}
      {/* Чиллер на крыше */}
      {chiller && (() => {
        const rx = x1 - 0.42, ry = 0.55, rh = 0.22, rb = 0.3;
        const q1 = iso(rx, ry, H + rh), q2 = iso(rx + rb, ry, H + rh), q3 = iso(rx + rb, ry + rb, H + rh), q4 = iso(rx, ry + rb, H + rh);
        const c = iso(rx + rb / 2, ry + rb / 2, H + rh);
        return (
          <g>
            <polygon points={poly([iso(rx, ry + rb, H), iso(rx + rb, ry + rb, H), q3, q4])} fill="hsl(240 10% 40%)" />
            <polygon points={poly([iso(rx + rb, ry, H), iso(rx + rb, ry + rb, H), q3, q2])} fill="hsl(240 10% 50%)" />
            <polygon points={poly([q1, q2, q3, q4])} fill="hsl(240 12% 66%)" />
            <circle cx={c.x} cy={c.y} r={2.4} fill="none" stroke="hsl(240 14% 30%)" strokeWidth={0.8} />
          </g>
        );
      })()}

      {/* Этажность */}
      <text x={At.x + (Bt.x - At.x) / 2} y={Math.min(At.y, Bt.y) - 7} textAnchor="middle"
        fontSize={9} fontWeight={700} fill="hsl(258 70% 46%)" style={EASE}>{floors}</text>
    </g>
  );
}

/* ── Подземный слой (ВРУ·ИТП·ВПУ / паркинг) как изо-плита ── */
function Slab({ gx0, gx1, gy0, gy1, z0, depth, fill, stroke }: {
  gx0: number; gx1: number; gy0: number; gy1: number; z0: number; depth: number;
  fill: string; stroke: string;
}) {
  const z1 = z0 - depth;
  const front = [iso(gx0, gy1, z0), iso(gx1, gy1, z0), iso(gx1, gy1, z1), iso(gx0, gy1, z1)];
  const right = [iso(gx1, gy0, z0), iso(gx1, gy1, z0), iso(gx1, gy1, z1), iso(gx1, gy0, z1)];
  return (
    <g style={EASE}>
      <polygon points={poly(right)} fill={fill} stroke={stroke} strokeWidth={0.8} strokeDasharray="3 2.5" />
      <polygon points={poly(front)} fill={fill} stroke={stroke} strokeWidth={0.8} strokeDasharray="3 2.5" />
    </g>
  );
}

/* ── Дворовые маркеры (монохром-биллборды с тенью на земле) ── */
const Shadow = ({ rx = 7 }: { rx?: number }) => (
  <ellipse cx={0} cy={1.5} rx={rx} ry={2.2} fill="rgba(40,30,70,.10)" />
);
const Tree = () => (
  <g>
    <Shadow rx={6} />
    <rect x={-1} y={-5} width={2} height={7} rx={1} fill="hsl(28 28% 42%)" />
    <circle cx={0} cy={-10} r={5.5} fill="hsl(150 36% 56%)" />
    <circle cx={-3.5} cy={-7} r={4} fill="hsl(150 40% 64%)" />
    <circle cx={3.5} cy={-8} r={4} fill="hsl(150 32% 48%)" />
  </g>
);
const Barrier = () => (
  <g>
    <Shadow rx={8} />
    <rect x={-7} y={-10} width={3} height={11} rx={1} fill="hsl(240 8% 52%)" />
    <line x1={-5.5} y1={-9} x2={10} y2={-14} stroke="hsl(258 62% 56%)" strokeWidth={2.6} strokeLinecap="round" />
    <line x1={-5.5} y1={-9} x2={10} y2={-14} stroke="rgba(255,255,255,.7)" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="2.5 3" />
  </g>
);
const Maf = () => (
  <g>
    <Shadow rx={7} />
    <g stroke="hsl(258 55% 55%)" strokeWidth={1.5} fill="none" strokeLinecap="round">
      <path d="M-6 1 L-6 -7 L0 -10 L6 -7 L6 1" />
      <path d="M-6 -4 L6 -4" />
    </g>
    <path d="M0 -8 L0 -11" stroke="hsl(258 55% 55%)" strokeWidth={1.5} />
  </g>
);
const Fountain = () => (
  <g>
    <Shadow rx={8} />
    <ellipse cx={0} cy={0} rx={7.5} ry={2.8} fill="hsl(245 30% 90%)" stroke="hsl(240 12% 60%)" strokeWidth={1} />
    <g stroke="hsl(258 50% 60%)" strokeWidth={1.2} fill="none" strokeLinecap="round">
      <line x1={0} y1={-1} x2={0} y2={-9} />
      <path d="M0 -9 Q-4 -7 -5 -3 M0 -9 Q4 -7 5 -3" />
    </g>
  </g>
);

function Courtyard({ params, gy1, lastX }: { params: BuildingParams; gy1: number; lastX: number }) {
  const items: React.ReactNode[] = [];
  if (params.greenArea > 0) {
    const trees = Math.min(3, Math.max(1, Math.round(params.greenArea / 2000)));
    for (let t = 0; t < trees; t++) items.push(<Tree key={`tree${t}`} />);
  }
  if (params.mafPresent && params.mafCount > 0) items.push(<Maf key="maf" />);
  if (params.courtFountain) items.push(<Fountain key="fountain" />);
  if (params.barriers > 0) items.push(<Barrier key="barrier" />);

  const front = gy1 - 0.55;            // передний двор
  const span = lastX + BOX;
  return (
    <g>
      {items.map((node, k) => {
        const wx = items.length === 1 ? span / 2 : (span * (k + 0.5)) / items.length;
        const p = iso(wx, front, 0);
        return <g key={k} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>{node}</g>;
      })}
    </g>
  );
}

function Scene({ params }: { params: BuildingParams }) {
  const { towers, hidden } = towersFrom(params);
  const n = towers.length;
  const maxFloors = Math.max(1, ...towers);
  const hasLift = totalElevators(params) > 0;
  const hasParking = params.areaParkingSpots > 0 || params.ramps > 0;
  const tallestIdx = towers.indexOf(maxFloors);

  // вентустановки по крышам (макс 2 на башню), чиллер — на самой высокой
  const vent = Math.min(params.ventilationUnits, n * 2);
  const roofUnitsPer = towers.map((_, j) => (vent > j ? 1 : 0) + (vent > n + j ? 1 : 0));

  // подземная инженерка
  const techParts = [
    params.vru > 0 ? `ВРУ${params.vru}` : null,
    params.itp > 0 ? `ИТП${params.itp}` : null,
    params.waterTreatmentStation ? "ВПУ" : null,
  ].filter(Boolean) as string[];
  const hasTech = techParts.length > 0 && n > 0;

  // земля
  const gx0 = -0.7, gy0 = -0.6;
  const lastX = (n - 1) * STEP;
  const gx1 = lastX + BOX + 0.7, gy1 = BOX + 1.7;  // + передний двор
  const ground = [iso(gx0, gy0, 0), iso(gx1, gy0, 0), iso(gx1, gy1, 0), iso(gx0, gy1, 0)];

  // границы viewBox: собираем экстремальные точки
  const pts: P[] = [...ground];
  towers.forEach((f, i) => {
    const H = Math.max(2.5, (f / maxFloors) * 26);
    pts.push(iso(i * STEP, 0, H), iso(i * STEP + BOX, 0, H), iso(i * STEP + BOX, BOX, H), iso(i * STEP, BOX, H));
  });
  if (hasTech || hasParking) pts.push(iso(gx1, gy1, -1.3), iso(gx0, gy1, -1.3));
  pts.push(iso((gx0 + gx1) / 2, gy1 + 1.2, 0)); // место под двор
  const pad = 16;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad - 6; // место под этажность
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;

  if (n === 0) {
    return (
      <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label="Схема жилого комплекса">
        <text x={150} y={90} textAnchor="middle" fontSize={11} fill="hsl(240 8% 60%)">Добавьте секции — дом появится здесь</text>
      </svg>
    );
  }

  let techZ = 0;
  const techDepth = 0.7, parkDepth = 0.7;

  return (
    <svg viewBox={`${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`}
      className="w-full" role="img" aria-label="Изометрическая схема жилого комплекса">
      <defs>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(258 30% 95%)" />
          <stop offset="100%" stopColor="hsl(245 18% 90%)" />
        </linearGradient>
      </defs>

      {/* Земля */}
      <polygon points={poly(ground)} fill="url(#groundGrad)" stroke="hsl(245 20% 84%)" strokeWidth={1} />

      {/* Подземные слои */}
      {hasTech && (() => {
        const s = <Slab key="tech" gx0={gx0} gx1={gx1} gy0={gy0} gy1={gy1} z0={techZ} depth={techDepth}
          fill="hsl(258 60% 60% / .10)" stroke="hsl(258 55% 50%)" />;
        techZ -= techDepth;
        return s;
      })()}
      {hasParking && (
        <Slab gx0={gx0} gx1={gx1} gy0={gy0} gy1={gy1} z0={techZ} depth={parkDepth}
          fill="hsl(240 10% 50% / .12)" stroke="hsl(240 10% 45%)" />
      )}

      {/* Башни (i по возрастанию = от задней к передней) */}
      {towers.map((floors, i) => (
        <Tower key={i} i={i} floors={floors} maxFloors={maxFloors} hasLift={hasLift}
          roofUnits={roofUnitsPer[i]} chiller={params.hasChiller && i === tallestIdx} />
      ))}

      {/* Огорожено / двор */}
      <Courtyard params={params} gy1={gy1} lastX={lastX} />

      {hidden > 0 && (
        <text x={maxX - pad} y={maxY - pad} textAnchor="end" fontSize={10} fontWeight={700} fill="hsl(258 70% 50%)">
          +{hidden} сек
        </text>
      )}
    </svg>
  );
}

/* ── Чипы систем ── */
function Chip({ icon: Icon, label, value, on = true }: {
  icon: React.ElementType; label: string; value: string | number; on?: boolean;
}) {
  if (!on) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-muted/70">
      <Icon className="h-3 w-3 flex-shrink-0 text-primary/70" />
      <span className="text-[10px] text-muted-foreground truncate">{label}</span>
      <span className="text-[11px] font-bold tabular-nums ml-auto">{value}</span>
    </div>
  );
}

export function BuildingPassport({ params }: { params: BuildingParams }) {
  const sections = totalEntrances(params);
  const lifts = totalElevators(params);
  const meta = [
    `${sections} сек`,
    `${lifts} лифт`,
    `${params.apartments} кв`,
    params.nonResidentialUnits > 0 ? `${params.nonResidentialUnits} неж` : null,
    params.storageUnits > 0 ? `${params.storageUnits} кл` : null,
    params.parkingSpots > 0 ? `${params.parkingSpots} мм` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl bg-card border border-border/70 shadow-sm overflow-hidden">
      <div className="px-4 pt-3.5 pb-1 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex-shrink-0">Модель МКД</p>
        <p className="text-[10px] text-muted-foreground tabular-nums text-right">{meta}</p>
      </div>

      <div className="px-3 pt-2 pb-1">
        <Scene params={params} />
      </div>

      <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
        <Chip icon={DoorOpen}   label="Вх. группы"     value={params.entryGroups}      on={params.entryGroups > 0} />
        <Chip icon={Phone}      label="Домофоны"       value={params.intercoms}        on={params.intercoms > 0} />
        <Chip icon={DoorClosed} label="Двери МОП"      value={params.mopDoors}         on={params.mopDoors > 0} />
        <Chip icon={Wrench}     label="Доводчики"      value={params.doorClosers}      on={params.doorClosers > 0} />
        <Chip icon={Trash2}     label="Мусорокамеры"   value={params.trashRooms}       on={params.trashRooms > 0} />
        <Chip icon={Zap}        label="ВРУ"            value={params.vru}              on={params.vru > 0} />
        <Chip icon={Thermometer} label="ИТП"           value={params.itp}              on={params.itp > 0} />
        <Chip icon={Fan}        label="Вентустановки"  value={params.ventilationUnits} on={params.ventilationUnits > 0} />
        <Chip icon={Droplets}   label="Водоподготовка" value="есть" on={params.waterTreatmentStation} />
        <Chip icon={Snowflake}  label="Чиллер"         value="есть" on={params.hasChiller} />
        <Chip icon={Wind}       label="Конд. лобби"    value={params.lobbyACCount || "есть"} on={params.lobbyAC} />
        <Chip icon={CarFront}   label="Рампы"          value={params.ramps}            on={params.ramps > 0} />
        <Chip icon={Fence}      label="Огорожено"      value="да"  on={params.fencedTerritory} />
        <Chip icon={Sprout}     label="Автополив"      value="да"  on={params.autoIrrigation} />
        <Chip icon={TreePine}   label="Озеленение"     value={`${fmt(params.greenArea, 0)} м²`} on={params.greenArea > 0} />
        <Chip icon={Waves}      label="Фонтан"         value="да"  on={params.courtFountain} />
      </div>
    </div>
  );
}
