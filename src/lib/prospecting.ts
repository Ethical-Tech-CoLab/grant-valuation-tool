// Web prospecting: turn a grant/funder URL or a search query into structured
// grant fields, using Tavily to scrape the web and Claude to structure it.
//
// Runs server-side only. Needs TAVILY_API_KEY (web scraping) and
// ANTHROPIC_API_KEY (structuring).

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { GrantInput } from "./types";

const MODEL = process.env.GRANT_SCORING_MODEL || "claude-opus-4-8";
const MAX_CONTENT_CHARS = 14000;

export function prospectingConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY && process.env.ANTHROPIC_API_KEY);
}

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

interface SourceContent {
  content: string;
  sourceUrl: string;
}

async function tavily(path: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.tavily.com/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Tavily ${path} failed (${res.status}). ${detail.slice(0, 200)}`);
  }
  return res.json();
}

async function scrapeUrl(url: string): Promise<SourceContent> {
  const data = await tavily("extract", {
    urls: [url],
    extract_depth: "advanced",
  });
  const first = data.results?.[0];
  if (!first?.raw_content) {
    throw new Error("Tavily could not extract content from that URL.");
  }
  return { content: first.raw_content, sourceUrl: first.url || url };
}

async function scrapeSearch(query: string): Promise<SourceContent> {
  const data = await tavily("search", {
    query,
    search_depth: "advanced",
    max_results: 4,
    include_raw_content: true,
  });
  const results: Array<{ url?: string; content?: string; raw_content?: string }> =
    data.results ?? [];
  if (results.length === 0) {
    throw new Error("No web results found for that search.");
  }
  const combined = [
    data.answer ? `Summary: ${data.answer}` : "",
    ...results.map(
      (r, i) =>
        `--- Result ${i + 1} (${r.url}) ---\n${(r.raw_content || r.content || "").slice(0, 5000)}`,
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
  return { content: combined, sourceUrl: results[0].url || "" };
}

const ProspectSchema = z.object({
  name: z.string().describe("the grant / program name"),
  funder: z.string().describe("the funding organization; empty string if unclear"),
  amount: z
    .number()
    .describe("award amount in USD as a number; 0 if not stated. Use the max/typical award."),
  deadline: z
    .string()
    .describe("application deadline as YYYY-MM-DD, or empty string if none found"),
  url: z.string().describe("the best canonical URL for this opportunity"),
  description: z
    .string()
    .describe(
      "a concise 3-6 sentence summary: what it funds, who is eligible, allowable costs, and any key requirements",
    ),
  focusAreas: z
    .array(z.string())
    .describe("3-6 short topic tags describing the grant's focus"),
  foundGrant: z
    .boolean()
    .describe("false if the page does not actually describe a fundable grant opportunity"),
});

export interface ProspectResult {
  fields: GrantInput;
  sourceUrl: string;
  foundGrant: boolean;
}

export async function prospectGrant(input: string): Promise<ProspectResult> {
  if (!prospectingConfigured()) {
    throw new Error(
      "Web prospecting needs TAVILY_API_KEY and ANTHROPIC_API_KEY in .env.local.",
    );
  }
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a grant URL or a search query.");

  const source = isUrl(trimmed)
    ? await scrapeUrl(trimmed)
    : await scrapeSearch(trimmed);

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ProspectSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          "Extract structured grant details from the web content below. If it describes multiple grants, pick the single most relevant fundable opportunity. Do not invent facts — use empty string / 0 when something is not stated.",
          source.sourceUrl ? `Source URL: ${source.sourceUrl}` : "",
          "",
          "--- WEB CONTENT ---",
          source.content.slice(0, MAX_CONTENT_CHARS),
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Could not structure that content into a grant.");
  }

  const p = response.parsed_output;
  return {
    foundGrant: p.foundGrant,
    sourceUrl: source.sourceUrl,
    fields: {
      name: p.name,
      funder: p.funder,
      amount: p.amount || 0,
      deadline: p.deadline || null,
      url: p.url || source.sourceUrl,
      description: p.description,
      focusAreas: p.focusAreas,
    },
  };
}
