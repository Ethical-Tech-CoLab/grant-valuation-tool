"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GrantInput } from "@/lib/types";

export default function GrantForm({
  initialValues,
}: {
  initialValues?: GrantInput;
}) {
  const router = useRouter();
  const v = initialValues ?? {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const focusAreas = String(form.get("focusAreas") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: String(form.get("name") || ""),
      funder: String(form.get("funder") || ""),
      amount: Number(form.get("amount") || 0),
      deadline: String(form.get("deadline") || "") || null,
      url: String(form.get("url") || ""),
      description: String(form.get("description") || ""),
      focusAreas,
    };

    try {
      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save grant");
      const grant = await res.json();
      router.push(`/grants/${grant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Grant / program name" required>
        <input
          name="name"
          required
          defaultValue={v.name ?? ""}
          placeholder="e.g. Responsible AI Fund 2026"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Funder">
          <input
            name="funder"
            defaultValue={v.funder ?? ""}
            placeholder="e.g. Mozilla Foundation"
            className={inputClass}
          />
        </Field>
        <Field label="Amount (USD)">
          <input
            name="amount"
            type="number"
            min="0"
            step="1000"
            defaultValue={v.amount ? String(v.amount) : ""}
            placeholder="150000"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Deadline">
          <input
            name="deadline"
            type="date"
            defaultValue={v.deadline ?? ""}
            placeholder="YYYY-MM-DD"
            className={inputClass}
          />
        </Field>
        <Field label="Opportunity URL">
          <input
            name="url"
            type="url"
            defaultValue={v.url ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Focus areas (comma-separated)">
        <input
          name="focusAreas"
          defaultValue={(v.focusAreas ?? []).join(", ")}
          placeholder="responsible AI, digital equity"
          className={inputClass}
        />
      </Field>

      <Field label="Description / notes">
        <textarea
          name="description"
          rows={6}
          defaultValue={v.description ?? ""}
          placeholder="Paste the grant description, eligibility, allowable costs, and any notes. The more detail, the better the AI valuation."
          className={inputClass}
        />
      </Field>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save grant"}
        </button>
        <span className="text-sm text-slate-500">
          You can run the AI valuation on the next screen.
        </span>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
