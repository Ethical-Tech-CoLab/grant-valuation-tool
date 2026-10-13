# Peer Review — *The ETC Grant Valuator: A Decision-Support Tool for Valuing and Prioritising Grant Opportunities*

**Reviewer role:** External referee, reviewing as a research-report / methods write-up for the Ethical Tech CoLab publications series, held to the bar the report sets for itself — a plain-language account of "exactly how it arrives at a number, what each of those numbers means, and what it cannot do." The software (`Ethical-Tech-CoLab/grant-valuation-tool`) is in scope insofar as the report makes claims about it.
**Recommendation:** **Minor revisions** — an unusually well-checked report about a tool whose central number is less verified than the report's own care would suggest.
**Date:** 22 July 2026
**Reviewed artefact:** `GrantValuator-Paper.md` (694 lines) against `src/lib/scoring.ts`, `src/lib/mission.ts`, and `data/grants.json` @ main

---

## Summary of the submission

The report describes an internal Next.js tool that helps a four-person research collaboration decide which grant opportunities to pursue. A written organisational profile (mission, focus areas, current projects, strengths, constraints) is held in code as the single source of truth. Each opportunity is scored 0–100 on five criteria — mission alignment (30%), funding fit (20%), competitiveness (20%), effort/feasibility (15%, deliberately inverted so higher means lighter), and strategic value (15%) — by a large language model that reads the profile alongside the grant description and returns a structured judgment: per-criterion scores with rationales, a weighted overall fit score, a win probability, red flags, and a pursue/consider/pass recommendation. Expected value is then computed by the software as award amount × win probability. Around the scorer sit evidence layers (funder leadership, review criteria, funding history, application logistics, pooled-fund backers), a discovery/prospecting path, a stage-based pipeline, and a priority digest.

The report's real subject is not the software but a distinction: **fit** (should we want this?) versus **win probability** (would we get it?), and the claim that keeping them apart, then multiplying one of them by the money, is what turns a headline pipeline figure into a decision.

## Strengths

- **Every quantitative claim in the report reproduces against the stored data.** I recomputed the lot from `data/grants.json`: 13 opportunities of which 12 are scored ✓; headline pipeline $11.65M against the report's "roughly $11.7 million" ✓; probability-weighted $1.62M against "roughly $1.6 million" ✓; the §4.3.1 worked example (78/80/48/62/85 → 23.4 + 16.0 + 9.6 + 9.3 + 12.75 = 71.05, recorded as 71) ✓ exactly; the §4.4.3 pair ($400k at 35% = $140k, $500k at 22% = $110k) ✓; expected value recomputes to the stored figure in **all twelve** scored records ✓. In a portfolio where the most common review finding is arithmetic that does not survive checking, this report is the exception, and it deserves to be said first.
- **§4.3.2 discloses the weakness a lesser report would have hidden.** It states plainly that the weights are "described in the code as guidance rather than as a fixed formula," that the scorer returns its own weights, and that they happened to match the targets in all twelve cases. I verified this: every scored record has weights summing to exactly 1.00 and matching the stated 30/20/20/15/15. Reporting a favourable empirical result *as* an empirical result, rather than as a design guarantee, is exactly right.
- **The fit / win-probability separation is a genuine contribution at this scale.** §4.4.1's observation that the two "come apart constantly" — 71 fit at 22% odds versus 68 fit at 35% — is the report's best idea, and the pipeline data bears it out. It is also the idea most transferable to other small research units.
- **§4.4.4 does the thing decision-support reports almost never do:** it states what the tool would have prevented. Reporting $11.7M to a board without the $1.6M beside it "would be misleading" is a concrete claim about institutional practice, not a feature description.
- **The effort criterion is correctly inverted and the report flags the inversion in plain language** ("scored in the opposite direction to intuition"), matching the code's guidance string ("Higher score = lighter, more feasible"). Small thing; most scorecards get this wrong silently.
- **§1.7 and §12 are honest about maturity** — single JSON file, no accounts, no access controls, should not leave one machine without authentication and a real database. No overclaiming.

## Major issues

1. **In 2 of 12 records the overall score is not the weighted average of the model's own criterion scores.** The report says the fit score *is* the weighted average (§4.3.1), and the prompt instructs the model that "overallScore must be the weight-weighted average of the criteria scores." Recomputing from each record's own criteria and weights:

   | Grant | Weighted average | Stored `overallScore` | Δ |
   |---|---|---|---|
   | Technology & Society Grantmaking | 53.00 | **54** | +1.00 |
   | Impact Challenge: AI for Government | 61.35 | **62** | +0.65 |
   | Combating Human Trafficking | 68.50 | 68 | −0.50 |
   | Mozilla Technology Fund | 48.50 | 49 | +0.50 |
   | *(the other eight)* | — | — | ≤0.05, i.e. exact |

   The last two are ordinary rounding. The first two are not: 53.00 rounds to 53, not 54, and 61.35 rounds to 61, not 62. These are small errors with no practical consequence at this sample size — but their existence is the answer to the question the report leaves open in §1.5, and the answer is that **the model's arithmetic is nearly but not exactly right, and nothing in the software checks it**. `scoreGrant` clamps `overallScore` and `winProbability` and rounds the score, but never recomputes it from the criteria array returned in the same response. *Fix:* a three-line change — recompute `sum(score × weight)` server-side and either use it as the overall score or log a discrepancy. Then say in §4.3 that the score is computed by the software from the model's per-criterion judgments, which is a materially stronger claim than the one the report can currently make. Report the two discrepancies as a found result; they are good evidence for the recommendation.

2. **Two-thirds of the entire portfolio's expected value rests on a single unvalidated probability estimate.** The $9M ILAB opportunity at 12% contributes **$1.08M of the pipeline's $1.62M** — 67%. §4.4.4 mentions this grant as "the largest single contributor to the difference" between headline and weighted value, which understates it considerably: it is not a contributor to the gap, it is the majority of the *result*. Drop that one estimate from 12% to 6% and the pipeline's expected value falls by a third; the report offers no basis for preferring either figure. This is the single most decision-relevant fact in the dataset. *Fix:* state the concentration explicitly with the number, and add a one-line sensitivity note (portfolio EV at ±50% on that estimate). Consider reporting portfolio EV both with and without the outlier, as fund managers routinely do.

3. **Win probability is the tool's load-bearing number and nothing calibrates it.** Every conclusion that matters — expected value, the pipeline total, the ranking that decides where senior time goes — is award amount multiplied by a figure a language model produced with no base rate, no reference class, and no feedback. The report acknowledges this in §11, but the acknowledgement is weaker than the situation warrants, because the tool *already collects the data that would fix it*: §1.1 says it tracks chosen opportunities "from first sighting through to an award or a rejection." The loop is one step from closing and is not closed. *Fix:* record the realised outcome against the prior estimate for every completed application, and publish the comparison once there are enough — even 8–10 resolved applications would show whether the estimates are systematically optimistic. Until then, say in §4.4 that the probabilities are uncalibrated judgments and that expected value inherits every bias in them.

4. **The executive summary asserts fixed weights; §4.3.2 says they are not fixed.** §1.3: "Each criterion receives a score from 0 to 100 and carries a **fixed weight**." §4.3.2: "The weights are described in the code as guidance rather than as a fixed formula. The scorer is asked to return its own weight." The body is correct and the summary is not. This matters because a reader who reads only §1 will believe the instrument is fixed across opportunities, which is the property that makes scores comparable — and it is currently an empirical observation over twelve cases rather than a guarantee. *Fix:* align §1.3 with §4.3.2, or make the weights actually fixed in the code (see next issue), at which point §1.3 becomes true and the whole ambiguity disappears.

5. **The `weight` field is the one model-returned quantity with no safeguard.** §4.3.3 lists the two safeguards accurately — scores clamped to 0–100 and rounded, win probability clamped to 0–1 — and the code confirms both. But `weight` passes through unclamped, unnormalised, and unchecked against the five target weights; the schema only *asks* that weights "sum to ~1.0". A response with weights summing to 1.4, or with four criteria instead of five, or with an unrecognised `key`, would be stored and displayed as a valid scorecard. Nothing has gone wrong in twelve runs; nothing prevents it in the thirteenth. *Fix:* validate that the returned criteria keys are exactly the five expected ones and that the weights match the targets (or normalise and flag), and add a sentence to §4.3.3 describing the third safeguard.

## Minor issues

1. **An unpriced opportunity is silently valued at zero.** `expectedValue: Math.round((grant.amount || 0) * winProbability)` — the "Artists Make Technology" record has no amount and therefore an expected value of $0, which in any EV-ranked view sorts it below a $50k opportunity at 15%. An unknown award is not a worthless one. Distinguish "unpriced" from "$0" in both the data model and the ranked display, and note the treatment in §4.4.2.
2. **The pipeline is 12 records scored by one model on one date.** No inter-rater comparison, no re-scoring of the same grant to test stability. Re-scoring three grants five times each would cost a few cents and would tell the reader whether a fit score of 71 is reproducible to ±1 or ±8 — which is exactly what a reader needs in order to trust the 71-versus-68 ordering the tool is built to produce.
3. **The model identifier is recorded per score but the report never states which model produced the pipeline.** `scoring.ts` defaults to `claude-opus-4-8` and the result stores `model`; §10 should name it, since every number in §4.3–§4.4 is that model's output and a future re-score on a different model is not comparable.
4. **No sampling settings are stated.** The scorer runs with adaptive thinking at high effort and a structured-output schema; none of this appears in the report, and all of it affects reproducibility.
5. **§2.2's comparison to commercial platforms is a list, not an argument.** Seven products are named as influences; none is compared on the one axis the report cares about — does any of them separate fit from win probability, and if so, what is new here? One paragraph would convert a related-work list into a positioning claim.
6. **No LICENSE file** in a public repository that documents itself as reusable by other small research units.

## What's missing

- **A retrospective.** The report describes a prospective instrument and never looks backward. The most valuable table it could add is: for every application ETC actually submitted, the fit score, the win probability, and what happened. That table is the only thing that can tell a reader whether this tool works, and the tool is already collecting its inputs.
- **A stability check.** (Minor issue 2.) Cheap, and it bounds every comparison the report makes.
- **An adversarial section.** The tool produces a number that justifies *not* applying for things. §11 covers epistemic limits but not institutional ones: what happens when a score is used to decline a partner's invitation, or when the profile in `mission.ts` is quietly edited to make a favoured opportunity score better? The profile is a single editable file and every judgment flows from it — that is the tool's most useful property and its most gameable one, and the report says only the first half.
- **The prompt.** `buildPrompt` is the instrument. It is described in prose but never shown; a reader cannot judge, for example, whether "be honest and specific; ETC has limited grant-writing bandwidth" nudges effort scores downward across the board. An appendix with the full prompt would cost one page.
- **A statement of who the report is for.** §13 addresses intended use of the *tool*; the report itself sits somewhere between internal documentation and a methods paper for other small units, and it would be stronger if it picked.

## Internal inconsistencies

1. **§1.3 "fixed weight" versus §4.3.2 "guidance rather than a fixed formula."** (Major issue 4.)
2. **§1.5 and §4.3.1 versus the data.** §4.3.1 states the fit score *is* the weighted average and demonstrates it on a record where that is exactly true (71.05 → 71); two other records in the same file do not satisfy the relation. Choosing the exact example is fair, but the general claim needs the qualifier — or, better, the code change that makes it true. (Major issue 1.)
3. **§1.4's "the only figure calculated by the software itself" versus §4.3.3's safeguards.** Both are defensible readings — expected value is the only figure *derived* by software, while clamping and rounding are applied to the model's figures — but a reader moving between them will wonder whether a rounded score counts as calculated. One clause resolves it.
4. **§4.4.4 calls the $9M opportunity "the largest single contributor to the difference"** between headline and weighted value; it is in fact the majority of the weighted value itself. Not wrong, but it directs the reader's attention to the smaller of the two facts. (Major issue 2.)

## Prioritized next steps

If there is time for only three things:

1. **Recompute the overall score in software** from the model's own per-criterion scores and weights, and validate the criteria keys and weight sum (Major issues 1 and 5). Three lines each, and together they convert the report's most-hedged claim — that the score is a weighted average — into one that holds by construction. Report the two 1-point discrepancies as the finding that motivated the change.
2. **Put the concentration and a sensitivity line into §4.4.4** (Major issue 2): 67% of pipeline expected value sits on one probability estimate, and here is what the portfolio looks like if that estimate is halved or doubled. This is the single most useful sentence the report could add for a reader who has to act on the number.
3. **Close the calibration loop** (Major issue 3) — record realised outcomes against prior estimates, and commit in §11 to publishing the comparison. Everything else in the report is a description of a method; this would be evidence that the method works.

Then: align §1.3 with §4.3.2, distinguish unpriced from $0, name the model and settings, add the prompt appendix, and add a LICENSE.

## What to take forward

- **If a report states an identity, have the code enforce it.** "The fit score is the weighted average of the criterion scores" is either a definition or an empirical claim, and the difference is one function call. Right now the report has to describe it as the latter and hope. Anywhere a document asserts that one number equals a function of others, compute it that way — then the sentence is free.
- **Report a concentration whenever you report a portfolio total.** $1.6M sounds like a diversified pipeline; two-thirds of it is one guess about one government grant. Any total built from independent estimates should be published with its largest single contributor named, because that is the number a reader would need in order to disagree with you.
- **A tool that collects outcomes has no excuse for uncalibrated priors.** The gap between "we estimate 22%" and "our 22% estimates have historically won 3 of 14 times" is the gap between a plausible tool and a validated one, and this tool is already storing the second column. Build the feedback loop into the data model before the estimates accumulate, not after.
- **The report's checking discipline is the habit worth keeping.** Every figure in §4 reproduced from the repository's own data on the first attempt. That is rare, and it is why the two 1-point discrepancies above are findable at all — a document this precise makes its own remaining errors visible. Keep writing numbers that can be checked against a file in the repo.

## Verdict

**Minor revisions.** This is a careful, honest, well-scoped report about a modest tool that does one useful thing, and its arithmetic survives checking almost everywhere — including the places most reports in this portfolio do not. The revisions are correspondingly small: make the score a computed quantity rather than a trusted one, tell the reader that most of the pipeline's value is one estimate, and start writing down what actually happened to the applications. Nothing here blocks publication as a methods report; issue 1 is worth fixing before the next scoring run rather than after.

## References

1. `src/lib/scoring.ts` — `ScoringSchema`, `buildPrompt`, and `scoreGrant`. The weights are model-returned (`weight: z.number().describe("relative weight 0.0-1.0; all weights should sum to ~1.0")`) with target weights supplied as prompt guidance; `overallScore` and `winProbability` are clamped, `weight` is not, and no server-side recomputation of the weighted average occurs.
2. `src/lib/mission.ts` — `ETC_MISSION.criteria`, the five criteria with `targetWeight` values 0.3 / 0.2 / 0.2 / 0.15 / 0.15 and the guidance strings, including "Higher score = lighter, more feasible" for effort.
3. `data/grants.json` — 13 opportunities, 12 scored. Source of every figure re-derived in this review: $11.65M headline, $1.62M probability-weighted, all twelve weight vectors summing to 1.00, all twelve expected values reproducing exactly, and the four score-versus-weighted-average deltas in Major issue 1.
4. OECD and JRC. *Handbook on Constructing Composite Indicators: Methodology and User Guide*, 2008 — the standard reference for the weighting and sensitivity questions §4.3 raises; §11 would be strengthened by engaging its treatment of weight sensitivity in small composite indices.
5. Kahneman, Daniel, Andrew M. Rosenfield, Linnea Gandhi, and Tom Blaser. "Noise: How to Overcome the High, Hidden Cost of Inconsistent Decision Making." *Harvard Business Review*, October 2016 — relevant to Minor issue 2: the case for measuring the spread of repeated judgments on identical inputs before trusting their ordering.

**[Verification Required]** Three items for the author rather than from this review. (a) My recomputation used the `criteria` arrays as stored in `data/grants.json`; if the UI ever re-normalises weights before display, the two discrepancies in Major issue 1 may present differently on screen than in the file. (b) The 12% estimate on the $9M ILAB opportunity drives two-thirds of the portfolio figure — that specific estimate deserves a human sanity check against the funder's published award history before the $1.6M number is shown to anyone outside the team. (c) I did not exercise the discovery, prospecting, digest, or proposal-drafting paths (§7–§9) against live sources; those sections' claims are reviewed as written, not as run.
