"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Plus, QrCode, XCircle } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Tabs, Td, Th } from "@/components/ui";
import { api, CURRENT_PERIOD, INV_STATUS, THB, thaiDate, useApi, type InvoiceDTO } from "@/lib/api";
import { exportXlsx } from "@/lib/export";

export default function BillingPage() {
  const { data, isValidating, mutate: refetch } = useApi<{ invoices: InvoiceDTO[] }>(`/invoices?period=${CURRENT_PERIOD}`);
  const invoices = data?.invoices ?? [];
  const [tab, setTab] = useState("ทั้งหมด");
  const [notify, setNotify] = useState("");
  const [err, setErr] = useState("");

  const exportBills = () =>
    exportXlsx(`bills-${CURRENT_PERIOD}`, "Bills", [
      { header: "เลขที่บיל", value: (i: InvoiceDTO) => i.no },
      { header: "รอบ", value: (i: InvoiceDTO) => i.period },
      { header: "ห้อง", value: (i: InvoiceDTO) => i.room.id },
      { header: "ผู้เช่า", value: (i: InvoiceDTO) => i.tenant.name },
  { header: "Rent (THB)", value: (i: InvoiceDTO) => i.rentAmount },
      { header: "น้ำ(หน่วย)", value: (i: InvoiceDTO) => i.waterUnits },
      { header: "ไฟ(หน่วย)", value: (i: InvoiceDTO) => i.elecUnits },
      { header: "คาน้ำ(฿)", value: (i: InvoiceDTO) => i.waterAmount },
      { header: "ค่าไฟ(฿)", value: (i: InvoiceDTO) => i.elecAmount },
      { header: "รวม(฿)", value: (i: InvoiceDTO) => i.total },
      { header: "สถานะ", value: (i: InvoiceDTO) => (i.status === "PAID" ? "ชำระแล้ว" : i.status === "OVERDUE" ? "ค้างชำระ" : "รอชำระ") },
      { header: "จ่ายเมื่อ", value: (i: InvoiceDTO) => (i.paidAt ? thaiDate(i.paidAt) : "—") },
    ], invoices);

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
    const open = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
    return { paid, open, overdue };
  }, [invoices]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ทั้งหมด: invoices.length };
    for (const i of invoices) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [invoices]);

  const list = invoices.filter((i) => tab === "ทั้งหมด" || i.status === tab);

  const toast = (msg: string) => {
    setNotify(msg);
    setErr("");
    setTimeout(() => setNotify(""), 4000);
  };

  const pay = async (id: string) => {
    setErr("");
    try {
      const inv = invoices.find((i) => i.id === id);
      await api(`/invoices/${id}/pay`, { method: "POST", body: JSON.stringify({ method: "CASH" }) });
      refetch();
      toast(`รับชำระ ${inv?.no} — ${inv?.tenant.name} เรียบร้อย ${inv ? THB(inv.total) : ""}`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "รับชำระไม่สำเร็จ");
    }
  };

  const createBills = async () => {
    setErr("");
    try {
      const res = await api<{ created: number; period: string }>("/invoices/generate", { method: "POST", body: JSON.stringify({}) });
      refetch();
      toast(`ออกบิลเดือนถัดไปแล้ว ${res.created} ใบ (${res.period})`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "ออกบิลไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="บิลและการเงิน"
        desc={`รอบบิลปัจจุบัน: กันยายน 2569 · หมดเขตชำระวันที่ 10`}
        actions={
                  <>
                    <Btn variant="brand" icon={QrCode}>
                      สร้าง QR รับชำระ
                    </Btn>
                    <Btn variant="neutral" icon={FileSpreadsheet} onClick={() => exportBills()}>
                      ส่งออก Excel
                    </Btn>
                    <Btn variant="neutral" icon={Plus} onClick={createBills}>
                      ออกบิลเดือนหน้า
                    </Btn>
                  </>
                }
      />

      {notify && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> {notify}
        </div>
      )}
      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger">
          <XCircle size={16} /> {err}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "เก็บได้แล้ว (ก.ย.)", value: THB(totals.paid), tone: "text-success" },
          { label: "ยังไม่ชำระ (รอ + ค้าง)", value: THB(totals.open), tone: "text-warn" },
          { label: "ค้างชำระเกินกำหนด", value: THB(totals.overdue), tone: "text-danger" },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Tabs
            options={[
              { id: "ทั้งหมด", label: "ทั้งหมด", count: counts.ทั้งหมด },
              { id: "PAID", label: "ชำระแล้ว", count: counts.PAID ?? 0 },
              { id: "PENDING", label: "รอชำระ", count: counts.PENDING ?? 0 },
              { id: "OVERDUE", label: "ค้างชำระ", count: counts.OVERDUE ?? 0 },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลดบิล...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>เลขที่บิล</Th>
                  <Th>ห้อง</Th>
                  <Th>ผู้เช่า</Th>
                  <Th right>ค่าเช่า</Th>
                  <Th right>ค่าน้ำ</Th>
                  <Th right>ค่าไฟ</Th>
                  <Th right>ยอดรวม</Th>
                  <Th>กำหนดชำระ</Th>
                  <Th>สถานะ</Th>
                  <Th right>จัดการ</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <Row key={b.id} className={b.status === "OVERDUE" ? "bg-danger-soft/40" : ""}>
                    <Td className="font-mono text-xs text-ink-soft">{b.no}</Td>
                    <Td className="font-semibold text-brand-dark">{b.room.id}</Td>
                    <Td>{b.tenant.name}</Td>
                    <Td right>{THB(b.rentAmount)}</Td>
                    <Td right className="text-ink-soft">
                      {THB(b.waterAmount)} ({b.waterUnits} หน่วย)
                    </Td>
                    <Td right className="text-ink-soft">
                      {THB(b.elecAmount)} ({b.elecUnits} หน่วย)
                    </Td>
                    <Td right className="font-semibold">
                      {THB(b.total)}
                    </Td>
                    <Td className="text-ink-soft">{thaiDate(b.dueDate)}</Td>
                    <Td>
                      <Badge tone={INV_STATUS[b.status].tone} dot>
                        {INV_STATUS[b.status].label}
                      </Badge>
                    </Td>
                    <Td right>
                      {b.status !== "PAID" ? (
                        <Btn size="sm" variant="brand" onClick={() => pay(b.id)}>
                          รับชำระ
                        </Btn>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <a href={`http://localhost:3001/api/pdf/invoices/${b.id}/receipt`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                            ใบเสร็จ PDF
                          </a>
                          <span className="text-xs text-ink-soft">จ่ายเมื่อ {thaiDate(b.paidAt)}</span>
                        </div>
                      )}
                    </Td>
                  </Row>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-line px-4 py-2.5 text-xs text-ink-soft">
          {isValidating ? "กำลังรีเฟรช..." : `อัตราค่าน้ำ ฿18/หน่วย · ค่าไฟ ฿7/หน่วย · แก้ไขได้ที่หน้า `}
          <a href="/settings" className="font-medium text-brand hover:underline">
            ตั้งค่า
          </a>
        </div>
      </Card>
    </>
  );
}