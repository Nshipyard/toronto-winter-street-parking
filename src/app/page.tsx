"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import StreetExplorer from "@/components/StreetExplorer";
import Concentration from "@/components/Concentration";
import WinterMap from "@/components/WinterMap";
import Developers from "@/components/Developers";

interface SummaryWire {
  total_winter_tickets: number;
  distinct_streets: number;
  concentration: {
    top10_winter_share: number;
    top50_winter_share: number;
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

function Hero() {
  const { t } = useLang();
  const [s, setS] = useState<SummaryWire | null>(null);
  useEffect(() => {
    fetch("/api/v1/curb/summary")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);
  const stats = s
    ? [
        { value: fmt(s.total_winter_tickets), label: t.statsLabels[0] },
        { value: fmt(s.distinct_streets), label: t.statsLabels[1] },
        { value: `${(s.concentration.top10_winter_share * 100).toFixed(1)}%`, label: t.statsLabels[2] },
        { value: `${(s.concentration.top50_winter_share * 100).toFixed(1)}%`, label: t.statsLabels[3] },
      ]
    : [];
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-16 pt-16 md:pb-24 md:pt-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.hero.kicker}</p>
        <h1 className="display mt-5 max-w-[880px] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.lead}</p>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#explorer" className="rounded-full bg-canada px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-7 py-3.5 text-[16px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        {stats.length > 0 && (
          <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="bg-paper p-7">
                <p className="display text-[44px] text-canada">{st.value}</p>
                <p className="mt-2 text-[15px] leading-snug text-ink/65">{st.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Anchor() {
  const { t } = useLang();
  return (
    <section id="anchor" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.anchor.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.anchor.title}</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {t.anchor.items.map((it) => (
            <article key={it.value} className="rounded-[24px] bg-white/[0.06] p-7">
              <p className="display text-[34px] leading-tight text-white">{it.value}</p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  const { t } = useLang();
  return (
    <section id="methodology" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.methodology.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.methodology.title}</h2>
        <ul className="mt-8 max-w-[860px] space-y-4">
          {t.methodology.points.map((p, i) => (
            <li key={i} className="flex gap-4 rounded-[20px] border border-line bg-paper-warm p-5">
              <span className="display shrink-0 text-[22px] text-canada">{i + 1}</span>
              <p className="text-[16px] leading-relaxed text-ink/75">{p}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Downloads() {
  const { t } = useLang();
  const files = [
    { name: "street_season.csv", path: "/data/street_season.csv" },
    { name: "ward_season.csv", path: "/data/ward_season.csv" },
    { name: "concentration.json", path: "/data/concentration.json" },
  ];
  return (
    <section id="data" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.downloads.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.downloads.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-paper p-6">
              <code className="font-mono text-[15px] font-medium">{f.name}</code>
              <a href={f.path} download className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink">
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Banner />
      <Nav />
      <main>
        <Hero />
        <Anchor />
        <StreetExplorer />
        <Concentration />
        <WinterMap />
        <Methodology />
        <Developers />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
