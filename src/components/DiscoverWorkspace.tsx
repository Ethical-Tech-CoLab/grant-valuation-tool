"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

interface Candidate {
  name: string;
  funder: string;
  url: string;
  amount: number;
  deadline: string | null;
  focusAreas: string[];
  summary: string;
  whyFit: string;
  fit: "strong" | "possible" | "weak";
  status: "open" | "unclear" | "closed";
}

interface DiscoveryResult {
  candidates: Candidate[];
  queriesRun: string[];
  sourcesSearched: number;
}

const fitBadge: Record<Candidate["fit"], string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  possible: "bg-amber-100 text-amber-800 border-amber-200",
  weak: "bg-slate-100 text-slate-600 border-slate-200",
};

type ImportState = "idle" | "importing" | "done";

export default function DiscoverWorkspace({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [imports, setImports] = useState<Record<string, ImportState>>({});

  async function runDiscovery() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");
      setResult(data);
      setImports({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  async function importCandidate(c: Candidate) {
    setImports((s) => ({ ...s, [c.url || c.name]: "importing" }));
    try {
      // Try a deep enrich from the URL first (people, criteria, funded examples…);
      // fall back to the candidate's basic fields if scraping fails.
      let fields: Record<string, unknown> = {
        name: c.name,
        funder: c.funder,
        amount: c.amount,
        deadline: c.deadline,
        url: c.url,
        description: c.summary,
        focusAreas: c.focusAreas,
        stage: "prospect",
      };
      if (c.url) {
        try {
          const pr = await fetch("/api/prospect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: c.url }),
          });
          if (pr.ok) {
            const pd = await pr.json();
            if (pd.fields) fields = { ...pd.fields, stage: "prospect" };
          }
        } catch {
          /* fall back to basic fields */
        }
      }
      // Carry the discovered open/unclear status through as availability.
      fields.availability = c.status === "open" ? "open" : null;
      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to save grant");
      const grant = await res.json();
      setImports((s) => ({ ...s, [c.url || c.name]: "done" }));
      router.push(`/grants/${grant.id}`);
    } catch {
      setImports((s) => ({ ...s, [c.url || c.name]: "idle" }));
      setError(`Couldn't import "${c.name}". Try again or add it manually.`);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Discovery needs <code className="rounded bg-slate-200 px-1">TAVILY_API_KEY</code> and{" "}
        <code className="rounded bg-slate-200 px-1">ANTHROPIC_API_KEY</code> in{" "}
        <code className="rounded bg-slate-200 px-1">.env.local</code>. Add them to search the web
        for new opportunities.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
        <label className="text-sm font-semibold text-slate-900">
          Focus the search <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <p className="mt-0.5 text-sm text-slate-500">
          Leave blank to sweep ETC&apos;s whole mission, or narrow it — e.g. &ldquo;forced labor
          supply chain&rdquo; or &ldquo;refugee technology&rdquo;.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && runDiscovery()}
            placeholder="e.g. disaster response AI  —  or leave blank"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={runDiscovery}
            disabled={loading}
            className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Find grants"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {loading && (
        <p className="text-sm text-slate-500">
          Searching the web and matching against ETC&apos;s mission… this takes a few seconds.
        </p>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {result.candidates.length > 0
              ? `${result.candidates.length} opportunit${
                  result.candidates.length === 1 ? "y" : "ies"
                } found across ${result.sourcesSearched} sources — new to your pipeline.`
              : `No new opportunities surfaced across ${result.sourcesSearched} sources. Try a different focus, or search again.`}
          </p>

          {result.candidates.map((c) => {
            const key = c.url || c.name;
            const state = imports[key] ?? "idle";
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{c.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${fitBadge[c.fit]}`}
                      >
                        {c.fit} fit
                      </span>
                      {c.status === "unclear" && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          status unclear
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{c.funder || "Unknown funder"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      >
                        Open ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => importCandidate(c)}
                      disabled={state !== "idle"}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {state === "importing"
                        ? "Importing…"
                        : state === "done"
                          ? "Imported ✓"
                          : "Import"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                  <span>
                    <span className="text-slate-400">Amount:</span>{" "}
                    {c.amount ? formatCurrency(c.amount) : "—"}
                  </span>
                  <span>
                    <span className="text-slate-400">Deadline:</span> {formatDate(c.deadline)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">{c.summary}</p>
                {c.whyFit && (
                  <p className="mt-2 rounded-md bg-indigo-50 px-3 py-1.5 text-xs text-indigo-800">
                    <span className="font-semibold">Why ETC:</span> {c.whyFit}
                  </p>
                )}
                {c.focusAreas.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.focusAreas.map((fa) => (
                      <span
                        key={fa}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                      >
                        {fa}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
