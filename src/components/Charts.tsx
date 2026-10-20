"use client";

import { useLang } from "@/i18n";
import type { Lang } from "@/i18n";

export interface ChartsData {
  top10Winter: { street: string; winter: number }[];
  curve: { rank: number; winterShare: number; summerShare: number }[];
  top20: { street: string; winter: number; summer: number }[];
  revenueTop10: { street: string; low: number; high: number }[];
  shares: { n: number; winter: number; summer: number }[];
}

const WINTER = "#d80621";
const SUMMER = "#e97f7f";
const GRID = "rgba(10,15,30,0.07)";
const FAINT = "rgba(10,15,30,0.55)";

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function num(n: number, lang: Lang): string {
  return n.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA");
}

function pct1(x: number, lang: Lang): string {
  return `${(x * 100).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function moneyK(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
}

function Legend({ winterLabel, summerLabel }: { winterLabel: string; summerLabel: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-[14px]">
      <span className="flex items-center gap-2">
        <span className="inline-block h-[3px] w-8" style={{ background: WINTER }} />
        {winterLabel}
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-[3px] w-8" style={{ background: SUMMER }} />
        {summerLabel}
      </span>
    </div>
  );
}

function ChartShell({
  title,
  takeaway,
  note,
  children,
}: {
  title: string;
  takeaway: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border-t border-line py-12 first:border-t-0 md:py-14">
      <h2 className="display max-w-[760px] text-[32px] md:text-[40px]">{title}</h2>
      <p className="mt-4 max-w-[760px] text-[17px] leading-relaxed text-ink/75">{takeaway}</p>
      <div className="mt-7">{children}</div>
      <p className="mt-4 max-w-[760px] text-[13.5px] leading-relaxed text-ink/50">{note}</p>
    </article>
  );
}

/** Chart 1: horizontal bars, top 10 streets by winter tickets. */
function Top10Chart({ rows, lang }: { rows: ChartsData["top10Winter"]; lang: Lang }) {
  const W = 960, LH = 190, VW = 90, PT = 6, ROW = 42;
  const H = PT * 2 + ROW * rows.length;
  const plotW = W - LH - VW;
  const max = Math.max(...rows.map((r) => r.winter));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper p-2" role="img" aria-label="Bar chart of the top 10 streets by winter parking tickets">
      {rows.map((r, i) => {
        const y = PT + i * ROW;
        const w = (r.winter / max) * plotW;
        return (
          <g key={r.street}>
            <text x={LH - 12} y={y + ROW / 2 + 5} textAnchor="end" fontSize="14" fontWeight="500" fill="#0a0f1e">
              {titleCase(r.street)}
            </text>
            <rect x={LH} y={y + 8} width={w} height={ROW - 16} rx={4} fill={WINTER} />
            <text x={LH + w + 10} y={y + ROW / 2 + 5} fontSize="13.5" fontFamily="ui-monospace, monospace" fill={FAINT}>
              {num(r.winter, lang)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Chart 2: cumulative share curves over the top 200 ranks, winter vs summer. */
function CurveChart({
  curve,
  xLabel,
  yLabel,
  winterLabel,
  summerLabel,
  lang,
}: {
  curve: ChartsData["curve"];
  xLabel: string;
  yLabel: string;
  winterLabel: string;
  summerLabel: string;
  lang: Lang;
}) {
  const W = 960, H = 460, PL = 62, PR = 24, PT = 18, PB = 52;
  const iw = W - PL - PR, ih = H - PT - PB;
  const maxRank = Math.max(...curve.map((p) => p.rank));
  const yMax = 0.6;
  const X = (rank: number) => PL + (rank / maxRank) * iw;
  const Y = (s: number) => PT + ih - (s / yMax) * ih;
  const line = (key: "winterShare" | "summerShare") =>
    curve.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.rank).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(" ");
  const at = (rank: number) => curve[rank - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper" role="img" aria-label="Cumulative share curves for winter and summer over the top 200 streets">
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((g) => (
          <g key={g}>
            <line x1={PL} y1={Y(g)} x2={PL + iw} y2={Y(g)} stroke={GRID} />
            <text x={PL - 8} y={Y(g) + 4} textAnchor="end" fontSize="11.5" fill={FAINT}>
              {pct1(g, lang)}
            </text>
          </g>
        ))}
        {[0, 50, 100, 150, 200].map((r) => (
          <g key={r}>
            <line x1={X(r)} y1={PT} x2={X(r)} y2={PT + ih} stroke={GRID} />
            <text x={X(r)} y={PT + ih + 22} textAnchor="middle" fontSize="11.5" fill={FAINT}>
              {r}
            </text>
          </g>
        ))}
        <path d={line("summerShare")} fill="none" stroke={SUMMER} strokeWidth="2.5" />
        <path d={line("winterShare")} fill="none" stroke={WINTER} strokeWidth="2.5" />
        {[10, 50].map((r) => (
          <g key={r}>
            <circle cx={X(r)} cy={Y(at(r).winterShare)} r="4" fill={WINTER} />
            <circle cx={X(r)} cy={Y(at(r).summerShare)} r="4" fill={SUMMER} />
          </g>
        ))}
        <text x={PL + iw / 2} y={H - 6} textAnchor="middle" fontSize="12.5" fill="rgba(10,15,30,0.6)">
          {xLabel}
        </text>
        <text x={15} y={PT + ih / 2} textAnchor="middle" fontSize="12.5" fill="rgba(10,15,30,0.6)" transform={`rotate(-90 15 ${PT + ih / 2})`}>
          {yLabel}
        </text>
      </svg>
      <Legend winterLabel={winterLabel} summerLabel={summerLabel} />
    </div>
  );
}

/** Chart 3: paired horizontal bars, winter and summer on the top 20 streets. */
function PairedChart({
  rows,
  winterLabel,
  summerLabel,
  lang,
}: {
  rows: ChartsData["top20"];
  winterLabel: string;
  summerLabel: string;
  lang: Lang;
}) {
  const W = 960, LH = 190, VW = 80, PT = 8, GROUP = 52, BAR = 13, GAP = 4;
  const H = PT * 2 + GROUP * rows.length;
  const plotW = W - LH - VW;
  const max = Math.max(...rows.flatMap((r) => [r.winter, r.summer]));
  const bw = (v: number) => Math.max(2, (v / max) * plotW);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper p-2" role="img" aria-label="Paired bars of winter and summer tickets on the top 20 streets">
        {rows.map((r, i) => {
          const y = PT + i * GROUP;
          return (
            <g key={r.street}>
              <text x={LH - 12} y={y + GROUP / 2 + 5} textAnchor="end" fontSize="14" fontWeight="500" fill="#0a0f1e">
                {titleCase(r.street)}
              </text>
              <rect x={LH} y={y + 6} width={bw(r.winter)} height={BAR} rx={3} fill={WINTER} />
              <text x={LH + bw(r.winter) + 8} y={y + 6 + BAR - 2} fontSize="12" fontFamily="ui-monospace, monospace" fill={FAINT}>
                {num(r.winter, lang)}
              </text>
              <rect x={LH} y={y + 6 + BAR + GAP} width={bw(r.summer)} height={BAR} rx={3} fill={SUMMER} />
              <text x={LH + bw(r.summer) + 8} y={y + 6 + BAR + GAP + BAR - 2} fontSize="12" fontFamily="ui-monospace, monospace" fill={FAINT}>
                {num(r.summer, lang)}
              </text>
            </g>
          );
        })}
      </svg>
      <Legend winterLabel={winterLabel} summerLabel={summerLabel} />
    </div>
  );
}

/** Chart 4: horizontal range bars, low to high revenue estimate per winter. */
function RevenueChart({ rows, lang }: { rows: ChartsData["revenueTop10"]; lang: Lang }) {
  const W = 1000, LH = 185, PT = 10, PB = 34, ROW = 46;
  const plotW = 620;
  const H = PT + ROW * rows.length + PB;
  const max = Math.max(...rows.map((r) => r.high));
  const X = (v: number) => LH + (v / max) * plotW;
  const ticks = [0, 100000, 200000, 300000, 400000, 500000];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper p-2" role="img" aria-label="Range bars of meter revenue at risk per winter for the top 10 streets">
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={X(tk)} y1={PT} x2={X(tk)} y2={PT + ROW * rows.length} stroke={GRID} />
          <text x={X(tk)} y={PT + ROW * rows.length + 22} textAnchor="middle" fontSize="11.5" fill={FAINT}>
            {moneyK(tk)}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = PT + i * ROW;
        return (
          <g key={r.street}>
            <text x={LH - 12} y={y + ROW / 2 + 5} textAnchor="end" fontSize="14" fontWeight="500" fill="#0a0f1e">
              {titleCase(r.street)}
            </text>
            <rect x={X(r.low)} y={y + ROW / 2 - 8} width={Math.max(3, X(r.high) - X(r.low))} height={16} rx={4} fill={WINTER} opacity={0.85} />
            <circle cx={X(r.low)} cy={y + ROW / 2} r="4.5" fill={WINTER} />
            <text x={X(r.high) + 12} y={y + ROW / 2 + 5} fontSize="13.5" fontFamily="ui-monospace, monospace" fill="#0a0f1e">
              {`${moneyK(r.low)} – ${moneyK(r.high)}`}
            </text>
          </g>
        );
      })}
      <text x={LH + plotW / 2} y={H - 2} textAnchor="middle" fontSize="12" fill={FAINT}>
        {lang === "fr" ? "Dollars par hiver (estimation)" : "Dollars per winter (estimate)"}
      </text>
    </svg>
  );
}

/** Chart 5: grouped vertical bars, winter vs summer share at three cutoffs. */
function SharesChart({
  shares,
  groupLabels,
  winterLabel,
  summerLabel,
  lang,
}: {
  shares: ChartsData["shares"];
  groupLabels: string[];
  winterLabel: string;
  summerLabel: string;
  lang: Lang;
}) {
  const W = 960, H = 440, PL = 62, PR = 16, PT = 26, PB = 56;
  const iw = W - PL - PR, ih = H - PT - PB;
  const yMax = 0.6;
  const Y = (s: number) => PT + ih - (s / yMax) * ih;
  const groupW = iw / shares.length;
  const barW = 74, gap = 10;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper" role="img" aria-label="Grouped bars of the share of all tickets on the top 10, 50 and 200 streets, winter and summer">
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((g) => (
          <g key={g}>
            <line x1={PL} y1={Y(g)} x2={PL + iw} y2={Y(g)} stroke={GRID} />
            <text x={PL - 8} y={Y(g) + 4} textAnchor="end" fontSize="11.5" fill={FAINT}>
              {pct1(g, lang)}
            </text>
          </g>
        ))}
        {shares.map((s, i) => {
          const cx = PL + groupW * i + groupW / 2;
          const wx = cx - barW - gap / 2;
          const sx = cx + gap / 2;
          return (
            <g key={s.n}>
              <rect x={wx} y={Y(s.winter)} width={barW} height={PT + ih - Y(s.winter)} rx={4} fill={WINTER} />
              <rect x={sx} y={Y(s.summer)} width={barW} height={PT + ih - Y(s.summer)} rx={4} fill={SUMMER} />
              <text x={wx + barW / 2} y={Y(s.winter) - 8} textAnchor="middle" fontSize="14" fontWeight="600" fill="#0a0f1e">
                {pct1(s.winter, lang)}
              </text>
              <text x={sx + barW / 2} y={Y(s.summer) - 8} textAnchor="middle" fontSize="14" fontWeight="600" fill="#0a0f1e">
                {pct1(s.summer, lang)}
              </text>
              <text x={cx} y={PT + ih + 26} textAnchor="middle" fontSize="13.5" fill="rgba(10,15,30,0.65)">
                {groupLabels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <Legend winterLabel={winterLabel} summerLabel={summerLabel} />
    </div>
  );
}

export default function Charts({ data }: { data: ChartsData }) {
  const { t, lang } = useLang();
  const c = t.charts;
  const winterLabel = t.concentration.winter;
  const summerLabel = t.concentration.summer;
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-20 pt-16 md:pt-20">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{c.kicker}</p>
        <h1 className="display mt-5 max-w-[880px] text-[44px] md:text-[64px]">{c.title}</h1>
        <p className="mt-6 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{c.lead}</p>
        <div className="mt-6 max-w-[1060px]">
          <ChartShell title={c.c1.title} takeaway={c.c1.takeaway} note={c.c1.note}>
            <Top10Chart rows={data.top10Winter} lang={lang} />
          </ChartShell>
          <ChartShell title={c.c2.title} takeaway={c.c2.takeaway} note={c.c2.note}>
            <CurveChart curve={data.curve} xLabel={c.c2.xLabel} yLabel={c.c2.yLabel} winterLabel={winterLabel} summerLabel={summerLabel} lang={lang} />
          </ChartShell>
          <ChartShell title={c.c3.title} takeaway={c.c3.takeaway} note={c.c3.note}>
            <PairedChart rows={data.top20} winterLabel={winterLabel} summerLabel={summerLabel} lang={lang} />
          </ChartShell>
          <ChartShell title={c.c4.title} takeaway={c.c4.takeaway} note={c.c4.note}>
            <RevenueChart rows={data.revenueTop10} lang={lang} />
          </ChartShell>
          <ChartShell title={c.c5.title} takeaway={c.c5.takeaway} note={c.c5.note}>
            <SharesChart shares={data.shares} groupLabels={c.c5.groupLabels} winterLabel={winterLabel} summerLabel={summerLabel} lang={lang} />
          </ChartShell>
        </div>
      </div>
    </section>
  );
}
