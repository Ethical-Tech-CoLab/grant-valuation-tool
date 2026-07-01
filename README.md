# ETC Grant Valuator

An AI-assisted grant **valuation and pipeline** tool for the Ethical Tech CoLab.
Capture prospective grants, let Claude score each one against ETC's mission, and
track the winners from application through to reporting and outcomes.

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
| **Funded projects to learn from** | Instrumentl prospecting | Real prior grantees under each program, with a "for ETC" takeaway on how to adapt them into a proposal. |
| **AI-assisted scoring** | Instrumentl, Good Grants, AmpliFund | Claude values each grant against the ETC mission: a 0–100 fit score, win probability, expected value, per-criterion breakdown, red flags, and a pursue / consider / pass recommendation. |
| **Pipeline lifecycle** | Blackbaud, Salesforce | Every opportunity moves through six stages on a board view. |
| **Deadline tracking** | Foundant | Due-soon flags and an upcoming-deadlines panel. |
| **Post-award tracking** | AmpliFund, Blackbaud | Awarded grants get reporting requirements, budget-utilization, and outcome notes. |
| **Dashboard analytics** | Fluxx | Pipeline value, weighted expected value, win rate, and top prospects at a glance. |

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

## How scoring works

`src/lib/mission.ts` holds the ETC profile — mission, focus areas, strengths,
constraints, and the weighted scoring criteria. This is the single source of
truth the model reads when valuing every grant. **Edit it to tune how the
scorer judges fit.**

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
    api/grants/…                 REST endpoints (CRUD + /score)
    api/prospect/route.ts        Web import (Tavily scrape → Claude structure)
  lib/
    mission.ts                   ETC profile & scoring criteria  ← tune this
    scoring.ts                   Anthropic valuation engine
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
