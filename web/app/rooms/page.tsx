"use client";

import { useMemo, useState } from "react";
import { Eye, Loader2, Plus, Search, Wrench, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, PageHeader, Row, Tabs, Td, Th, inputCls } from "@/components/ui";
import { api, ROOM_STATUS, THB, useApi, type RoomDTO } from "@/lib/api";

const FILTERS = ["ทั้งหมด", "มีผู้เช่า", "ว่าง", "จอง", "ปิดปรับปรุง"];

const blank = { id: "", floor: 2, type: "ห้องเดี่ยว แอร์", rent: 3000, status: "VACANT" as RoomDTO["status"] };

export default function RoomsPage() {
  const { data, isValidating, mutate: refetch } = useApi<{ rooms: RoomDTO[] }>("/rooms");
  const rooms = data?.rooms ?? [];
  const [filter, setFilter] = useState("ทั้งหมด");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { ทั้งหมด: rooms.length };
    for (const r of rooms) c[ROOM_STATUS[r.status].label] = (c[ROOM_STATUS[r.status].label] ?? 0) + 1;
    return c;
  }, [rooms]);

  const list = rooms.filter((r) => {
    const st = ROOM_STATUS[r.status].label;
    const okStatus = filter === "ทั้งหมด" || st === filter;
    const qq = q.trim().toLowerCase();
    const okQ = !qq || r.id.toLowerCase().includes(qq) || (r.currentTenant?.name ?? "").toLowerCase().includes(qq) || r.type.toLowerCase().includes(qq);
    return okStatus && okQ;
  });

  const add = async () => {
    if (!f.id.trim()) return;
    setErr("");
    try {
      await api("/rooms", { method: "POST", body: JSON.stringify({ ...f, id: f.id.trim().toUpperCase() }) });
      refetch();
      setOpen(false);
      setF(blank);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "เพิ่มห้องไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="ห้องพัก"
        desc={data ? `ทั้งหมด ${rooms.length} ห้อง · 3 ชั้น · ค่าเช่า ฿2,500 – ฿6,500/เดือน` : "กำลังโหลด..."}
        actions={
          <Btn variant="brand" icon={Plus} onClick={() => setOpen(true)}>
            เพิ่มห้อง
          </Btn>
        }
      />

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Tabs options={FILTERS.map((x) => ({ id: x, label: x, count: counts[x] ?? 0 }))} value={filter} onChange={setFilter} />
          <div className="relative ml-auto w-64">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาห้อง / ผู้เช่า..." className={`${inputCls} rounded-full pl-8`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลดข้อมูลห้องพัก
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ห้อง</Th>
                  <Th>ชั้น</Th>
                  <Th>ประเภท</Th>
                  <Th right>ค่าเช่า/เดือน</Th>
                  <Th right>ค่าน้ำ (หน่วย)</Th>
                  <Th right>ค่าไฟ (หน่วย)</Th>
                  <Th>ผู้เช่า</Th>
                  <Th>สถานะ</Th>
                  <Th right>จัดการ</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <Row key={r.id}>
                    <Td className="font-semibold text-brand-dark">{r.id}</Td>
                    <Td className="text-ink-soft">ชั้น {r.floor}</Td>
                    <Td>{r.type}</Td>
                    <Td right className="font-semibold">
                      {THB(r.rent)}
                    </Td>
                    <Td right className="text-ink-soft">
                      {r.waterMeter} หน่วย
                    </Td>
                    <Td right className="text-ink-soft">
                      {r.elecMeter} หน่วย
                    </Td>
                    <Td>{r.currentTenant?.name ?? <span className="text-ink-soft/60">—</span>}</Td>
                    <Td>
                      <Badge tone={ROOM_STATUS[r.status].tone} dot>
                        {ROOM_STATUS[r.status].label}
                      </Badge>
                    </Td>
                    <Td right>
                      <div className="flex justify-end gap-1">
                        <Btn size="sm" variant="ghost" icon={Eye}>
                          ดู
                        </Btn>
                        <Btn size="sm" variant="ghost" icon={Wrench}>
                          ซ่อม
                        </Btn>
                      </div>
                    </Td>
                  </Row>
                ))}
                {list.length === 0 && (
                  <Row>
                    <Td className="py-8 text-center text-ink-soft" >
                      ไม่พบห้องที่ตรงกับเงื่อนไข
                    </Td>
                  </Row>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-line px-4 py-2.5 text-xs text-ink-soft">
          {isValidating ? "กำลังรีเฟรช..." : `แสดง ${list.length} จาก ${rooms.length} ห้อง · ว่าง ${counts["ว่าง"] ?? 0} · จอง ${counts["จอง"] ?? 0} · ปิดปรับปรุง ${counts["ปิดปรับปรุง"] ?? 0}`}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มห้องพักใหม่"
        subtitle="บันทึกลงฐานข้อมูลจริง"
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={add}>
              บันทึกห้อง
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="หมายเลขห้อง *">
            <input className={inputCls} value={f.id} onChange={(e) => setF({ ...f, id: e.target.value.toUpperCase() })} placeholder="เช่น A205" />
          </Field>
          <Field label="ชั้น">
            <select className={inputCls} value={f.floor} onChange={(e) => setF({ ...f, floor: Number(e.target.value) })}>
              <option value={2}>ชั้น 2</option>
              <option value={3}>ชั้น 3</option>
              <option value={4}>ชั้น 4</option>
            </select>
          </Field>
          <Field label="ประเภทห้อง">
            <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option>ห้องเดี่ยว แอร์</option>
              <option>ห้องเดี่ยว พัดลม</option>
              <option>ห้องสวีท</option>
            </select>
          </Field>
          <Field label="ค่าเช่า/เดือน (บาท)">
            <input type="number" className={inputCls} value={f.rent} onChange={(e) => setF({ ...f, rent: Number(e.target.value) })} />
          </Field>
          <Field label="สถานะ">
            <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as RoomDTO["status"] })}>
              <option value="VACANT">ว่าง</option>
              <option value="RESERVED">จอง</option>
              <option value="RENTED">มีผู้เช่า</option>
              <option value="MAINTENANCE">ปิดปรับปรุง</option>
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