// Small presentation helpers shared across server and client components.

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Whole days until `iso` (negative = past). null when no date. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Human label + urgency tier for a deadline. */
export function deadlineStatus(iso: string | null): {
  label: string;
  tier: "none" | "past" | "urgent" | "soon" | "ok";
} {
  const days = daysUntil(iso);
  if (days === null) return { label: "No deadline", tier: "none" };
  if (days < 0) return { label: `${Math.abs(days)}d ago`, tier: "past" };
  if (days === 0) return { label: "Due today", tier: "urgent" };
  if (days <= 14) return { label: `${days}d left`, tier: "urgent" };
  if (days <= 45) return { label: `${days}d left`, tier: "soon" };
  return { label: `${days}d left`, tier: "ok" };
}

export function recommendationColor(rec: string): string {
  switch (rec) {
    case "pursue":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "consider":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "pass":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
