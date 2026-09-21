"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Plus, XCircle } from "lucide-react";
import { Badge, Btn, Field, Modal, PageHeader, inputCls } from "@/components/ui";
import { api, WORK_PRIORITY, WORK_STATUS, useApi, type WorkDTO } from "@/lib/api";

const COLS = [
  { id: "NEW", label: "รับเรื่อง" },
  { id: "IN_PROGRESS", label: "กำลังซ่อม" },
  { id: "DONE", label: "เสร็จแล้ว" },
] as const;

const NEXT: Record<string, WorkDTO["status"]> = { NEW: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "DONE" };

export default function MaintenancePage() {
  const { data, isValidating, mutate: refetch } = useApi<{ orders: WorkDTO[] }>("/workorders");
  const orders = data?.orders ?? [];
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ room: "", title: "", cat: "ไฟฟ้า", pr: "NORMAL" as WorkDTO["priority"] });
  const [err, setErr] = useState("");

  const advance = async (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setErr("");
    try {
      await api(`/workorders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: NEXT[o.status] }) });
      refetch();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "อัปเดตงานไม่สำเร็จ");
    }
  };

  const add = async () => {
    if (!f.room.trim() || !f.title.trim()) return;
    setErr("");
    try {
      await api("/workorders", { method: "POST", body: JSON.stringify({ roomId: f.room.trim().toUpperCase(), title: f.title.trim(), category: f.cat, priority: f.pr }) });
      refetch();
      setOpen(false);
      setF({ room: "", title: "", cat: "ไฟฟ้า", pr: "NORMAL" });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "แจ้งซ่อมไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="ซ่อมบำรุง"
        desc={err ? err : "กระดานงานซ่อม — คลิกปุ่มลูกศรเพื่อเลื่อนสถานะงาน"}
        actions={
          <Btn variant="brand" icon={Plus} onClick={() => setOpen(true)}>
            แจ้งซ่อมใหม่
          </Btn>
        }
      />

      {!data && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink-soft">
          <Loader2 size={15} className="animate-spin" /> กำลังโหลดงานซ่อม...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLS.map((col) => {
          const items = orders.filter((o) => o.status === col.id);
          return (
            <div key={col.id} className="rounded-lg border border-line bg-page/70 p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{col.label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-soft ring-1 ring-line">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((o) => (
                  <div key={o.id} className="rounded-md border border-line bg-white p-3 shadow-[0_1px_2px_rgba(8,7,7,0.05)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-ink-soft">{o.id.slice(0, 8)}</span>
                      <Badge tone={WORK_PRIORITY[o.priority].tone}>{WORK_PRIORITY[o.priority].label}</Badge>
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">{o.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {o.category} · ห้อง <span className="font-semibold text-brand-dark">{o.room.id}</span> · {new Date(o.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                      <Badge tone={WORK_STATUS[o.status].tone} dot>
                        {WORK_STATUS[o.status].label}
                      </Badge>
                      {col.id !== "DONE" && (
                        <Btn size="sm" variant="ghost" icon={ArrowRight} onClick={() => advance(o.id)}>
                          {o.status === "NEW" ? "เริ่มซ่อม" : "ปิดงาน"}
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-line-strong py-6 text-center text-xs text-ink-soft">ไม่มีงานในคอลัมน์นี้</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isValidating && <p className="mt-3 text-xs text-ink-soft">กำลังรีเฟรช...</p>}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="แจ้งซ่อมใหม่"
        subtitle="บันทึกลงฐานข้อมูลจริง — งานจะเข้าคอลัมน์ รับเรื่อง"
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={add}>
              แจ้งซ่อม
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="ห้อง *">
            <input className={inputCls} value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} placeholder="เช่น B305" />
          </Field>
          <Field label="หมวดหมู่">
            <select className={inputCls} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
              <option>ไฟฟ้า</option>
              <option>ประปา</option>
              <option>เครื่องใช้ไฟฟ้า</option>
              <option>เครื่องเรือน</option>
            </select>
          </Field>
          <Field label="รายละเอียดงาน *">
            <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="เช่น แอร์ไม่เย็น" />
          </Field>
          <Field label="ความเร่งด่วน">
            <select className={inputCls} value={f.pr} onChange={(e) => setF({ ...f, pr: e.target.value as WorkDTO["priority"] })}>
              <option value="NORMAL">ปกติ</option>
              <option value="HIGH">เร่งด่วน</option>
              <option value="LOW">ต่ำ</option>
            </select>
          </Field>
          {err && (
            <p className="col-span-2 flex items-center gap-1.5 rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              <XCircle size={14} /> {err}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}