import Link from "next/link";
import NewGrantWorkspace from "@/components/NewGrantWorkspace";
import { prospectingConfigured } from "@/lib/prospecting";

export default function NewGrantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to pipeline
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add a grant</h1>
      <p className="mt-1 text-sm text-slate-500">
        Import an opportunity from the web or enter it manually, then run the AI valuation
        to decide whether to pursue it.
      </p>
      <div className="mt-6">
        <NewGrantWorkspace prospectingEnabled={prospectingConfigured()} />
      </div>
    </div>
  );
}
