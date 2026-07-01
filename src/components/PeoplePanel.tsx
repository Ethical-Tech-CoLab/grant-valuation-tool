import type { Grant } from "@/lib/types";

export default function PeoplePanel({ grant }: { grant: Grant }) {
  const hasPeople = grant.people.length > 0;
  if (!grant.orgLinkedIn && !hasPeople) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Who runs it</h2>
        {grant.orgLinkedIn && (
          <a
            href={grant.orgLinkedIn}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#0a66c2]/30 bg-[#0a66c2]/5 px-2.5 py-1 text-sm font-medium text-[#0a66c2] hover:bg-[#0a66c2]/10"
          >
            <LinkedInMark /> Organization page ↗
          </a>
        )}
      </div>

      {hasPeople ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {grant.people.map((p, i) => (
            <li key={i} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                {p.role && <div className="text-xs text-slate-500">{p.role}</div>}
              </div>
              {p.linkedin ? (
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#0a66c2] hover:underline"
                >
                  <LinkedInMark /> Profile ↗
                </a>
              ) : (
                <span className="text-xs text-slate-300">no profile</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No named contacts yet — add them, or re-import to fetch leadership.
        </p>
      )}
    </section>
  );
}

function LinkedInMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
