"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

export default function Developers() {
  const { t } = useLang();
  const [top, setTop] = useState<{ street: string; winter_tickets: number; revenue_low: number | null; revenue_high: number | null } | null>(null);
  useEffect(() => {
    fetch("/api/v1/curb/summary")
      .then((r) => r.json())
      .then((d) => setTop(d.top_street))
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-CA");
  const money = (n: number | null) => (n === null ? "null" : n);

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/curb/streets?q=yonge",
      desc: "Streets ranked by winter tickets, with revenue-at-risk ranges",
      response: top
        ? `{ "count": 1, "streets": [\n  { "street": "${top.street}",\n    "winter_tickets": ${top.winter_tickets},\n    "revenue_low": ${money(top.revenue_low)},\n    "revenue_high": ${money(top.revenue_high)},\n    "estimable": "yes",\n    "method": "rate-band-model-v1" } ] }`
        : "{ \"count\": 0, \"streets\": [] }",
    },
    {
      method: "GET",
      path: "/api/v1/curb/concentration",
      desc: "Top-10 and top-50 shares, Gini, Lorenz points, winter vs summer",
      response: `{
  "top10_winter_share": 0.0,
  "top50_winter_share": 0.0,
  "gini_winter": 0.0,
  "rank_table": [ … ],
  "lorenz_winter": [ … ]
}`,
    },
    {
      method: "GET",
      path: "/api/v1/curb/wards?ward=10",
      desc: "Winter and summer ticket counts for one ward",
      response: `{
  "ward": "10",
  "name": "Spadina-Fort York",
  "winter_tickets": 0,
  "summer_tickets": 0,
  "winter_share_city_pct": 0.0
}`,
    },
  ];

  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-winter-street-parking",
            displayName: "Toronto Winter Street Parking",
            exampleEn: "Tell me the winter revenue at risk for the top street and how concentrated winter tickets are",
            exampleFr: "Dis-moi le revenu hivernal à risque pour la première rue et à quel point les contraventions d'hiver sont concentrées",
          }}
        />
        <p className="mt-4 font-mono text-[12px] text-white/40">Data check: top street fetched live from /api/v1/curb/summary ({top ? `${top.street}, ${fmt(top.winter_tickets)} winter tickets` : "loading"}).</p>
      </div>
    </section>
  );
}
