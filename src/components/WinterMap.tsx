"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface Feature {
  type: string;
  properties: { code: string; name: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}
interface WardRow {
  ward: string;
  name: string;
  winter_tickets: number;
  summer_tickets: number;
  winter_share_city_pct: number;
  winter_share_of_ward_pct: number;
}

const STOPS = ["#fde8e8", "#f5b5b5", "#e97f7f", "#d80621", "#8f0416"];

function ringPath(ring: number[][], px: (x: number, y: number) => [number, number]) {
  return ring.map((c, i) => `${i === 0 ? "M" : "L"}${px(c[0], c[1]).join(",")}`).join(" ") + " Z";
}
function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

export default function WinterMap() {
  const { t } = useLang();
  const m = t.mapSection;
  const [features, setFeatures] = useState<Feature[]>([]);
  const [wards, setWards] = useState<WardRow[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/geo/wards25_simple.geojson")
      .then((r) => r.json())
      .then((d) => setFeatures(d.features))
      .catch(() => {});
    fetch("/api/v1/curb/wards")
      .then((r) => r.json())
      .then((d) => setWards(d.wards ?? []))
      .catch(() => {});
  }, []);

  const byWard = useMemo(() => {
    const map: Record<string, WardRow> = {};
    for (const w of wards) map[w.ward] = w;
    return map;
  }, [wards]);

  const { paths, names } = useMemo(() => {
    if (!features.length) return { paths: [] as { code: string; d: string }[], names: {} as Record<string, string> };
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const f of features) {
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys as number[][][][])
        for (const ring of poly)
          for (const c of ring) {
            if (c[0] < minX) minX = c[0];
            if (c[0] > maxX) maxX = c[0];
            if (c[1] < minY) minY = c[1];
            if (c[1] > maxY) maxY = c[1];
          }
    }
    const W = 1000, H = 620;
    const s = Math.min(W / (maxX - minX), H / (maxY - minY));
    const ox = (W - (maxX - minX) * s) / 2, oy = (H - (maxY - minY) * s) / 2;
    const px = (x: number, y: number): [number, number] => [ox + (x - minX) * s, oy + (maxY - y) * s];
    const paths: { code: string; d: string }[] = [];
    const names: Record<string, string> = {};
    for (const f of features) {
      const code = f.properties.code;
      names[code] = f.properties.name;
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      const d = (polys as number[][][][]).map((poly) => poly.map((ring) => ringPath(ring, px)).join(" ")).join(" ");
      paths.push({ code, d });
    }
    return { paths, names };
  }, [features]);

  const { max, min } = useMemo(() => {
    const vals = wards.map((w) => w.winter_tickets);
    return { max: Math.max(1, ...vals), min: vals.length ? Math.min(...vals) : 1 };
  }, [wards]);

  function colorFor(code: string) {
    const v = byWard[code]?.winter_tickets ?? 0;
    if (v <= 0) return "#f1f1f1";
    // Log scale normalized to the observed min-max range, so all five stops
    // are used when every ward has a high count (narrow range, no zeros).
    const tt =
      max === min
        ? 1
        : (Math.log10(v + 1) - Math.log10(min + 1)) / (Math.log10(max + 1) - Math.log10(min + 1));
    const idx = Math.min(STOPS.length - 1, Math.max(0, Math.floor(tt * STOPS.length)));
    return STOPS[idx];
  }

  const active = hover ?? selected;
  const activeRow = active ? byWard[active] : undefined;

  return (
    <section id="map" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{m.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{m.title}</h2>
        <p className="mt-5 max-w-[820px] text-[18px] leading-relaxed text-ink/70">{m.body}</p>
        <div className="relative mt-10">
          <svg viewBox="0 0 1000 620" className="w-full rounded-[24px] border border-line bg-paper" role="img" aria-label="Choropleth map of winter parking tickets by ward">
            {paths.map((p) => (
              <path
                key={p.code}
                d={p.d}
                fill={colorFor(p.code)}
                stroke={selected === p.code ? "#0a0f1e" : "#ffffff"}
                strokeWidth={selected === p.code ? 2.5 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHover(p.code)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(selected === p.code ? null : p.code)}
              />
            ))}
          </svg>
          {active && names[active] && (
            <div className="pointer-events-none absolute left-4 top-4 max-w-[300px] rounded-[16px] bg-ink px-4 py-3 text-white shadow-lg">
              <p className="text-[14px] font-semibold">
                {names[active]} <span className="font-mono text-white/60">({active})</span>
              </p>
              {activeRow ? (
                <p className="mt-0.5 font-mono text-[13px] leading-relaxed text-white/75">
                  {fmt(activeRow.winter_tickets)} {m.tickets} · {activeRow.winter_share_city_pct.toFixed(1)}% {m.shareCity} ·{" "}
                  {activeRow.winter_share_of_ward_pct.toFixed(1)}% {m.winterOfWard}
                </p>
              ) : null}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-[13px] text-ink/60">
            <span>{m.fewer}</span>
            <div className="flex overflow-hidden rounded-full">
              {STOPS.map((col) => (
                <span key={col} className="h-3 w-8" style={{ background: col }} />
              ))}
            </div>
            <span>{m.more}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
