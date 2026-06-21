import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-brand-700">SupplyLink AI</span>
        <nav className="flex gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          AI-powered B2B supplier discovery
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Connect manufacturers, wholesalers, and retailers with intelligent matching,
          RFQ workflows, and trust signals.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            Start free
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            View dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
