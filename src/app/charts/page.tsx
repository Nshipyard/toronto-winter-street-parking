import type { Metadata } from "next";
import { Banner, Nav, Footer } from "@/components/chrome";
import Charts from "@/components/Charts";
import type { ChartsData } from "@/components/Charts";
import { getAllStreets, getData } from "@/lib/winter";

export const metadata: Metadata = {
  title: "Charts · Toronto streets by winter parking revenue at risk",
  description:
    "Five charts from the project's street file: the top streets by winter parking tickets, winter and summer cumulative share curves over the top 200 streets, paired winter and summer counts on the top 20 streets, meter revenue at risk per winter, and the share of all tickets on the top 10, 50 and 200 streets.",
};

/**
 * Every number on this page is computed at build time from the project's
 * own data files (data/street_season.csv, read in full by getAllStreets,
 * and the season totals in data/app_data.json). Nothing is hardcoded.
 */
function buildChartsData(): ChartsData {
  const streets = getAllStreets();
  const { total_winter_tickets: totalWinter, total_summer_tickets: totalSummer } = getData().concentration;

  const byWinter = [...streets].sort((a, b) => b.winter_tickets - a.winter_tickets);
  const bySummer = [...streets].sort((a, b) => b.summer_tickets - a.summer_tickets);

  const top10Winter = byWinter.slice(0, 10).map((s) => ({ street: s.street, winter: s.winter_tickets }));

  // Cumulative share of each season's tickets, rank by rank, top 200.
  const curve: ChartsData["curve"] = [];
  let cumW = 0;
  let cumS = 0;
  for (let i = 0; i < 200; i++) {
    cumW += byWinter[i].winter_tickets;
    cumS += bySummer[i].summer_tickets;
    curve.push({ rank: i + 1, winterShare: cumW / totalWinter, summerShare: cumS / totalSummer });
  }

  const top20 = byWinter.slice(0, 20).map((s) => ({ street: s.street, winter: s.winter_tickets, summer: s.summer_tickets }));

  const revenueTop10 = streets
    .filter((s) => s.revenue_high !== null && s.revenue_low !== null)
    .sort((a, b) => (b.revenue_high as number) - (a.revenue_high as number))
    .slice(0, 10)
    .map((s) => ({ street: s.street, low: s.revenue_low as number, high: s.revenue_high as number }));

  const shares = [10, 50, 200].map((n) => ({
    n,
    winter: byWinter.slice(0, n).reduce((acc, s) => acc + s.winter_tickets, 0) / totalWinter,
    summer: bySummer.slice(0, n).reduce((acc, s) => acc + s.summer_tickets, 0) / totalSummer,
  }));

  return { top10Winter, curve, top20, revenueTop10, shares };
}

export default function ChartsPage() {
  const data = buildChartsData();
  return (
    <>
      <Banner />
      <Nav base="/" />
      <main>
        <Charts data={data} />
      </main>
      <Footer />
    </>
  );
}
