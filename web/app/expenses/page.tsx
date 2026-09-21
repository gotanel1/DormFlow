"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, PageHeader, Row, Td, Th, inputCls } from "@/components/ui";
import { api, THB, thaiMonth, useApi } from "@/lib/api";

interface ExpenseDTO {
  id: string;
  month: string;
  category: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

const CATEGORIES = ["ค่าไฟส่วนกลาง", "ค่าน้ำส่วนกลาง", "ซ่อมบำรุง", "เงินเดือนพนักงาน", "ทำความสะอาด", "อื่นๆ"];
const CAT_TONES: Record<string, "blue" | "amber" | "red" | "green" | "gray"> = {
  "ค่าไฟส่วนกลาง": "amber",
  "ค่าน้ำส่วนกลาง": "blue",
  ซ่อมบำรุง: "red",
  เงินเดือนพนักงาน: "green",
  ทำความสะอาด: "gray",
  "อื่นๆ": "gray",
};

export default function ExpensesPage() {
  const { data, mutate: refetch } = useApi<{ expenses: ExpenseDTO[]; total: number; byMonth: { label: string; value: number }[] }>("/expenses");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ month: "2026-09", category: "ค่าไฟส่วนกลาง", amount: "", note: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const expenses = data?.expenses ?? [];

  const add = async () => {
    setErr("");
    if (!f.amount || Number(f.amount) <= 0) {
      setErr("กรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    try {
      await api("/expenses", {
        method: "POST",
        body: JSON.stringify({ month: f.month, category: f.category, amount: Number(f.amount), note: f.note || null }),
      });
      refetch();
      setOpen(false);
      setF({ month: "2026-09", category: "ค่าไฟส่วนกลาง", amount: "", note: "" });
      setMsg("บันทึกรายจ่ายเรียบร้อย");
      setTimeout(() => setMsg(""), 4000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: string) => {
    await api(`/expenses/${id}`, { method: "DELETE" });
    refetch();
  };

  const thisMonth = expenses.filter((e) => e.month === "2026-09").reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader
        title="รายจ่าย"
        desc="บันทึกค่าใช้จ่ายของหอพัก — ใช้คำนวณกำไรสุทธิในหน้ารายงาน"
        actions={
          <Btn variant="brand" icon={Plus} onClick={() => setOpen(true)}>
            เพิ่มรายจ่าย
          </Btn>
        }
      />

      {msg && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">รายจ่ายเดือน ก.ย.</p>
          <p className="mt-1 text-2xl font-bold text-danger">{THB(thisMonth)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">รายจ่ายรวมทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold text-ink">{THB(data?.total ?? 0)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">จำนวนรายการ</p>
          <p className="mt-1 text-2xl font-bold text-ink">{expenses.length}</p>
        </div>
      </div>

      <Card noPad title="รายการค่าใช้จ่าย" desc="เรียงจากล่าสุด">
        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>รอบเดือน</Th>
                  <Th>หมวดหมู่</Th>
                  <Th>หมายเหตุ</Th>
                  <Th right>จำนวนเงิน</Th>
                  <Th right>จัดการ</Th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <Row key={e.id}>
                    <Td className="font-semibold text-ink">{thaiMonth(e.month)}</Td>
                    <Td>
                      <Badge tone={CAT_TONES[e.category] ?? "gray"}>{e.category}</Badge>
                    </Td>
                    <Td className="text-ink-soft">{e.note ?? "—"}</Td>
                    <Td right className="font-semibold text-danger">
                      {THB(e.amount)}
                    </Td>
                    <Td right>
                      <Btn size="sm" variant="danger" icon={Trash2} onClick={() => remove(e.id)}>
                        ลบ
                      </Btn>
                    </Td>
                  </Row>
                ))}
                {expenses.length === 0 && (
                  <Row>
                    <Td className="py-8 text-center text-ink-soft">ยังไม่มีรายจ่าย</Td>
                  </Row>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มรายจ่าย"
        subtitle="บันทึกลงฐานข้อมูลจริง"
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={add}>
              บันทึก
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="รอบเดือน">
            <select className={inputCls} value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })}>
              {["2026-07", "2026-08", "2026-09", "2026-10"].map((m) => (
                <option key={m} value={m}>
                  {thaiMonth(m)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="หมวดหมู่">
            <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="จำนวนเงิน (บาท) *">
            <input inputMode="numeric" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} placeholder="เช่น 4500" />
          </Field>
          <Field label="หมายเหตุ">
            <input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="ไม่บังคับ" />
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