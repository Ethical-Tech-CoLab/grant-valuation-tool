# The ETC Grant Valuator

### A Research Report on a Decision-Support Tool for Valuing and Prioritising Grant Opportunities

*Prepared as a plain-language review of the Grant Valuator research prototype*
*based on the software and documentation contained in this repository*

---

## Foreword

Every research group that depends on grant funding faces the same quiet
arithmetic. There are more funding calls than there are people to write
applications for them. Each application costs weeks of senior time, and most
applications fail. Choosing which two or three opportunities to pursue out of
twenty is therefore one of the most consequential decisions a small research
unit makes, and it is usually made informally: a hurried conversation, a shared
sense that one funder "feels right", a deadline that happens to be closest.

The Grant Valuator is a research prototype built to make that reasoning
explicit. It asks a small organisation to write down what it is for, then
scores each funding opportunity against that written statement, records the
reasoning behind every score, and puts the resulting numbers side by side so
they can be compared and argued with. This report explains, in non-technical
language, what the tool does, exactly how it arrives at a number, what each of
those numbers means, and what it cannot do.

---

## 1. Executive Summary

1.1 The Grant Valuator is a small internal software tool built for the NYU
Ethical Tech CoLab (ETC), a research collaboration between New York
University's Center for Global Affairs and Microsoft Research. It helps the
team decide which grant opportunities are worth applying for, and then tracks
the chosen ones from first sighting through to an award or a rejection.

1.2 The tool holds a written profile of the organisation: its mission, its
focus areas, its current research projects, its strengths, and its practical
constraints. Every funding opportunity is judged against that profile rather
than against a general notion of quality. If the organisation's priorities
change, the profile is edited and the judgments change with it.

1.3 Each opportunity is assessed on five criteria: mission alignment, funding
fit, competitiveness, effort, and strategic value. Each criterion receives a
score from 0 to 100 and carries a fixed weight. The weights are 30 per cent,
20 per cent, 20 per cent, 15 per cent, and 15 per cent respectively, and they
sum to 100 per cent. The weighted average of the five scores is the
opportunity's overall fit score.

1.4 Two further numbers are produced. Win probability is an estimate, between
zero and one, of the chance the organisation would actually be awarded the
grant if it applied. Expected value is the award amount multiplied by that
probability, and it is the only figure in the tool calculated by the software
itself rather than judged. A $500,000 opportunity with a one in five chance of
success is recorded as being worth $100,000 in expectation, which places it
below a $400,000 opportunity with a one in three chance.

1.5 The scoring is performed by a large language model, a computer system
trained to read and write text, which is asked to read the organisation's
profile alongside the description of the grant and return its judgments in a
fixed structure. The tool does not compute the fit score from a formula of its
own. It asks the model to apply the weights and it records the reasoning the
model gives for every individual score.

1.6 Alongside scoring, the tool gathers the surrounding evidence a grant
decision usually depends on and that is otherwise scattered across browser
tabs: who runs the funder, how the funder scores applications, what the funder
has funded before, how one actually applies, and which foundations are behind a
pooled fund.

1.7 The tool is a working internal prototype rather than a published product.
It stores its data in a single file on the machine it runs on, it has no user
accounts or access controls, and its documentation states plainly that it
should not be deployed beyond a single computer without authentication and a
proper database.

---

## 2. Background and Rationale

2.1 The problem. Grant seeking is a resource-allocation problem disguised as a
writing problem. A team with limited senior time must choose which calls to
answer, and the cost of answering one well is the cost of not answering
another. The choice is usually made without a written record of why one
opportunity was preferred over another, which means it cannot be revisited when
the outcome is known.

2.2 The gap. Commercial grant-management platforms exist and are widely used
in the philanthropic sector. The repository names several of them as
influences: Instrumentl for prospecting and funder intelligence, Foundant and
AmpliFund for deadlines and post-award reporting, Good Grants and Submittable
for review rubrics, Blackbaud and Salesforce for pipeline stages, and Fluxx for
portfolio analytics. These systems are built for organisations with dedicated
development staff and budgets to match. A four-person academic research
collaboration needs the same reasoning and almost none of the apparatus.

2.3 The response. The Grant Valuator takes the small number of ideas that
actually carry the weight in those systems, a written mission profile, a
weighted scorecard, a probability-weighted pipeline value, and a stage-based
lifecycle, and implements them at the scale of one research group. The design
choice throughout is that judgments should be written down, attributed, and
open to revision, not that they should be automated away.

2.4 The concept borrowed most directly from established practice is the
weighted pipeline. Nonprofit finance guidance has long recommended that
prospective revenue be discounted by the probability of receiving it before it
is reported to a board, so that a list of large but unlikely opportunities is
not mistaken for a forecast. The Grant Valuator applies the same discipline to
a research group's funding pipeline.

---

## 3. Objectives

The tool is designed to:

3.1 Force an explicit statement of what the organisation is for, and judge
every opportunity against that statement rather than against its headline
amount.

3.2 Produce a comparable score for each opportunity, broken into named
criteria with a written justification attached to each.

3.3 Separate the question of whether an opportunity fits from the question of
whether the organisation would realistically win it, and keep both visible.

3.4 Express the value of a pipeline in probability-weighted terms, so that a
large improbable grant is not confused with a smaller likely one.

3.5 Collect, in one place, the funder intelligence that a strong application
depends on: the review rubric, previously funded projects, key people, the
application mechanism, and the timeline.

3.6 Surface, at any moment, the single most pressing piece of work across the
whole pipeline, so that scarce attention goes to the grant that most needs it.

3.7 Keep every judgment traceable to the reasoning that produced it, and to
the date and the model version that produced it.

---

## 4. How the Valuation Works

The valuation rests on two documents and one calculation. The first document
is the organisational profile. The second is the description of the grant. The
calculation is the weighted average that turns five judgments into one number.

### 4.1 The organisational profile

The profile is a single editable file that the repository describes as the one
source of truth the scorer reads. It contains:

- The mission statement, which describes ETC as exploring intervention
  opportunities at the intersection of emerging technologies and the human
  condition, prototyping interventions for migration, forced labour, internally
  displaced people, and refugees.
- Eleven focus areas, including technology for migration and displacement,
  technology against forced labour, artificial intelligence for disaster
  response and evacuation decisions, the ethical return of cultural artifacts,
  verifiable ethical claims in supply chains, trust infrastructure, climate
  accountability, and artificial intelligence safety.
- Four current research projects, each stated as a question: how can artificial
  intelligence inform evacuation decisions; how can technology support the
  ethical return of cultural artifacts; how can ethical claims in supply chains
  be made verifiable; and how can artificial intelligence help practitioners
  rehearse high-stakes diplomacy. These give the scorer something concrete to
  compare a funding call against.
- Five stated strengths and three stated constraints. The constraints matter as
  much as the strengths: they say that ETC prefers grants funding applied
  research and staff time over pure overhead, that its strongest fit is
  human-centred interventions rather than general-purpose software, and that
  work requiring capabilities it does not have, such as large clinical trials
  or hardware manufacturing, is out of scope.
- A breadth note, added after an early version of the tool proved too narrow.
  It instructs the scorer that ETC is technology-agnostic, that artificial
  intelligence is one tool among several, that data infrastructure and civic
  technology are equally in scope, that corporate funders are as welcome as
  foundations, and that a grant must not be penalised merely for not being
  about artificial intelligence.

### 4.2 The five criteria and their weights

Each opportunity is scored from 0 to 100 on five criteria, each carrying a
fixed target weight. In plain terms:

Mission alignment, weight 30 per cent. How directly the funder's stated
priorities overlap ETC's mission, focus areas, and current projects. This
carries the largest weight because it is the criterion the organisation has
least ability to change. A funder that does not care about displacement or
forced labour cannot be persuaded to, and every other advantage is spent
against that wall.

Funding fit, weight 20 per cent. Whether the size of the award, the costs the
funder allows, and the type of grant match what ETC actually needs, namely
applied research, prototyping, and researcher time. A grant that pays only for
equipment, or that requires matching funds the organisation does not have, can
be a perfect thematic match and still be unusable.

Competitiveness, weight 20 per cent. How strong an ETC application would be
against the likely applicant pool, given its track record and its backing by
NYU's Center for Global Affairs and Microsoft Research. This is deliberately a
judgment about the competition and not only about the applicant.

Effort and feasibility, weight 15 per cent. How heavy the application and
reporting burden is relative to the team's capacity. This criterion is scored
in the opposite direction to intuition: a higher score means a lighter and more
feasible process. It exists because the true cost of a grant application is
senior time, and a team with limited grant-writing bandwidth pays that cost
whether or not it wins.

Strategic value, weight 15 per cent. Whether winning would build reputation,
relationships, or capabilities that compound beyond the money itself, and
whether it extends the projects already under way. This is the criterion that
allows a modest award from a well-placed funder to outrank a larger cheque from
a peripheral one.

### 4.3 The arithmetic

4.3.1 The overall fit score is the weighted average of the five criterion
scores. Each criterion score is multiplied by its weight and the five products
are added together. Taking an actual entry from the repository's pipeline, one
opportunity was scored 78 on mission alignment, 80 on funding fit, 48 on
competitiveness, 62 on effort, and 85 on strategic value. Applying the weights
gives 23.4 plus 16.0 plus 9.6 plus 9.3 plus 12.75, which is 71.05, recorded as
a fit score of 71.

4.3.2 The weights are described in the code as guidance rather than as a fixed
formula. The scorer is asked to return its own weight for each criterion,
subject to the requirement that the weights sum to approximately one. In
practice, across all twelve scored opportunities held in the repository, the
returned weights were identical to the target weights in every case, so the
scorecard has behaved as a fixed instrument. Section 10 returns to why this
distinction matters.

4.3.3 Two safeguards are applied by the software after the judgment is
returned. Any fit score is rounded to a whole number and confined to the range
0 to 100. Any win probability is confined to the range 0 to 1. These prevent a
malformed judgment from propagating into the totals as an impossible figure.

### 4.4 Win probability and expected value

4.4.1 Win probability is a separate estimate from the fit score, and the
distinction is the tool's most important structural idea. Fit answers whether
the organisation should want the grant. Win probability answers whether it
would get it. The two come apart constantly. In the recorded pipeline, one
opportunity scores 71 for fit but carries a win probability of 22 per cent,
because it is a high-profile pooled fund attracting a very large applicant
field. Another scores 68 for fit with a win probability of 35 per cent,
because the field is narrower.

4.4.2 Expected value is the award amount multiplied by the win probability,
rounded to the nearest dollar. It is computed by the software from the stored
amount and the estimated probability, not asserted by the scorer. It is the one
number in the tool that cannot be argued with once its two inputs are agreed.

4.4.3 The purpose of expected value is to make opportunities of different
sizes and different odds comparable on a single axis. In the repository's
pipeline, a $400,000 opportunity at 35 per cent carries an expected value of
$140,000, while a $500,000 opportunity at 22 per cent carries $110,000. The
larger headline figure is the smaller prospect. Expected value is not a
prediction of what any single grant will pay. It is a way of ranking bets, and
it is meaningful only across a portfolio.

4.4.4 The recorded pipeline illustrates the gap the measure is meant to close.
Thirteen opportunities carry a combined headline value of roughly $11.7
million. The probability-weighted value of the same pipeline is roughly $1.6
million. Reporting the first figure to a board without the second would be
misleading, and the largest single contributor to the difference is one
$9 million government opportunity assessed at a 12 per cent chance of success.

### 4.5 Recommendation and red flags

4.5.1 The scorer must return one of three verdicts. Pursue means a strong fit
worth applying for. Consider means borderline. Pass means not worth the effort.
The verdict is returned as a judgment rather than derived from a score
threshold, so a high fit score does not automatically produce a recommendation
to pursue.

4.5.2 The scorer must also return a list of red flags: concrete disqualifiers
or mismatches such as an eligibility restriction, the wrong type of funding, or
an unrealistic scope. The list may be empty. Red flags are displayed separately
from the score, on the reasoning that a single disqualifying fact should be
read on its own rather than diluted into an average.

4.5.3 Every criterion carries a written rationale of one or two sentences.
This is the element that makes the score reviewable. A colleague who disagrees
with a verdict can find the specific sentence they disagree with rather than
arguing with a number.

---

## 5. Reading the Results

5.1 The valuation panel. For a scored grant the tool shows four headline
figures: the fit score out of 100, the recommendation, the win probability as
a percentage, and the expected value in dollars with the multiplication that
produced it shown underneath. Below them sits a plain-language verdict of two
to four sentences written for a programme director, then the five criteria as
labelled bars with their scores, weights, and rationales, then the red flags.
The date of the assessment and the name of the model that produced it are
recorded at the foot of the panel, so an old judgment can be identified as old.

5.2 The recommendation colours. Pursue is shown in green, consider in amber,
pass in red. This is the only place where the tool compresses its reasoning
into a signal, and it always appears next to the number and the summary that
justify it.

5.3 The dashboard. Four figures describe the health of the whole pipeline.
Active pipeline value is the sum of the headline amounts of every opportunity
not yet decided. Weighted expected value is the sum of the individual expected
values across the same set. Win rate is the share of decided opportunities that
were awarded, shown only once at least one has been decided. Awarded to date is
the total value actually won. The first two figures are deliberately displayed
side by side so that the gap between ambition and expectation is visible at a
glance.

5.4 What the results do not say. A fit score is not a measure of the quality
of a grant, nor of the funder. It is a measure of the match between one
organisation and one opportunity at one moment. The same call scored against a
different profile would produce a different number, which is the intended
behaviour.

---

## 6. The Evidence Layers Behind a Score

A score is only as good as what the scorer was told. The tool therefore
collects several layers of evidence about each opportunity, each of which can
be gathered automatically or typed in by hand.

6.1 The funder's own review criteria. This is the rubric the funder uses to
judge applications, with the funder's stated weights where they publish them,
and a note on what they say they are looking for on each point. Capturing it
serves two purposes. It is fed into the scorer, where it sharpens the
competitiveness judgment, and it is fed into the proposal drafter, so that the
draft is written against the criteria that will actually decide it. In the
recorded pipeline only one of thirteen opportunities has this layer filled in,
which is an honest indication of how hard published rubrics are to find.

6.2 Previously funded projects. Up to four real prior grantees under the same
programme, each with what the project did, the amount, the year, links to the
award announcement and to the grantee organisation, and a link to the actual
proposal where one is public. Each carries a one-line note on how ETC could
adapt the example. This layer is present for nine of the thirteen recorded
opportunities and is the most reliable evidence of what a funder actually
rewards, as distinct from what it says it rewards.

6.3 Key people and the funding coalition. Each opportunity can carry the
funder's organisational page and the named individuals who run the programme
with their roles. Separately, for pooled or collaborative funds, the tool
records every named member foundation, what kind of body it is, and its role or
commitment. The distinction matters for large collaboratives. The pipeline
includes an opportunity backed by a coalition of ten foundations that together
committed $500 million over five years to public-interest work on artificial
intelligence, and knowing which ten they are is more useful for relationship
building than knowing the name of the fund. A member of a coalition can be
manually flagged as a priority relationship and annotated.

6.4 The submission process. How one actually applies: the mechanism, whether
that is an online portal or a letter of inquiry followed by an invited full
proposal, a direct link to the form, the ordered steps, and the required
materials.

6.5 Timeline and constraints. When applicants hear back, how long the funding
period runs, the dated milestones from opening to notification to funding
start, and the eligibility restrictions and requirements. Constraints are
recorded as plain sentences, for example that applicants must be United States
nonprofits or that outputs must be open source, because these are the facts
that turn an attractive opportunity into an ineligible one.

6.6 Availability. Separately from where the organisation stands with an
opportunity, the tool records whether the opportunity itself is open, upcoming,
rolling, closed, or by invitation only. This exists so that a closed funding
cycle can stay visible and correctly labelled rather than being deleted or
misfiled as a rejection. A fund worth applying to next year is not the same
thing as a fund that turned you down.

---

## 7. Finding Opportunities

The tool offers two ways of getting a grant into the pipeline without typing
it, and both work the same way in outline: a web search service retrieves the
text of relevant pages, and the language model reads that text and fills in the
structured fields.

7.1 Import. The user pastes either the web address of a funding call or a
description of what they are looking for. The tool retrieves the page or the
search results, then runs five further searches in parallel, each targeting one
of the evidence layers described above: the funder's leadership, its past
grantees, its review criteria, the coalition backing it, and the application
process. All of that text is passed to the model, which returns the structured
grant record. Nothing is saved automatically. The fields pre-fill a form that
the user reviews and edits before saving.

7.2 Discovery. Rather than waiting for someone to find a call, the tool can go
looking. It builds six search queries directly from the organisational profile,
covering technology for migration and displacement, forced labour and supply
chain traceability, artificial intelligence for disaster response, human rights
technology, cultural heritage and provenance, and responsible artificial
intelligence, each anchored to the current year. The results are gathered and
the model is asked to identify distinct, currently open opportunities that
match the profile, rating each as a strong, possible, or weak fit and marking
whether it appears open, closed, or unclear.

7.3 Guards against duplication and invention. Anything the model returns is
filtered twice. Opportunities already in the pipeline are removed by comparing
both names and addresses, and anything clearly closed is discarded. The
instructions given to the model state repeatedly that it must only return
opportunities actually present in the retrieved text and must never invent one.
That instruction reduces the risk of a fabricated funding call but does not
eliminate it, which is why nothing enters the pipeline without a human pressing
save.

---

## 8. The Pipeline and the Priority Digest

8.1 Six stages. Every opportunity sits in one of six stages: prospect,
scoring, drafting, submitted, awarded, or rejected. The first four count as
open and contribute to the pipeline totals. The last two are decided and
contribute to the win rate. Awarded grants gain a further record: the amount
actually awarded, the award date, funds spent to date, written outcomes, and a
list of reporting obligations each with a due date and a status.

8.2 Deadline bands. A deadline is converted into a number of whole days
remaining and then into one of five labels. Past due, due today, urgent at
fourteen days or fewer, approaching at forty five days or fewer, and
comfortable beyond that. The fourteen day and forty five day boundaries are the
tool's only fixed time thresholds, and they correspond roughly to the point at
which a serious application can no longer be started from scratch and the point
at which drafting should already have begun.

8.3 The priority digest. The dashboard carries a ranked list of what the team
should work on next. Unlike everything else described so far, this involves no
artificial intelligence at all. It is a simple rule applied to what the tool
already knows about each grant, and it is worth setting out fully because it
encodes the project's view of what actually matters.

8.3.1 Only opportunities in the prospect, scoring, or drafting stages are
considered. Once something is submitted it is out of the team's hands, and
awarded or rejected grants are settled.

8.3.2 For each remaining opportunity the rule finds the single most pressing
gap and assigns it an urgency figure. An open grant whose deadline has already
passed scores 100, the loudest possible signal, because it means something has
gone wrong. A scored grant with no proposal draft scores 55. An unscored grant
scores 45. A drafted grant with no tailored guidance scores 30. A grant with
everything in place, awaiting only submission, scores 25. A grant the scorer
recommended passing on scores 10, so it sinks to the bottom of the list without
disappearing from it.

8.3.3 A second figure reflects the deadline. A passed deadline adds 90.
Fourteen days or fewer adds 70. Forty five days or fewer adds 40. Beyond that
the figure decays gently with distance, starting at 25 and falling by one point
for every ten additional days, never below zero. An opportunity with no
deadline at all adds nothing.

8.3.4 The two figures are added and the list is sorted by the total, with the
six highest shown. The effect is that urgency and incompleteness compound. A
grant that is neither scored nor close to its deadline waits. A drafted grant
with eleven days left rises to the top. The design assumption is that the most
common failure in a small team is not choosing the wrong grant but running out
of time on the right one.

---

## 9. What the Tool Writes

9.1 Proposal drafting. For any grant, the tool can produce an initial proposal
recommendation: a suggested project title, a core thesis of three to five
sentences, three to six key aspects to lead with and why each matters to this
particular funder, a suggested outline of sections with guidance on what each
should contain, concrete points mapping ETC's work onto the funder's stated
criteria, what distinguishes ETC from the likely applicant pool, and the gaps
to address before submitting. Where the funder has published a required
structure, the draft follows it. This is explicitly a starting point for the
team to build on and not a submission.

9.2 Grantseeking guidance. The tool can also produce a tailored playbook for
an opportunity: a strategic read, between five and ten prioritised tips, and
three to six concrete next actions in order. The tips are sorted into seven
categories that follow the arc of an application: positioning, funder research,
relationship building, proposal craft, budget, process, and pitfalls to avoid.

9.3 The basis of the guidance. Twelve established grantseeking principles are
written into the tool and given to the model as a lens rather than as content
to repeat. They are ordinary professional practice: that genuine fit is the
strongest predictor of winning; that funders should be researched through their
guidelines and their recent grants; that a relationship established before
applying makes a proposal expected rather than cold; that instructions must be
followed exactly because non-compliant applications are screened out before
merit is considered; that a statement of need should precede a description of
the solution; that outcomes should be measurable; that budgets should be honest
and match the narrative; that sustainability beyond the grant period should be
addressed; and that the classic failures are jargon, unfocused scope,
unsupported claims, and boilerplate. The model is instructed not to restate
these generically but to apply them to the specific funder, and every tip is
required to reference something concrete about the opportunity.

9.4 Reuse of what is already known. When guidance is generated, everything the
grant already carries is passed in: the funder's review criteria, the timeline
and constraints, the previously funded examples, and any prior valuation
including its red flags. Advice generated for a grant already flagged as a
weak fit is therefore expected to say so plainly rather than to coach an
application that should not be written.

---

## 10. Methodological Choices and Their Consequences

10.1 Why judgment rather than a formula. The tool could have scored grants by
counting keyword matches between a funding call and a list of focus areas. It
does not, because the question it is asking is genuinely interpretive: whether
a call for work on trust in digital systems is a fit for a group working on
verifiable claims in supply chains is a matter of reading, not of matching. The
cost of that choice is that the judgment is not reproducible in the strict
sense. Running the same grant twice may produce slightly different scores.

10.2 Where the weights come from. The five weights were set by the developer
as a considered statement of the organisation's priorities. They are not
derived from any analysis of past grant outcomes, because ETC does not yet have
enough decided applications to analyse. They are an honest declaration of
preference, and their most defensible property is that they are written down in
one place and can be changed deliberately rather than drifting.

10.3 The overall score is asserted, not calculated. This is the most
significant methodological weakness in the tool, and it deserves to be stated
plainly. The software instructs the scorer that the overall score must be the
weighted average of the criterion scores, but it does not recompute that
average itself. Recalculating the twelve scored opportunities in the repository
from their own criterion scores and weights shows the stated overall score
agreeing with the exact weighted average to within one point in every case,
with most differing by less than half a point. The instrument is behaving as
intended. But it is behaving that way because it was asked to, not because the
arithmetic is enforced, and that difference matters for a tool whose entire
claim is that its numbers are traceable.

10.4 Two recorded assessments contain a stray sixth criterion with a blank or
placeholder label and a weight of zero. It has no effect on any total, but it
is a small illustration of the same point: what a structured output guarantees
is a shape, not a meaning.

10.5 Why expected value is computed in software. In deliberate contrast to the
fit score, expected value is calculated by the program from the amount and the
probability. This was the right dividing line to draw. The inputs are
judgments; the multiplication is not.

10.6 Why the profile is a single editable file. Putting the organisational
profile in one place, separate from the scoring machinery, means that
disagreements about what the organisation is for are conducted where they
belong, in a statement of purpose, rather than being buried in the mechanics of
the scorer. The repository documents this explicitly and invites the reader to
edit it in order to tune how the scorer judges fit.

---

## 11. Limitations and Caveats

11.1 The scores are estimates produced by a language model and carry the
characteristic weaknesses of that method. They are plausible, internally
consistent, and articulate, and none of those qualities is evidence of
accuracy. A confidently reasoned win probability of 22 per cent has no
demonstrated relationship to the true frequency of success.

11.2 Win probability is unvalidated and, at present, unvalidatable. The
recorded pipeline contains no awarded and no rejected grants, so the win rate
figure on the dashboard is empty and no estimate has ever been checked against
an outcome. Until several dozen applications have been decided, the
probabilities should be read as relative rankings rather than as frequencies.
This is the single largest gap between what the tool displays and what it can
support.

11.3 The overall score is not enforced in software, as set out in section 10.3.

11.4 The tool does not know what it has not been told. A grant whose
description is thin will be scored thinly. The scorer is instructed to evaluate
conservatively and flag missing information when a description is absent, which
mitigates but does not remove the problem.

11.5 Imported information can be wrong. Automatically retrieved deadlines,
amounts, and eligibility rules are read from web pages by a language model.
They are frequently correct and occasionally not, and the eligibility rules are
exactly the facts on which a wasted application turns. Every imported field is
presented for review before saving, and that review is not optional in
practice.

11.6 Assessments go stale. A valuation records the date it was made, but
nothing prompts a re-score when a funder changes its priorities or a deadline
moves. The date stamp is the only defence against acting on an old judgment.

11.7 The tool models one organisation. The weights, the criteria, and the
profile are ETC's. Another group could reuse the structure, but none of the
numbers in this repository would transfer.

11.8 The data store is a single file with no access control, no protection
against two people writing at once, and no user accounts. The repository states
that this must be replaced with a proper database and that authentication must
be added before the tool is deployed anywhere shared, because the pipeline
contains strategy information about which funders are being approached and how
likely each is thought to be.

11.9 The tool depends on two external commercial services to do anything
beyond manual entry: one that provides access to the language model and one
that retrieves web pages. Without credentials for the first, scoring, drafting,
and guidance are disabled and the tool becomes a manual tracker. Without the
second, import and discovery disappear.

11.10 The publicly visible page for this project is a static overview only.
The working tool requires a server and credentials and runs on the team's own
machines.

---

## 12. Practical Nature of the Tool

12.1 The Grant Valuator is a web application built with an ordinary
contemporary software stack, run by a member of the team on their own computer
and reached through a browser. It requires no installation beyond fetching its
components, and it stores everything it knows in one structured text file
inside its own folder.

12.2 The recorded pipeline at the time of writing holds thirteen opportunities
from foundations, corporate funders, and United States government agencies,
ranging from $50,000 to $9 million. Twelve have been valued. One was
recommended for pursuit, nine for consideration, and two for passing. The
distribution is itself informative: an instrument that recommended pursuing
most of what it saw would not be doing useful work.

12.3 The commit history records the tool's development as a sequence of
deliberate additions rather than a single design: the initial scaffold, then
key people and funder pages, then timelines and funded examples, then a
broadening of the mission profile after the scorer proved too narrow towards
work on artificial intelligence, then discovery and coalition tracking, and
finally the priority digest. Each layer was added because a real decision
needed information the tool did not yet hold.

---

## 13. Intended Audience and Use

13.1 The immediate audience is the ETC team itself: a small research group
deciding where to spend limited grant-writing time. The repository is explicit
that this is a private internal tool.

13.2 The wider audience is anyone facing the same structural problem. Small
research units, civil society organisations, and university centres allocate
scarce senior attention across many funding calls without a written record of
why. The transferable contribution here is not the software but the discipline:
name your criteria, weight them, score against a written statement of purpose,
keep fit and probability apart, discount your pipeline by the odds, and record
the reasoning next to the number.

13.3 The tool is a decision aid and not a decision procedure. Nothing in it
submits an application, allocates a budget, or removes an opportunity from
consideration. Every action it takes ends at a screen where a person decides.

---

## 14. Conclusion

14.1 The Grant Valuator is a modest piece of software carrying a clear idea.
The idea is that the choice of which grants to pursue is a real analytic
question deserving a written answer, and that the two components of that
answer, whether an opportunity is right and whether it is winnable, should be
estimated separately and combined openly. Multiplying an award amount by an
honest estimate of the odds is elementary, and the discipline of doing it
consistently across a whole pipeline is what the tool actually supplies.

14.2 The prototype is candid about its own construction. Its weights are a
declaration of preference rather than a finding. Its win probabilities have
never been checked against an outcome, because no outcome has yet arrived. Its
overall score is asserted by the scorer rather than recomputed by the software.
Its data sits in a single unprotected file that its own documentation says must
be replaced before the tool goes anywhere. None of this is hidden, and the
scores carry their reasoning, their date, and the model that produced them, so
that a colleague can find the sentence they disagree with. For an internal
research prototype built to support a decision that is usually made without any
written record at all, that is a reasonable standard to have set.

---

## Attribution

Developed by Carolina Moron as part of masters research at the NYU Center for
Global Affairs (2026), under the Ethical Tech CoLab.

> Note: This report is a plain-language summary of a research prototype. The
> tool is an internal decision aid for academic research administration. Its
> valuations are estimates produced with the assistance of a language model,
> have not been validated against grant outcomes, and are not a substitute for
> the judgment of the researchers and administrators who decide which
> opportunities to pursue.
