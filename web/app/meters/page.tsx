"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Gauge, Loader2, Save, XCircle } from "lucide-react";
import { Badge, Btn, Card, PageHeader, Row, Td, Th, inputCls } from "@/components/ui";
import { api, THB, thaiMonth, useApi } from "@/lib/api";

interface MeterRow {
  roomId: string;
  tenant: string | null;
  rent: number;
  waterPrev: number;
  elecPrev: number;
  waterCurr: number | null;
  elecCurr: number | null;
  waterUnits: number | null;
  elecUnits: number | null;
  saved: boolean;
}

interface MeterResp {
  month: string;
  waterRate: number;
  elecRate: number;
  rooms: MeterRow[];
  savedCount: number;
}

const MONTH_OPTIONS = ["2026-09", "2026-10", "2026-11"];

export default function MetersPage() {
  const [month, setMonth] = useState("2026-10");
  const { data, isValidating, mutate: refetch } = useApi<MeterResp>(`/meters?month=${month}`);
  const [draft, setDraft] = useState<Record<string, { water: string; elec: string }>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // โหลดค่าที่เคยบันทึกไว้ลงฟอร์ม
  useEffect(() => {
    if (!data) return;
    const d: Record<string, { water: string; elec: string }> = {};
    for (const r of data.rooms) {
      d[r.roomId] = { water: r.waterCurr != null ? String(r.waterCurr) : "", elec: r.elecCurr != null ? String(r.elecCurr) : "" };
    }
    setDraft(d);
  }, [data]);

  const set = (roomId: string, key: "water" | "elec", v: string) => {
    setDraft((p) => ({ ...p, [roomId]: { ...p[roomId], [key]: v.replace(/[^\d]/g, "") } }));
  };

  const rows = data?.rooms ?? [];
  const filled = rows.filter((r) => draft[r.roomId]?.water && draft[r.roomId]?.elec);

  const totalPreview = filled.reduce((s, r) => {
    const w = Number(draft[r.roomId].water) - r.waterPrev;
    const e = Number(draft[r.roomId].elec) - r.elecPrev;
    if (w < 0 || e < 0) return s;
    return s + r.rent + w * (data?.waterRate ?? 18) + e * (data?.elecRate ?? 7);
  }, 0);

  const save = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const readings = filled.map((r) => ({
        roomId: r.roomId,
        waterPrev: r.waterPrev,
        waterCurr: Number(draft[r.roomId].water),
        elecPrev: r.elecPrev,
        elecCurr: Number(draft[r.roomId].elec),
      }));
      if (!readings.length) {
        setErr("ยังไม่ได้กรอกเลขมิเตอร์");
        return;
      }
      const res = await api<{ saved: number }>("/meters", { method: "POST", body: JSON.stringify({ month, readings }) });
      refetch();
      setMsg(`บันทึกมิเตอร์ ${res.saved} ห้อง สำหรับรอบ ${thaiMonth(month)} เรียบร้อย`);
      setTimeout(() => setMsg(""), 5000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="จดมิเตอร์"
        desc="กรอกเลขมิเตอร์ครั้งนี้ของทุกห้อง — ระบบคำนวณหน่วยที่ใช้และยอดบิลให้อัตโนมัติ"
        actions={
          <>
            <select className={`${inputCls} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  รอบ {thaiMonth(m)}
                </option>
              ))}
            </select>
            <Btn variant="brand" icon={Save} onClick={save} disabled={busy || !filled.length}>
              {busy ? "กำลังบันทึก..." : `บันทึก ${filled.length} ห้อง`}
            </Btn>
          </>
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

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">จดแล้ว</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data ? `${filled.length}/${rows.length}` : "—"} <span className="text-sm font-normal text-ink-soft">ห้อง</span>
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">อัตราค่าบริการ</p>
          <p className="mt-1 text-lg font-bold text-ink">
            น้ำ ฿{data?.waterRate ?? "—"} · ไฟ ฿{data?.elecRate ?? "—"} <span className="text-sm font-normal text-ink-soft">/หน่วย</span>
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">ยอดบิลรวมโดยประมาณ</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">{THB(totalPreview)}</p>
        </div>
      </div>

      <Card noPad title={`รอบบิล ${data ? thaiMonth(data.month) : "—"}`} desc="กรอกเฉพาะ “เลขครั้งนี้” — เลขครั้งก่อนดึงอัตโนมัติจากรอบที่แล้ว">
        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลดมิเตอร์...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ห้อง</Th>
                  <Th>ผู้เช่า</Th>
                  <Th right>น้ำครั้งก่อน</Th>
                  <Th right>น้ำครั้งนี้</Th>
                  <Th right>หน่วยน้ำ</Th>
                  <Th right>ไฟครั้งก่อน</Th>
                  <Th right>ไฟครั้งนี้</Th>
                  <Th right>หน่วยไฟ</Th>
                  <Th right>ยอดบิลประมาณ</Th>
                  <Th>สถานะ</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const wCurr = draft[r.roomId]?.water ?? "";
                  const eCurr = draft[r.roomId]?.elec ?? "";
                  const wUnits = wCurr === "" ? null : Number(wCurr) - r.waterPrev;
                  const eUnits = eCurr === "" ? null : Number(eCurr) - r.elecPrev;
                  const invalid = (wUnits != null && wUnits < 0) || (eUnits != null && eUnits < 0);
                  const est =
                    wUnits != null && eUnits != null && !invalid ? r.rent + wUnits * data.waterRate + eUnits * data.elecRate : null;
                  return (
                    <Row key={r.roomId} className={invalid ? "bg-danger-soft/40" : ""}>
                      <Td className="font-semibold text-brand-dark">{r.roomId}</Td>
                      <Td className="text-ink-soft">{r.tenant ?? "—"}</Td>
                      <Td right className="font-mono text-xs text-ink-soft">
                        {r.waterPrev.toLocaleString()}
                      </Td>
                      <Td right>
                        <input
                          value={wCurr}
                          onChange={(e) => set(r.roomId, "water", e.target.value)}
                          placeholder={String(r.waterPrev)}
                          inputMode="numeric"
                          className={`${inputCls} w-24 text-right font-mono`}
                        />
                      </Td>
                      <Td right className={wUnits != null && wUnits < 0 ? "font-semibold text-danger" : "text-ink-soft"}>
                        {wUnits != null ? `${wUnits} หน่วย` : "—"}
                      </Td>
                      <Td right className="font-mono text-xs text-ink-soft">
                        {r.elecPrev.toLocaleString()}
                      </Td>
                      <Td right>
                        <input
                          value={eCurr}
                          onChange={(e) => set(r.roomId, "elec", e.target.value)}
                          placeholder={String(r.elecPrev)}
                          inputMode="numeric"
                          className={`${inputCls} w-24 text-right font-mono`}
                        />
                      </Td>
                      <Td right className={eUnits != null && eUnits < 0 ? "font-semibold text-danger" : "text-ink-soft"}>
                        {eUnits != null ? `${eUnits} หน่วย` : "—"}
                      </Td>
                      <Td right className="font-semibold">
                        {est != null ? THB(est) : "—"}
                      </Td>
                      <Td>
                        {invalid ? (
                          <Badge tone="red" dot>
                            เลขน้อยกว่าเดิม
                          </Badge>
                        ) : r.saved ? (
                          <Badge tone="green" dot>
                            บันทึกแล้ว
                          </Badge>
                        ) : (
                          <Badge tone="gray">ยังไม่จด</Badge>
                        )}
                      </Td>
                    </Row>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-ink-soft">
          <Gauge size={13} />
          {isValidating ? "กำลังรีเฟรช..." : `บันทึกไว้แล้ว ${data?.savedCount ?? 0} ห้อง · จดครบแล้วไปออกบิลได้ที่หน้า บิลและการเงิน`}
        </div>
      </Card>
    </>
  );
}