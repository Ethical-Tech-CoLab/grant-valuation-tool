import type { Grant } from "@/lib/types";
import { formatDate, daysUntil } from "@/lib/format";

export default function LogisticsPanel({ grant }: { grant: Grant }) {
  const l = grant.logistics;
  if (
    !l ||
    (!l.decisionTimeline &&
      !l.grantPeriod &&
      l.keyDates.length === 0 &&
      l.constraints.length === 0)
  ) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Timeline &amp; constraints</h2>

      {(l.decisionTimeline || l.grantPeriod) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {l.decisionTimeline && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Expected to hear back
              </div>
              <div className="mt-1 text-sm font-medium text-amber-900">
                {l.decisionTimeline}
              </div>
            </div>
          )}
          {l.grantPeriod && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Grant period
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">{l.grantPeriod}</div>
            </div>
          )}
        </div>
      )}

      {l.keyDates.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Key dates</h3>
          <ol className="space-y-0">
            {l.keyDates.map((d, i) => {
              const days = daysUntil(d.date);
              const future = days !== null && days >= 0;
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                        future ? "bg-indigo-500" : "bg-slate-300"
                      }`}
                    />
                    {i < l.keyDates.length - 1 && (
                      <span className="h-8 w-px flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-3">
                    <div className="text-sm font-medium text-slate-800">{d.label}</div>
                    <div className="text-xs text-slate-500">
                      {d.date ? formatDate(d.date) : "TBD"}
                      {days !== null && days >= 0 && (
                        <span className="text-slate-400"> · in {days}d</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {l.constraints.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            Constraints &amp; requirements
          </h3>
          <ul className="space-y-1.5">
            {l.constraints.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
