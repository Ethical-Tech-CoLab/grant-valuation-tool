import { NextResponse } from "next/server";
import { discoverGrants, discoveryConfigured } from "@/lib/discovery";
import { getGrant, listGrants } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/grants/:id/related — find other similar challenges / coalitions to
// this grant, using the Tavily discovery engine seeded from the grant.
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  if (!discoveryConfigured()) {
    return NextResponse.json(
      { error: "Discovery needs TAVILY_API_KEY and ANTHROPIC_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  const grant = await getGrant(id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Seed the sweep from this grant's identity so it surfaces *similar* programs.
  const theme = [
    grant.name,
    grant.funder,
    ...grant.focusAreas,
    "similar challenge OR fund OR coalition OR collaborative",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    // Dedupe against the whole pipeline, including this grant.
    const known = (await listGrants()).map((g) => ({ name: g.name, url: g.url }));
    const result = await discoverGrants(theme, known);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Related search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
