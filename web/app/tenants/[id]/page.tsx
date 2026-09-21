"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Td, Th } from "@/components/ui";
import { api, THB, thaiDate, useApi, type ContractDTO, type InvoiceDTO, type TenantDTO } from "@/lib/api";

interface Detail extends TenantDTO {
  contracts: (ContractDTO & { tenant: { name: string } })[];
  invoices: InvoiceDTO[];
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApi<{ tenant: Detail }>(`/tenants/${id}`);
  const t = data?.tenant;

  if (!t) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t.name}
        desc={`ผู้เช่า • ห้อง ${t.currentRoom?.id ?? "—"}`}
        actions={
          <Link href="/tenants">
            <Btn variant="neutral" icon={ArrowLeft}>
              กลับรายชื่อ
            </Btn>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "ห้อง", value: t.currentRoom?.id ?? "—" },
          { label: "เข้าอยู่", value: thaiDate(t.moveInAt) },
          { label: "เงินประกัน", value: THB(t.deposit), bold: true },
          { label: "ยอดค้าง", value: t.balance > 0 ? THB(t.balance) : "—", red: t.balance > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.red ? "text-danger" : "text-ink"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card noPad title="ประวัติสัญญา" desc={`${t.contracts.length} สัญญา`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>เริ่ม</Th>
                  <Th>สิ้นสุด</Th>
                  <Th>ระยะ</Th>
                  <Th right>ประกัน</Th>
                  <Th right>PDF</Th>
                </tr>
              </thead>
              <tbody>
                {t.contracts.map((c) => (
                  <Row key={c.id}>
                    <Td className="text-ink-soft">{thaiDate(c.startDate)}</Td>
                    <Td className="text-ink-soft">{thaiDate(c.endDate)}</Td>
                    <Td>{c.months} เดือน</Td>
                    <Td right>{THB(c.deposit)}</Td>
                    <Td right>
                      <a href={`http://localhost:3001/api/pdf/contracts/${c.id}/pdf`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                        ดาวน์โหลด
                      </a>
                    </Td>
                  </Row>
                ))}
                {t.contracts.length === 0 && (
                  <Row>
                    <Td className="py-6 text-center text-ink-soft">ยังไม่มีประวัติสัญญา</Td>
                  </Row>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card noPad title="ประวัติบิล" desc={`${t.invoices.length} ใบล่าสุด`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>เลขที่บิล</Th>
                  <Th>รอบ</Th>
                  <Th right>ยอด</Th>
                  <Th>สถานะ</Th>
                  <Th right>PDF</Th>
                </tr>
              </thead>
              <tbody>
                {t.invoices.map((i) => (
                  <Row key={i.id}>
                    <Td className="font-mono text-xs text-ink-soft">{i.no}</Td>
                    <Td className="text-ink-soft">{i.period.replace("-", "/")}</Td>
                    <Td right className="font-semibold">
                      {THB(i.total)}
                    </Td>
                    <Td>
                      <Badge tone={i.status === "PAID" ? "green" : i.status === "OVERDUE" ? "red" : "amber"} dot>
                        {i.status === "PAID" ? "ชำระแล้ว" : i.status === "OVERDUE" ? "ค้างชำระ" : "รอชำระ"}
                      </Badge>
                    </Td>
                    <Td right>
                      <a href={`http://localhost:3001/api/pdf/invoices/${i.id}/receipt`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                        ใบเสร็จ
                      </a>
                    </Td>
                  </Row>
                ))}
                {t.invoices.length === 0 && (
                  <Row>
                    <Td className="py-6 text-center text-ink-soft">ยังไม่มีบิล</Td>
                  </Row>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-soft">
            {t.invoices.length >= 12 ? "แสดง 12 ใบล่าสุด" : `ทั้งหมด ${t.invoices.length} ใบ`}
            <span className="text-ink-soft/70">ดูประวัติเพิ่มได้ที่หน้าบิล</span>
          </div>
        </Card>
      </div>
    </>
  );
}