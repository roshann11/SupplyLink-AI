function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Role-specific analytics dashboards will be available in Phase 2."
    />
  );
}
