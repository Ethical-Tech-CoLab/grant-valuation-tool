import Link from "next/link";
import { listGrants } from "@/lib/store";
import { scoringConfigured } from "@/lib/scoring";
import { buildDigest } from "@/lib/digest";
import type { DigestItem } from "@/lib/digest";
import type { Grant } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  deadlineStatus,
  recommendationColor,
} from "@/lib/format";

const TIER_STYLES: Record<DigestItem["tier"], { dot: string; label: string }> = {
  urgent: { dot: "bg-rose-500", label: "text-rose-600" },
  soon: { dot: "bg-amber-500", label: "text-amber-600" },
  attention: { dot: "bg-slate-300", label: "text-slate-400" },
};

export const dynamic = "force-dynamic";

const OPEN_STAGES = ["prospect", "scoring", "drafting", "submitted"] as const;
const isOpen = (g: Grant) => (OPEN_STAGES as readonly string[]).includes(g.stage);

export default async function Dashboard() {
  const grants = await listGrants();

  const open = grants.filter(isOpen);
  const awarded = grants.filter((g) => g.stage === "awarded");
  const rejected = grants.filter((g) => g.stage === "rejected");

  const pipelineValue = open.reduce((sum, g) => sum + (g.amount || 0), 0);
  const expectedValue = open.reduce(
    (sum, g) => sum + (g.scoring?.expectedValue || 0),
    0,
  );
  const awardedValue = awarded.reduce(
    (sum, g) => sum + (g.award?.awardedAmount || g.amount || 0),
    0,
  );
  const decided = awarded.length + rejected.length;
  const winRate = decided > 0 ? Math.round((awarded.length / decided) * 100) : null;

  const upcoming = open
    .filter((g) => g.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6);

  const topProspects = open
    .filter((g) => g.scoring)
    .sort((a, b) => (b.scoring!.overallScore || 0) - (a.scoring!.overallScore || 0))
    .slice(0, 6);

  const digest = buildDigest(grants);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Grant pipeline health for the Ethical Tech CoLab.
        </p>
      </div>

      {!scoringConfigured() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          AI scoring is disabled — set <code className="font-mono">ANTHROPIC_API_KEY</code>{" "}
          in <code className="font-mono">.env.local</code> to enable valuations.
        </div>
      )}

      {grants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <h2 className="text-lg font-medium text-slate-900">Get started</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a grant opportunity to begin valuing your pipeline.
          </p>
          <Link
            href="/grants/new"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Add grant
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Active pipeline value"
              value={formatCurrency(pipelineValue)}
              hint={`${open.length} open ${open.length === 1 ? "grant" : "grants"}`}
            />
            <Stat
              label="Weighted expected value"
              value={formatCurrency(expectedValue)}
              hint="Σ amount × win probability"
            />
            <Stat
              label="Win rate"
              value={winRate === null ? "—" : `${winRate}%`}
              hint={`${awarded.length} won · ${rejected.length} lost`}
            />
            <Stat
              label="Awarded to date"
              value={formatCurrency(awardedValue)}
              hint={`${awarded.length} ${awarded.length === 1 ? "award" : "awards"}`}
            />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Priority actions</h2>
                <p className="text-xs text-slate-500">
                  What to work on next across the pipeline, ranked by urgency.
                </p>
              </div>
              <Link href="/pipeline" className="text-xs text-slate-400 hover:text-slate-600">
                View pipeline →
              </Link>
            </div>
            {digest.length === 0 ? (
              <Empty>Nothing needs attention — every active grant is scored, drafted, and ready.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {digest.map((item) => {
                  const tier = TIER_STYLES[item.tier];
                  return (
                    <li key={item.grantId}>
                      <Link
                        href={`/grants/${item.grantId}`}
                        className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tier.dot}`} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {item.grantName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.reason} ·{" "}
                              <span className={tier.label}>{item.deadlineLabel}</span>
                            </div>
                          </div>
                        </div>
                        <span className="ml-3 shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {item.action}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Upcoming deadlines" href="/pipeline">
              {upcoming.length === 0 ? (
                <Empty>No open grants with deadlines.</Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {upcoming.map((g) => {
                    const d = deadlineStatus(g.deadline);
                    return (
                      <li key={g.id}>
                        <Link
                          href={`/grants/${g.id}`}
                          className="flex items-center justify-between px-1 py-2.5 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {g.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(g.deadline)}
                            </div>
                          </div>
                          <span
                            className={`ml-3 shrink-0 text-xs font-medium ${
                              d.tier === "urgent" || d.tier === "past"
                                ? "text-rose-600"
                                : d.tier === "soon"
                                  ? "text-amber-600"
                                  : "text-slate-400"
                            }`}
                          >
                            {d.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Top prospects" href="/pipeline">
              {topProspects.length === 0 ? (
                <Empty>No scored grants yet. Run an AI valuation to rank prospects.</Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {topProspects.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/grants/${g.id}`}
                        className="flex items-center justify-between px-1 py-2.5 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-800">
                            {g.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            EV {formatCurrency(g.scoring!.expectedValue)}
                          </div>
                        </div>
                        <span
                          className={`ml-3 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${recommendationColor(
                            g.scoring!.recommendation,
                          )}`}
                        >
                          {g.scoring!.overallScore} · {g.scoring!.recommendation}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link href={href} className="text-xs text-slate-400 hover:text-slate-600">
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-slate-400">{children}</p>;
}
