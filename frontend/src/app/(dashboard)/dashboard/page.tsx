export default function DashboardPage() {
  const stats = [
    { label: "Active RFQs", value: "—", hint: "Phase 2" },
    { label: "Products", value: "—", hint: "Phase 2" },
    { label: "Messages", value: "—", hint: "Phase 2" },
    { label: "Match Score", value: "—", hint: "Phase 4" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome to SupplyLink AI</h2>
        <p className="mt-2 text-slate-600">
          Your dashboard is ready. Business features will be added in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Supplier discovery, RFQ management, and AI matchmaking coming soon.
        </p>
      </div>
    </div>
  );
}
