import { NextResponse } from "next/server";
import { prospectGrant, prospectingConfigured } from "@/lib/prospecting";

// POST /api/prospect  { input: "<url or search query>" }
// Returns structured grant fields (not saved) to pre-fill the add-grant form.
export async function POST(request: Request) {
  if (!prospectingConfigured()) {
    return NextResponse.json(
      {
        error:
          "Web prospecting is not configured. Set TAVILY_API_KEY and ANTHROPIC_API_KEY in .env.local.",
      },
      { status: 503 },
    );
  }

  const { input } = await request.json().catch(() => ({ input: "" }));

  try {
    const result = await prospectGrant(String(input || ""));
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Prospecting failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
