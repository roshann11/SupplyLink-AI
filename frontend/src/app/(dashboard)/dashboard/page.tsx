"use client";

import { useEffect, useState } from "react";
import { companiesApi, messagesApi } from "@/lib/api-client";
import { BarChart3, MessageSquare, Package, ShoppingCart } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    rfqs: 0,
    messages: 0,
    rating: "0.0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    Promise.all([
      companiesApi.statsMe(token),
      messagesApi.conversations(token).catch(() => []),
    ])
      .then(([companyStats, convs]) => {
        setStats({
          products: companyStats.products_count || 0,
          rfqs: companyStats.rfqs_count || 0,
          messages: convs.length || 0,
          rating: Number(companyStats.average_rating || 0).toFixed(1),
        });
      })
      .catch((err) => console.error("Error loading stats", err))
      .finally(() => setLoading(false));
  }, []);

  const statsItems = [
    { label: "Active Products", value: stats.products, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Active RFQs", value: stats.rfqs, icon: ShoppingCart, color: "text-amber-600 bg-amber-50" },
    { label: "Conversations", value: stats.messages, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
    { label: "Company Rating", value: `${stats.rating} / 5.0`, icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
        <p className="mt-2 text-sm text-slate-500">
          Real-time metrics for your company's transactions and activities.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-400">{item.label}</p>
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-800 tracking-tight">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Active Operations</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Use the navigation links in the sidebar to manage your product catalogs, write quotes, inspect public RFQs, or respond to buyer inquiries.
        </p>
      </div>
    </div>
  );
}
