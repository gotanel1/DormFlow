"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, DoorOpen, Gauge, ReceiptText, ScrollText, Settings, Home, Users, Wallet, Wrench } from "lucide-react";

const NAV = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/rooms", label: "ห้องพัก", icon: DoorOpen },
  { href: "/tenants", label: "ผู้เช่า", icon: Users },
  { href: "/contracts", label: "สัญญาเช่า", icon: ScrollText },
  { href: "/meters", label: "จดมิเตอร์", icon: Gauge },
  { href: "/billing", label: "บิลและการเงิน", icon: ReceiptText },
  { href: "/expenses", label: "รายจ่าย", icon: Wallet },
  { href: "/maintenance", label: "ซ่อมบำรุง", icon: Wrench },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[232px] shrink-0 flex-col border-r border-line bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white">
          <Building2 size={18} />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-4 text-ink">DormFlow</p>
          <p className="text-[11px] text-ink-soft">ระบบบริหารหอพักสบายใจ</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft/80">เมนูหลัก</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition ${
                active ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-page"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-brand" />}
              <Icon size={16} className={active ? "text-brand" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#032d60] text-xs font-semibold text-white">ก</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold text-ink">ก็อต (เจ้าของหอ)</p>
            <p className="text-[11px] text-ink-soft">ผู้ดูแลระบบ · Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}