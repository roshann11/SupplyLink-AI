"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api-client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/rfqs", label: "RFQs", icon: ShoppingCart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authApi.me(token)
        .then((data) => {
          setUserInfo({
            name: `${data.first_name} ${data.last_name}`,
            role: data.role.toUpperCase(),
          });
        })
        .catch(() => {});
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <Link href="/" className="text-lg font-bold text-brand-700 tracking-tight">
          SupplyLink AI
        </Link>
        <p className="mt-1 text-xs text-slate-400 font-medium">B2B Marketplace</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4 animate-pulse-slow" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User profile drawer */}
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        {userInfo && (
          <div className="mb-3 px-2">
            <p className="text-xs font-semibold text-slate-800 truncate">{userInfo.name}</p>
            <p className="text-[10px] font-bold text-brand-600 uppercase mt-0.5 tracking-wider">{userInfo.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
