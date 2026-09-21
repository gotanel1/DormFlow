"use client";

import Link from "next/link";
import { mutate } from "swr";
import { AlertTriangle, ChevronRight, DoorOpen, Loader2, Plus, ReceiptText, Users, Wallet } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Stat, Td, Th } from "@/components/ui";
import { Bars, Donut } from "@/components/charts";
import {
  api,
  CURRENT_PERIOD,
  INV_STATUS,
  THB,
  thaiDate,
  thaiMonth,
  useApi,
  type ContractDTO,
  type InvoiceDTO,
  type SummaryDTO,
  type WorkDTO,
} from "@/lib/api";

export default function DashboardPage() {
  const { data: summary } = useApi<SummaryDTO>("/invoices/summary");
  const { data: bills } = useApi<{ invoices: InvoiceDTO[] }>(`/invoices?period=${CURRENT_PERIOD}`);
  const { data: contracts } = useApi<{ contracts: ContractDTO[] }>("/contracts");
  const { data: work } = useApi<{ orders: WorkDTO[] }>("/workorders");
  const loading = !summary || !bills || !contracts || !work;

  const openBills = (bills?.invoices ?? []).filter((b) => b.status !== "PAID");
  const near = (contracts?.contracts ?? []).filter((c) => c.daysLeft <= 30);
  const wip = (work?.orders ?? []).filter((w) => w.status !== "DONE").slice(0, 3);

  const pay = async (id: string) => {
    await api(`/invoices/${id}/pay`, { method: "POST", body: JSON.stringify({ method: "CASH" }) });
    mutate(`/invoices?period=${CURRENT_PERIOD}`);
    mutate("/invoices/summary");
  };

  const monthly = (summary?.monthly ?? []).map((m) => ({ label: thaiMonth(m.label), value: m.value }));
  const prevTwo = summary?.monthly.slice(-2) ?? [];
  const delta =
    prevTwo.length === 2 && prevTwo[0].value > 0 ? `${((prevTwo[1].value / prevTwo[0].value - 1) * 100).toFixed(1)}%` : undefined;

  return (
    <>
      <PageHeader
        title="หน้าหลัก"
        desc="หอพักสบายใจ · ซอยสุขุมวิท 31 · พุธที่ 18 กันยายน 2569"
        actions={
          <>
            <Link href="/billing">
              <Btn variant="neutral" icon={Plus}>
                สร้างบิลเดือน ก.ย.
              </Btn>
            </Link>
            <Link href="/billing">
              <Btn variant="brand" icon={ReceiptText}>
                รับชำระ
              </Btn>
            </Link>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="รายได้เดือนนี้ (ก.ย.)" value={summary ? THB(summary.monthIncome) : "—"} delta={delta} up={!!delta && !delta.startsWith("-")} note="ยอดที่ชำระแล้วจริง" icon={Wallet} />
        <Stat
          label="ยอดค้างชำระ (ก.ย.)"
          value={summary ? THB(summary.overdue.value) : "—"}
          delta={summary ? `${summary.overdue.count} รายการ` : undefined}
          up={false}
          note="ครบกำหนด 10 ก.ย. 2569"
          icon={AlertTriangle}
        />
        <Stat
          label="อัตราการเข้าพัก"
          value={summary ? `${Math.round((summary.occupancy / summary.roomCount) * 100)}%` : "—"}
          note={summary ? `เข้าพัก ${summary.occupancy} จาก ${summary.roomCount} ห้อง` : undefined}
          icon={DoorOpen}
        />
        <Stat label="ผู้เช่าทั้งหมด" value={summary ? `${summary.tenantCount} คน` : "—"} icon={Users} />
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink-soft">
          <Loader2 size={15} className="animate-spin" /> กำลังโหลดข้อมูลจาก API...
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 xl:col-span-2">
          <Card
            title="รายได้รวมย้อนหลัง"
            desc="จากบิลที่ชำระแล้วจริง · หน่วย: พันบาท"
            actions={
              <Badge tone="blue">
                รวม {THB((summary?.monthly ?? []).reduce((s, m) => s + m.value, 0))}
              </Badge>
            }
          >
            {monthly.length > 1 ? (
              <Bars data={monthly} />
            ) : (
              <p className="py-8 text-center text-sm text-ink-soft">ยังไม่มีข้อมูลรายรับย้อนหลัง</p>
            )}
          </Card>

          <Card
            title={`บิลค้างชำระ / รอชำระ — ${openBills.length} รายการ`}
            desc={`รอบบิล ${thaiMonth(CURRENT_PERIOD)} 2569 · ครบกำหนด 10 ก.ย. 2569`}
            actions={
              <Link href="/billing">
                <Btn variant="neutral" size="sm">
                  ดูทั้งหมด <ChevronRight size={13} />
                </Btn>
              </Link>
            }
          >
            <div className="-mx-4 -mb-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-page/60">
                    <Th>เลขที่บิล</Th>
                    <Th>ห้อง</Th>
                    <Th>ผู้เช่า</Th>
                    <Th right>ยอดรวม</Th>
                    <Th>กำหนดชำระ</Th>
                    <Th>สถานะ</Th>
                    <Th right>จัดการ</Th>
                  </tr>
                </thead>
                <tbody>
                  {openBills.map((b) => (
                    <Row key={b.id}>
                      <Td className="font-mono text-xs text-ink-soft">{b.no}</Td>
                      <Td className="font-semibold text-brand-dark">{b.room.id}</Td>
                      <Td>{b.tenant.name}</Td>
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
                        <Btn size="sm" variant="brand" onClick={() => pay(b.id)}>
                          รับชำระ
                        </Btn>
                      </Td>
                    </Row>
                  ))}
                  {!loading && openBills.length === 0 && (
                    <Row>
                      <Td className="py-8 text-center text-ink-soft">🎉 ไม่มีบิลค้าง — เก็บครบแล้วทุกห้อง</Td>
                    </Row>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card title="สถานะห้องพัก" desc={`ทั้งหมด ${summary?.roomCount ?? "—"} ห้อง · 3 ชั้น`}>
            <Donut
              segments={[
                { label: "มีผู้เช่า", value: summary?.occupancy ?? 0, color: "#0176d3" },
                { label: "ว่าง/อื่นๆ", value: (summary?.roomCount ?? 0) - (summary?.occupancy ?? 0), color: "#c9c9c9" },
              ]}
              centerValue={summary ? `${summary.occupancy}/${summary.roomCount}` : "—"}
              centerLabel="เข้าพัก"
            />
          </Card>

          <Card title="สัญญาครบกำหนดเร็วๆ นี้" desc="หมดอายุภายใน 30 วัน" actions={<Link href="/contracts"><Btn variant="ghost" size="sm">จัดการสัญญา</Btn></Link>}>
            <div className="space-y-2.5">
              {near.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{c.tenant.name}</p>
                    <p className="text-[11px] text-ink-soft">
                      ห้อง {c.room.id} · สิ้นสุด {thaiDate(c.endDate)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge tone={c.daysLeft < 0 ? "red" : "amber"}>{c.daysLeft < 0 ? "หมดอายุแล้ว" : `เหลือ ${c.daysLeft} วัน`}</Badge>
                  </div>
                </div>
              ))}
              {!loading && near.length === 0 && <p className="py-4 text-center text-sm text-ink-soft">ไม่มีสัญญาใกล้หมดอายุ</p>}
            </div>
          </Card>

          <Card title="งานซ่อมล่าสุด" desc="งานที่ยังไม่เสร็จ">
            <div className="space-y-2.5">
              {wip.map((w) => (
                <div key={w.id} className="flex items-center gap-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{w.title}</p>
                    <p className="text-[11px] text-ink-soft">
                      ห้อง {w.room.id} · {w.category}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge tone={w.status === "NEW" ? "blue" : "amber"} dot>
                      {w.status === "NEW" ? "รับเรื่อง" : "กำลังซ่อม"}
                    </Badge>
                  </div>
                </div>
              ))}
              {!loading && wip.length === 0 && <p className="py-4 text-center text-sm text-ink-soft">ไม่มีงานค้าง</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}