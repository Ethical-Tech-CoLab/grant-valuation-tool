import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            ETC Grant Valuator
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/pipeline"
            className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Pipeline
          </Link>
          <Link
            href="/discover"
            className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Discover
          </Link>
          <Link
            href="/grants/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700"
          >
            + Add grant
          </Link>
        </nav>
      </div>
    </header>
  );
}
