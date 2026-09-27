'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../common/Sidebar';
import { Sale, Product, TradeInRecord } from '../../types';
import { TradeInInspectionModal } from '../pos/TradeInInspectionModal';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  DollarSign,
  Receipt,
  Smartphone,
  Wrench,
  RotateCcw,
  Plus,
  PlusCircle,
  Search,
  AlertTriangle,
  Clock,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Package,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Layers,
  Barcode,
  CreditCard,
  Repeat,
  Truck,
  Wallet,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImeiSearch: () => void;
}

interface CategorySlice {
  name: string;
  count: number;
  percent: number;
  color: string;
}

interface TrendPoint {
  label: string;
  revenue: number;
}

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  inventoryCount: number;
  pendingRepairs: number;
  tradeInCount: number;
  lowStockCount: number;
  yesterdayRevenue: number;
  salesByCategory: CategorySlice[];
  trendToday: TrendPoint[];
  trendWeek: TrendPoint[];
  trendMonth: TrendPoint[];
  recentSales: Sale[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_RED = '#e61e25';

const CATEGORY_COLORS: Record<string, string> = {
  iPhone: '#3b82f6', // Blue
  iPad: '#8b5cf6', // Purple
  Mac: '#06b6d4', // Cyan
  'Apple Watch': '#10b981', // Emerald
  AirPods: '#f59e0b', // Amber
  Accessories: '#ec4899', // Pink
  Protection: '#6366f1', // Indigo
  'Pre-Owned': '#f97316', // Orange
  Other: '#64748b', // Slate
};

const PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
];

const AVATAR_BG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function fmtRs(val: number): string {
  return `Rs. ${(val || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function trendPct(today: number, yesterday: number): { pct: number; up: boolean } {
  if (!yesterday || yesterday === 0) {
    if (today > 0) return { pct: 100, up: true };
    return { pct: 0, up: true };
  }
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function getInitials(name?: string): string {
  if (!name || name.trim() === '' || name.toLowerCase().includes('walk-in')) {
    return 'WC';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name?: string): string {
  if (!name) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

// Catmull-Rom to Cubic Bézier for smooth SVG spline line
function buildSmoothSplinePath(
  points: TrendPoint[],
  w: number,
  h: number,
  pad = 14
): {
  line: string;
  area: string;
  coords: { x: number; y: number; revenue: number; label: string }[];
} {
  if (!points || points.length === 0) {
    return {
      line: `M 0,${h - pad} L ${w},${h - pad}`,
      area: `M 0,${h - pad} L ${w},${h - pad} L ${w},${h} L 0,${h} Z`,
      coords: [],
    };
  }

  const max = Math.max(...points.map((p) => p.revenue || 0), 1);
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p.revenue || 0) / max) * (h - pad * 2.4);
    return { x, y, revenue: p.revenue || 0, label: p.label };
  });

  if (coords.length === 1) {
    const pt = coords[0];
    return {
      line: `M ${pad},${pt.y} L ${w - pad},${pt.y}`,
      area: `M ${pad},${pt.y} L ${w - pad},${pt.y} L ${w - pad},${h} L ${pad},${h} Z`,
      coords,
    };
  }

  // Generate smooth cubic Bézier segments
  let line = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    line += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)},${h} L ${coords[0].x.toFixed(1)},${h} Z`;

  return { line, area, coords };
}

// Build Donut Slices for SVG
function buildDonutSlices(
  slices: CategorySlice[],
  cx: number,
  cy: number,
  r: number
): { d: string; color: string; name: string }[] {
  if (!slices || slices.length === 0) return [];
  const total = slices.reduce((a, s) => a + s.count, 0) || 1;
  let angle = -Math.PI / 2;
  return slices.map((s) => {
    const sweep = (s.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return {
      d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: s.color,
      name: s.name,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Component
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} />
);

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card Component (Matching reference image with vertical accent bar)
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  trendText: string;
  trendSubtext: string;
  isUp: boolean;
  accentBarColor: string;
  badgeBg: string;
  badgeTextColor: string;
  icon: React.ReactNode;
  loading: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trendText,
  trendSubtext,
  isUp,
  accentBarColor,
  badgeBg,
  badgeTextColor,
  icon,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Top row: Vertical accent bar + Title & Metric, and right badge icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Vertical Accent Bar */}
          <div className={`w-1.5 h-10 rounded-full ${accentBarColor} flex-shrink-0 mt-0.5`} />
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
              {value}
            </p>
          </div>
        </div>

        {/* Top Right Subtle Badge Icon */}
        <div
          className={`w-9 h-9 rounded-xl ${badgeBg} ${badgeTextColor} flex items-center justify-center flex-shrink-0 shadow-xs transition-transform group-hover:scale-105`}
        >
          {icon}
        </div>
      </div>

      {/* Bottom Trend */}
      <div className="mt-3.5 flex items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center font-bold gap-0.5 ${
            isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {isUp ? '↑' : '—'} {trendText}
        </span>
        <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
          {trendSubtext}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Donut Chart Component (Matching reference image "Invoice Statistics / Category Distribution")
// ─────────────────────────────────────────────────────────────────────────────

interface DonutChartProps {
  slices: CategorySlice[];
  totalSalesCount: number;
  loading: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ slices, totalSalesCount, loading }) => {
  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 52;
  const donutSlices = buildDonutSlices(slices, cx, cy, outerR);

  return (
    <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Sales by Category
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Product distribution across catalog
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Live
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Skeleton className="w-36 h-36 rounded-full" />
        </div>
      ) : totalSalesCount === 0 || slices.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-6">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-36 h-36 transform -rotate-90">
              <circle
                cx={cx}
                cy={cy}
                r={(outerR + innerR) / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={outerR - innerR}
                className="text-slate-100 dark:text-slate-800/80 stroke-dasharray-[6,6]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200">0</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">SALES</span>
            </div>
          </div>
          <div className="text-center md:text-left space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No sales recorded yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-[180px]">
              Categories will automatically populate upon your first POS invoice.
            </p>
          </div>
        </div>
      ) : (
        /* Populated Donut & Breakdown */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-40 h-40">
              <defs>
                <mask id="donut-mask">
                  <rect width="200" height="200" fill="white" />
                  <circle cx={cx} cy={cy} r={innerR} fill="black" />
                </mask>
              </defs>
              <g mask="url(#donut-mask)">
                {donutSlices.map((s, i) => (
                  <path
                    key={i}
                    d={s.d}
                    fill={s.color}
                    className="transition-all hover:opacity-85 cursor-pointer"
                  >
                    <title>{`${s.name}: ${slices[i]?.count || 0} (${slices[i]?.percent || 0}%)`}</title>
                  </path>
                ))}
              </g>
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                className="text-slate-900 dark:text-white"
                fill="currentColor"
                fontSize="22"
                fontWeight="900"
              >
                {totalSalesCount}
              </text>
              <text
                x={cx}
                y={cy + 13}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1"
              >
                SALES
              </text>
            </svg>
          </div>

          {/* Breakdown List */}
          <div className="flex-1 w-full space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
            {slices.map((slice, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono ml-2 flex-shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">{slice.count}</span>
                  <span className="text-slate-400 text-[11px]">({slice.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sales Analytics Spline / Area Chart Component (Matching reference image)
// ─────────────────────────────────────────────────────────────────────────────

type ChartPeriod = 'Today' | 'Week' | 'Month';

interface RevenueChartProps {
  trendToday: TrendPoint[];
  trendWeek: TrendPoint[];
  trendMonth: TrendPoint[];
  loading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  trendToday,
  trendWeek,
  trendMonth,
  loading,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>('Week');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activePoints: TrendPoint[] = useMemo(() => {
    if (period === 'Today') return trendToday;
    if (period === 'Week') return trendWeek;
    return trendMonth;
  }, [period, trendToday, trendWeek, trendMonth]);

  const W = 580;
  const H = 160;
  const { line, area, coords } = useMemo(
    () => buildSmoothSplinePath(activePoints, W, H, 14),
    [activePoints, W, H]
  );

  const maxRevenue = Math.max(...activePoints.map((p) => p.revenue || 0), 0);
  const yTicks = [
    maxRevenue,
    Math.round(maxRevenue * 0.66),
    Math.round(maxRevenue * 0.33),
    0,
  ];

  const totalPeriodRevenue = activePoints.reduce((acc, p) => acc + (p.revenue || 0), 0);

  return (
    <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Sales Analytics
            <span className="text-xs font-normal text-slate-400">
              ({fmtRs(totalPeriodRevenue)})
            </span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Revenue trends for {period === 'Today' ? 'today' : period === 'Week' ? 'last 7 days' : 'last 30 days'}
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {(['Today', 'Week', 'Month'] as ChartPeriod[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setPeriod(tab);
                setHoveredIdx(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === tab
                  ? 'bg-white dark:bg-dark-card text-brand-500 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'Today' ? 'Today' : tab === 'Week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Spline Canvas */}
      {loading ? (
        <Skeleton className="h-44 w-full rounded-xl my-2" />
      ) : (
        <div className="relative w-full overflow-hidden pt-2">
          {/* Active Tooltip Badge (Matching the reference image floating pill) */}
          {hoveredIdx !== null && coords[hoveredIdx] && (
            <div
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
              style={{
                left: `${(coords[hoveredIdx].x / W) * 100}%`,
                top: `${(coords[hoveredIdx].y / (H + 24)) * 100 - 8}%`,
              }}
            >
              <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2.5 py-1 rounded-lg shadow-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{fmtRs(coords[hoveredIdx].revenue)}</span>
                <span className="opacity-70 text-[10px]">({coords[hoveredIdx].label})</span>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${W} ${H + 26}`}
            className="w-full h-44 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Dashed Guidelines */}
            {yTicks.map((tick, i) => {
              const y =
                maxRevenue === 0
                  ? H - 14 - (i / 3) * (H - 28)
                  : H - 14 - (tick / maxRevenue) * (H - 28);
              return (
                <g key={i}>
                  <line
                    x1="0"
                    y1={y}
                    x2={W}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800/80"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x="2"
                    y={y - 4}
                    fill="#94a3b8"
                    fontSize="8"
                    fontWeight="600"
                    className="select-none"
                  >
                    {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={area} fill="url(#areaGradient)" />

            {/* Spline Line */}
            <path
              d={line}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Node Points & Hover Areas */}
            {coords.map((pt, i) => (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible larger hover zone */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Point ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? '5' : '3.5'}
                  fill="white"
                  stroke="#6366f1"
                  strokeWidth={hoveredIdx === i ? '3' : '2'}
                  className="transition-all dark:fill-dark-card"
                />

                {/* X-axis Label */}
                <text
                  x={pt.x}
                  y={H + 18}
                  textAnchor="middle"
                  fill={hoveredIdx === i ? '#6366f1' : '#94a3b8'}
                  fontSize="8.5"
                  fontWeight={hoveredIdx === i ? 'bold' : '500'}
                  className="select-none"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'paid') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
        Paid
      </span>
    );
  }
  if (s === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
        Pending
      </span>
    );
  }
  if (s === 'refunded') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
      {status || 'Completed'}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard View Component
// ─────────────────────────────────────────────────────────────────────────────

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenImeiSearch,
}) => {
  const { products, sales, repairs, customers, currentTradeIn, setTradeIn, setLastCompletedSale, showNotification } = useStore();
  const { currentUser } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Live Sri Lanka Clock (Asia/Colombo)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Colombo',
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Colombo',
    });
  }, [currentTime]);

  // Global Keyboard Shortcuts on Dashboard: F2, F4, F7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal or input has focus, ignore
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F4') {
        e.preventDefault();
        onOpenImeiSearch();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setIsTradeInModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, onOpenImeiSearch]);

  // ── Compute Real-time Dashboard Data ──────────────────────────────────────
  const loadData = useCallback(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yesterdayStr = yd.toISOString().substring(0, 10);

    const todaySales = sales.filter((s) => s.date === todayStr);
    const yesterdaySales = sales.filter((s) => s.date === yesterdayStr);

    const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const yesterdayRevenue = yesterdaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const todayOrders = todaySales.length;

    // Active Inventory Devices in stock
    const inventoryCount = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);

    // Pending Repairs count
    const pendingRepairs = repairs.filter(
      (r) =>
        r.status === 'Received' ||
        r.status === 'Diagnostics' ||
        r.status === 'Repairing' ||
        r.status === 'Waiting for Parts' ||
        r.status === 'RECEIVED' ||
        r.status === 'DIAGNOSING' ||
        r.status === 'IN_PROGRESS' ||
        r.status === 'WAITING_PARTS'
    ).length;

    // Trade-In Units: items tagged as trade-ins or in pre-owned stock, plus active cart trade-in
    const tradeInUnitsFromStock = products.reduce((acc, p) => {
      const itemsCount = (p.imeis || []).filter((item) => item.isTradeIn).length;
      return acc + itemsCount;
    }, 0);
    const tradeInCount = tradeInUnitsFromStock + (currentTradeIn ? 1 : 0);

    // Low stock products count
    const lowStockCount = products.filter(
      (p) => (p.currentStock || 0) <= (p.minStock ?? 2)
    ).length;

    // Sales by Category
    const catMap: Record<string, number> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + (item.quantity || 1);
      });
    });

    const totalCatCount = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
    const salesByCategory: CategorySlice[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        name,
        count,
        percent: Math.round((count / totalCatCount) * 100),
        color: CATEGORY_COLORS[name] || PALETTE[i % PALETTE.length],
      }));

    // Trend: Today (hourly slots)
    const todayHours = ['08h', '10h', '12h', '14h', '16h', '18h', '20h'];
    const trendToday: TrendPoint[] = todayHours.map((label, i) => {
      const hourVal = todaySales
        .filter((s) => {
          const h = parseInt((s.time || '00:00').split(':')[0], 10);
          return h >= 8 + i * 2 && h < 10 + i * 2;
        })
        .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      return { label, revenue: hourVal };
    });

    // Trend: Week (last 7 days)
    const trendWeek: TrendPoint[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().substring(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const revenue = sales
        .filter((s) => s.date === ds)
        .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      return { label, revenue };
    });

    // Trend: Month (last 4 weeks)
    const trendMonth: TrendPoint[] = Array.from({ length: 4 }).map((_, i) => {
      const start = new Date();
      start.setDate(start.getDate() - (3 - i) * 7 - 6);
      const end = new Date();
      end.setDate(end.getDate() - (3 - i) * 7);
      const startStr = start.toISOString().substring(0, 10);
      const endStr = end.toISOString().substring(0, 10);
      const revenue = sales
        .filter((s) => s.date >= startStr && s.date <= endStr)
        .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      return { label: `Wk ${i + 1}`, revenue };
    });

    // Recent 5 sales
    const recentSales = [...sales]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 6);

    setData({
      todayRevenue,
      todayOrders,
      inventoryCount,
      pendingRepairs,
      tradeInCount,
      lowStockCount,
      yesterdayRevenue,
      salesByCategory,
      trendToday,
      trendWeek,
      trendMonth,
      recentSales,
    });
    setLoading(false);
  }, [sales, products, repairs, currentTradeIn]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derived Trend
  const todayRev = data?.todayRevenue || 0;
  const yestRev = data?.yesterdayRevenue || 0;
  const revTrend = trendPct(todayRev, yestRev);

  const userName = currentUser?.name || currentUser?.full_name || 'Surinda';

  // Receipt preview handler
  const handleOpenReceipt = (sale: Sale) => {
    setLastCompletedSale(sale);
    setIsReceiptModalOpen(true);
  };

  // Trade-In Apply handler
  const handleApplyTradeIn = (record: TradeInRecord) => {
    setTradeIn(record);
    setIsTradeInModalOpen(false);
    showNotification('success', `Trade-In registered for ${record.inspection.model}! Added to POS cart.`);
    setActiveTab('pos');
  };


  // ── Mobile Specific Derived Metrics ─────────────────────────────────────
  const [mobileTimeframe, setMobileTimeframe] = useState<'Today' | '7D' | '30D' | 'All'>('Today');

  const todaySalesTotal = data?.todayRevenue || 0;
  const todaySalesList = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return sales.filter(s => s.date === todayStr);
  }, [sales]);
  const todayProfitTotal = useMemo(() => todaySalesList.reduce((acc, s) => acc + (s.profitTotal || 0), 0), [todaySalesList]);
  const todayMarginPct = todaySalesTotal > 0 ? Math.round((todayProfitTotal / todaySalesTotal) * 100) : 0;
  const todayTxCount = data?.todayOrders || 0;
  const todayAvgTicket = todayTxCount > 0 ? Math.round(todaySalesTotal / todayTxCount) : 0;

  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    if (mobileTimeframe === 'Today') {
      return sales.filter(s => s.date === todayStr);
    }
    if (mobileTimeframe === '7D') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const cutoff = d.toISOString().substring(0, 10);
      return sales.filter(s => s.date >= cutoff);
    }
    if (mobileTimeframe === '30D') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const cutoff = d.toISOString().substring(0, 10);
      return sales.filter(s => s.date >= cutoff);
    }
    return sales;
  }, [sales, mobileTimeframe]);

  const totalStockUnits = data?.inventoryCount || 0;
  const totalStockRetail = useMemo(() => products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.currentStock || 0)), 0), [products]);
  const lowStockProducts = useMemo(() => products.filter(p => (p.currentStock || 0) <= (p.minStock ?? 2)), [products]);
  const activeTradeInCount = data?.tradeInCount || 0;
  const totalOutstandingCredit = useMemo(() => (customers || []).reduce((acc, c) => acc + (c.creditBalance || 0), 0), [customers]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* ULTRA-PREMIUM APPLE IPHONE MATCHING AESTHETIC MOBILE VIEW */}
      {/* ======================================================== */}
      <div className="md:hidden space-y-4">
        {/* 1. iOS Dynamic Island / Status Capsule */}
        <div className="flex justify-center pt-1 pb-1">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/95 dark:bg-black text-white shadow-2xl border border-white/15 backdrop-blur-2xl">
            {/* Apple Logo */}
            <div className="text-white/95">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.94-12.04-14.57-6.53-10.02-11.66-21.78-15.39-35.27-3.72-13.5-5.59-26.33-5.59-38.48 0-14.79 3.65-27.15 10.96-37.07 7.31-9.92 16.59-14.94 27.82-15.07 4.93 0 10.51 1.34 16.74 4.02 6.23 2.68 10.08 4.09 11.57 4.23 2.01-.27 6.13-1.8 12.35-4.59 6.23-2.79 11.75-4.04 16.57-3.77 13.98.78 24.89 5.86 32.72 15.24-12.32 7.48-18.35 17.65-18.09 30.52.26 10.27 4.15 18.8 11.66 25.6 7.51 6.8 16.35 10.74 26.52 11.83-2.24 6.78-4.87 13.78-7.87 21.01zM119.22 32.64c0-7.27 2.64-14.15 7.92-20.64 5.29-6.49 11.85-10.76 19.7-12.8 1.02 7.27-.93 14.19-5.83 20.76-4.91 6.58-11.45 10.97-19.64 13.19-.71-.16-1.42-.33-2.15-.51z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold tracking-tight text-white/95">
              AppleVision <span className="text-white/60 font-normal">Galle</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-white/30" />

            {/* Live Trading Status Dot */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>

            <span className="w-1 h-1 rounded-full bg-white/30" />

            {/* Digital Time */}
            <span className="text-[11px] font-mono text-white/80 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 2. Apple Wallet / Apple Card Styled Hero Glass Card */}
        <div className="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-neutral-900 via-zinc-900 to-black select-none">
          {/* Ambient Apple Card glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br from-rose-500/25 via-amber-500/20 to-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Card subtle mesh pattern / metallic shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Card Top Row: Chip / NFC & Store Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Apple Card Chip Style */}
                <div className="w-9 h-7 rounded-md border border-amber-300/40 bg-gradient-to-br from-amber-200/20 to-amber-500/20 flex items-center justify-center p-1">
                  <div className="w-full h-full border border-amber-200/30 rounded grid grid-cols-2 grid-rows-2 gap-0.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                    AppleVision Titanium Card
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-200">
                    Galle Flagship Store
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{todayMarginPct}% Margin</span>
              </div>
            </div>

            {/* Hero Revenue Display */}
            <div className="pt-1">
              <div className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
                Today's Gross Revenue
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-neutral-400 font-mono">LKR</span>
                <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
                  {todaySalesTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card Bottom Row: Details and stats */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="font-semibold">{todayTxCount} Transactions</span>
                <span className="text-white/30">•</span>
                <span className="text-neutral-400 font-mono text-[11px]">Avg LKR {todayAvgTicket.toLocaleString()}</span>
              </div>

              <button
                onClick={() => setActiveTab('pos')}
                className="px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] shadow-lg shadow-brand-500/30 flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>Charge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. iOS Control Center Quick Action Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Quick Actions
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">
              Control Center
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. + Sale [Red] */}
            <button
              onClick={() => setActiveTab('pos')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  + Sale
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  New POS
                </div>
              </div>
            </button>

            {/* 2. Scan IMEI [Blue] */}
            <button
              onClick={onOpenImeiSearch}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Barcode className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Scan IMEI
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Passport
                </div>
              </div>
            </button>

            {/* 3. Trade-In [Orange] */}
            <button
              onClick={() => setActiveTab('pos')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
                <Repeat className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Trade-In
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Exchange
                </div>
              </div>
            </button>

            {/* 4. Stock Intake [Green] */}
            <button
              onClick={() => setActiveTab('inventory')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Stock Intake
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Inventory
                </div>
              </div>
            </button>

            {/* 5. Repairs [Indigo] */}
            <button
              onClick={() => setActiveTab('repairs')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Repairs
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Job Sheets
                </div>
              </div>
            </button>

            {/* 6. Analytics [Purple] */}
            <button
              onClick={() => setActiveTab('reports')}
              className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Analytics
                </div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Reports
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. iOS 2x2 Apple Health/Fitness Styled Widget Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Store Vitals & Activity
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">
              Live Sensors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Widget 1: Stock Level with Low Stock Warning */}
            <button
              onClick={() => setActiveTab('inventory')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                {lowStockProducts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {lowStockProducts.length} LOW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    OPTIMAL
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Hardware Stock
                </div>
                <div className="font-mono font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {totalStockUnits} <span className="text-xs font-semibold text-slate-400 font-sans">Units</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 truncate">
                  Valued LKR {(totalStockRetail / 1000000).toFixed(1)}M
                </div>
              </div>
            </button>

            {/* Widget 2: Active Repairs Badge */}
            <button
              onClick={() => setActiveTab('repairs')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                  GENIUS BAR
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Active Repairs
                </div>
                <div className="font-mono font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {repairs.filter(r => r.status !== 'Delivered').length} <span className="text-xs font-semibold text-slate-400 font-sans">Devices</span>
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1 truncate flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {repairs.filter(r => r.status === 'Ready for Pickup').length} Ready to Pickup
                </div>
              </div>
            </button>

            {/* Widget 3: Profit Margin Ring (Apple Activity Ring style) */}
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Margin Ring
                </div>
                <div className="font-mono font-black text-xl text-emerald-500 mt-0.5">
                  {todayMarginPct}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">
                  LKR {(todayProfitTotal / 1000).toFixed(0)}k Profit
                </div>
              </div>

              {/* Apple Watch Fitness Style Activity Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="transparent"
                    className="text-emerald-500/20"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke="#10b981"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={144.5}
                    strokeDashoffset={144.5 * (1 - Math.min(Math.max(todayMarginPct, 0), 100) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Widget 4: Outstanding Credit */}
            <button
              onClick={() => setActiveTab('customers')}
              className="p-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                  LEDGER
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Due Credit
                </div>
                <div className="font-mono font-black text-xl text-rose-500 mt-0.5 truncate">
                  {(totalOutstandingCredit / 1000).toFixed(1)}k <span className="text-xs font-semibold text-slate-400 font-sans">LKR</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 truncate">
                  {customers.filter(c => c.creditBalance > 0).length} Unsettled accounts
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 5. iOS Segmented Control */}
        <div className="p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70 backdrop-blur-md flex items-center justify-between text-xs font-semibold select-none">
          {(['Today', '7D', '30D', 'All'] as const).map((tab) => {
            const isActive = mobileTimeframe === tab;
            return (
              <button
                key={tab}
                onClick={() => setMobileTimeframe(tab)}
                className={`flex-1 py-1.5 rounded-xl text-center transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 6. iOS Grouped List for Recent Invoices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Recent Invoices
            </span>
            <span className="text-[10px] font-semibold text-brand-500">
              {filteredSales.length} Invoices
            </span>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 divide-y divide-neutral-200/50 dark:divide-neutral-800/80 overflow-hidden shadow-sm">
            {filteredSales.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                No invoices found for this timeframe.
              </div>
            ) : (
              filteredSales.slice(0, 6).map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => handleOpenReceipt(sale)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-500/5 active:bg-neutral-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Apple Receipt Icon Squircle */}
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {sale.customerName}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-sans">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-400 font-mono truncate mt-0.5">
                        {sale.invoiceNumber} • {sale.time} • {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        LKR {sale.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-emerald-500 font-semibold">
                        Receipt
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))
            )}
          </div>

          {filteredSales.length > 6 && (
            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-2.5 rounded-xl bg-white/60 dark:bg-neutral-900/60 border border-white/20 dark:border-white/10 text-center text-xs font-semibold text-brand-500 hover:text-brand-600 active:scale-98 transition-all"
            >
              View All Invoices in Reports ({filteredSales.length})
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP VIEW (AppleVision Flagship POS Dashboard)        */}
      {/* ======================================================== */}
      <div className="hidden md:block space-y-6">
      {/* ── HEADER WITH LIVE SRI LANKA TICKER & SHORTCUT ACTIONS ─────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm">
        {/* Left: User Welcome & Store Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome Back, {userName} 👋
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              Store Owner
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AppleVision Store Galle · Kalegana Junction, Galle
          </p>
        </div>

        {/* Center: Live Sri Lanka Clock Ticker */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 w-fit">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <div className="text-xs">
            <div className="font-mono font-bold text-slate-900 dark:text-white tracking-tight">
              {formattedTime}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {formattedDate} (Asia/Colombo)
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons with Keyboard Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* New Sale F2 */}
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20 hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: BRAND_RED }}
            title="Press F2 to open POS"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
            <kbd className="ml-1 bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px] font-mono">
              F2
            </kbd>
          </button>

          {/* Intake Trade-In F7 */}
          <button
            onClick={() => setIsTradeInModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Press F7 to intake trade-in device"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Intake Trade-In</span>
            <kbd className="ml-1 bg-purple-200/50 dark:bg-purple-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono">
              F7
            </kbd>
          </button>

          {/* New Repair */}
          <button
            onClick={() => setActiveTab('repairs')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>New Repair</span>
          </button>

          {/* Scan IMEI F4 */}
          <button
            onClick={onOpenImeiSearch}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:border-slate-400 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Press F4 to search IMEI / Serial"
          >
            <Search className="w-3.5 h-3.5 text-blue-500" />
            <span>Scan IMEI</span>
            <kbd className="ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px] font-mono">
              F4
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 5 KPI STAT CARDS ROW (MATCHING REFERENCE IMAGE) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Today's Sales */}
        <KpiCard
          title="Today's Sales"
          value={fmtRs(todayRev)}
          trendText={`+${revTrend.pct}%`}
          trendSubtext="vs Yesterday"
          isUp={revTrend.up}
          accentBarColor="bg-rose-500"
          badgeBg="bg-rose-50 dark:bg-rose-950/40"
          badgeTextColor="text-rose-500"
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />

        {/* Card 2: Today's Orders */}
        <KpiCard
          title="Today's Orders"
          value={`${data?.todayOrders || 0}`}
          trendText={`${data?.todayOrders || 0}`}
          trendSubtext="Invoices today"
          isUp={true}
          accentBarColor="bg-blue-500"
          badgeBg="bg-blue-50 dark:bg-blue-950/40"
          badgeTextColor="text-blue-500"
          icon={<Receipt className="w-5 h-5" />}
          loading={loading}
        />

        {/* Card 3: Active Inventory */}
        <KpiCard
          title="Active Inventory"
          value={`${data?.inventoryCount || 0} Devices`}
          trendText={`${products.length} models`}
          trendSubtext="Units in stock"
          isUp={true}
          accentBarColor="bg-emerald-500"
          badgeBg="bg-emerald-50 dark:bg-emerald-950/40"
          badgeTextColor="text-emerald-500"
          icon={<Smartphone className="w-5 h-5" />}
          loading={loading}
        />

        {/* Card 4: Pending Repairs */}
        <KpiCard
          title="Pending Repairs"
          value={`${data?.pendingRepairs || 0}`}
          trendText={`${data?.pendingRepairs || 0} active`}
          trendSubtext="Awaiting work"
          isUp={false}
          accentBarColor="bg-amber-500"
          badgeBg="bg-amber-50 dark:bg-amber-950/40"
          badgeTextColor="text-amber-500"
          icon={<Wrench className="w-5 h-5" />}
          loading={loading}
        />

        {/* Card 5: Trade-In Units */}
        <KpiCard
          title="Trade-In Units"
          value={`${data?.tradeInCount || 0} Units`}
          trendText="Pre-Owned"
          trendSubtext="Graded & Intake"
          isUp={true}
          accentBarColor="bg-purple-500"
          badgeBg="bg-purple-50 dark:bg-purple-950/40"
          badgeTextColor="text-purple-500"
          icon={<RotateCcw className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* ── QUICK STAT WIDGETS ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Widget */}
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                (data?.lowStockCount || 0) > 0
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}
            >
              {(data?.lowStockCount || 0) > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {(data?.lowStockCount || 0) > 0
                  ? `${data?.lowStockCount} Products Running Low`
                  : 'Stock Levels Healthy'}
              </p>
              <p className="text-[11px] text-slate-400">
                {(data?.lowStockCount || 0) > 0
                  ? 'Items reached or below minimum reorder thresholds'
                  : 'All inventory models have sufficient reserve stock'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1 group"
          >
            <span>Review Stock</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Trade-Ins Intake Widget */}
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {(data?.tradeInCount || 0) > 0
                  ? `${data?.tradeInCount} Trade-In Units in Workflow`
                  : 'Apple Trade-In Program Ready'}
              </p>
              <p className="text-[11px] text-slate-400">
                Automated 12-point hardware grading & instant valuation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTradeInModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1 transition-all"
          >
            <span>+ Intake Device</span>
          </button>
        </div>
      </div>

      {/* ── ANALYTICS ROW (DONUT + SPLINE CHART) ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* Left: Donut Chart (2 cols) */}
        <div className="lg:col-span-2">
          <DonutChart
            slices={data?.salesByCategory || []}
            totalSalesCount={data?.recentSales?.length || 0}
            loading={loading}
          />
        </div>

        {/* Right: Spline Revenue Chart (3 cols) */}
        <div className="lg:col-span-3">
          <RevenueChart
            trendToday={data?.trendToday || []}
            trendWeek={data?.trendWeek || []}
            trendMonth={data?.trendMonth || []}
            loading={loading}
          />
        </div>
      </div>

      {/* ── RECENT INVOICES TABLE (MATCHING REFERENCE IMAGE) ───────────────── */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
            <p className="text-xs text-slate-400">Latest transactions from customer checkouts</p>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1 group"
          >
            <span>View All Reports</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.recentSales || data.recentSales.length === 0 ? (
          /* Empty State (Clean zero data presentation) */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Receipt className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              No transactions yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Your store is clean and ready for production. Press{' '}
              <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                F2
              </kbd>{' '}
              or click New Sale above to start your first checkout.
            </p>
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              style={{ backgroundColor: BRAND_RED }}
            >
              <Plus className="w-4 h-4" />
              <span>Start First Sale (F2)</span>
            </button>
          </div>
        ) : (
          /* Populated Invoices Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold bg-slate-50/50 dark:bg-dark-surface/30">
                  <th className="px-6 py-3 font-semibold w-12">No</th>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Item Name</th>
                  <th className="px-4 py-3 font-semibold">Order Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-6 py-3 font-semibold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {data.recentSales.map((sale, idx) => {
                  const avatarColor = getAvatarColor(sale.customerName);
                  const firstItem = sale.items?.[0];
                  const extraItemsCount = (sale.items?.length || 1) - 1;

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-surface/50 transition-colors"
                    >
                      {/* Row No */}
                      <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Invoice No */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-brand-500 text-[11px]">
                          {sale.invoiceNumber || '—'}
                        </span>
                      </td>

                      {/* Customer with initials avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${avatarColor}`}
                          >
                            {getInitials(sale.customerName)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
                              {sale.customerName || 'Walk-in Customer'}
                            </span>
                            {sale.customerPhone && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {sale.customerPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Item Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate max-w-[180px]">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {firstItem?.productName || 'Apple Device'}
                            </span>
                            {extraItemsCount > 0 && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                +{extraItemsCount} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Order Date & Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {sale.date}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sale.time || ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sale.status || 'Completed'} />
                      </td>

                      {/* Price / Amount */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {fmtRs(sale.totalAmount || 0)}
                      </td>

                      {/* Action / Receipt Button */}
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenReceipt(sale)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View / Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      {/* Trade-In Inspection Intake Modal (F7) */}
      <TradeInInspectionModal
        isOpen={isTradeInModalOpen}
        onClose={() => setIsTradeInModalOpen(false)}
        selectedCustomer={null}
        onApplyTradeIn={handleApplyTradeIn}
      />

      {/* View / Print Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setActiveTab('pos');
        }}
      />
    </div>
  );
};
