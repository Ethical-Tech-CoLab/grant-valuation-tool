import { NextResponse } from "next/server";
import { getGrant, updateGrant } from "@/lib/store";
import { generateProposal, proposalConfigured } from "@/lib/proposal";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/grants/:id/proposal — draft an AI proposal recommendation and persist it.
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  if (!proposalConfigured()) {
    return NextResponse.json(
      { error: "AI proposal drafting is not configured. Set ANTHROPIC_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  const grant = await getGrant(id);
  if (!grant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const proposal = await generateProposal(grant);
    // Once there's a draft to work from, advance a scored prospect into drafting.
    const nextStage =
      grant.stage === "prospect" || grant.stage === "scoring" ? "drafting" : grant.stage;
    const updated = await updateGrant(id, { proposal, stage: nextStage });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proposal drafting failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
