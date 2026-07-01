// AI-assisted proposal drafting.
//
// Given a grant + the ETC mission profile, asks Claude for an initial proposal
// recommendation tailored to how THIS funder judges applications: a project
// title, core thesis, the key aspects to lead with, a suggested outline, how
// ETC maps onto the funder's stated review criteria, differentiators, and the
// gaps to shore up. Runs server-side only (uses ANTHROPIC_API_KEY).

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ETC_MISSION } from "./mission";
import type { Grant, ProposalDraft } from "./types";

const MODEL = process.env.GRANT_SCORING_MODEL || "claude-opus-4-8";

const ProposalSchema = z.object({
  title: z.string().describe("a specific, compelling project/proposal title tailored to this funder"),
  thesis: z
    .string()
    .describe(
      "one paragraph (3-5 sentences) making the core case: what ETC would do, for whom, and why it fits this funder's priorities",
    ),
  keyAspects: z
    .array(
      z.object({
        aspect: z.string().describe("a key aspect ETC should lead with, e.g. 'Community partnership'"),
        why: z.string().describe("why this aspect matters specifically to THIS funder / their criteria"),
      }),
    )
    .describe("3-6 key aspects to emphasize, ranked by importance to winning"),
  sections: z
    .array(
      z.object({
        heading: z.string().describe("a proposal section heading, e.g. 'Statement of need'"),
        guidance: z
          .string()
          .describe("1-3 sentences on what ETC should write in this section, tailored to the grant"),
      }),
    )
    .describe("a suggested proposal outline; use the funder's required structure if the grant states one"),
  alignmentHighlights: z
    .array(z.string())
    .describe(
      "concrete points showing how ETC maps onto the funder's stated review criteria; if no criteria are given, map to the funder's evident priorities",
    ),
  differentiators: z
    .array(z.string())
    .describe("what makes ETC stand out from the likely applicant pool for this grant"),
  risks: z
    .array(z.string())
    .describe("gaps, weaknesses, or eligibility concerns ETC should address before submitting; empty if none"),
});

function buildPrompt(grant: Grant): string {
  const m = ETC_MISSION;
  const lines = [
    `You are a senior grant writer for ${m.organization}. Draft an initial proposal recommendation for the opportunity below — a strategic starting point the team can build a full application from. Tailor everything to how THIS funder thinks and scores.`,
    "",
    "## About ETC",
    m.mission,
    "",
    `Focus areas: ${m.focusAreas.join("; ")}`,
    `Current projects (extend or complement these where it fits): ${m.currentProjects
      .map((p) => `${p.name} — ${p.question}`)
      .join("; ")}`,
    `Strengths: ${m.strengths.join("; ")}`,
    `Constraints: ${m.constraints.join("; ")}`,
    `Breadth: ${m.breadth}`,
    "",
    "## Grant opportunity",
    `Name: ${grant.name}`,
    `Funder: ${grant.funder || "(unknown)"}`,
    `Amount: ${grant.amount ? `$${grant.amount.toLocaleString()}` : "(unspecified)"}`,
    `Deadline: ${grant.deadline || "(none given)"}`,
    grant.focusAreas.length ? `Tagged focus areas: ${grant.focusAreas.join(", ")}` : "",
    "",
    "Description / notes:",
    grant.description || "(no description provided — infer conservatively and note the missing info as a risk)",
  ];

  if (grant.reviewCriteria && grant.reviewCriteria.length) {
    lines.push(
      "",
      "## How the funder scores applications (their review criteria — align to these)",
      ...grant.reviewCriteria.map(
        (c) => `- ${c.criterion}${c.weight ? ` (${c.weight})` : ""}${c.detail ? `: ${c.detail}` : ""}`,
      ),
    );
  }

  if (grant.logistics?.constraints?.length) {
    lines.push(
      "",
      "## Eligibility / constraints (must be satisfied)",
      ...grant.logistics.constraints.map((c) => `- ${c}`),
    );
  }

  if (grant.fundedExamples && grant.fundedExamples.length) {
    lines.push(
      "",
      "## Previously funded projects (model the proposal on what this funder rewards)",
      ...grant.fundedExamples.map(
        (e) => `- ${e.grantee}: ${e.project}${e.takeaway ? ` — takeaway: ${e.takeaway}` : ""}`,
      ),
    );
  }

  if (grant.scoring) {
    lines.push(
      "",
      "## Prior AI valuation (context)",
      `Fit ${grant.scoring.overallScore}/100, recommendation "${grant.scoring.recommendation}", win probability ${Math.round(grant.scoring.winProbability * 100)}%.`,
      grant.scoring.redFlags.length ? `Known red flags: ${grant.scoring.redFlags.join("; ")}` : "",
    );
  }

  lines.push(
    "",
    "## Instructions",
    "- Ground every claim in ETC's real strengths — do not invent programs, staff, or results ETC does not have.",
    "- Lead with what this specific funder rewards; map key aspects directly to their review criteria when given.",
    "- If the grant states a required application structure, mirror it in the sections.",
    "- Be concrete and decision-useful — this is a working draft, not marketing copy.",
    "- Surface honest risks (eligibility gaps, capability gaps, thin evidence) so the team can address them.",
  );

  return lines.filter(Boolean).join("\n");
}

export function proposalConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateProposal(grant: Grant): Promise<ProposalDraft> {
  if (!proposalConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI proposal drafting.",
    );
  }

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 5000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(ProposalSchema),
    },
    messages: [{ role: "user", content: buildPrompt(grant) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to draft a proposal for this grant.");
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Proposal drafting returned no structured output. Try again.");
  }

  return {
    title: parsed.title,
    thesis: parsed.thesis,
    keyAspects: parsed.keyAspects,
    sections: parsed.sections,
    alignmentHighlights: parsed.alignmentHighlights,
    differentiators: parsed.differentiators,
    risks: parsed.risks,
    model: response.model || MODEL,
    generatedAt: new Date().toISOString(),
  };
}
