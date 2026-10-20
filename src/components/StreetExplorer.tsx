"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface Street {
  street: string;
  winter_rank: number;
  winter_tickets: number;
  summer_tickets: number;
  winter_meter_tickets: number;
  winter_share_city_pct: number;
  revenue_low: number | null;
  revenue_high: number | null;
  estimable: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}
function money(n: number) {
  return "$" + n.toLocaleString("en-CA");
}

export default function StreetExplorer() {
  const { t } = useLang();
  const e = t.explorer;
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Street[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const qs = q.trim()
        ? `q=${encodeURIComponent(q.trim())}&limit=50`
        : "limit=50";
      fetch(`/api/v1/curb/streets?${qs}`)
        .then((r) => r.json())
        .then((d) => {
          setRows(d.streets ?? []);
          setTotal(d.count ?? 0);
        })
        .catch(() => {});
    }, 200);
    return () => window.clearTimeout(id);
  }, [q]);

  const searched = q.trim().length > 0;
  const empty = useMemo(() => searched && rows.length === 0, [searched, rows]);

  return (
    <section id="explorer" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{e.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{e.title}</h2>
        <p className="mt-5 max-w-[820px] text-[18px] leading-relaxed text-ink/70">{e.body}</p>

        <div className="mt-8 flex max-w-[720px] flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder={e.search}
            className="min-w-[260px] flex-1 rounded-full border border-line bg-paper px-6 py-4 text-[17px] outline-none placeholder:text-ink/40 focus:border-canada"
            aria-label={e.search}
          />
          <span className="text-[14px] text-ink/55">
            {fmt(rows.length)} / {fmt(total)} {e.showing}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-[13px] font-medium">
          <span className="rounded-full bg-ink px-3 py-1 text-white">{e.tagFact}: tickets, shares</span>
          <span className="rounded-full bg-canada px-3 py-1 text-white">{e.tagEstimate}: revenue range</span>
        </div>

        {empty ? (
          <p className="mt-8 text-[16px] text-ink/60">{e.noResult}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[24px] border border-line">
            <table className="w-full min-w-[900px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-line bg-paper-warm text-[12.5px] uppercase tracking-wide text-ink/55">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">{e.colStreet}</th>
                  <th className="px-5 py-3 text-right font-semibold">{e.colWinter}</th>
                  <th className="px-5 py-3 text-right font-semibold">{e.colSummer}</th>
                  <th className="px-5 py-3 text-right font-semibold">{e.colShare}</th>
                  <th className="px-5 py-3 text-right font-semibold">{e.colMeter}</th>
                  <th className="px-5 py-3 text-right font-semibold">{e.colRevenue}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.street} className="border-b border-line/60 last:border-0 hover:bg-paper-warm">
                    <td className="px-5 py-2.5 font-mono text-ink/50">{s.winter_rank}</td>
                    <td className="px-5 py-2.5 font-mono font-medium">{s.street}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-canada">{fmt(s.winter_tickets)}</td>
                    <td className="px-5 py-2.5 text-right font-mono">{fmt(s.summer_tickets)}</td>
                    <td className="px-5 py-2.5 text-right font-mono">{s.winter_share_city_pct.toFixed(2)}%</td>
                    <td className="px-5 py-2.5 text-right font-mono">{fmt(s.winter_meter_tickets)}</td>
                    <td className="px-5 py-2.5 text-right font-mono">
                      {s.estimable === "yes" && s.revenue_low !== null && s.revenue_high !== null ? (
                        <span>
                          {money(s.revenue_low)} to {money(s.revenue_high)}
                        </span>
                      ) : (
                        <span className="font-sans text-[13px] text-ink/55">{e.notEstimable}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
