"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Grant, PipelineStage } from "@/lib/types";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/types";
import { formatCurrency, formatDate, deadlineStatus } from "@/lib/format";
import ScorePanel from "@/components/ScorePanel";
import AwardPanel from "@/components/AwardPanel";
import PeoplePanel from "@/components/PeoplePanel";

export default function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/grants/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setGrant)
      .catch(() => setNotFound(true));
  }, [id]);

  async function setStage(stage: PipelineStage) {
    const res = await fetch(`/api/grants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) setGrant(await res.json());
  }

  async function remove() {
    if (!confirm("Delete this grant? This cannot be undone.")) return;
    const res = await fetch(`/api/grants/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/pipeline");
  }

  if (notFound) {
    return (
      <div className="text-center text-slate-500">
        <p>Grant not found.</p>
        <Link href="/pipeline" className="text-slate-900 underline">
          Back to pipeline
        </Link>
      </div>
    );
  }

  if (!grant) return <p className="text-slate-500">Loading…</p>;

  const deadline = deadlineStatus(grant.deadline);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to pipeline
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{grant.name}</h1>
            <p className="mt-1 text-slate-500">{grant.funder || "Unknown funder"}</p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-rose-200 hover:text-rose-600"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Key facts + stage */}
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-4">
        <Fact label="Amount" value={formatCurrency(grant.amount)} />
        <Fact
          label="Deadline"
          value={formatDate(grant.deadline)}
          hint={deadline.tier !== "none" ? deadline.label : undefined}
          hintUrgent={deadline.tier === "urgent" || deadline.tier === "past"}
        />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Stage
          </div>
          <select
            aria-label="Pipeline stage"
            value={grant.stage}
            onChange={(e) => setStage(e.target.value as PipelineStage)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Link
          </div>
          {grant.url ? (
            <a
              href={grant.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm text-indigo-600 hover:underline"
            >
              Open opportunity ↗
            </a>
          ) : (
            <span className="mt-1 block text-sm text-slate-400">—</span>
          )}
        </div>
      </section>

      {grant.description && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{grant.description}</p>
          {grant.focusAreas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {grant.focusAreas.map((fa) => (
                <span
                  key={fa}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {fa}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <PeoplePanel grant={grant} />

      <ScorePanel grant={grant} onScored={setGrant} />

      {grant.stage === "awarded" && <AwardPanel grant={grant} onSaved={setGrant} />}
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
  hintUrgent,
}: {
  label: string;
  value: string;
  hint?: string;
  hintUrgent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
      {hint && (
        <div className={`text-xs ${hintUrgent ? "text-rose-600" : "text-slate-400"}`}>
          {hint}
        </div>
      )}
    </div>
  );
}
