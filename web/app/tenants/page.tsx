"use client";

import { useState } from "react";
import { Loader2, Plus, Search, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, PageHeader, Row, Td, Th, inputCls } from "@/components/ui";
import { api, THB, thaiDate, useApi, type TenantDTO } from "@/lib/api";

export default function TenantsPage() {
  const { data, isValidating, mutate: refetch } = useApi<{ tenants: TenantDTO[] }>("/tenants");
  const tenants = data?.tenants ?? [];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", idCard: "", room: "", deposit: 3000 });
  const [err, setErr] = useState("");

  const list = tenants.filter((t) => {
    const qq = q.trim().toLowerCase();
    return !qq || t.name.toLowerCase().includes(qq) || (t.currentRoom?.id ?? "").toLowerCase().includes(qq) || (t.phone ?? "").includes(qq);
  });

  const totalBalance = tenants.reduce((s, t) => s + t.balance, 0);

  const add = async () => {
    if (!f.name.trim() || !f.room.trim()) return;
    setErr("");
    try {
      await api("/tenants", {
        method: "POST",
        body: JSON.stringify({ name: f.name.trim(), phone: f.phone || null, idCard: f.idCard || null, deposit: f.deposit, roomId: f.room.trim().toUpperCase() }),
      });
      refetch();
      setOpen(false);
      setF({ name: "", phone: "", idCard: "", room: "", deposit: 3000 });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "เพิ่มผู้เช่าไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="ผู้เช่า"
        desc={data ? `ทั้งหมด ${tenants.length} ราย` : "กำลังโหลด..."}
        actions={
          <Btn variant="brand" icon={Plus} onClick={() => setOpen(true)}>
            เพิ่มผู้เช่า
          </Btn>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "ผู้เช่าทั้งหมด", value: data ? `${tenants.length} ราย` : "—" },
          { label: "ยอดคงค้างรวม", value: THB(totalBalance), red: totalBalance > 0 },
          { label: "สถานะข้อมูล", value: isValidating ? "กำลังรีเฟรช..." : "อัปเดตล่าสุด 18 ก.ย. 2569" },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-white p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.red ? "text-danger" : "text-ink"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative ml-auto w-64">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / ห้อง / เบอร์..." className={`${inputCls} rounded-full pl-8`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลดรายชื่อผู้เช่า
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ชื่อผู้เช่า</Th>
                  <Th>เบอร์โทร</Th>
                  <Th>บัตรประชาชน</Th>
                  <Th>ห้อง</Th>
                  <Th>เข้าอยู่เมื่อ</Th>
                  <Th right>เงินประกัน</Th>
                  <Th right>ยอดคงค้าง</Th>
                  <Th>สถานะ</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <Row key={t.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#032d60] text-[11px] font-semibold text-white">
                          {t.name.replace(/[^ก-ฮ]/g, "").charAt(0)}
                        </span>
                        <span className="font-semibold text-ink">{t.name}</span>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs text-ink-soft">{t.phone ?? "—"}</Td>
                    <Td className="font-mono text-xs text-ink-soft">{t.idCard ?? "—"}</Td>
                    <Td className="font-semibold text-brand-dark">{t.currentRoom?.id ?? "—"}</Td>
                    <Td className="text-ink-soft">{thaiDate(t.moveInAt)}</Td>
                    <Td right>{THB(t.deposit)}</Td>
                    <Td right className={t.balance > 0 ? "font-semibold text-danger" : "text-ink-soft"}>
                      {t.balance > 0 ? THB(t.balance) : "—"}
                    </Td>
                    <Td>
                      <Badge tone={t.balance > 0 ? "red" : "green"} dot>
                        {t.balance > 0 ? "ค้างชำระ" : "ปกติ"}
                      </Badge>
                    </Td>
                  </Row>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มผู้เช่าใหม่"
        subtitle="บันทึกลงฐานข้อมูลจริง — ห้องจะเปลี่ยนเป็น มีผู้เช่า อัตโนมัติ"
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={add}>
              บันทึกผู้เช่า
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อ-นามสกุล *">
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="เช่น วิชัย ใจดี" />
          </Field>
          <Field label="เบอร์โทร">
            <input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="08x-xxx-xxxx" />
          </Field>
          <Field label="เลขบัตรประชาชน">
            <input className={inputCls} value={f.idCard} onChange={(e) => setF({ ...f, idCard: e.target.value })} placeholder="x-xxxx-xxxxx-xx-x" />
          </Field>
          <Field label="ห้อง *" hint="ต้องเป็นห้อง ว่าง หรือ จอง เท่านั้น">
            <input className={inputCls} value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} placeholder="เช่น A205" />
          </Field>
          <Field label="เงินประกัน (บาท)">
            <input type="number" className={inputCls} value={f.deposit} onChange={(e) => setF({ ...f, deposit: Number(e.target.value) })} />
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