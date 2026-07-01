"use client";

import { useState } from "react";
import type { Grant, CoalitionMember } from "@/lib/types";
import { BACKER_TYPE_LABELS } from "@/lib/types";

const TYPE_STYLES: Record<string, string> = {
  foundation: "bg-indigo-100 text-indigo-700",
  corporate: "bg-sky-100 text-sky-700",
  government: "bg-slate-200 text-slate-700",
  nonprofit: "bg-emerald-100 text-emerald-700",
  academic: "bg-violet-100 text-violet-700",
  multilateral: "bg-teal-100 text-teal-700",
  other: "bg-slate-100 text-slate-600",
};

export default function CoalitionPanel({
  grant,
  onUpdated,
}: {
  grant: Grant;
  onUpdated: (updated: Grant) => void;
}) {
  const coalition = grant.coalition ?? [];
  const [saving, setSaving] = useState(false);
  if (coalition.length === 0) return null;

  const bestFitCount = coalition.filter((m) => m.bestFit).length;

  async function persist(next: CoalitionMember[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/grants/${grant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coalition: next }),
      });
      if (res.ok) onUpdated(await res.json());
    } finally {
      setSaving(false);
    }
  }

  function toggle(i: number) {
    const next = coalition.map((m, idx) =>
      idx === i ? { ...m, bestFit: !m.bestFit } : m,
    );
    persist(next);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Who&apos;s funding this</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            The coalition behind the opportunity. Tick the backers that are the best fit for ETC to
            prioritize.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {bestFitCount > 0 ? `${bestFitCount} marked best fit` : `${coalition.length} backers`}
          {saving && " · saving…"}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {coalition.map((m, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-lg border p-3 transition ${
              m.bestFit
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-slate-100 bg-slate-50/50"
            }`}
          >
            <input
              type="checkbox"
              checked={m.bestFit}
              onChange={() => toggle(i)}
              disabled={saving}
              aria-label={`Mark ${m.name} as best fit`}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 hover:underline"
                    >
                      {m.name} ↗
                    </a>
                  ) : (
                    m.name
                  )}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    TYPE_STYLES[m.type] ?? TYPE_STYLES.other
                  }`}
                >
                  {BACKER_TYPE_LABELS[m.type] ?? m.type}
                </span>
                {m.bestFit && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                    Best fit
                  </span>
                )}
              </div>
              {m.role && <p className="mt-0.5 text-xs text-slate-600">{m.role}</p>}
              {m.note && <p className="mt-0.5 text-xs text-slate-500 italic">{m.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
