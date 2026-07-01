import { STAGE_LABELS, type PipelineStage } from "@/lib/types";

const STAGE_STYLES: Record<PipelineStage, string> = {
  prospect: "bg-slate-100 text-slate-700",
  scoring: "bg-indigo-100 text-indigo-700",
  drafting: "bg-blue-100 text-blue-700",
  submitted: "bg-violet-100 text-violet-700",
  awarded: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
