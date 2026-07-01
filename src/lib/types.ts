// Domain types for the grant pipeline.

export const PIPELINE_STAGES = [
  "prospect",
  "scoring",
  "drafting",
  "submitted",
  "awarded",
  "rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  prospect: "Prospect",
  scoring: "Scoring",
  drafting: "Drafting",
  submitted: "Submitted",
  awarded: "Awarded",
  rejected: "Rejected",
};

/** A single weighted criterion returned by the AI scorer. */
export interface ScoreCriterion {
  key: string;
  label: string;
  /** 0–100 */
  score: number;
  /** relative weight, 0–1, across all criteria (sums to ~1) */
  weight: number;
  rationale: string;
}

/** Full AI valuation of a grant opportunity. */
export interface ScoringResult {
  /** 0–100 weighted fit score */
  overallScore: number;
  recommendation: "pursue" | "consider" | "pass";
  /** 0.0–1.0 estimated probability of winning if we apply */
  winProbability: number;
  /** amount * winProbability, computed server-side */
  expectedValue: number;
  criteria: ScoreCriterion[];
  redFlags: string[];
  summary: string;
  model: string;
  scoredAt: string;
}

/** A reporting obligation attached to an awarded grant. */
export interface ReportingRequirement {
  id: string;
  label: string;
  dueDate: string | null;
  status: "pending" | "submitted";
}

/** A person who runs the funding organization or program. */
export interface Person {
  name: string;
  role: string;
  /** LinkedIn profile URL; empty if unknown */
  linkedin: string;
}

/** Post-award tracking data. */
export interface AwardTracking {
  awardedAmount: number;
  awardDate: string | null;
  fundsSpent: number;
  outcomes: string;
  reporting: ReportingRequirement[];
}

export interface Grant {
  id: string;
  name: string;
  funder: string;
  /** requested / opportunity amount in USD */
  amount: number;
  deadline: string | null;
  url: string;
  description: string;
  focusAreas: string[];
  /** LinkedIn URL of the funding organization; empty if unknown */
  orgLinkedIn: string;
  /** Key people who run the funder / program */
  people: Person[];
  stage: PipelineStage;
  scoring: ScoringResult | null;
  award: AwardTracking | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape accepted when creating or updating a grant. */
export type GrantInput = Partial<
  Omit<Grant, "id" | "createdAt" | "updatedAt" | "scoring" | "award">
>;
