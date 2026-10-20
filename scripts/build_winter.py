#!/usr/bin/env python3
"""Build toronto-winter-street-parking derived datasets.

Question: where does Toronto's winter curb activity concentrate, street by
street, and what paid-parking revenue is at risk on those streets when snow
blocks the curb?

Inputs (read-only, from the sibling reference project):
  <source>/raw/parking-tickets-20*/Parking_Tags_Data_*.csv
      City of Toronto open data "Parking Tickets", calendar years 2023-2025
      (6,454,695 tickets). Monthly files for 2023 and 2024, one yearly file
      for 2025.
  <source>/raw/address-points-4326.csv
      City Address Points (Municipal). Used only to attach a ward to tickets
      that carry a house number, for the ward-level winter map.
  <geo-source>  Toronto ward boundaries (25 wards) GeoJSON, simplified here
      for the SVG choropleth.

Seasons (calendar months, all three years pooled):
  winter = December, January, February, March   (364 days in the slice)
  summer = June, July, August, September        (366 days in the slice)

Street extraction: the ticket field location2 is either "642 KING ST W"
(house number plus street) or "LOWTHER AVE" (street only, used at
intersections). The street is location2 with any leading house number (and
an optional single unit letter) removed, then normalized with the same
street-type table the reference project uses (STREET -> ST, AVENUE -> AVE,
and so on). Unlike the reference project, street counts here include
street-only tickets: a ticket written at an intersection still records curb
activity on that street. Tickets whose location2 is empty are excluded and
counted.

Revenue-at-risk model (per street, per winter season, in dollars per year).
Every input is listed here and in the README. Dollar figures are estimates
built from these stated assumptions, not measurements.

  Fact inputs (Toronto Parking Authority 2026 Operating Budget report):
    on-street revenue $67.7M, off-street revenue $97.4M, total forecast
    revenue $177.3M on 32.4M transactions, 21,000 on-street spaces.
    Blended revenue per transaction = 177.3M / 32.4M = $5.47.
    Implied on-street transactions per year = 67.7M / 5.47 = about 12.37M.
    One lost on-street space forgoes 67.7M / 21,000 = about $3,224 per year.
  Measured from the ticket data in this script:
    Meter tickets are infraction codes 207, 312, 313, 314 (parking machine
    fee not paid, machine not used, fail to activate, not within period).
    Sessions per meter ticket = on-street transactions per year divided by
    meter tickets per year in the slice. The script computes this from the
    data (it is about 33) and stores it in summary.json.
  Stated assumptions (judgment calls, chosen wide on purpose):
    A paid metered session lasts 1.0 to 2.0 hours (Toronto's posted maximum
    stay at most meters is 3 hours).
    Snow leaves 5% to 15% of winter meter-hours unusable on an average
    street over a full winter. Anchor: in February 2025 a single storm
    closed 47% of on-street inventory for snow removal and cost 371,000
    transactions (TPA 2026 budget report). A full-winter average is far
    below a storm peak, hence 5% to 15%.
    The hourly rate is the Toronto Parking Authority band, $1.50 to $6.75.
  Formula, for a street with W3 winter meter tickets over the 3 winters:
    annual winter meter tickets  A = W3 / 3
    paid sessions exposed        S = A * sessions-per-meter-ticket
    low  = S * 1.0 h * 5%  snow loss * $1.50/h
    high = S * 2.0 h * 15% snow loss * $6.75/h
  Estimability rule: a street needs at least 100 winter meter tickets over
  the 3 winters for the conversion to be more than noise. Streets below
  that threshold get revenue_at_risk fields of null and estimable = no.
  Their activity share is still reported.

Outputs (in this project's data/ and public/data/):
  street_season.csv   one row per street: winter and summer tickets, winter
                      meter tickets, city shares, revenue range or flag
  ward_season.csv     one row per ward (address-matched tickets only)
  concentration.json  top-10 and top-50 shares, winter and summer, Gini
                      coefficients, Lorenz curve points, rank table
  summary.json        slice definition, totals, model constants, top street
  app_data.json       compact bundle consumed by the Next.js app
  public/geo/wards25_simple.geojson   simplified ward boundaries

Usage:
  python3 scripts/build_winter.py \
      --source ~/workspace/toronto-parking-tickets-geocoded/data \
      --geo ~/workspace/toronto-geo-concordances/data/raw/wards25.geojson
"""

import argparse
import csv
import glob
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data")
PUBLIC_DATA = os.path.join(BASE, "public", "data")
PUBLIC_GEO = os.path.join(BASE, "public", "geo")

WINTER_MONTHS = {12, 1, 2, 3}
SUMMER_MONTHS = {6, 7, 8, 9}
WINTER_DAYS = 364  # Dec-Mar days in calendar 2023-2025 (121 + 122 + 121)
SUMMER_DAYS = 366  # Jun-Sep days in calendar 2023-2025 (122 * 3)
METER_CODES = {"207", "312", "313", "314"}
ESTIMABLE_MIN_WINTER_METER = 100

# Toronto Parking Authority 2026 Operating Budget report (facts)
TPA_ONSTREET_REVENUE = 67_700_000
TPA_TOTAL_REVENUE = 177_300_000
TPA_TOTAL_TRANSACTIONS = 32_400_000
TPA_ONSTREET_SPACES = 21_000
RATE_LOW, RATE_HIGH = 1.50, 6.75
HOURS_LOW, HOURS_HIGH = 1.0, 2.0
SNOW_LOW, SNOW_HIGH = 0.05, 0.15

TYPE_MAP = {
    "STREET": "ST", "AVENUE": "AVE", "BOULEVARD": "BLVD", "DRIVE": "DR",
    "ROAD": "RD", "LANE": "LN", "TRAIL": "TRL", "CRESCENT": "CRES",
    "PLACE": "PL", "COURT": "CT", "TERRACE": "TERR", "PARKWAY": "PKWY",
    "GROVE": "GRV", "SQUARE": "SQ", "CIRCLE": "CIR", "GATE": "GATE",
    "MEWS": "MEWS", "WAY": "WAY", "HILL": "HILL", "PARK": "PK",
    "GARDENS": "GDNS", "QUAY": "QUAY", "ROW": "ROW",
}

ADDR_RE = re.compile(r"^(\d+)\s*(?:[A-Z]\s+)?(.+)$")
RANGE_RE = re.compile(r"^\d+-\d+\s+(.+)$")
WS_RE = re.compile(r"\s+")


def norm_street(s):
    s = WS_RE.sub(" ", s.upper().strip().rstrip("."))
    return " ".join(TYPE_MAP.get(p, p) for p in s.split(" "))


def extract_street(loc2):
    """Street name from a location2 value, or None if unusable."""
    s = WS_RE.sub(" ", (loc2 or "").upper().strip().rstrip("."))
    if not s:
        return None
    m = RANGE_RE.match(s)
    if m:
        s = m.group(1)
    else:
        m = ADDR_RE.match(s)
        if m:
            s = m.group(2)
    s = norm_street(s.lstrip("- ").strip())
    if len(s) < 3 or not any(c.isalpha() for c in s):
        return None
    return s


def split_address(loc2):
    """(house number, normalized street) or (None, None). Same rule as the
    reference project, used only for the ward join."""
    s = WS_RE.sub(" ", (loc2 or "").upper().strip().rstrip("."))
    m = ADDR_RE.match(s)
    if not m:
        return None, None
    return m.group(1), norm_street(m.group(2))


def read_ticket_file(fp, encoding):
    """Process one ticket CSV. Returns per-file counters so a file that
    fails UTF-8 decoding can be retried in cp1252 without double counting.
    Columns are positional: the schema is identical in every file
    (0 tag, 1 date, 2 infraction code, 7 location2)."""
    out = {
        "rows": 0, "bad_date": 0, "no_street": 0,
        "street_winter": Counter(), "street_summer": Counter(),
        "street_meter_winter": Counter(), "street_meter_all": Counter(),
        "ward_winter": Counter(), "ward_summer": Counter(),
        "meter_total": 0,
    }
    with open(fp, newline="", encoding=encoding) as f:
        reader = csv.reader((ln for ln in f if ln.strip()))
        header = next(reader, None)
        if header is None or "tag" not in (header[0] or "").lower():
            raise ValueError(f"unexpected header in {fp}: {header}")
        for row in reader:
            if len(row) < 8:
                out["rows"] += 1
                out["bad_date"] += 1
                continue
            out["rows"] += 1
            date = (row[1] or "").strip()
            if len(date) != 8 or not date.isdigit():
                out["bad_date"] += 1
                continue
            month = int(date[4:6])
            code = (row[2] or "").strip()
            loc2 = row[7]
            street = extract_street(loc2)
            if street is None:
                out["no_street"] += 1
            is_meter = code in METER_CODES
            if is_meter:
                out["meter_total"] += 1
            if month in WINTER_MONTHS:
                season = "winter"
            elif month in SUMMER_MONTHS:
                season = "summer"
            else:
                season = None
            if season and street:
                out[f"street_{season}"][street] += 1
                if season == "winter" and is_meter:
                    out["street_meter_winter"][street] += 1
            if is_meter and street:
                out["street_meter_all"][street] += 1
            if season:
                # ward join needs the address-point map, filled in by caller
                num, sname = split_address(loc2)
                if num is not None:
                    ward = ADDRESS_WARD.get((num, sname))
                    if ward:
                        out[f"ward_{season}"][ward] += 1
    return out


ADDRESS_WARD = {}


def load_address_wards(source):
    """(house number, street) -> zero-padded ward, from Address Points.
    Only the number, street, and ward columns are read."""
    path = os.path.join(source, "raw", "address-points-4326.csv")
    print("loading address points for ward join...", flush=True)
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        idx = {name: i for i, name in enumerate(reader.fieldnames or [])}
        # DictReader is simplest here; the file has one row per address.
        for row in reader:
            num = (row.get("ADDRESS_NUMBER") or "").strip()
            if not num:
                continue
            street = norm_street(row.get("LINEAR_NAME_FULL") or "")
            ward = (row.get("WARD") or "").strip()
            if ward.isdigit():
                ward = f"{int(ward):02d}"
            if street and ward:
                ADDRESS_WARD[(num, street)] = ward
    print(f"address points with ward: {len(ADDRESS_WARD)}", flush=True)


def gini(values):
    """Gini coefficient of a list of non-negative counts."""
    xs = sorted(v for v in values if v > 0)
    n = len(xs)
    if n == 0:
        return 0.0
    total = sum(xs)
    if total == 0:
        return 0.0
    cum = 0
    weighted = 0.0
    for i, v in enumerate(xs, start=1):
        cum += v
        weighted += i * v
    return round((2 * weighted) / (n * total) - (n + 1) / n, 4)


def lorenz_points(counter, total, steps=20):
    """Cumulative ticket share held by the top fraction of streets.
    Returns points ordered from the largest street down, plus the diagonal
    endpoints, as {top_fraction_of_streets, share_of_tickets}."""
    ranked = sorted(counter.values(), reverse=True)
    n = len(ranked)
    pts = [{"top_fraction_of_streets": 0.0, "share_of_tickets": 0.0}]
    cum = 0
    targets = {max(1, round(n * i / steps)) for i in range(1, steps + 1)}
    for i, v in enumerate(ranked, start=1):
        cum += v
        if i in targets or i == n:
            pts.append({
                "top_fraction_of_streets": round(i / n, 4),
                "share_of_tickets": round(cum / total, 4) if total else 0.0,
            })
    return pts


def simplify_ring(ring, tol):
    """Douglas-Peucker on one ring (list of [lon, lat]); keeps endpoints."""
    if len(ring) <= 2:
        return ring

    def dist(pt, a, b):
        ax, ay = a
        bx, by = b
        px, py = pt
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return math.hypot(px - ax, py - ay)
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

    keep = [False] * len(ring)
    keep[0] = keep[-1] = True
    stack = [(0, len(ring) - 1)]
    while stack:
        lo, hi = stack.pop()
        dmax, imax = 0.0, -1
        for i in range(lo + 1, hi):
            d = dist(ring[i], ring[lo], ring[hi])
            if d > dmax:
                dmax, imax = d, i
        if dmax > tol and imax > 0:
            keep[imax] = True
            stack.append((lo, imax))
            stack.append((imax, hi))
    return [p for p, k in zip(ring, keep) if k]


def write_wards_geojson(geo_path):
    feats_in = json.load(open(geo_path))["features"]
    out = []
    for ft in feats_in:
        p = ft["properties"]
        code = str(p["AREA_SHORT_CODE"]).zfill(2)
        geom = ft["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        new_polys = []
        for poly in polys:
            new_poly = []
            for ring in poly:
                simp = simplify_ring(ring, 0.0004)
                new_poly.append([[round(x, 5), round(y, 5)] for x, y in simp])
            new_polys.append(new_poly)
        new_geom = (
            {"type": "Polygon", "coordinates": new_polys[0]}
            if geom["type"] == "Polygon"
            else {"type": "MultiPolygon", "coordinates": new_polys}
        )
        out.append({"type": "Feature", "properties": {"code": code, "name": p["AREA_NAME"]}, "geometry": new_geom})
    os.makedirs(PUBLIC_GEO, exist_ok=True)
    with open(os.path.join(PUBLIC_GEO, "wards25_simple.geojson"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": out}, f)
    print(f"wards geojson: {len(out)} features", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.path.expanduser(
        "~/workspace/toronto-parking-tickets-geocoded/data"))
    ap.add_argument("--geo", default=os.path.expanduser(
        "~/workspace/toronto-geo-concordances/data/raw/wards25.geojson"))
    args = ap.parse_args()
    source = args.source

    load_address_wards(source)

    totals = {
        "rows": 0, "bad_date": 0, "no_street": 0, "meter_total": 0,
        "street_winter": Counter(), "street_summer": Counter(),
        "street_meter_winter": Counter(), "street_meter_all": Counter(),
        "ward_winter": Counter(), "ward_summer": Counter(),
    }
    files = sorted(glob.glob(os.path.join(source, "raw", "parking-tickets-20*", "Parking_Tags_Data_*.csv")))
    print(f"ticket files: {len(files)}", flush=True)
    for fp in files:
        try:
            part = read_ticket_file(fp, "utf-8-sig")
        except UnicodeDecodeError:
            print(f"  retrying {os.path.basename(fp)} as cp1252", flush=True)
            part = read_ticket_file(fp, "cp1252")
        for k in ("rows", "bad_date", "no_street", "meter_total"):
            totals[k] += part[k]
        for k in ("street_winter", "street_summer", "street_meter_winter",
                  "street_meter_all", "ward_winter", "ward_summer"):
            totals[k].update(part[k])
        print(f"  {os.path.basename(fp)}: rows={totals['rows']}", flush=True)

    sw, ss = totals["street_winter"], totals["street_summer"]
    smw = totals["street_meter_winter"]
    total_winter = sum(sw.values())
    total_summer = sum(ss.values())
    streets = sorted(set(sw) | set(ss))
    print(f"total rows={totals['rows']} winter={total_winter} summer={total_summer} "
          f"streets={len(streets)} meter_total={totals['meter_total']}", flush=True)

    # ---- model constants measured from the data ----
    blended = TPA_TOTAL_REVENUE / TPA_TOTAL_TRANSACTIONS
    onstreet_txn_per_year = TPA_ONSTREET_REVENUE / blended
    meter_per_year = totals["meter_total"] / 3
    sessions_per_meter_ticket = onstreet_txn_per_year / meter_per_year
    spot_value = TPA_ONSTREET_REVENUE / TPA_ONSTREET_SPACES
    print(f"blended=${blended:.4f} onstreet txn/yr={onstreet_txn_per_year:,.0f} "
          f"meter/yr={meter_per_year:,.0f} sessions per meter ticket={sessions_per_meter_ticket:.2f} "
          f"spot value=${spot_value:,.0f}", flush=True)

    def revenue_range(winter_meter_3yr):
        if winter_meter_3yr < ESTIMABLE_MIN_WINTER_METER:
            return None, None, "no"
        annual = winter_meter_3yr / 3
        sessions = annual * sessions_per_meter_ticket
        low = sessions * HOURS_LOW * SNOW_LOW * RATE_LOW
        high = sessions * HOURS_HIGH * SNOW_HIGH * RATE_HIGH
        return round(low), round(high), "yes"

    # ---- street table, ranked by winter tickets ----
    ranked_winter = sorted(streets, key=lambda s: sw.get(s, 0), reverse=True)
    rows_out = []
    for rank, s in enumerate(ranked_winter, start=1):
        w, su, mw = sw.get(s, 0), ss.get(s, 0), smw.get(s, 0)
        low, high, est = revenue_range(mw)
        rows_out.append({
            "street": s,
            "winter_rank": rank,
            "winter_tickets": w,
            "summer_tickets": su,
            "winter_meter_tickets": mw,
            "winter_share_city_pct": round(100 * w / total_winter, 4) if total_winter else 0,
            "winter_share_of_street_pct": round(100 * w / (w + su), 2) if (w + su) else 0,
            "revenue_low": low,
            "revenue_high": high,
            "estimable": est,
            "method": "rate-band-model-v1" if est == "yes" else "not-estimable-low-meter-sample",
        })

    # ---- concentration ----
    def share_of_top(counter, total, n):
        top = sum(v for _, v in counter.most_common(n))
        return round(top / total, 4) if total else 0.0

    rank_table = []
    for n in (1, 5, 10, 25, 50, 100, 200, 500, 1000):
        rank_table.append({
            "top_n_streets": n,
            "winter_share": share_of_top(sw, total_winter, n),
            "summer_share": share_of_top(ss, total_summer, n),
        })
    concentration = {
        "total_winter_tickets": total_winter,
        "total_summer_tickets": total_summer,
        "winter_days": WINTER_DAYS,
        "summer_days": SUMMER_DAYS,
        "distinct_streets_winter": len([s for s in streets if sw.get(s, 0) > 0]),
        "distinct_streets_summer": len([s for s in streets if ss.get(s, 0) > 0]),
        "top10_winter_share": share_of_top(sw, total_winter, 10),
        "top50_winter_share": share_of_top(sw, total_winter, 50),
        "top10_summer_share": share_of_top(ss, total_summer, 10),
        "top50_summer_share": share_of_top(ss, total_summer, 50),
        "gini_winter": gini(list(sw.values())),
        "gini_summer": gini(list(ss.values())),
        "rank_table": rank_table,
        "lorenz_winter": lorenz_points(sw, total_winter),
        "lorenz_summer": lorenz_points(ss, total_summer),
    }

    # ---- wards ----
    ward_names = {}
    with open(os.path.join(source, "tickets_by_ward.csv"), newline="") as f:
        for row in csv.DictReader(f):
            ward_names[row["ward"].zfill(2)] = row["ward_name"]
    ward_total_winter = sum(totals["ward_winter"].values())
    ward_total_summer = sum(totals["ward_summer"].values())
    wards_out = []
    for ward in sorted(set(totals["ward_winter"]) | set(totals["ward_summer"])):
        w = totals["ward_winter"].get(ward, 0)
        su = totals["ward_summer"].get(ward, 0)
        wards_out.append({
            "ward": ward,
            "name": ward_names.get(ward, ""),
            "winter_tickets": w,
            "summer_tickets": su,
            "winter_share_city_pct": round(100 * w / ward_total_winter, 2) if ward_total_winter else 0,
            "winter_share_of_ward_pct": round(100 * w / (w + su), 2) if (w + su) else 0,
        })
    wards_out.sort(key=lambda r: r["winter_tickets"], reverse=True)

    top = rows_out[0] if rows_out else None
    summary = {
        "slice": "City of Toronto open data 'Parking Tickets', calendar years 2023-2025, retrieved 2026-10-08",
        "total_tickets_in_slice": totals["rows"] - 0,
        "rows_with_bad_date": totals["bad_date"],
        "rows_without_street": totals["no_street"],
        "tickets_with_street": totals["rows"] - totals["bad_date"] - totals["no_street"],
        "total_winter_tickets": total_winter,
        "total_summer_tickets": total_summer,
        "winter_days": WINTER_DAYS,
        "summer_days": SUMMER_DAYS,
        "distinct_streets": len(streets),
        "meter_tickets_all_years": totals["meter_total"],
        "model": {
            "blended_revenue_per_transaction": round(blended, 2),
            "onstreet_transactions_per_year": round(onstreet_txn_per_year),
            "meter_tickets_per_year": round(meter_per_year),
            "sessions_per_meter_ticket": round(sessions_per_meter_ticket, 1),
            "rate_band_low": RATE_LOW,
            "rate_band_high": RATE_HIGH,
            "paid_hours_low": HOURS_LOW,
            "paid_hours_high": HOURS_HIGH,
            "snow_loss_low": SNOW_LOW,
            "snow_loss_high": SNOW_HIGH,
            "estimable_min_winter_meter_tickets": ESTIMABLE_MIN_WINTER_METER,
            "value_of_one_lost_onstreet_space_per_year": round(spot_value),
        },
        "top_street": {
            "street": top["street"],
            "winter_tickets": top["winter_tickets"],
            "summer_tickets": top["summer_tickets"],
            "winter_share_city_pct": top["winter_share_city_pct"],
            "revenue_low": top["revenue_low"],
            "revenue_high": top["revenue_high"],
        } if top else None,
        "concentration": {k: concentration[k] for k in (
            "top10_winter_share", "top50_winter_share", "top10_summer_share",
            "top50_summer_share", "gini_winter", "gini_summer")},
        "ward_matched_winter_tickets": ward_total_winter,
        "ward_matched_summer_tickets": ward_total_summer,
    }

    # ---- write outputs ----
    os.makedirs(DATA, exist_ok=True)
    os.makedirs(PUBLIC_DATA, exist_ok=True)
    street_cols = ["street", "winter_rank", "winter_tickets", "summer_tickets",
                   "winter_meter_tickets", "winter_share_city_pct",
                   "winter_share_of_street_pct", "revenue_at_risk_low_per_year",
                   "revenue_at_risk_high_per_year", "estimable", "method"]
    for dest in (os.path.join(DATA, "street_season.csv"),
                 os.path.join(PUBLIC_DATA, "street_season.csv")):
        with open(dest, "w", newline="") as f:
            wtr = csv.writer(f)
            wtr.writerow(street_cols)
            for r in rows_out:
                wtr.writerow([r["street"], r["winter_rank"], r["winter_tickets"],
                              r["summer_tickets"], r["winter_meter_tickets"],
                              r["winter_share_city_pct"], r["winter_share_of_street_pct"],
                              r["revenue_low"] if r["revenue_low"] is not None else "",
                              r["revenue_high"] if r["revenue_high"] is not None else "",
                              r["estimable"], r["method"]])
    for dest in (os.path.join(DATA, "ward_season.csv"),
                 os.path.join(PUBLIC_DATA, "ward_season.csv")):
        with open(dest, "w", newline="") as f:
            wtr = csv.writer(f)
            wtr.writerow(["ward", "ward_name", "winter_tickets", "summer_tickets",
                          "winter_share_city_pct", "winter_share_of_ward_pct"])
            for r in wards_out:
                wtr.writerow([r["ward"], r["name"], r["winter_tickets"], r["summer_tickets"],
                              r["winter_share_city_pct"], r["winter_share_of_ward_pct"]])
    with open(os.path.join(DATA, "concentration.json"), "w") as f:
        json.dump(concentration, f, indent=2)
    with open(os.path.join(PUBLIC_DATA, "concentration.json"), "w") as f:
        json.dump(concentration, f, indent=2)
    with open(os.path.join(DATA, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    app_data = {"summary": summary, "concentration": concentration,
                "streets": rows_out[:300], "wards": wards_out}
    with open(os.path.join(DATA, "app_data.json"), "w") as f:
        json.dump(app_data, f)

    write_wards_geojson(args.geo)
    print(json.dumps(summary, indent=2), flush=True)
    print("wrote outputs", flush=True)


if __name__ == "__main__":
    sys.exit(main())
