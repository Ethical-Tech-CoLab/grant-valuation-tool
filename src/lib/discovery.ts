// Grant discovery: proactively surface NEW funding opportunities that match
// ETC's mission, instead of waiting for someone to paste a URL.
//
// Builds web searches from the ETC profile (plus an optional theme), scrapes
// results with Tavily, and asks Claude to pull out distinct, currently-open
// grant opportunities — deduped against what's already in the pipeline.
//
// Runs server-side only. Needs TAVILY_API_KEY + ANTHROPIC_API_KEY.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ETC_MISSION } from "./mission";
import type { GrantInput } from "./types";

const MODEL = process.env.GRANT_SCORING_MODEL || "claude-opus-4-8";
const MAX_CONTENT_CHARS = 16000;

export function discoveryConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY && process.env.ANTHROPIC_API_KEY);
}

interface SearchHit {
  title: string;
  url: string;
  content: string;
}

async function tavilySearch(query: string): Promise<SearchHit[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        max_results: 6,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: Array<{ title?: string; url?: string; content?: string }> =
      data.results ?? [];
    return results.map((r) => ({
      title: r.title || "",
      url: r.url || "",
      content: (r.content || "").slice(0, 800),
    }));
  } catch {
    return [];
  }
}

// Turn the ETC profile (+ optional user theme) into a spread of search queries.
function buildQueries(theme?: string): string[] {
  const year = new Date().getFullYear();
  const t = theme?.trim();
  if (t) {
    return [
      `${t} grant funding opportunity ${year}`,
      `${t} request for proposals nonprofit OR research`,
      `${t} open call for applications ${year} apply`,
      `${t} foundation grant technology`,
    ];
  }
  // Default sweep, anchored to ETC's real focus areas — each query a different angle.
  return [
    `grants funding technology migration refugees displacement ${year} apply`,
    `funding forced labor OR "human trafficking" supply chain traceability technology grant`,
    `AI disaster response humanitarian technology grant open call ${year}`,
    `human rights technology research grant OR fellowship nonprofit request for proposals`,
    `cultural heritage OR provenance technology grant funding ${year}`,
    `responsible AI public interest technology grant open call ${year}`,
  ];
}

const CandidateSchema = z.object({
  name: z.string().describe("the grant / program / fund name"),
  funder: z.string().describe("the funding organization; empty string if unclear"),
  url: z.string().describe("the best canonical URL for this specific opportunity"),
  amount: z
    .number()
    .describe("typical or max award in USD as a number; 0 if not stated"),
  deadline: z
    .string()
    .describe("application deadline as YYYY-MM-DD, or empty string if none found / rolling"),
  focusAreas: z.array(z.string()).describe("3-6 short topic tags for this grant"),
  summary: z
    .string()
    .describe("1-2 sentences: what it funds and who is eligible"),
  whyFit: z
    .string()
    .describe("1 sentence on why it fits ETC specifically (which focus area / project)"),
  fit: z
    .enum(["strong", "possible", "weak"])
    .describe("how well this matches ETC's mission and current projects"),
  status: z
    .enum(["open", "unclear", "closed"])
    .describe("whether the opportunity currently appears open to apply; 'closed' if clearly past"),
});

const DiscoverySchema = z.object({
  candidates: z
    .array(CandidateSchema)
    .describe(
      "distinct real grant opportunities found in the content that fit ETC. Do NOT invent grants — only include ones actually present in the search results. Exclude any that duplicate the 'already tracked' list. Order best-fit first.",
    ),
});

/** A discovered opportunity, ready to render and import (not yet saved). */
export interface GrantCandidate {
  name: string;
  funder: string;
  url: string;
  amount: number;
  deadline: string | null;
  focusAreas: string[];
  summary: string;
  whyFit: string;
  fit: "strong" | "possible" | "weak";
  status: "open" | "unclear" | "closed";
}

export interface DiscoveryResult {
  candidates: GrantCandidate[];
  queriesRun: string[];
  sourcesSearched: number;
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);

/** Existing pipeline entries to dedupe against. */
export interface KnownGrant {
  name: string;
  url: string;
}

export async function discoverGrants(
  theme: string | undefined,
  known: KnownGrant[],
): Promise<DiscoveryResult> {
  if (!discoveryConfigured()) {
    throw new Error(
      "Grant discovery needs TAVILY_API_KEY and ANTHROPIC_API_KEY in .env.local.",
    );
  }

  const queries = buildQueries(theme);
  const hitLists = await Promise.all(queries.map(tavilySearch));
  const hits = hitLists.flat();

  // De-duplicate raw search hits by URL before sending to the model.
  const seenUrls = new Set<string>();
  const uniqueHits = hits.filter((h) => {
    const key = h.url.replace(/[?#].*$/, "");
    if (!h.url || seenUrls.has(key)) return false;
    seenUrls.add(key);
    return true;
  });

  if (uniqueHits.length === 0) {
    return { candidates: [], queriesRun: queries, sourcesSearched: 0 };
  }

  const m = ETC_MISSION;
  const knownList = known.length
    ? known.map((k) => `- ${k.name}${k.url ? ` (${k.url})` : ""}`).join("\n")
    : "(none yet)";

  const content = [
    `You are a grants prospector for ${m.organization}. From the web search results below, identify DISTINCT, real, currently-open grant opportunities that fit ETC. Be selective — quality over quantity.`,
    "",
    "## About ETC",
    m.mission,
    `Focus areas: ${m.focusAreas.join("; ")}`,
    `Current projects: ${m.currentProjects.map((p) => `${p.name} (${p.question})`).join("; ")}`,
    `Breadth: ${m.breadth}`,
    "",
    "## Already tracked (do NOT return these — they're duplicates)",
    knownList,
    "",
    "## Instructions",
    "- Only include opportunities that actually appear in the search results — never invent one.",
    "- Each candidate must be a specific fundable grant/fund/RFP, not a list page or a news article.",
    "- Prefer opportunities that look currently open; mark status 'closed' if clearly past and 'unclear' if you can't tell.",
    "- Rate fit honestly against ETC's focus areas and current projects.",
    "- Skip anything that duplicates the already-tracked list.",
    "",
    "## Search results",
    ...uniqueHits.map(
      (h, i) => `--- Result ${i + 1}: ${h.title} (${h.url}) ---\n${h.content}`,
    ),
  ]
    .join("\n")
    .slice(0, MAX_CONTENT_CHARS + 4000);

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(DiscoverySchema),
    },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Discovery returned no structured output. Try again.");
  }

  // Belt-and-suspenders dedupe in code against known grants (by name and URL).
  const knownNames = new Set(known.map((k) => norm(k.name)));
  const knownUrls = new Set(
    known.map((k) => k.url.replace(/^https?:\/\//, "").replace(/\/$/, "")).filter(Boolean),
  );

  const candidates: GrantCandidate[] = response.parsed_output.candidates
    .filter((c) => c.name && c.status !== "closed")
    .filter((c) => !knownNames.has(norm(c.name)))
    .filter((c) => {
      const u = c.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return !u || !knownUrls.has(u);
    })
    .map((c) => ({
      name: c.name,
      funder: c.funder,
      url: c.url,
      amount: c.amount || 0,
      deadline: c.deadline || null,
      focusAreas: c.focusAreas,
      summary: c.summary,
      whyFit: c.whyFit,
      fit: c.fit,
      status: c.status,
    }));

  return {
    candidates,
    queriesRun: queries,
    sourcesSearched: uniqueHits.length,
  };
}

/** Map a discovered candidate to the GrantInput the store accepts. */
export function candidateToGrantInput(c: GrantCandidate): GrantInput {
  return {
    name: c.name,
    funder: c.funder,
    amount: c.amount,
    deadline: c.deadline,
    url: c.url,
    description: c.summary,
    focusAreas: c.focusAreas,
    stage: "prospect",
  };
}
