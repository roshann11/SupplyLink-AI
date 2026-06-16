export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Phase 1 — Scaffold
        </span>
      </div>
    </header>
  );
}
