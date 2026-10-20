import { NextResponse } from "next/server";
import { getData, getAllStreets } from "@/lib/winter";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-winter-street-parking", version: "1.0.0" };

const TOOLS = [
  {
    name: "curb_street_stats",
    description:
      "Winter street parking statistics for a Toronto street: winter and summer ticket counts (December-March vs June-September, 2023-2025), winter meter tickets, share of city winter tickets, and the estimated winter revenue-at-risk range in dollars per year (or an explicit not-estimable flag). Search by name fragment, e.g. 'yonge'. Ticket counts are facts; revenue figures are model estimates.",
    inputSchema: {
      type: "object",
      properties: { q: { type: "string", description: "Street name fragment, e.g. 'yonge'" } },
      required: ["q"],
    },
  },
  {
    name: "curb_ward_stats",
    description:
      "Winter and summer parking ticket counts for one Toronto ward (address-matched tickets only), plus the ward's share of city winter tickets. Pass ward as its number, e.g. '10'.",
    inputSchema: {
      type: "object",
      properties: { ward: { type: "string", description: "Ward number, e.g. '10'" } },
      required: ["ward"],
    },
  },
  {
    name: "curb_concentration",
    description:
      "Concentration analysis: the share of winter and summer tickets carried by the top 10 and top 50 streets, winter vs summer comparison, Gini coefficients, cumulative rank table, and Lorenz curve points.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        const d = getData();
        if (name === "curb_street_stats") {
          const q = String(args.q ?? "").toLowerCase().trim();
          const rows = getAllStreets()
            .filter((x) => x.street.toLowerCase().includes(q))
            .slice(0, 10);
          return ok(id, textResult({ count: rows.length, streets: rows }));
        }
        if (name === "curb_ward_stats") {
          const key = String(args.ward).padStart(2, "0");
          const w = d.wards.find((x) => x.ward === key || x.ward === String(args.ward));
          if (!w) return err(id, -32001, `Unknown ward ${args.ward}`);
          return ok(id, textResult(w));
        }
        if (name === "curb_concentration") {
          return ok(id, textResult(d.concentration));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
