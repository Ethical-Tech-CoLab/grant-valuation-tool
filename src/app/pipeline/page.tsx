import Link from "next/link";
import { listGrants } from "@/lib/store";
import { PIPELINE_STAGES, STAGE_LABELS, type Grant, type PipelineStage } from "@/lib/types";
import { formatCurrency, deadlineStatus, recommendationColor } from "@/lib/format";
import AvailabilityBadge from "@/components/AvailabilityBadge";

export const dynamic = "force-dynamic";

// An opportunity you can act on now (or soon) vs. one whose cycle has ended.
const isActionable = (g: Grant) =>
  g.availability === "open" ||
  g.availability === "upcoming" ||
  g.availability === "rolling";
const isDormant = (g: Grant) =>
  g.availability === "closed" || g.availability === "invite-only";

export default async function PipelinePage() {
  const grants = await listGrants();

  const byStage = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = grants.filter((g) => g.stage === stage);
      return acc;
    },
    {} as Record<PipelineStage, Grant[]>,
  );

  const actionable = grants.filter(isActionable).length;
  const dormant = grants.filter(isDormant).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {grants.length} {grants.length === 1 ? "opportunity" : "opportunities"} across
            the funnel
            {(actionable > 0 || dormant > 0) && (
              <>
                {" · "}
                <span className="font-medium text-emerald-700">{actionable} open / upcoming</span>
                {dormant > 0 && (
                  <span className="text-slate-400"> · {dormant} closed</span>
                )}
              </>
            )}
            .
          </p>
        </div>
        <Link
          href="/grants/new"
          className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add grant
        </Link>
      </div>

      {grants.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-700">
                  {STAGE_LABELS[stage]}
                </h2>
                <span className="text-xs text-slate-400">{byStage[stage].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage].map((g) => (
                  <GrantCard key={g.id} grant={g} />
                ))}
                {byStage[stage].length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-300">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GrantCard({ grant }: { grant: Grant }) {
  const deadline = deadlineStatus(grant.deadline);
  const dormant = isDormant(grant);
  return (
    <Link
      href={`/grants/${grant.id}`}
      className={`block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow ${
        dormant ? "opacity-60 hover:opacity-100" : ""
      }`}
    >
      {grant.availability && (
        <div className="mb-1.5">
          <AvailabilityBadge
            availability={grant.availability}
            note={grant.availabilityNote}
            size="xs"
          />
        </div>
      )}
      <div className="text-sm font-medium text-slate-900">{grant.name}</div>
      <div className="mt-0.5 truncate text-xs text-slate-500">
        {grant.funder || "Unknown funder"}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">
          {formatCurrency(grant.amount)}
        </span>
        {grant.scoring && (
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${recommendationColor(
              grant.scoring.recommendation,
            )}`}
          >
            {grant.scoring.overallScore}
          </span>
        )}
      </div>
      {deadline.tier !== "none" && (
        <div
          className={`mt-1.5 text-[11px] ${
            deadline.tier === "urgent" || deadline.tier === "past"
              ? "text-rose-600"
              : deadline.tier === "soon"
                ? "text-amber-600"
                : "text-slate-400"
          }`}
        >
          {deadline.label}
        </div>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <h2 className="text-lg font-medium text-slate-900">No grants yet</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add your first opportunity to start valuing it.
      </p>
      <Link
        href="/grants/new"
        className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        + Add grant
      </Link>
    </div>
  );
}
