# ETC Grant Valuator

**🌐 Live overview: [ethical-tech-colab.github.io/grant-valuation-tool](https://ethical-tech-colab.github.io/grant-valuation-tool/)**

An AI-assisted grant **valuation and pipeline** tool for the
[NYU Ethical Tech CoLab](https://ethical-tech-colab.github.io/website/) — a
research collaboration between NYU's Center for Global Affairs and Microsoft
Research. Capture prospective grants, let Claude score each one against ETC's
mission, and track the winners from application through to reporting and outcomes.

> The link above is a static overview page (hosted on GitHub Pages). The full
> tool — AI scoring, web import, and proposal drafting — needs a Node server and
> an `ANTHROPIC_API_KEY`; run it locally with `npm run dev` or deploy it to a
> host such as Vercel (see [Getting started](#getting-started)).

Built with Next.js 16, React 19, Tailwind v4, and the Anthropic SDK — matching
the ETC website stack.

## What it does

The tool models the full grant lifecycle as a pipeline:

```
prospect → scoring → drafting → submitted → awarded → rejected
```

Feature highlights (drawn from leading grant-management platforms):

| Capability | Inspired by | What it does here |
|---|---|---|
| **Web prospecting / import** | Instrumentl | Paste a grant URL or a search query — Tavily scrapes the web and Claude structures it into grant fields that pre-fill the form. |
| **Who runs it** | Instrumentl relationship intel | Each grant carries the funder's LinkedIn page and the key people who run it (name, role, LinkedIn) — captured on import or entered manually. |
| **Timeline & constraints** | Foundant / AmpliFund | Per grant: when to expect a decision, the grant period, a key-date timeline, and eligibility constraints/requirements. |
| **Funder review criteria** | Good Grants / Submittable rubrics | Capture *how the funder scores applications* — their rubric, weights, and what they look for. Extracted on import (a dedicated web search hunts for it) and fed into both the scorer and the proposal draft so you write to what actually wins. |
| **Funded projects to learn from** | Instrumentl prospecting | Real prior grantees under each program, with a "for ETC" takeaway on how to adapt them into a proposal. |
| **AI-assisted scoring** | Instrumentl, Good Grants, AmpliFund | Claude values each grant against the ETC mission: a 0–100 fit score, win probability, expected value, per-criterion breakdown, red flags, and a pursue / consider / pass recommendation. |
| **Tailored proposal draft** | Grantboost / proposal AI | One click turns a grant into an initial proposal recommendation: a project title, core thesis, the key aspects to lead with, a suggested outline, how ETC maps onto the funder's criteria, differentiators, and gaps to shore up. |
| **Recommendations & tips** | GrantStation public grantseeking guidance | A funder-tailored grantseeking playbook per grant: a strategic read, prioritized tips across positioning, funder research, relationship, proposal craft, budget, process, and pitfalls, plus concrete next actions before the deadline. Grounded in established best practices, written for this specific opportunity. |
| **Pipeline lifecycle** | Blackbaud, Salesforce | Every opportunity moves through six stages on a board view. |
| **Deadline tracking** | Foundant | Due-soon flags and an upcoming-deadlines panel. |
| **Post-award tracking** | AmpliFund, Blackbaud | Awarded grants get reporting requirements, budget-utilization, and outcome notes. |
| **Dashboard analytics** | Fluxx | Pipeline value, weighted expected value, win rate, and top prospects at a glance. |
| **Priority actions digest** | Instrumentl task feeds | A cross-pipeline, deadline-aware to-do list on the dashboard: it finds each active grant's most pressing gap (not scored, no draft, no tips, deadline slipping) and ranks them, so the team always sees what to work on next. |

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

Keys:

- `ANTHROPIC_API_KEY` (from https://console.anthropic.com/) — powers AI scoring
  and structuring. Without it the app still runs, but "Score with AI" is disabled.
- `TAVILY_API_KEY` (from https://tavily.com/) — powers "Import from the web".
  Without it, the import box is hidden and you enter grants manually.

## Prospecting: import from the web

On **Add grant**, paste a grant/funder URL or a search query (e.g. "responsible
AI grants for nonprofits 2026"). The server uses Tavily to scrape the page or
search results (`src/lib/prospecting.ts`), then Claude structures the content
into grant fields — name, funder, amount, deadline, focus areas, and a summary —
which pre-fill the form for you to review and save.

## Recommendations & tips

On each grant's detail page, **Get tips with AI** generates a grantseeking
playbook tailored to that funder (`src/lib/recommendations.ts`): a strategic
read of the opportunity, 5–10 prioritized tips spanning positioning, funder
research, relationship-building, proposal craft, budget, process, and common
pitfalls, plus an ordered list of next actions before the deadline. The engine
is grounded in well-established grantseeking best practices — the kind of
guidance nonprofit resources like [GrantStation](https://grantstation.com/)
publish freely — but the model writes advice specific to *this* grant, funder,
and ETC's actual strengths, reusing everything the grant already knows (mission,
the funder's review criteria, timeline/constraints, funded examples, and any
prior AI valuation). It never copies or re-hosts third-party content.

## How scoring works

`src/lib/mission.ts` holds the ETC profile — mission, focus areas (responsible
AI, algorithmic accountability, digital equity, climate & technology, anti-human-
trafficking tech, arts & technology, technology governance/policy, and good use
of technology broadly), strengths, constraints, and the weighted scoring
criteria. It also carries a `breadth` note telling the scorer ETC is
**technology-agnostic** (AI is one tool among many; non-AI grants and private-
sector/corporate funders are fully in scope). This is the single source of truth
the model reads when valuing every grant. **Edit it to tune how the scorer judges
fit.**

`src/lib/scoring.ts` sends a grant plus that profile to Claude
(`claude-opus-4-8`) and gets back a validated, structured valuation via the
SDK's structured-outputs helper. Expected value is computed server-side as
`amount × win probability`.

## Project layout

```
src/
  app/
    page.tsx                     Dashboard (metrics, deadlines, top prospects)
    pipeline/page.tsx            Stage board
    grants/new/page.tsx          Add-grant form
    grants/[id]/page.tsx         Grant detail: scoring + award tracking
    api/grants/…                 REST endpoints (CRUD + /score + /proposal)
    api/prospect/route.ts        Web import (Tavily scrape → Claude structure)
  lib/
    mission.ts                   ETC profile & scoring criteria  ← tune this
    scoring.ts                   Anthropic valuation engine
    proposal.ts                  Anthropic proposal-draft engine
    recommendations.ts           Anthropic grantseeking tips engine
    prospecting.ts               Tavily + Claude web import
    store.ts                     JSON data store
    types.ts                     Domain types
    format.ts                    Presentation helpers
  components/                    Nav, GrantForm, ScorePanel, AwardPanel, StageBadge
```

## Data storage

Grants are stored in `data/grants.json` (gitignored — it holds org-specific
pipeline data). This keeps the app zero-config to run, but the store is **not**
safe for concurrent writes or multi-user production use. When you're ready to
harden it, replace `src/lib/store.ts` with a real database (Postgres + Prisma,
SQLite, etc.) — the rest of the app only touches grants through that module.

## Roadmap ideas

- Authentication (staff-only access) before deploying anywhere shared
- Swap the JSON store for a database
- Email/Slack reminders for approaching deadlines and reports
- Export pipeline reports to PDF/spreadsheet

## Deployment

This is a private ETC tool. Add authentication and move to a database before
deploying beyond localhost, since the pipeline contains sensitive strategy data.

---

## Peer Review

The full independent academic peer review of `GrantValuator-Paper.md` is in [PEER-REVIEW.md](PEER-REVIEW.md) (also available as [Word](peer-review/grant-valuator-Peer-Review.docx) under [`peer-review/`](peer-review/)).

**Recommendation:** Minor revisions — an unusually well-checked report; every figure in §4 reproduced from `data/grants.json` on the first attempt.

**What the review found:**

- **In 2 of 12 records the overall score is not the weighted average of the model's own criterion scores.** Recomputing from each record's stored criteria: 53.00 → stored 54, and 61.35 → stored 62 (the other two deltas, 48.50 → 49 and 68.50 → 68, are ordinary rounding). `scoreGrant` clamps `overallScore` and `winProbability` but never recomputes the average from the criteria array returned in the same response. A three-line change makes the report's central claim true by construction.
- **Two-thirds of the portfolio's expected value rests on a single unvalidated estimate.** The $9M ILAB opportunity at 12% contributes $1.08M of the pipeline's $1.62M. §4.4.4 calls it "the largest single contributor to the difference"; it is the majority of the result, and halving the estimate cuts pipeline value by a third.
- **Win probability is the load-bearing number and nothing calibrates it.** The tool already tracks applications through to award or rejection — the feedback loop is one step from closing and is not closed.
- **§1.3 asserts fixed weights; §4.3.2 says they are guidance.** The body is correct: the scorer returns its own weights. They matched the targets in all twelve records (verified — every weight vector sums to exactly 1.00), but that is an empirical result, not a guarantee.
- **`weight` is the one model-returned quantity with no safeguard** — unclamped, unnormalised, and never checked against the five expected criteria keys.
- Minor: an unpriced opportunity is silently valued at $0 and sorts below a $50k grant at 15%; no stability check (re-scoring the same grant to see whether 71 is reproducible to ±1 or ±8); the scoring model and its settings are never named in the report; no LICENSE.

**Verified against the repository:** 13 opportunities of which 12 are scored; $11.65M headline against the paper's "roughly $11.7 million"; $1.62M probability-weighted against "roughly $1.6 million"; the §4.3.1 worked example (78/80/48/62/85 → 71.05, recorded as 71) exact; expected value reproducing exactly in all twelve records.
