"use client";

import { useState } from "react";
import type { Grant, ProposalDraft } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function ProposalPanel({
  grant,
  onDrafted,
}: {
  grant: Grant;
  onDrafted: (updated: Grant) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proposal = grant.proposal;

  async function runDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grants/${grant.id}/proposal`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proposal drafting failed");
      onDrafted(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proposal drafting failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Proposal recommendation</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            An AI starting draft tailored to this funder&apos;s criteria.
          </p>
        </div>
        <button
          onClick={runDraft}
          disabled={loading}
          className="shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Drafting…" : proposal ? "Re-draft" : "Draft with AI"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {!proposal && !error && (
        <p className="mt-6 text-sm text-slate-500">
          No draft yet. Click <span className="font-medium">Draft with AI</span> for a tailored
          project title, core pitch, the key aspects to lead with, a suggested outline, and the
          gaps to shore up. Add the funder&apos;s review criteria for a sharper draft.
        </p>
      )}

      {proposal && <ProposalDetail proposal={proposal} />}
    </section>
  );
}

function ProposalDetail({ proposal }: { proposal: ProposalDraft }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-indigo-700">
          Suggested title
        </div>
        <div className="mt-1 text-base font-semibold text-slate-900">{proposal.title}</div>
        <p className="mt-2 text-sm text-slate-700">{proposal.thesis}</p>
      </div>

      {proposal.keyAspects.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Key aspects to lead with</h3>
          <ul className="space-y-2">
            {proposal.keyAspects.map((a, i) => (
              <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-sm font-semibold text-slate-800">{a.aspect}</div>
                <p className="mt-0.5 text-sm text-slate-600">{a.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {proposal.sections.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Suggested outline</h3>
          <ol className="space-y-2">
            {proposal.sections.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{s.heading}</div>
                  <p className="text-sm text-slate-600">{s.guidance}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {proposal.alignmentHighlights.length > 0 && (
          <ListBlock
            title="Maps to their criteria"
            titleClass="text-emerald-700"
            items={proposal.alignmentHighlights}
            dotClass="bg-emerald-400"
          />
        )}
        {proposal.differentiators.length > 0 && (
          <ListBlock
            title="Why ETC stands out"
            titleClass="text-indigo-700"
            items={proposal.differentiators}
            dotClass="bg-indigo-400"
          />
        )}
      </div>

      {proposal.risks.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-amber-700">Gaps to shore up</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {proposal.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Drafted {formatDate(proposal.generatedAt)} · {proposal.model} · a starting point, not a
        final application
      </p>
    </div>
  );
}

function ListBlock({
  title,
  titleClass,
  items,
  dotClass,
}: {
  title: string;
  titleClass: string;
  items: string[];
  dotClass: string;
}) {
  return (
    <div>
      <h3 className={`mb-2 text-sm font-semibold ${titleClass}`}>{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-600">
            <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${dotClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
