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

// Best-effort second pass: find the funder's LinkedIn page and the people who
// run it. Returns snippet text to fold into the model's context, or "" on error.
async function scrapeLeadership(hint: string): Promise<string> {
  return sideSearch(
    `${hint} foundation leadership president OR "executive director" OR CEO LinkedIn`,
    "Leadership summary",
  );
}

// Best-effort third pass: find previously-funded projects / grantees to reference.
async function scrapePastGrants(hint: string): Promise<string> {
  return sideSearch(
    `${hint} past grantees OR "funded projects" OR awardees examples`,
    "Past grantees summary",
  );
}

// Best-effort fourth pass: find how the funder scores applications (their rubric).
async function scrapeReviewCriteria(hint: string): Promise<string> {
  return sideSearch(
    `${hint} "review criteria" OR "evaluation criteria" OR "selection criteria" OR rubric OR "how applications are scored" OR "what we look for"`,
    "Review criteria summary",
  );
}

// Best-effort fifth pass: find the coalition / foundations funding a collaborative.
async function scrapeCoalition(hint: string): Promise<string> {
  return sideSearch(
    `${hint} funded by OR "supported by" OR "in partnership with" OR "founding funders" OR "member foundations" OR coalition OR collaborative OR "funding partners" OR backers`,
    "Coalition / funders summary",
  );
}

// Best-effort sixth pass: find the application mechanism / form / process.
async function scrapeSubmission(hint: string): Promise<string> {
  return sideSearch(
    `${hint} "how to apply" OR "application process" OR "application form" OR "submission guidelines" OR "letter of inquiry" OR "required materials" OR apply portal`,
    "Submission process summary",
  );
}

async function sideSearch(query: string, label: string): Promise<string> {
  try {
    const data = await tavily("search", {
      query,
      search_depth: "advanced",
      max_results: 5,
      include_raw_content: false,
    });
    const results: Array<{ url?: string; title?: string; content?: string }> =
      data.results ?? [];
    if (results.length === 0) return "";
    return [
      data.answer ? `${label}: ${data.answer}` : "",
      ...results.map((r) => `- ${r.title} (${r.url}): ${(r.content || "").slice(0, 400)}`),
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
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
  orgLinkedIn: z
    .string()
    .describe("the funding organization's LinkedIn company page URL, or empty string if unknown"),
  people: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().describe("their title / role at the funder, e.g. President"),
        linkedin: z.string().describe("their LinkedIn profile URL, or empty string"),
      }),
    )
    .describe("1-4 key people who run the funder or program; empty array if none found"),
  decisionTimeline: z
    .string()
    .describe(
      "when applicants can expect to hear back / a decision after applying (e.g. 'notified ~6-8 weeks after the deadline'); empty string if not stated",
    ),
  grantPeriod: z
    .string()
    .describe("the funding / grant period or duration, e.g. '12 months'; empty string if not stated"),
  keyDates: z
    .array(
      z.object({
        label: z.string().describe("milestone name, e.g. 'Applications open', 'Deadline', 'Notification', 'Funding starts'"),
        date: z.string().describe("YYYY-MM-DD, or empty string if only an approximate window is known"),
      }),
    )
    .describe("key timeline milestones; empty array if none found"),
  constraints: z
    .array(z.string())
    .describe(
      "eligibility restrictions, requirements, or constraints (e.g. 'US nonprofits only', 'outputs must be open source', 'matching funds required', 'no unsolicited proposals'); empty array if none",
    ),
  reviewCriteria: z
    .array(
      z.object({
        criterion: z
          .string()
          .describe("a dimension the funder scores applications on, e.g. 'Innovation & originality'"),
        weight: z
          .string()
          .describe("the stated weight if given, e.g. '30%' or '25 pts'; empty string if not stated"),
        detail: z
          .string()
          .describe("what the funder says they are looking for on this criterion"),
      }),
    )
    .describe(
      "how the FUNDER evaluates/scores applications — their published review criteria, rubric, or selection priorities (what THEY look for, not ETC's fit). Empty array if none stated.",
    ),
  coalition: z
    .array(
      z.object({
        name: z.string().describe("the backer/funder organization name"),
        type: z
          .enum(["foundation", "corporate", "government", "nonprofit", "academic", "multilateral", "other"])
          .describe("what kind of entity this backer is"),
        role: z
          .string()
          .describe("their role or contribution, e.g. 'Founding funder', '$100M commitment', 'Convener'; empty if unknown"),
        url: z.string().describe("their website or LinkedIn, or empty string"),
      }),
    )
    .describe(
      "the coalition / foundations / partners actually FUNDING or backing this opportunity. For a collaborative or challenge (e.g. a $500M fund backed by many foundations), list every named member funder. Empty array if it's a single funder already captured above or none are named.",
    ),
  submission: z
    .object({
      mechanism: z
        .string()
        .describe("how you apply, e.g. 'Online application via Fluxx portal', 'Letter of inquiry then full proposal by invitation'; empty if unknown"),
      formUrl: z.string().describe("direct link to the application form / portal, or empty string"),
      steps: z.array(z.string()).describe("ordered steps in the application process; empty array if not stated"),
      materials: z
        .array(z.string())
        .describe("required materials, e.g. 'project narrative', 'budget', 'letters of support'; empty array if not stated"),
      notes: z.string().describe("any extra notes on the process; empty string if none"),
    })
    .describe("how to actually apply — the submission mechanism and process"),
  fundedExamples: z
    .array(
      z.object({
        grantee: z.string().describe("the organization/project that was funded"),
        project: z.string().describe("what the funded project actually did"),
        amount: z
          .number()
          .describe("funded amount in USD — double-check the actual figure from the content; 0 only if truly unknown"),
        year: z.string().describe("year funded, e.g. '2026', or empty string"),
        url: z.string().describe("link to the project/award announcement, or empty string"),
        orgUrl: z.string().describe("link to the grantee organization's own website, or empty string"),
        proposalUrl: z
          .string()
          .describe("link to the actual grant proposal/application if it is public, or empty string"),
        takeaway: z.string().describe("one line on why it's a useful reference to adapt"),
      }),
    )
    .describe(
      "up to 4 previously-funded projects under this program that are named in the content — real reference examples. Verify the funded amount and include org and proposal links where available. Empty array if none found.",
    ),
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

  // Enrich with leadership, past grantees, review criteria, the funding
  // coalition, and the submission process — all in parallel.
  const [leadership, pastGrants, reviewCriteria, coalition, submission] = await Promise.all([
    scrapeLeadership(source.sourceUrl || trimmed),
    scrapePastGrants(source.sourceUrl || trimmed),
    scrapeReviewCriteria(source.sourceUrl || trimmed),
    scrapeCoalition(source.sourceUrl || trimmed),
    scrapeSubmission(source.sourceUrl || trimmed),
  ]);

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
          "Extract structured grant details from the web content below. If it describes multiple grants, pick the single most relevant fundable opportunity. Pay attention to the application/decision TIMELINE (when applicants hear back), the grant PERIOD, any CONSTRAINTS or eligibility requirements, the funder's REVIEW/EVALUATION CRITERIA (how they score applications), the COALITION of funders/foundations backing this opportunity (especially for collaboratives — list every named member funder), the SUBMISSION PROCESS (how you apply — mechanism, form/portal link, steps, required materials), and any PAST GRANTEES / previously-funded projects named in the content (with verified amounts and org/proposal links). Do not invent facts — use empty string / 0 / empty array when something is not stated.",
          source.sourceUrl ? `Source URL: ${source.sourceUrl}` : "",
          "",
          "--- GRANT / FUNDER CONTENT ---",
          source.content.slice(0, MAX_CONTENT_CHARS),
          leadership ? "\n--- LEADERSHIP / LINKEDIN SEARCH ---\n" + leadership : "",
          pastGrants ? "\n--- PAST GRANTEES SEARCH ---\n" + pastGrants : "",
          reviewCriteria ? "\n--- REVIEW / EVALUATION CRITERIA SEARCH ---\n" + reviewCriteria : "",
          coalition ? "\n--- COALITION / FUNDERS SEARCH ---\n" + coalition : "",
          submission ? "\n--- SUBMISSION / HOW-TO-APPLY SEARCH ---\n" + submission : "",
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
      orgLinkedIn: p.orgLinkedIn,
      people: p.people,
      logistics: {
        decisionTimeline: p.decisionTimeline,
        grantPeriod: p.grantPeriod,
        keyDates: p.keyDates.map((d) => ({ label: d.label, date: d.date || null })),
        constraints: p.constraints,
      },
      coalition: p.coalition.map((c) => ({
        name: c.name,
        type: c.type,
        role: c.role,
        url: c.url,
        bestFit: false,
        note: "",
      })),
      submission:
        p.submission.mechanism ||
        p.submission.formUrl ||
        p.submission.steps.length ||
        p.submission.materials.length ||
        p.submission.notes
          ? {
              mechanism: p.submission.mechanism,
              formUrl: p.submission.formUrl,
              steps: p.submission.steps,
              materials: p.submission.materials,
              notes: p.submission.notes,
            }
          : null,
      reviewCriteria: p.reviewCriteria,
      fundedExamples: p.fundedExamples.map((e) => ({
        grantee: e.grantee,
        project: e.project,
        amount: e.amount || 0,
        year: e.year,
        url: e.url,
        orgUrl: e.orgUrl,
        proposalUrl: e.proposalUrl,
        takeaway: e.takeaway,
      })),
    },
  };
}
