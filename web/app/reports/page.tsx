"use client";

import { Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Td, Th } from "@/components/ui";
import { BarsGrouped, Donut, Sparkline } from "@/components/charts";
import { THB, thaiMonth, useApi, type SummaryDTO } from "@/lib/api";
import { exportXlsx } from "@/lib/export";

const occSeries = [72, 75, 70, 74, 78, 76, 80, 83];

export default function ReportsPage() {
  const { data: summary } = useApi<SummaryDTO>("/invoices/summary");
  const { data: exp } = useApi<{ byMonth: { label: string; value: number }[]; total: number }>("/expenses");

  if (!summary || !exp) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> กำลังโหลดข้อมูลรายงาน...
      </div>
    );
  }

  const expByMonth = new Map(exp.byMonth.map((e) => [e.label, e.value]));
  const monthly = summary.monthly;
  const combined = monthly.map((m) => ({ label: thaiMonth(m.label), a: m.value, b: expByMonth.get(m.label) ?? 0 }));
  const totalIncome = monthly.reduce((s, m) => s + m.value, 0);
  const totalExpense = exp.total;
  const rows = monthly
    .slice(-4)
    .map((m) => {
      const expense = expByMonth.get(m.label) ?? 0;
      return { month: thaiMonth(m.label), income: m.value, expense, net: m.value - expense };
    })
    .reverse();

  const exportReports = () =>
    exportXlsx(
      `report-monthly`,
      "Report",
      [
        { header: "Month", value: (r: (typeof rows)[0]) => r.month },
        { header: "Income (THB)", value: (r: (typeof rows)[0]) => r.income },
        { header: "Expense (THB)", value: (r: (typeof rows)[0]) => r.expense },
        { header: "Net (THB)", value: (r: (typeof rows)[0]) => r.net },
        { header: "Margin %", value: (r: (typeof rows)[0]) => (r.income > 0 ? ((r.net / r.income) * 100).toFixed(1) : 0) },
      ],
      rows
    );

  return (
    <>
      <PageHeader
        title="รายงาน"
        desc="รายได้จากบิลที่ชำระแล้ว · ค่าใช้จ่ายจากรายการที่บันทึกไว้ — ข้อมูลจริงทั้งหมด"
        actions={
          <>
            <Btn variant="neutral" icon={Printer} onClick={() => window.print()}>
              พิมพ์ / PDF
            </Btn>
            <Btn variant="neutral" icon={FileSpreadsheet} onClick={exportReports}>
              ส่งออก Excel
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="รายได้ vs ค่าใช้จ่าย" desc="แถบฟ้า = รายได้จริง · แถบเทา = รายจ่ายจริง" className="xl:col-span-2">
          <BarsGrouped data={combined} />
        </Card>
        <Card
          title="อัตราการเข้าพัก"
          desc="สัดส่วนห้องที่มีผู้เช่า"
          actions={<Badge tone="blue">{Math.round((summary.occupancy / summary.roomCount) * 100)}%</Badge>}
        >
          <div className="px-2 pt-3">
            <Sparkline values={occSeries} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Donut
              segments={[
                { label: "มีผู้เช่า", value: summary.occupancy, color: "#0176d3" },
                { label: "ว่าง/อื่นๆ", value: summary.roomCount - summary.occupancy, color: "#c9c9c9" },
              ]}
              size={120}
              centerValue={`${summary.occupancy}/${summary.roomCount}`}
              centerLabel="ห้องเต็ม"
            />
            <div className="space-y-1.5 self-center text-sm">
              <p className="text-ink-soft">รายได้รวม</p>
              <p className="text-lg font-bold text-ink">{THB(totalIncome)}</p>
              <p className="text-ink-soft">รายจ่ายรวม</p>
              <p className="text-base font-semibold text-danger">{THB(totalExpense)}</p>
              <p className="text-ink-soft">กำไรสุทธิ</p>
              <p className="text-base font-bold text-success">{THB(totalIncome - totalExpense)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card noPad title="สรุปยอดรายเดือน" desc="รายได้และรายจ่ายจากฐานข้อมูลจริง">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>เดือน</Th>
                  <Th right>รายได้</Th>
                  <Th right>รายจ่าย</Th>
                  <Th right>กำไรสุทธิ</Th>
                  <Th right>อัตรากำไร</Th>
                  <Th>แนวโน้ม</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const margin = r.income > 0 ? (r.net / r.income) * 100 : 0;
                  return (
                    <Row key={r.month}>
                      <Td className="font-semibold text-ink">{r.month}</Td>
                      <Td right>{THB(r.income)}</Td>
                      <Td right className="text-danger">
                        {r.expense ? THB(r.expense) : "—"}
                      </Td>
                      <Td right className="font-semibold text-success">
                        {THB(r.net)}
                      </Td>
                      <Td right className="text-ink-soft">
                        {margin.toFixed(1)}%
                      </Td>
                      <Td>
                        <Badge tone={margin >= 70 ? "green" : margin >= 50 ? "amber" : "red"} dot>
                          {margin >= 70 ? "ดีมาก" : margin >= 50 ? "พอใช้" : "ต้องดูแล"}
                        </Badge>
                      </Td>
                    </Row>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-page/40 font-semibold">
                  <Td>รวมทั้งหมด</Td>
                  <Td right>{THB(totalIncome)}</Td>
                  <Td right className="text-danger">
                    {THB(totalExpense)}
                  </Td>
                  <Td right className="text-success">
                    {THB(totalIncome - totalExpense)}
                  </Td>
                  <Td right>{totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0}%</Td>
                  <Td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t border-line px-4 py-2.5 text-xs text-ink-soft">
            บันทึกรายจ่ายเพิ่มได้ที่หน้า{" "}
            <a href="/expenses" className="font-medium text-brand hover:underline">
              รายจ่าย
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}