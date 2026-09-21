"use client";

import { useRouter } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { loggedInUser, setToken } from "@/lib/api";

export default function TopBar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();
  const user = loggedInUser();

  const logout = () => {
    setToken(null);
    router.push("/login");
  };

  return (
    <header className="flex h-[54px] shrink-0 items-center gap-3 border-b border-line bg-white px-3 lg:px-5">
      {/* Mobile menu */}
      <button onClick={onMenu} className="rounded-md p-1.5 text-ink-soft transition hover:bg-page lg:hidden">
        <Menu size={19} />
      </button>

      {/* Global search */}
      <div className="relative w-full max-w-md">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/70" />
        <input
          type="text"
          placeholder="ค้นหาห้อง, ผู้เช่า, บิล..."
          className="w-full rounded-full border border-line-strong bg-page/70 py-1.5 pl-8 pr-3 text-sm outline-none transition placeholder:text-ink-soft/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-page/70 px-3 py-1 text-xs font-medium text-ink-soft sm:inline-flex">
          <CalendarDays size={13} />
          <span className="hidden md:inline">พุธ 18 ก.ย. 2569</span>
          <span className="md:hidden">18 ก.ย. 69</span>
        </span>
        <button className="relative rounded-full p-1.5 text-ink-soft transition hover:bg-page">
          <Bell size={17} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
        </button>
        <div className="h-6 w-px bg-line" />
        <button className="flex items-center gap-2 rounded-md py-1 pl-0.5 pr-1.5 transition hover:bg-page">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#032d60] text-[11px] font-semibold text-white">
            {(user?.name ?? "?").replace(/[^ก-ฮ]/g, "").charAt(0) || "u"}
          </span>
          <span className="hidden text-[13px] font-medium text-ink sm:inline">{user?.name ?? "—"}</span>
          <ChevronDown size={14} className="hidden text-ink-soft sm:block" />
        </button>
        <button onClick={logout} title="ออกจากระบบ" className="rounded-md p-1.5 text-ink-soft transition hover:bg-danger-soft hover:text-danger">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}