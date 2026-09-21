"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Td, Th } from "@/components/ui";
import { ROOM_STATUS, THB, thaiDate, useApi } from "@/lib/api";

interface RoomDetail {
  id: string;
  floor: number;
  type: string;
  rent: number;
  status: string;
  waterMeter: number;
  elecMeter: number;
  currentTenant: { id: string; name: string; phone: string | null; deposit: number; balance: number } | null;
  contracts: { id: string; tenant: { name: string }; startDate: string; endDate: string; months: number; deposit: number }[];
  readings: { id: string; month: string; waterUnits: number; elecUnits: number; recordedAt: string }[];
  workOrders: { id: string; title: string; category: string; priority: string; status: string; createdAt: string }[];
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApi<{ room: RoomDetail }>(`/rooms/${id}`);
  const r = data?.room;

  if (!r) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`ห้อง ${r.id}`}
        desc={`ชั้น ${r.floor} · ${r.type} · ${ROOM_STATUS[r.status]?.label ?? r.status}`}
        actions={
          <Link href="/rooms">
            <Btn variant="neutral" icon={ArrowLeft}>
              กลับห้องพัก
            </Btn>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "ค่าเช่า/เดือน", value: THB(r.rent), bold: true },
          { label: "มิเตอร์น้ำ (ล่าสุด)", value: `${r.waterMeter} หน่วย` },
          { label: "มิเตอร์ไฟ (ล่าสุด)", value: `${r.elecMeter} หน่วย` },
          { label: "สถานะ", value: ROOM_STATUS[r.status]?.label ?? r.status, badgeTone: ROOM_STATUS[r.status]?.tone ?? "gray" },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
            {s.badgeTone ? (
              <span className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                <Badge tone={s.badgeTone} dot>
                  {s.value}
                </Badge>
              </span>
            ) : (
              <p className={`mt-1 text-xl font-bold ${s.bold ? "text-ink" : "text-ink-soft"}`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {r.currentTenant && (
        <Card title="ผู้เช่าปัจจุบัน" desc="ข้อมูลติดต่อและสถานะการเงิน" className="mb-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">ชื่อ</p>
              <p className="font-semibold text-ink">{r.currentTenant.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">เบอร์โทร</p>
              <p className="text-sm text-ink">{r.currentTenant.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">เงินประกัน</p>
              <p className="text-sm text-ink">{THB(r.currentTenant.deposit)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">ยอดค้าง</p>
              <p className={`text-sm font-semibold ${r.currentTenant.balance > 0 ? "text-danger" : "text-ink-soft"}`}>
                {r.currentTenant.balance > 0 ? THB(r.currentTenant.balance) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Link href={`/tenants/${r.currentTenant.id}`}>
              <Btn variant="neutral" size="sm">
                ดูประวัติผู้เช่า →
              </Btn>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card noPad title="ประวัติสัญญา" desc={`${r.contracts.length} สัญญา`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ผู้เช่า</Th>
                  <Th>เริ่ม</Th>
                  <Th>สิ้นสุด</Th>
                </tr>
              </thead>
              <tbody>
                {r.contracts.map((c) => (
                  <Row key={c.id}>
                    <Td>{c.tenant.name}</Td>
                    <Td className="text-ink-soft">{thaiDate(c.startDate)}</Td>
                    <Td className="text-ink-soft">{thaiDate(c.endDate)}</Td>
                  </Row>
                ))}
                {r.contracts.length === 0 && (
                  <Row>
                    <Td className="py-6 text-center text-ink-soft">ยังไม่มี</Td>
                  </Row>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card noPad title="บันтึกมิเตอร์" desc="8 รอบล่าสุด">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>รอบ</Th>
                  <Th right>น้ำ (หน่วย)</Th>
                  <Th right>ไฟ (หน่วย)</Th>
                </tr>
              </thead>
              <tbody>
                {r.readings.map((m) => (
                  <Row key={m.id}>
                    <Td className="text-ink-soft">{m.month.replace("-", "/")}</Td>
                    <Td right>{m.waterUnits}</Td>
                    <Td right>{m.elecUnits}</Td>
                  </Row>
                ))}
                {r.readings.length === 0 && (
                  <Row>
                    <Td className="py-6 text-center text-ink-soft">ยังไม่มี</Td>
                  </Row>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card noPad title="งานซ่อม" desc="8 งานล่าสุด">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>งาน</Th>
                  <Th>สถานะ</Th>
                </tr>
              </thead>
              <tbody>
                {r.workOrders.map((w) => (
                  <Row key={w.id}>
                    <Td className="text-[13px]">{w.title}</Td>
                    <Td>
                      <Badge tone={w.status === "NEW" ? "blue" : w.status === "IN_PROGRESS" ? "amber" : "green"} dot>
                        {w.status === "NEW" ? "รับเรื่อง" : w.status === "IN_PROGRESS" ? "กำลังซ่อม" : "เสร็จแล้ว"}
                      </Badge>
                    </Td>
                  </Row>
                ))}
                {r.workOrders.length === 0 && (
                  <Row>
                    <Td className="py-6 text-center text-ink-soft">ยังไม่มี</Td>
                  </Row>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}