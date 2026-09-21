"use client";

import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, useApi } from "@/lib/api";

interface NotifItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_TONE: Record<string, string> = {
  overdue: "bg-danger-soft text-danger",
  contract_expiring: "bg-warn-soft text-warn",
  work_high: "bg-brand-soft text-brand-dark",
};

const TYPE_LABEL: Record<string, string> = {
  overdue: "ค้างชำระ",
  contract_expiring: "สัญญา",
  work_high: "ซ่อมเร่งด่วน",
};

export default function NotificationBell() {
  const { data, mutate: refetch } = useApi<{ items: NotifItem[]; unread: number }>("/notifications");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "POST" });
    refetch();
  };

  const readAll = async () => {
    await api("/notifications/read-all", { method: "POST" });
    refetch();
  };

  const openItem = (n: NotifItem) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-1.5 text-ink-soft transition hover:bg-page"
        title="การแจ้งเตือน"
      >
        <Bell size={17} />
        {unread > 0 && (
          <>
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-sm font-semibold text-ink">การแจ้งเตือน</p>
              {unread > 0 && (
                <button onClick={readAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  <CheckCheck size={13} /> อ่านทั้งหมด
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-soft">
                  <Loader2 size={14} className="animate-spin" /> กำลังโหลด...
                </div>
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-soft">ไม่มีแจ้งเตือน 🎉</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-2.5 border-b border-line/60 px-4 py-3 text-left transition hover:bg-page/70 ${n.read ? "opacity-60" : ""}`}
                  >
                    <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_TONE[n.type] ?? "bg-gray-100 text-ink-soft"}`}>
                      {TYPE_LABEL[n.type] ?? "ระบบ"}
                    </span>
                    <span className="flex-1 text-[13px] leading-snug text-ink">{n.message}</span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}