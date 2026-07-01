// Cross-pipeline "what should we work on next" digest.
//
// A deterministic prioritizer over the whole pipeline: for each grant that
// still needs work, it finds the single most pressing gap (not scored, no
// draft, no tips, deadline slipping…) and ranks the grants by urgency, blending
// the deadline with how far along the grant is. No AI call — it reasons over
// the score / proposal / recommendations / deadline state each grant carries.

import type { Grant } from "./types";
import { daysUntil, deadlineStatus } from "./format";

export type DigestTier = "urgent" | "soon" | "attention";

export interface DigestItem {
  grantId: string;
  grantName: string;
  /** short status of where this grant stands */
  reason: string;
  /** the single recommended next action */
  action: string;
  /** deadline context, e.g. "14d left" or "No deadline" */
  deadlineLabel: string;
  tier: DigestTier;
  /** higher = surface first */
  priority: number;
}

// Stages where the team can still act to improve the odds. "submitted" is out
// the door (waiting on the funder) and "awarded"/"rejected" are decided, so
// none of them appear in the digest.
const ACTIONABLE_STAGES = new Set(["prospect", "scoring", "drafting"]);

/**
 * Rank the pipeline by what most needs attention. Returns at most `limit`
 * items, most urgent first.
 */
export function buildDigest(grants: Grant[], limit = 6): DigestItem[] {
  const items: DigestItem[] = [];

  for (const g of grants) {
    if (!ACTIONABLE_STAGES.has(g.stage)) continue;

    const days = daysUntil(g.deadline);
    const deadlineLabel = deadlineStatus(g.deadline).label;

    let reason: string;
    let action: string;
    let gapWeight: number;

    if (days !== null && days < 0) {
      // A live grant whose deadline already passed is the loudest signal.
      reason = "Deadline passed while still open";
      action = "Submit now if still applying, or move to Rejected";
      gapWeight = 100;
    } else if (!g.scoring) {
      reason = "Not scored yet";
      action = "Run an AI valuation to gauge fit";
      gapWeight = 45;
    } else if (g.scoring.recommendation === "pass") {
      reason = `Scored ${g.scoring.overallScore} · pass`;
      action = "Deprioritize or move to Rejected";
      gapWeight = 10;
    } else if (!g.proposal) {
      reason = `${g.scoring.recommendation} (${g.scoring.overallScore}) · no draft yet`;
      action = "Draft the proposal";
      gapWeight = 55;
    } else if (!g.recommendations) {
      reason = "Draft ready · no tailored tips";
      action = "Get recommendations & tips";
      gapWeight = 30;
    } else {
      reason = "Scored, drafted & tips ready";
      action = "Finalize and submit";
      gapWeight = 25;
    }

    const deadlineWeight =
      days === null
        ? 0
        : days < 0
          ? 90
          : days <= 14
            ? 70
            : days <= 45
              ? 40
              : Math.max(0, 25 - days / 10);

    const tier: DigestTier =
      days !== null && days <= 14
        ? "urgent"
        : days !== null && days <= 45
          ? "soon"
          : "attention";

    items.push({
      grantId: g.id,
      grantName: g.name,
      reason,
      action,
      deadlineLabel,
      tier,
      priority: deadlineWeight + gapWeight,
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, limit);
}
