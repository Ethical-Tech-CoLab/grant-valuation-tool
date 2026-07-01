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

/**
 * Whether the opportunity can actually be applied to right now — orthogonal to
 * the pipeline stage (where WE are with it). Lets a closed cycle stay visible
 * and clearly labeled instead of being deleted or mislabeled "Rejected".
 */
export const AVAILABILITY = [
  "open",
  "upcoming",
  "rolling",
  "closed",
  "invite-only",
] as const;

export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  open: "Open",
  upcoming: "Upcoming",
  rolling: "Rolling",
  closed: "Closed",
  "invite-only": "Invite-only",
};

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

/** A dated milestone in a grant's application/decision timeline. */
export interface KeyDate {
  label: string;
  date: string | null;
}

/** "What happens after you apply" — timeline, response window, and constraints. */
export interface GrantLogistics {
  /** When applicants can expect a decision after applying */
  decisionTimeline: string;
  /** Funding / grant period or duration, e.g. "12 months" */
  grantPeriod: string;
  /** Timeline milestones (open date, deadline, notification, funding start, reporting) */
  keyDates: KeyDate[];
  /** Eligibility restrictions, requirements, and constraints */
  constraints: string[];
}

/**
 * One criterion the FUNDER uses to judge applications — their rubric, not ETC's.
 * Captured so we can tailor a proposal to how they actually score.
 */
export interface ReviewCriterion {
  /** the criterion the funder scores on, e.g. "Innovation & originality" */
  criterion: string;
  /** stated weight if the funder gives one, e.g. "30%" or "up to 25 pts"; empty if unstated */
  weight: string;
  /** what the funder is looking for on this criterion */
  detail: string;
}

/** A key aspect the proposal should emphasize, tailored to this funder. */
export interface ProposalAspect {
  aspect: string;
  /** why it matters for THIS funder / these criteria */
  why: string;
}

/** A suggested section of the proposal, with tailored guidance on what to write. */
export interface ProposalSection {
  heading: string;
  guidance: string;
}

/** An AI-drafted initial proposal recommendation tailored to a specific grant. */
export interface ProposalDraft {
  /** suggested project / proposal title */
  title: string;
  /** one-paragraph core pitch, tailored to the funder */
  thesis: string;
  /** the key aspects ETC should lead with */
  keyAspects: ProposalAspect[];
  /** a suggested proposal outline */
  sections: ProposalSection[];
  /** how ETC maps onto the funder's stated review criteria */
  alignmentHighlights: string[];
  /** what makes ETC stand out from the likely applicant pool */
  differentiators: string[];
  /** gaps or weaknesses to shore up before submitting */
  risks: string[];
  model: string;
  generatedAt: string;
}

/**
 * The buckets a grantseeking tip can fall into. Mirrors the arc of a strong
 * application: pick the right fight, know the funder, build the relationship,
 * write it well, budget honestly, run the process cleanly, dodge the classic
 * mistakes.
 */
export const TIP_CATEGORIES = [
  "positioning",
  "funder-research",
  "relationship",
  "proposal",
  "budget",
  "process",
  "pitfall",
] as const;

export type TipCategory = (typeof TIP_CATEGORIES)[number];

export const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  positioning: "Positioning",
  "funder-research": "Funder research",
  relationship: "Relationship",
  proposal: "Proposal craft",
  budget: "Budget",
  process: "Process & logistics",
  pitfall: "Pitfall to avoid",
};

/** One prioritized, funder-tailored grantseeking recommendation. */
export interface GrantTip {
  category: TipCategory;
  /** short imperative headline, e.g. "Lead with the migration prototype" */
  title: string;
  /** 1-3 sentences of advice tailored to THIS grant and funder */
  detail: string;
  priority: "high" | "medium" | "low";
}

/** AI-generated grantseeking playbook for a specific grant. */
export interface RecommendationSet {
  /** 2-4 sentence strategic overview of how to approach this opportunity */
  strategy: string;
  /** prioritized, funder-tailored tips */
  tips: GrantTip[];
  /** concrete next actions to take before the deadline */
  actionItems: string[];
  model: string;
  generatedAt: string;
}

/** A previously-funded project under this program — a reference/exemplar to adapt. */
export interface FundedExample {
  grantee: string;
  /** what the funded project actually did */
  project: string;
  /** funded amount in USD; 0 if unknown */
  amount: number;
  /** year funded, e.g. "2026"; empty if unknown */
  year: string;
  /** link to the project / award announcement */
  url: string;
  /** link to the grantee organization's own site; empty if unknown */
  orgUrl: string;
  /** link to the actual grant proposal / application, if public; empty if unknown */
  proposalUrl: string;
  /** why it's a useful reference — how ETC could adapt it */
  takeaway: string;
}

/** The kind of entity backing a funding opportunity. */
export const BACKER_TYPES = [
  "foundation",
  "corporate",
  "government",
  "nonprofit",
  "academic",
  "multilateral",
  "other",
] as const;

export type BackerType = (typeof BACKER_TYPES)[number];

export const BACKER_TYPE_LABELS: Record<BackerType, string> = {
  foundation: "Foundation",
  corporate: "Corporate",
  government: "Government",
  nonprofit: "Nonprofit",
  academic: "Academic",
  multilateral: "Multilateral",
  other: "Other",
};

/**
 * A member of the coalition / collaborative behind an opportunity — the deeper
 * layer of "who is actually funding this." E.g. a $500M collaborative may be
 * backed by ten different foundations; each is a CoalitionMember.
 */
export interface CoalitionMember {
  name: string;
  type: BackerType;
  /** their role or contribution, e.g. "Founding funder", "$100M commitment", "Convener" */
  role: string;
  /** org site or LinkedIn; empty if unknown */
  url: string;
  /** user-selected: is this a strong fit / priority relationship for ETC? */
  bestFit: boolean;
  /** user's editorial note on this backer */
  note: string;
}

/** How you actually apply — the submission mechanism and process. */
export interface SubmissionProcess {
  /** the mechanism, e.g. "Online form via Fluxx", "LOI, then full proposal by invitation" */
  mechanism: string;
  /** direct link to the application form / portal; empty if unknown */
  formUrl: string;
  /** ordered steps in the application process */
  steps: string[];
  /** required materials, e.g. "project narrative", "budget", "letters of support" */
  materials: string[];
  /** any extra notes on the process */
  notes: string;
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
  /** Whether the opportunity is currently open to apply; null = not yet assessed */
  availability: Availability | null;
  /** Short human note on availability, e.g. "reopens ~Mar 2027" or deadline detail */
  availabilityNote: string;
  /** LinkedIn URL of the funding organization; empty if unknown */
  orgLinkedIn: string;
  /** Key people who run the funder / program */
  people: Person[];
  /** Timeline, expected decision window, and constraints */
  logistics: GrantLogistics | null;
  /** The coalition / foundations backing this opportunity */
  coalition: CoalitionMember[];
  /** How to actually apply — mechanism, form, steps, materials */
  submission: SubmissionProcess | null;
  /** How the funder evaluates applications — their scoring rubric */
  reviewCriteria: ReviewCriterion[];
  /** Previously-funded projects to reference and adapt */
  fundedExamples: FundedExample[];
  stage: PipelineStage;
  scoring: ScoringResult | null;
  /** AI-drafted initial proposal recommendation */
  proposal: ProposalDraft | null;
  /** AI grantseeking playbook — tailored tips & recommendations */
  recommendations: RecommendationSet | null;
  award: AwardTracking | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape accepted when creating or updating a grant. */
export type GrantInput = Partial<
  Omit<
    Grant,
    "id" | "createdAt" | "updatedAt" | "scoring" | "proposal" | "recommendations" | "award"
  >
>;
