// AI-assisted grant valuation.
//
// Sends a grant + the ETC mission profile to Claude and gets back a structured
// valuation: a weighted fit score, win probability, per-criterion breakdown,
// red flags, and a recommendation. Runs server-side only (uses ANTHROPIC_API_KEY).

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ETC_MISSION } from "./mission";
import type { Grant, ScoringResult } from "./types";

const MODEL = process.env.GRANT_SCORING_MODEL || "claude-opus-4-8";

const CriterionSchema = z.object({
  key: z.string().describe("stable key, e.g. missionAlignment"),
  label: z.string().describe("human-readable criterion name"),
  score: z.number().describe("0-100, how well this grant scores on this criterion"),
  weight: z.number().describe("relative weight 0.0-1.0; all weights should sum to ~1.0"),
  rationale: z.string().describe("one or two sentences justifying the score"),
});

const ScoringSchema = z.object({
  overallScore: z
    .number()
    .describe("0-100 weighted fit score (weighted average of criteria scores)"),
  recommendation: z
    .enum(["pursue", "consider", "pass"])
    .describe("pursue = strong fit worth applying; consider = borderline; pass = not worth it"),
  winProbability: z
    .number()
    .describe("0.0-1.0 estimated probability ETC would win this grant if it applied"),
  criteria: z.array(CriterionSchema).describe("one entry per evaluation criterion"),
  redFlags: z
    .array(z.string())
    .describe("specific concerns, mismatches, or disqualifiers; empty if none"),
  summary: z
    .string()
    .describe("2-4 sentence plain-language verdict a program director can act on"),
});

function buildPrompt(grant: Grant): string {
  const m = ETC_MISSION;
  return [
    `You are a grants strategist for ${m.organization}. Evaluate whether ETC should pursue the grant opportunity below, and value it.`,
    "",
    "## About ETC",
    m.mission,
    "",
    `Focus areas: ${m.focusAreas.join("; ")}`,
    `Strengths: ${m.strengths.join("; ")}`,
    `Constraints: ${m.constraints.join("; ")}`,
    "",
    "## Evaluation criteria (score each 0-100 and assign a weight)",
    ...m.criteria.map(
      (c) => `- ${c.label} (${c.key}, target weight ~${c.targetWeight}): ${c.guidance}`,
    ),
    "",
    "## Grant opportunity",
    `Name: ${grant.name}`,
    `Funder: ${grant.funder || "(unknown)"}`,
    `Amount: ${grant.amount ? `$${grant.amount.toLocaleString()}` : "(unspecified)"}`,
    `Deadline: ${grant.deadline || "(none given)"}`,
    grant.url ? `URL: ${grant.url}` : "",
    grant.focusAreas.length ? `Tagged focus areas: ${grant.focusAreas.join(", ")}` : "",
    "",
    "Description / notes:",
    grant.description || "(no description provided — evaluate conservatively and flag the missing info)",
    "",
    "## Instructions",
    "- overallScore must be the weight-weighted average of the criteria scores.",
    "- Be honest and specific; ETC has limited grant-writing bandwidth, so effort cost matters.",
    "- winProbability should reflect ETC's realistic competitiveness, not just fit.",
    "- List concrete red flags (eligibility mismatch, wrong funding type, unrealistic scope). Empty array if none.",
    "- Keep the summary decision-useful.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function scoringConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function scoreGrant(grant: Grant): Promise<ScoringResult> {
  if (!scoringConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI scoring.",
    );
  }

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(ScoringSchema),
    },
    messages: [{ role: "user", content: buildPrompt(grant) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to score this grant.");
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Scoring returned no structured output. Try again.");
  }

  const winProbability = clamp01(parsed.winProbability);

  return {
    overallScore: clampScore(parsed.overallScore),
    recommendation: parsed.recommendation,
    winProbability,
    expectedValue: Math.round((grant.amount || 0) * winProbability),
    criteria: parsed.criteria.map((c) => ({
      key: c.key,
      label: c.label,
      score: clampScore(c.score),
      weight: c.weight,
      rationale: c.rationale,
    })),
    redFlags: parsed.redFlags,
    summary: parsed.summary,
    model: response.model || MODEL,
    scoredAt: new Date().toISOString(),
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
