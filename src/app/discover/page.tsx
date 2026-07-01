import Link from "next/link";
import DiscoverWorkspace from "@/components/DiscoverWorkspace";
import { discoveryConfigured } from "@/lib/discovery";

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to pipeline
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Discover grants</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search the web for new funding opportunities that match ETC&apos;s mission and current
        projects. Import the promising ones straight into your pipeline.
      </p>
      <div className="mt-6">
        <DiscoverWorkspace enabled={discoveryConfigured()} />
      </div>
    </div>
  );
}
