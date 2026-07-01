import { NextResponse } from "next/server";
import { discoverGrants, discoveryConfigured } from "@/lib/discovery";
import { listGrants } from "@/lib/store";

// POST /api/discover  { theme?: "<optional focus/theme>" }
// Searches the web for NEW grant opportunities matching ETC, deduped against
// the pipeline. Returns candidates (not saved).
export async function POST(request: Request) {
  if (!discoveryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Grant discovery is not configured. Set TAVILY_API_KEY and ANTHROPIC_API_KEY in .env.local.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const theme = typeof body.theme === "string" ? body.theme : undefined;

  try {
    const known = (await listGrants()).map((g) => ({ name: g.name, url: g.url }));
    const result = await discoverGrants(theme, known);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Discovery failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
