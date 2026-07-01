import type { Grant } from "@/lib/types";

export default function SubmissionPanel({ grant }: { grant: Grant }) {
  const s = grant.submission;
  if (
    !s ||
    (!s.mechanism && !s.formUrl && s.steps.length === 0 && s.materials.length === 0 && !s.notes)
  ) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">How to apply</h2>

      {(s.mechanism || s.formUrl) && (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          {s.mechanism && (
            <p className="text-sm font-medium text-slate-800">{s.mechanism}</p>
          )}
          {s.formUrl && (
            <a
              href={s.formUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-indigo-700 hover:underline"
            >
              Open application form ↗
            </a>
          )}
        </div>
      )}

      {s.steps.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Process</h3>
          <ol className="space-y-0">
            {s.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  {i < s.steps.length - 1 && <span className="h-6 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="pb-3 text-sm text-slate-700">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {s.materials.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Required materials</h3>
          <div className="flex flex-wrap gap-1.5">
            {s.materials.map((m, i) => (
              <span
                key={i}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {s.notes && <p className="mt-4 text-sm text-slate-600">{s.notes}</p>}
    </section>
  );
}
