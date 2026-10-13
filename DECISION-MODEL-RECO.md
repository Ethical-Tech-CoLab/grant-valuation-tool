# Decision-model recommendation: grant-fit shortlist

Date: 2026-10-11. Public-source proposal; no API experiment or measured saving.
Scope: this repository's grant scoring, not grant awards or applicant selection.

## Concrete opportunity

Reviewed [README](https://github.com/Ethical-Tech-CoLab/grant-valuation-tool/blob/76d70fce533f56781c3be2c599f2f1e9a71a8904/README.md)
and [scoring implementation](https://github.com/Ethical-Tech-CoLab/grant-valuation-tool/blob/76d70fce533f56781c3be2c599f2f1e9a71a8904/src/lib/scoring.ts).
`scoreGrant` calls a configurable Claude model, defaulting in this revision to
`claude-opus-4-8`, with adaptive thinking and structured output. It returns
criterion scores, a pursue/consider/pass recommendation, narrative and a
model-estimated win probability. Expected value multiplies amount by that
probability. Clamping into a range does not establish calibration.

This is a stronger cost-reduction candidate than adding AI to a deterministic
pipeline: a high-volume bounded fit check could remove some expensive calls.
However, the scorer also writes rationales and summaries, which a decision
model cannot replace directly.

## Recommended cascade

1. Preserve deterministic dates, amounts, access and explicit eligibility
   constraints. Unknown eligibility requires review, not inferred permission.
2. Score only mission-fit criteria against approved evidence using a fixed
   ordinal rubric; use a separate unknown/no-evidence outcome.
3. Compute weights and aggregate fit in code under a versioned policy.
4. Retain richer Claude analysis and drafting for the shortlist and ambiguous
   cases. Never silently remove the existing narrative contract from the UI.

Do not feed ordinal fit into `winProbability` or expected value. A grant can be
an excellent fit yet very unlikely to win. Calibrate outcome forecasts only
with historical outcomes and explicit selection-bias limitations.

## Candidates and evaluation

Compare current Claude, rule-based filters, a local classifier, Jev,
Microsoft-Decision-1 and Sage on the same approved public opportunities.
Jev's [reranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe.md)
and [confidence cascade](https://docs.typesafe.ai/patterns/confidence-routing.md)
are useful patterns, not evidence of this project's savings.

Split by funder/program and time. Have grant staff label criterion fit and
shortlist decisions independently of funding outcomes. Measure promising-grant
recall, false rejection, reviewer agreement, calibration where appropriate,
top-K retention, latency, and cost per accepted opportunity including fallback,
research and human review. Test missing deadlines, unknown requirements and
adversarial imported text. Retrospective winners alone are a biased test set.

## Pilot and go/no-go

Run a server-side, off-by-default shadow adapter. Log source IDs, rubric/model
version, candidate decisions, fallbacks and billed usage. Maintain current
outputs until a separate UI/API contract is agreed. No automatic application,
rejection or spending.

Adopt only with owner-approved held-out recall/error bounds and lower total
cost at equivalent useful work. No provider is qualified yet. The exact
proprietary checkpoints are not locally downloadable; local candidates need
independent license, hardware and quality evaluation.
