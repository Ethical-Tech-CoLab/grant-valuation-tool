"use client";

import { useState } from "react";
import GrantForm from "@/components/GrantForm";
import type { GrantInput } from "@/lib/types";

export default function NewGrantWorkspace({
  prospectingEnabled,
}: {
  prospectingEnabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Changing the key remounts GrantForm so its (uncontrolled) defaults refresh.
  const [prefill, setPrefill] = useState<GrantInput | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  async function runImport() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prospecting failed");
      setPrefill(data.fields);
      setFormKey((k) => k + 1);
      setNotice(
        data.foundGrant
          ? "Imported from the web — review and edit below, then save."
          : "That page didn't look like a fundable grant. Review the fields below carefully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prospecting failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {prospectingEnabled && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Import from the web
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Paste a grant / funder URL, or describe what you&apos;re looking for. We&apos;ll
            scrape the web and pre-fill the form.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runImport()}
              placeholder="https://funder.org/grant  —  or  —  responsible AI grants for nonprofits"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={runImport}
              disabled={loading}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Scraping…" : "Import"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          {notice && <p className="mt-2 text-sm text-indigo-700">{notice}</p>}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <GrantForm key={formKey} initialValues={prefill} />
      </div>
    </div>
  );
}
