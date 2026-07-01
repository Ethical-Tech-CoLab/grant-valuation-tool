"use client";

import { useState } from "react";
import type { Grant, CoalitionMember, BackerType } from "@/lib/types";
import { BACKER_TYPES, BACKER_TYPE_LABELS } from "@/lib/types";

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
  const [bestOnly, setBestOnly] = useState(false);
  const [adding, setAdding] = useState(false);
  const emptyDraft = { name: "", type: "foundation" as BackerType, role: "", url: "" };
  const [draft, setDraft] = useState(emptyDraft);

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

  function updateNote(i: number, note: string) {
    if ((coalition[i].note ?? "") === note) return;
    persist(coalition.map((m, idx) => (idx === i ? { ...m, note } : m)));
  }

  function removeMember(i: number) {
    persist(coalition.filter((_, idx) => idx !== i));
  }

  function addMember() {
    if (!draft.name.trim()) return;
    const member: CoalitionMember = {
      name: draft.name.trim(),
      type: draft.type,
      role: draft.role.trim(),
      url: draft.url.trim(),
      bestFit: false,
      note: "",
    };
    persist([...coalition, member]);
    setDraft(emptyDraft);
    setAdding(false);
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
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setBestOnly(false)}
              className={`rounded px-2 py-1 font-medium ${
                !bestOnly ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All {coalition.length}
            </button>
            <button
              type="button"
              onClick={() => setBestOnly(true)}
              className={`rounded px-2 py-1 font-medium ${
                bestOnly ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Best fit {bestFitCount}
            </button>
          </div>
          {saving && <span className="text-xs text-slate-400">saving…</span>}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {coalition.map((m, i) =>
          bestOnly && !m.bestFit ? null : (
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
                <input
                  defaultValue={m.note}
                  onBlur={(e) => updateNote(i, e.target.value.trim())}
                  placeholder="Add a note (why they fit, a contact, an angle…)"
                  className="mt-1 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-600 italic outline-none hover:border-slate-200 focus:border-slate-300 focus:not-italic"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMember(i)}
                disabled={saving}
                aria-label={`Remove ${m.name}`}
                className="mt-0.5 shrink-0 rounded px-1.5 text-slate-300 hover:text-rose-500"
              >
                ×
              </button>
            </li>
          ),
        )}
        {coalition.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            No backers captured yet — add one below, or run a web import.
          </li>
        )}
        {bestOnly && bestFitCount === 0 && coalition.length > 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            None marked best fit yet. Switch to “All” and tick the backers you want to prioritize.
          </li>
        )}
      </ul>

      {adding ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Backer name"
              className={fieldClass}
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as BackerType })}
              aria-label="Backer type"
              className={fieldClass}
            >
              {BACKER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BACKER_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              placeholder="Role / contribution (optional)"
              className={fieldClass}
            />
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="URL (optional)"
              className={fieldClass}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={addMember}
              disabled={!draft.name.trim() || saving}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Add backer
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(emptyDraft);
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          + Add backer
        </button>
      )}
    </section>
  );
}

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
