import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface ModelConstants {
  blended_revenue_per_transaction: number;
  onstreet_transactions_per_year: number;
  meter_tickets_per_year: number;
  sessions_per_meter_ticket: number;
  rate_band_low: number;
  rate_band_high: number;
  paid_hours_low: number;
  paid_hours_high: number;
  snow_loss_low: number;
  snow_loss_high: number;
  estimable_min_winter_meter_tickets: number;
  value_of_one_lost_onstreet_space_per_year: number;
}

export interface Summary {
  slice: string;
  total_tickets_in_slice: number;
  rows_with_bad_date: number;
  rows_without_street: number;
  tickets_with_street: number;
  total_winter_tickets: number;
  total_summer_tickets: number;
  winter_days: number;
  summer_days: number;
  distinct_streets: number;
  meter_tickets_all_years: number;
  model: ModelConstants;
  top_street: {
    street: string;
    winter_tickets: number;
    summer_tickets: number;
    winter_share_city_pct: number;
    revenue_low: number | null;
    revenue_high: number | null;
  } | null;
  concentration: {
    top10_winter_share: number;
    top50_winter_share: number;
    top10_summer_share: number;
    top50_summer_share: number;
    gini_winter: number;
    gini_summer: number;
  };
  ward_matched_winter_tickets: number;
  ward_matched_summer_tickets: number;
}

export interface StreetStat {
  street: string;
  winter_rank: number;
  winter_tickets: number;
  summer_tickets: number;
  winter_meter_tickets: number;
  winter_share_city_pct: number;
  winter_share_of_street_pct: number;
  revenue_low: number | null;
  revenue_high: number | null;
  estimable: string;
  method: string;
}

export interface WardStat {
  ward: string;
  name: string;
  winter_tickets: number;
  summer_tickets: number;
  winter_share_city_pct: number;
  winter_share_of_ward_pct: number;
}

export interface LorenzPoint {
  top_fraction_of_streets: number;
  share_of_tickets: number;
}

export interface Concentration {
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

export interface AppData {
  summary: Summary;
  concentration: Concentration;
  streets: StreetStat[];
  wards: WardStat[];
}

let cache: AppData | null = null;

export function getData(): AppData {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(path.join(DATA, "app_data.json"), "utf-8")) as AppData;
  }
  return cache;
}

let allStreets: StreetStat[] | null = null;

/** Parse one CSV line, honouring double-quoted fields (a few street names
 * in the source file are quoted and contain commas, so a plain split
 * misaligns their columns). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Every street in street_season.csv (the app bundle carries only the top
 * 300; search and the API serve the full list). Rows are ranked by winter
 * tickets in the file. */
export function getAllStreets(): StreetStat[] {
  if (allStreets) return allStreets;
  const text = fs.readFileSync(path.join(DATA, "street_season.csv"), "utf-8");
  const lines = text.trim().split(/\r?\n/);
  const out: StreetStat[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]);
    if (c.length < 11) continue;
    out.push({
      street: c[0],
      winter_rank: Number(c[1]),
      winter_tickets: Number(c[2]),
      summer_tickets: Number(c[3]),
      winter_meter_tickets: Number(c[4]),
      winter_share_city_pct: Number(c[5]),
      winter_share_of_street_pct: Number(c[6]),
      revenue_low: c[7] === "" ? null : Number(c[7]),
      revenue_high: c[8] === "" ? null : Number(c[8]),
      estimable: c[9],
      method: c[10],
    });
  }
  allStreets = out;
  return out;
}

export function fmt(n: number): string {
  return n.toLocaleString("en-CA");
}

export function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-CA");
}

export function fmtPct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}
