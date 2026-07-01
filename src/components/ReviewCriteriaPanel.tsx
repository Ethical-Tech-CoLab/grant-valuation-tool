import type { Grant } from "@/lib/types";

export default function ReviewCriteriaPanel({ grant }: { grant: Grant }) {
  const criteria = grant.reviewCriteria ?? [];
  if (criteria.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">How the funder scores you</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        The funder&apos;s own review criteria — what an application is judged on. Write to these.
      </p>

      <ul className="mt-4 space-y-3">
        {criteria.map((c, i) => (
          <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="text-sm font-semibold text-slate-900">{c.criterion}</div>
              {c.weight && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                  {c.weight}
                </span>
              )}
            </div>
            {c.detail && <p className="mt-1 text-sm text-slate-600">{c.detail}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
