"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface LorenzPoint {
  top_fraction_of_streets: number;
  share_of_tickets: number;
}
interface Conc {
  total_winter_tickets: number;
  total_summer_tickets: number;
  winter_days: number;
  summer_days: number;
  distinct_streets_winter: number;
  distinct_streets_summer: number;
  top10_winter_share: number;
  top50_winter_share: number;
  top10_summer_share: number;
  top50_summer_share: number;
  gini_winter: number;
  gini_summer: number;
  rank_table: { top_n_streets: number; winter_share: number; summer_share: number }[];
  lorenz_winter: LorenzPoint[];
  lorenz_summer: LorenzPoint[];
}

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}
function pct(x: number, d = 1) {
  return `${(x * 100).toFixed(d)}%`;
}

function LorenzChart({ winter, summer, winterLabel, summerLabel, xLabel, yLabel }: {
  winter: LorenzPoint[];
  summer: LorenzPoint[];
  winterLabel: string;
  summerLabel: string;
  xLabel: string;
  yLabel: string;
}) {
  const W = 720, H = 420, PL = 56, PR = 16, PT = 16, PB = 44;
  const iw = W - PL - PR, ih = H - PT - PB;
  const X = (f: number) => PL + f * iw;
  const Y = (s: number) => PT + ih - s * ih;
  const line = (pts: LorenzPoint[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.top_fraction_of_streets).toFixed(1)},${Y(p.share_of_tickets).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[24px] border border-line bg-paper" role="img" aria-label="Cumulative share curve, winter and summer">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={X(g)} y1={PT} x2={X(g)} y2={PT + ih} stroke="rgba(10,15,30,0.07)" />
            <line x1={PL} y1={Y(g)} x2={PL + iw} y2={Y(g)} stroke="rgba(10,15,30,0.07)" />
            <text x={X(g)} y={PT + ih + 20} textAnchor="middle" fontSize="11" fill="rgba(10,15,30,0.55)">{pct(g, 0)}</text>
            <text x={PL - 8} y={Y(g) + 4} textAnchor="end" fontSize="11" fill="rgba(10,15,30,0.55)">{pct(g, 0)}</text>
          </g>
        ))}
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="rgba(10,15,30,0.3)" strokeDasharray="5 5" />
        <path d={line(summer)} fill="none" stroke="#e97f7f" strokeWidth="2.5" />
        <path d={line(winter)} fill="none" stroke="#d80621" strokeWidth="2.5" />
        <text x={PL + iw / 2} y={H - 4} textAnchor="middle" fontSize="12" fill="rgba(10,15,30,0.6)">{xLabel}</text>
        <text x={14} y={PT + ih / 2} textAnchor="middle" fontSize="12" fill="rgba(10,15,30,0.6)" transform={`rotate(-90 14 ${PT + ih / 2})`}>{yLabel}</text>
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-[14px]">
        <span className="flex items-center gap-2"><span className="inline-block h-[3px] w-8 bg-canada" />{winterLabel}</span>
        <span className="flex items-center gap-2"><span className="inline-block h-[3px] w-8" style={{ background: "#e97f7f" }} />{summerLabel}</span>
      </div>
    </div>
  );
}

export default function Concentration() {
  const { t } = useLang();
  const c = t.concentration;
  const [d, setD] = useState<Conc | null>(null);
  useEffect(() => {
    fetch("/api/v1/curb/concentration")
      .then((r) => r.json())
      .then(setD)
      .catch(() => {});
  }, []);

  const cards = useMemo(() => {
    if (!d) return [];
    return [
      {
        season: c.winter,
        top10: pct(d.top10_winter_share),
        top50: pct(d.top50_winter_share),
        gini: d.gini_winter.toFixed(3),
        tickets: fmt(d.total_winter_tickets),
        streets: fmt(d.distinct_streets_winter),
        days: d.winter_days,
      },
      {
        season: c.summer,
        top10: pct(d.top10_summer_share),
        top50: pct(d.top50_summer_share),
        gini: d.gini_summer.toFixed(3),
        tickets: fmt(d.total_summer_tickets),
        streets: fmt(d.distinct_streets_summer),
        days: d.summer_days,
      },
    ];
  }, [d, c]);

  return (
    <section id="concentration" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{c.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{c.title}</h2>
        <p className="mt-5 max-w-[820px] text-[18px] leading-relaxed text-ink/70">{c.body}</p>

        {d && (
          <>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {cards.map((card) => (
                <article key={card.season} className="rounded-[24px] border border-line bg-paper p-7">
                  <h3 className="text-[15px] font-semibold uppercase tracking-wide text-ink/60">{card.season}</h3>
                  <div className="mt-5 grid grid-cols-2 gap-6">
                    <div>
                      <p className="display text-[40px] text-canada">{card.top10}</p>
                      <p className="mt-1 text-[14px] text-ink/60">{c.top10}</p>
                    </div>
                    <div>
                      <p className="display text-[40px] text-canada">{card.top50}</p>
                      <p className="mt-1 text-[14px] text-ink/60">{c.top50}</p>
                    </div>
                    <div>
                      <p className="display text-[32px]">{card.gini}</p>
                      <p className="mt-1 text-[14px] text-ink/60">{c.gini}</p>
                    </div>
                    <div>
                      <p className="display text-[32px]">{card.tickets}</p>
                      <p className="mt-1 text-[14px] text-ink/60">
                        {c.tickets} · {card.days} {c.daysWord} · {card.streets} {c.streets}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="display text-[28px] md:text-[32px]">{c.rankTitle}</h3>
                <p className="mt-2 max-w-[520px] text-[15.5px] text-ink/65">{c.rankBody}</p>
                <div className="mt-5 overflow-x-auto rounded-[24px] border border-line bg-paper">
                  <table className="w-full text-left text-[14.5px]">
                    <thead>
                      <tr className="border-b border-line bg-paper-warm text-[12.5px] uppercase tracking-wide text-ink/55">
                        <th className="px-5 py-3 font-semibold">{c.colTopN}</th>
                        <th className="px-5 py-3 text-right font-semibold">{c.colWinterShare}</th>
                        <th className="px-5 py-3 text-right font-semibold">{c.colSummerShare}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.rank_table.map((r) => (
                        <tr key={r.top_n_streets} className="border-b border-line/60 last:border-0">
                          <td className="px-5 py-2.5 font-mono">{fmt(r.top_n_streets)}</td>
                          <td className="px-5 py-2.5 text-right font-mono text-canada">{pct(r.winter_share, 2)}</td>
                          <td className="px-5 py-2.5 text-right font-mono">{pct(r.summer_share, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="display text-[28px] md:text-[32px]">{c.lorenzTitle}</h3>
                <p className="mt-2 max-w-[520px] text-[15.5px] text-ink/65">{c.lorenzBody}</p>
                <div className="mt-5">
                  <LorenzChart
                    winter={d.lorenz_winter}
                    summer={d.lorenz_summer}
                    winterLabel={c.lorenzWinter}
                    summerLabel={c.lorenzSummer}
                    xLabel={c.lorenzX}
                    yLabel={c.lorenzY}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
