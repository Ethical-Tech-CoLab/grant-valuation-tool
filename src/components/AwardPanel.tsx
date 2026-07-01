"use client";

import { useState } from "react";
import type { AwardTracking, Grant, ReportingRequirement } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

function emptyAward(grant: Grant): AwardTracking {
  return {
    awardedAmount: grant.amount || 0,
    awardDate: null,
    fundsSpent: 0,
    outcomes: "",
    reporting: [],
  };
}

export default function AwardPanel({
  grant,
  onSaved,
}: {
  grant: Grant;
  onSaved: (updated: Grant) => void;
}) {
  const [award, setAward] = useState<AwardTracking>(grant.award ?? emptyAward(grant));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save(next: AwardTracking) {
    setAward(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/grants/${grant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ award: next }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved(data);
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  }

  function addRequirement() {
    const req: ReportingRequirement = {
      id: crypto.randomUUID(),
      label: "New report",
      dueDate: null,
      status: "pending",
    };
    save({ ...award, reporting: [...award.reporting, req] });
  }

  function updateRequirement(id: string, patch: Partial<ReportingRequirement>) {
    save({
      ...award,
      reporting: award.reporting.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  }

  function removeRequirement(id: string) {
    save({ ...award, reporting: award.reporting.filter((r) => r.id !== id) });
  }

  const utilization = award.awardedAmount
    ? Math.min(100, Math.round((award.fundsSpent / award.awardedAmount) * 100))
    : 0;

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Award tracking</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Reporting, spend, and outcomes for this awarded grant.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {saving ? "Saving…" : savedAt ? "Saved" : ""}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <NumberField
          label="Awarded amount"
          value={award.awardedAmount}
          onCommit={(v) => save({ ...award, awardedAmount: v })}
        />
        <NumberField
          label="Funds spent"
          value={award.fundsSpent}
          onCommit={(v) => save({ ...award, fundsSpent: v })}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Award date
          </span>
          <input
            type="date"
            defaultValue={award.awardDate ?? ""}
            onBlur={(e) => save({ ...award, awardDate: e.target.value || null })}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Budget utilization</span>
          <span>
            {formatCurrency(award.fundsSpent)} / {formatCurrency(award.awardedAmount)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Reporting requirements</h3>
          <button
            onClick={addRequirement}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Add
          </button>
        </div>
        {award.reporting.length === 0 ? (
          <p className="text-sm text-slate-500">No reporting requirements yet.</p>
        ) : (
          <ul className="space-y-2">
            {award.reporting.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={r.status === "submitted"}
                  onChange={(e) =>
                    updateRequirement(r.id, {
                      status: e.target.checked ? "submitted" : "pending",
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <input
                  defaultValue={r.label}
                  onBlur={(e) => updateRequirement(r.id, { label: e.target.value })}
                  className={`flex-1 min-w-[8rem] border-none bg-transparent text-sm text-slate-800 outline-none ${
                    r.status === "submitted" ? "line-through text-slate-400" : ""
                  }`}
                />
                <input
                  type="date"
                  defaultValue={r.dueDate ?? ""}
                  onBlur={(e) => updateRequirement(r.id, { dueDate: e.target.value || null })}
                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                />
                <button
                  onClick={() => removeRequirement(r.id)}
                  className="text-xs text-slate-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="mt-6 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Outcomes / impact notes
        </span>
        <textarea
          rows={4}
          defaultValue={award.outcomes}
          onBlur={(e) => save({ ...award, outcomes: e.target.value })}
          placeholder="What did this grant fund and achieve? Used for reporting and future applications."
          className={inputClass}
        />
      </label>
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

function NumberField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min="0"
        step="1000"
        defaultValue={value}
        onBlur={(e) => onCommit(Number(e.target.value) || 0)}
        className={inputClass}
      />
    </label>
  );
}
