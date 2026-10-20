import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Toronto Winter Street Parking API",
    version: "1.0.0",
    description:
      "Toronto parking tickets counted street by street for winter (December to March) and summer (June to September), calendar years 2023-2025. Ticket counts are counted facts. Revenue-at-risk figures are estimates from a documented model; streets with fewer than 100 winter meter tickets over the three winters are marked not estimable. MIT licensed.",
  },
  servers: [{ url: "https://winter-street-parking.canada.nshipyard.com/api/v1" }],
  paths: {
    "/curb/summary": {
      get: {
        summary: "Dataset summary: slice, winter and summer totals, concentration headline shares, model constants",
        responses: { "200": { description: "Summary object" } },
      },
    },
    "/curb/streets": {
      get: {
        summary: "Streets ranked by winter tickets, with revenue-at-risk ranges",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "yonge" },
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 50 },
        ],
        responses: { "200": { description: "Street list" } },
      },
    },
    "/curb/wards": {
      get: {
        summary: "Winter and summer ticket counts per ward (address-matched tickets only)",
        parameters: [{ name: "ward", in: "query", required: false, schema: { type: "string" }, example: "10" }],
        responses: { "200": { description: "Ward list or single ward" }, "404": { description: "Unknown ward" } },
      },
    },
    "/curb/concentration": {
      get: {
        summary: "Concentration analysis: top-10 and top-50 shares, Gini coefficients, rank table, Lorenz points",
        responses: { "200": { description: "Concentration object" } },
      },
    },
    "/curb/search": {
      get: {
        summary: "Combined search across streets and wards",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, example: "yonge" }],
        responses: { "200": { description: "Grouped matches" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
