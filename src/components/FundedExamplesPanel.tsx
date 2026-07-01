import type { Grant } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function FundedExamplesPanel({ grant }: { grant: Grant }) {
  if (!grant.fundedExamples || grant.fundedExamples.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Funded projects to learn from
      </h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Real projects this funder backed — reference points to model and adapt an ETC
        proposal on.
      </p>

      <ul className="mt-4 space-y-3">
        {grant.fundedExamples.map((ex, i) => (
          <li
            key={i}
            className="rounded-lg border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="text-sm font-semibold text-slate-900">
                {ex.url ? (
                  <a
                    href={ex.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 hover:underline"
                  >
                    {ex.grantee} ↗
                  </a>
                ) : (
                  ex.grantee
                )}
              </div>
              <div className="text-xs text-slate-500">
                {ex.amount ? formatCurrency(ex.amount) : ""}
                {ex.amount && ex.year ? " · " : ""}
                {ex.year}
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-600">{ex.project}</p>
            {ex.takeaway && (
              <p className="mt-2 rounded-md bg-indigo-50 px-3 py-1.5 text-xs text-indigo-800">
                <span className="font-semibold">For ETC:</span> {ex.takeaway}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
