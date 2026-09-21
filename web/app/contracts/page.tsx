"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, PageHeader, Row, Tabs, Td, Th, inputCls } from "@/components/ui";
import { api, THB, thaiDate, useApi, type ContractDTO, type RoomDTO, type TenantDTO } from "@/lib/api";

function statusOf(c: ContractDTO): "ยังดำเนิน" | "ใกล้หมดอายุ" | "หมดอายุแล้ว" {
  return c.daysLeft < 0 ? "หมดอายุแล้ว" : c.daysLeft <= 30 ? "ใกล้หมดอายุ" : "ยังดำเนิน";
}

function addMonths(iso: string, n: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function ContractsPage() {
  const { data, isValidating, mutate: refetch } = useApi<{ contracts: ContractDTO[] }>("/contracts");
  const { data: tenantsData } = useApi<{ tenants: TenantDTO[] }>("/tenants");
  const { data: roomsData } = useApi<{ rooms: RoomDTO[] }>("/rooms");
  const contracts = data?.contracts ?? [];
  const [tab, setTab] = useState("ทั้งหมด");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [f, setF] = useState({ tenantId: "", roomId: "", startDate: "2026-10-01", months: 12, deposit: 3500 });

  const counts = useMemo(() => {
    const c: Record<string, number> = { ทั้งหมด: contracts.length, ยังดำเนิน: 0, ใกล้หมดอายุ: 0, "หมดอายุแล้ว": 0 };
    for (const x of contracts) c[statusOf(x)]++;
    return c;
  }, [contracts]);

  const list = contracts.filter((c) => (tab === "ทั้งหมด" ? true : statusOf(c) === tab));

  const extend = async (id: string) => {
    setErr("");
    try {
      await api(`/contracts/${id}/extend`, { method: "POST" });
      refetch();
      setMsg("ต่ออายุสัญญา 12 เดือนเรียบร้อย");
      setTimeout(() => setMsg(""), 4000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "ต่ออายุไม่สำเร็จ");
    }
  };

  const create = async () => {
    setErr("");
    if (!f.tenantId || !f.roomId) {
      setErr("เลือกผู้เช่าและห้องให้ครบ");
      return;
    }
    try {
      await api("/contracts", {
        method: "POST",
        body: JSON.stringify({
          tenantId: f.tenantId,
          roomId: f.roomId,
          startDate: f.startDate,
          endDate: addMonths(f.startDate, f.months),
          months: f.months,
          deposit: f.deposit,
        }),
      });
      refetch();
      setOpen(false);
      setMsg("สร้างสัญญาใหม่เรียบร้อย");
      setTimeout(() => setMsg(""), 4000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "สร้างสัญญาไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="สัญญาเช่า"
        desc={data ? `ครบกำหนดภายใน 30 วัน: ${counts["ใกล้หมดอายุ"]} สัญญา · หมดอายุแล้ว: ${counts["หมดอายุแล้ว"]} สัญญา` : "กำลังโหลด..."}
        actions={
          <Btn variant="brand" icon={Plus} onClick={() => setOpen(true)}>
            สร้างสัญญาใหม่
          </Btn>
        }
      />

      {msg && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger">
          <XCircle size={16} /> {err}
        </div>
      )}

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Tabs
            options={[
              { id: "ทั้งหมด", label: "ทั้งหมด", count: counts.ทั้งหมด },
              { id: "ยังดำเนิน", label: "ยังดำเนิน", count: counts.ยังดำเนิน },
              { id: "ใกล้หมดอายุ", label: "ใกล้หมดอายุ", count: counts.ใกล้หมดอายุ },
              { id: "หมดอายุแล้ว", label: "หมดอายุแล้ว", count: counts["หมดอายุแล้ว"] },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลดสัญญา...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ผู้เช่า</Th>
                  <Th>ห้อง</Th>
                  <Th>เริ่มสัญญา</Th>
                  <Th>สิ้นสุดสัญญา</Th>
                  <Th>ระยะเวลา</Th>
                  <Th right>เงินประกัน</Th>
                  <Th>สถานะ</Th>
                  <Th right>จัดการ</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const st = statusOf(c);
                  return (
                    <Row key={c.id}>
                      <Td className="font-semibold text-ink">{c.tenant.name}</Td>
                      <Td className="font-semibold text-brand-dark">{c.room.id}</Td>
                      <Td className="text-ink-soft">{thaiDate(c.startDate)}</Td>
                      <Td className="text-ink-soft">{thaiDate(c.endDate)}</Td>
                      <Td>{c.months} เดือน</Td>
                      <Td right>{THB(c.deposit)}</Td>
                      <Td>
                        {st === "ยังดำเนิน" ? (
                          <Badge tone="green" dot>
                            ยังดำเนิน
                          </Badge>
                        ) : st === "ใกล้หมดอายุ" ? (
                          <Badge tone="amber" dot>
                            เหลือ {c.daysLeft} วัน
                          </Badge>
                        ) : (
                          <Badge tone="red" dot>
                            หมดอายุแล้ว
                          </Badge>
                        )}
                      </Td>
                      <Td right>
                        {st !== "ยังดำเนิน" && (
                          <span className="flex items-center gap-1.5">
                            <a href={`http://localhost:3001/api/pdf/contracts/${c.id}/pdf`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                              PDF
                            </a>
                            <Btn size="sm" variant="neutral" icon={CalendarClock} onClick={() => extend(c.id)}>
                              ต่ออายุ 12 เดือน
                            </Btn>
                          </span>
                        )}
                        {st === "ยังดำเนิน" && (
                          <a href={`http://localhost:3001/api/pdf/contracts/${c.id}/pdf`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                            PDF
                          </a>
                        )}
                      </Td>
                    </Row>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-line px-4 py-2.5 text-xs text-ink-soft">{isValidating ? "กำลังรีเฟรช..." : `แสดง ${list.length} จาก ${contracts.length} สัญญา`}</div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="สร้างสัญญาเช่าใหม่"
        subtitle="วันสิ้นสุดคำนวณจากระยะเวลาอัตโนมัติ"
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={create}>
              สร้างสัญญา
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="ผู้เช่า *">
            <select className={inputCls} value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })}>
              <option value="">— เลือกผู้เช่า —</option>
              {(tenantsData?.tenants ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.currentRoom ? `(${t.currentRoom.id})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ห้อง *">
            <select
              className={inputCls}
              value={f.roomId}
              onChange={(e) => {
                const room = (roomsData?.rooms ?? []).find((r) => r.id === e.target.value);
                setF({ ...f, roomId: e.target.value, deposit: room?.rent ?? f.deposit });
              }}
            >
              <option value="">— เลือกห้อง —</option>
              {(roomsData?.rooms ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {THB(r.rent)}/เดือน
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันเริ่มสัญญา">
            <input type="date" className={inputCls} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </Field>
          <Field label="ระยะเวลา (เดือน)">
            <select className={inputCls} value={f.months} onChange={(e) => setF({ ...f, months: Number(e.target.value) })}>
              {[3, 6, 12, 24].map((m) => (
                <option key={m} value={m}>
                  {m} เดือน
                </option>
              ))}
            </select>
          </Field>
          <Field label="เงินประกัน (บาท)" hint="ค่าเริ่มต้น = ค่าเช่า 1 เดือน">
            <input inputMode="numeric" className={inputCls} value={f.deposit} onChange={(e) => setF({ ...f, deposit: Number(e.target.value.replace(/\D/g, "") || 0) })} />
          </Field>
          <Field label="วันสิ้นสุด (คำนวณให้)">
            <input className={`${inputCls} bg-page/60`} value={addMonths(f.startDate, f.months)} readOnly />
          </Field>
        </div>
      </Modal>
    </>
  );
}