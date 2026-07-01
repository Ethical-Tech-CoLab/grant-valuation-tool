import { AVAILABILITY_LABELS, type Availability } from "@/lib/types";

const STYLES: Record<Availability, string> = {
  open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  upcoming: "bg-sky-100 text-sky-800 border-sky-200",
  rolling: "bg-teal-100 text-teal-800 border-teal-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  "invite-only": "bg-amber-100 text-amber-800 border-amber-200",
};

const DOT: Record<Availability, string> = {
  open: "bg-emerald-500",
  upcoming: "bg-sky-500",
  rolling: "bg-teal-500",
  closed: "bg-slate-400",
  "invite-only": "bg-amber-500",
};

export default function AvailabilityBadge({
  availability,
  note,
  size = "sm",
}: {
  availability: Availability | null | undefined;
  note?: string;
  size?: "sm" | "xs";
}) {
  if (!availability) return null;
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      title={note || undefined}
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${STYLES[availability]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[availability]}`} />
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}
