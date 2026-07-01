// AI-assisted grantseeking recommendations.
//
// Given a grant + the ETC mission profile, asks Claude for a tailored
// grantseeking "playbook": a strategy overview, a set of prioritized,
// funder-specific tips, and concrete next actions. The advice is grounded in
// well-established grantseeking best practices (the kind of guidance nonprofit
// resources like GrantStation publish freely) but is written for THIS funder,
// THIS opportunity, and ETC's actual strengths — not generic boilerplate.
// Runs server-side only (uses ANTHROPIC_API_KEY).

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ETC_MISSION } from "./mission";
import { TIP_CATEGORIES } from "./types";
import type { Grant, RecommendationSet } from "./types";

const MODEL = process.env.GRANT_SCORING_MODEL || "claude-opus-4-8";

// Well-established grantseeking best practices, distilled from the guidance
// nonprofit funding resources publish (funder fit, cultivation, proposal craft,
// budgeting, process discipline, and the classic mistakes). The model uses
// these as a lens to generate advice tailored to the specific grant — it should
// NOT parrot them back generically.
const BEST_PRACTICES = [
  "Fit first: the strongest predictor of winning is genuine alignment between the funder's stated priorities and the applicant's mission. Chasing a poor-fit grant wastes scarce grant-writing bandwidth.",
  "Research the funder deeply: read their guidelines, recently funded projects, average award size, and the language they use. Mirror their priorities and vocabulary.",
  "Cultivate the relationship before applying when possible: a brief inquiry, letter of interest, or conversation with a program officer surfaces fit and makes the eventual proposal expected rather than cold.",
  "Follow the funder's instructions exactly: required structure, word limits, attachments, and eligibility rules. Reviewers screen out non-compliant applications before judging merit.",
  "Lead with a compelling, evidence-backed statement of need — who is affected, how, and why now — before describing the solution.",
  "Make goals and outcomes specific and measurable, and include a credible plan to evaluate and report impact.",
  "Build an honest, realistic budget that maps cleanly to the work and respects the funder's allowable costs and overhead limits.",
  "Address sustainability and what happens after the grant period — funders want to know the work continues.",
  "Tell a coherent story: the need, the approach, the team's fitness to do it, and the difference the money makes should form one thread.",
  "Give yourself runway: strong applications need weeks, not days. Map the deadline backward into internal drafting, review, and sign-off milestones.",
  "Differentiate honestly: name what makes this applicant a better bet than the likely pool, grounded in real track record rather than adjectives.",
  "Avoid the classic mistakes: jargon, unfocused scope, unsupported claims, a budget that doesn't match the narrative, ignoring stated criteria, and boilerplate that isn't tailored to the funder.",
];

const TipSchema = z.object({
  category: z
    .enum(TIP_CATEGORIES)
    .describe(
      "which part of the grantseeking arc this tip addresses: positioning, funder-research, relationship, proposal, budget, process, or pitfall",
    ),
  title: z
    .string()
    .describe("a short, imperative headline for the tip, e.g. 'Lead with the evacuation prototype'"),
  detail: z
    .string()
    .describe("1-3 sentences of advice tailored specifically to THIS grant, funder, and ETC"),
  priority: z
    .enum(["high", "medium", "low"])
    .describe("how much this tip moves the needle for winning THIS grant"),
});

const RecommendationSchema = z.object({
  strategy: z
    .string()
    .describe(
      "2-4 sentences: how ETC should approach this specific opportunity overall — the headline strategic read",
    ),
  tips: z
    .array(TipSchema)
    .describe("5-10 prioritized, funder-tailored tips spanning several categories; most important first"),
  actionItems: z
    .array(z.string())
    .describe("3-6 concrete, do-able next actions ETC should take before the deadline, in order"),
});

function buildPrompt(grant: Grant): string {
  const m = ETC_MISSION;
  const lines = [
    `You are a seasoned grants advisor coaching ${m.organization} on how to win the opportunity below. Produce a tailored grantseeking playbook: a strategic read, prioritized tips, and concrete next actions. Everything must be specific to THIS funder and grant — no generic advice that could apply to any application.`,
    "",
    "## Grantseeking best practices (use these as a lens; do NOT restate them generically)",
    ...BEST_PRACTICES.map((p) => `- ${p}`),
    "",
    "## About ETC",
    m.mission,
    "",
    `Focus areas: ${m.focusAreas.join("; ")}`,
    `Current projects (anchor advice to these where relevant): ${m.currentProjects
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
    grant.description || "(no description provided — note the missing intel as something to research)",
  ];

  if (grant.reviewCriteria && grant.reviewCriteria.length) {
    lines.push(
      "",
      "## How the funder scores applications (align tips to these)",
      ...grant.reviewCriteria.map(
        (c) => `- ${c.criterion}${c.weight ? ` (${c.weight})` : ""}${c.detail ? `: ${c.detail}` : ""}`,
      ),
    );
  }

  if (grant.logistics) {
    const l = grant.logistics;
    const bits: string[] = [];
    if (l.decisionTimeline) bits.push(`Decision timeline: ${l.decisionTimeline}`);
    if (l.grantPeriod) bits.push(`Grant period: ${l.grantPeriod}`);
    if (l.keyDates?.length)
      bits.push(
        `Key dates: ${l.keyDates.map((d) => `${d.label}${d.date ? ` (${d.date})` : ""}`).join(", ")}`,
      );
    if (l.constraints?.length) bits.push(`Constraints: ${l.constraints.join("; ")}`);
    if (bits.length) lines.push("", "## Timeline & constraints", ...bits.map((b) => `- ${b}`));
  }

  if (grant.fundedExamples && grant.fundedExamples.length) {
    lines.push(
      "",
      "## Previously funded projects (mine these for what this funder rewards)",
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
    "- Every tip must reference something concrete about this funder, grant, or ETC — never advice that could be copy-pasted onto another application.",
    "- Prioritize honestly: put the tips that most change the odds of winning first, marked high priority.",
    "- Span multiple categories; don't return seven proposal-writing tips and nothing else.",
    "- If fit is weak or there are red flags, say so plainly in the strategy and include positioning/pitfall tips about whether and how to pursue.",
    "- Action items must be things ETC can actually do before the deadline, ordered sensibly.",
    "- Ground everything in ETC's real strengths and projects; do not invent capabilities, staff, or results.",
  );

  return lines.filter(Boolean).join("\n");
}

export function recommendationsConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateRecommendations(grant: Grant): Promise<RecommendationSet> {
  if (!recommendationsConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI recommendations.",
    );
  }

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 5000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(RecommendationSchema),
    },
    messages: [{ role: "user", content: buildPrompt(grant) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to generate recommendations for this grant.");
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Recommendations returned no structured output. Try again.");
  }

  return {
    strategy: parsed.strategy,
    tips: parsed.tips,
    actionItems: parsed.actionItems,
    model: response.model || MODEL,
    generatedAt: new Date().toISOString(),
  };
}
