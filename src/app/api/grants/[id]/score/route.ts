import { NextResponse } from "next/server";
import { getGrant, updateGrant } from "@/lib/store";
import { scoreGrant, scoringConfigured } from "@/lib/scoring";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/grants/:id/score — run AI valuation and persist it on the grant.
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  if (!scoringConfigured()) {
    return NextResponse.json(
      { error: "AI scoring is not configured. Set ANTHROPIC_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  const grant = await getGrant(id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const scoring = await scoreGrant(grant);
    // Move a fresh prospect into the "scoring" stage once it has a valuation.
    const nextStage = grant.stage === "prospect" ? "scoring" : grant.stage;
    const updated = await updateGrant(id, { scoring, stage: nextStage });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
