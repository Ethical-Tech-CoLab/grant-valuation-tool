import { NextResponse } from "next/server";
import { getGrant, updateGrant } from "@/lib/store";
import { generateRecommendations, recommendationsConfigured } from "@/lib/recommendations";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/grants/:id/recommendations — generate a tailored grantseeking
// playbook (strategy, tips, next actions) and persist it.
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  if (!recommendationsConfigured()) {
    return NextResponse.json(
      { error: "AI recommendations are not configured. Set ANTHROPIC_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  const grant = await getGrant(id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const recommendations = await generateRecommendations(grant);
    const updated = await updateGrant(id, { recommendations });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generating recommendations failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
