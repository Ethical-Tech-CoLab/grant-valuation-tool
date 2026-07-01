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

    // One person per line: "Name — Role — https://linkedin.com/in/…"
    // (role and LinkedIn optional; separator is — or -).
    const people = String(form.get("people") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, role, linkedin] = line.split(/\s+[—-]\s+/);
        return {
          name: (name || "").trim(),
          role: (role || "").trim(),
          linkedin: (linkedin || "").trim(),
        };
      })
      .filter((p) => p.name);

    // One milestone per line: "Label — YYYY-MM-DD" (date optional).
    const keyDates = String(form.get("keyDates") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, date] = line.split(/\s+[—-]\s+/);
        return { label: (label || "").trim(), date: (date || "").trim() || null };
      })
      .filter((d) => d.label);

    const constraints = String(form.get("constraints") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // One criterion per line: "Criterion — Weight — Detail" (weight/detail optional).
    const reviewCriteria = String(form.get("reviewCriteria") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [criterion, weight, detail] = line.split(/\s+[—-]\s+/);
        return {
          criterion: (criterion || "").trim(),
          weight: (weight || "").trim(),
          detail: (detail || "").trim(),
        };
      })
      .filter((c) => c.criterion);

    // One per line: "Grantee — Project — URL" (URL optional).
    const fundedExamples = String(form.get("fundedExamples") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [grantee, project, url] = line.split(/\s+[—-]\s+/);
        return {
          grantee: (grantee || "").trim(),
          project: (project || "").trim(),
          url: (url || "").trim(),
          orgUrl: "",
          proposalUrl: "",
          amount: 0,
          year: "",
          takeaway: "",
        };
      })
      .filter((e) => e.grantee);

    // One backer per line: "Name — Type — Role — URL" (type/role/url optional).
    const BACKER_SET = new Set([
      "foundation",
      "corporate",
      "government",
      "nonprofit",
      "academic",
      "multilateral",
      "other",
    ]);
    const coalition = String(form.get("coalition") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, type, role, url] = line.split(/\s+[—-]\s+/);
        const t = (type || "").trim().toLowerCase();
        return {
          name: (name || "").trim(),
          type: (BACKER_SET.has(t) ? t : "other") as
            | "foundation"
            | "corporate"
            | "government"
            | "nonprofit"
            | "academic"
            | "multilateral"
            | "other",
          role: (role || "").trim(),
          url: (url || "").trim(),
          bestFit: false,
          note: "",
        };
      })
      .filter((c) => c.name);

    const submissionMechanism = String(form.get("submissionMechanism") || "").trim();
    const submissionFormUrl = String(form.get("submissionFormUrl") || "").trim();
    const submissionSteps = String(form.get("submissionSteps") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const submissionMaterials = String(form.get("submissionMaterials") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const hasSubmission =
      submissionMechanism ||
      submissionFormUrl ||
      submissionSteps.length ||
      submissionMaterials.length;

    const decisionTimeline = String(form.get("decisionTimeline") || "").trim();
    const grantPeriod = String(form.get("grantPeriod") || "").trim();
    const hasLogistics =
      decisionTimeline || grantPeriod || keyDates.length || constraints.length;

    const payload = {
      name: String(form.get("name") || ""),
      funder: String(form.get("funder") || ""),
      amount: Number(form.get("amount") || 0),
      deadline: String(form.get("deadline") || "") || null,
      url: String(form.get("url") || ""),
      description: String(form.get("description") || ""),
      focusAreas,
      orgLinkedIn: String(form.get("orgLinkedIn") || ""),
      people,
      logistics: hasLogistics
        ? { decisionTimeline, grantPeriod, keyDates, constraints }
        : null,
      coalition,
      submission: hasSubmission
        ? {
            mechanism: submissionMechanism,
            formUrl: submissionFormUrl,
            steps: submissionSteps,
            materials: submissionMaterials,
            notes: "",
          }
        : null,
      reviewCriteria,
      fundedExamples,
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

      <Field label="Organization LinkedIn URL">
        <input
          name="orgLinkedIn"
          type="url"
          defaultValue={v.orgLinkedIn ?? ""}
          placeholder="https://www.linkedin.com/company/..."
          className={inputClass}
        />
      </Field>

      <Field label="Key people (one per line: Name — Role — LinkedIn URL)">
        <textarea
          name="people"
          rows={3}
          defaultValue={(v.people ?? [])
            .map((p) => [p.name, p.role, p.linkedin].filter(Boolean).join(" — "))
            .join("\n")}
          placeholder={"Jane Doe — Program Director — https://www.linkedin.com/in/janedoe\nJohn Smith — President"}
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Expected to hear back">
          <input
            name="decisionTimeline"
            defaultValue={v.logistics?.decisionTimeline ?? ""}
            placeholder="e.g. ~6–8 weeks after the deadline"
            className={inputClass}
          />
        </Field>
        <Field label="Grant period">
          <input
            name="grantPeriod"
            defaultValue={v.logistics?.grantPeriod ?? ""}
            placeholder="e.g. 12 months"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Key dates (one per line: Label — YYYY-MM-DD)">
        <textarea
          name="keyDates"
          rows={3}
          defaultValue={(v.logistics?.keyDates ?? [])
            .map((d) => [d.label, d.date].filter(Boolean).join(" — "))
            .join("\n")}
          placeholder={"Applications open — 2026-09-06\nDeadline — 2026-10-05\nNotification — 2026-11-30"}
          className={inputClass}
        />
      </Field>

      <Field label="Constraints / requirements (one per line)">
        <textarea
          name="constraints"
          rows={3}
          defaultValue={(v.logistics?.constraints ?? []).join("\n")}
          placeholder={"US nonprofits only\nOutputs must be open source\nMatching funds required"}
          className={inputClass}
        />
      </Field>

      <Field label="Funder review criteria (one per line: Criterion — Weight — What they look for)">
        <textarea
          name="reviewCriteria"
          rows={3}
          defaultValue={(v.reviewCriteria ?? [])
            .map((c) => [c.criterion, c.weight, c.detail].filter(Boolean).join(" — "))
            .join("\n")}
          placeholder={"Innovation & originality — 30% — Novel approach to a real public-interest problem\nImpact & reach — 25% — Clear, measurable benefit to communities\nFeasibility — 20% — Credible plan, team, and budget"}
          className={inputClass}
        />
      </Field>

      <Field label="Coalition / who funds it (one per line: Name — Type — Role — URL)">
        <textarea
          name="coalition"
          rows={3}
          defaultValue={(v.coalition ?? [])
            .map((c) => [c.name, c.type, c.role, c.url].filter(Boolean).join(" — "))
            .join("\n")}
          placeholder={"MacArthur Foundation — foundation — Founding funder — https://www.macfound.org\nMicrosoft — corporate — Compute & data partner"}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-slate-400">
          Type: foundation, corporate, government, nonprofit, academic, multilateral, or other.
        </span>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="How to apply (mechanism)">
          <input
            name="submissionMechanism"
            defaultValue={v.submission?.mechanism ?? ""}
            placeholder="e.g. Online form via Fluxx portal"
            className={inputClass}
          />
        </Field>
        <Field label="Application form URL">
          <input
            name="submissionFormUrl"
            type="url"
            defaultValue={v.submission?.formUrl ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Application steps (one per line)">
        <textarea
          name="submissionSteps"
          rows={3}
          defaultValue={(v.submission?.steps ?? []).join("\n")}
          placeholder={"Submit a letter of inquiry\nInvited applicants submit a full proposal\nFinalists interview with the review panel"}
          className={inputClass}
        />
      </Field>

      <Field label="Required materials (comma-separated)">
        <input
          name="submissionMaterials"
          defaultValue={(v.submission?.materials ?? []).join(", ")}
          placeholder="project narrative, budget, letters of support"
          className={inputClass}
        />
      </Field>

      <Field label="Funded examples to reference (one per line: Grantee — Project — URL)">
        <textarea
          name="fundedExamples"
          rows={3}
          defaultValue={(v.fundedExamples ?? [])
            .map((e) => [e.grantee, e.project, e.url].filter(Boolean).join(" — "))
            .join("\n")}
          placeholder={"Upturn — Benefits Tech Advocacy Hub, challenging faulty benefits algorithms — https://www.upturn.org"}
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
