import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header title="Dashboard" />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
