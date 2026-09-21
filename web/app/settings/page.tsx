"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, ReceiptText, Save, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, PageHeader, inputCls } from "@/components/ui";
import { api, loggedInUser, useApi } from "@/lib/api";

type Settings = Record<string, string>;

export default function SettingsPage() {
  const { data, mutate: refetch } = useApi<{ settings: Settings }>("/settings");
  const [form, setForm] = useState<Settings>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(loggedInUser()?.role === "ADMIN");
  }, []);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (keys: string[], label: string) => {
    setErr("");
    setMsg("");
    try {
      const payload = Object.fromEntries(keys.map((k) => [k, form[k] ?? ""]));
      await api("/settings", { method: "PUT", body: JSON.stringify(payload) });
      refetch();
      setMsg(`บันทึก "${label}" เรียบร้อยแล้ว`);
      setTimeout(() => setMsg(""), 4000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "บันทึกไม่สำเร็จ");
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> กำลังโหลดการตั้งค่า...
      </div>
    );
  }

  return (
    <>
      <PageHeader title="ตั้งค่า" desc="ข้อมูลหอพักและอัตราค่าบริการ — มีผลกับการคำนวณบิลจริง" />

      {!isAdmin && (
        <div className="mb-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-2.5 text-sm font-medium text-warn">
          บัญชี Staff ดูได้อย่างเดียว — แก้ไขได้เฉพาะ Admin
        </div>
      )}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="ข้อมูลหอพัก" desc="แสดงบนสัญญาและใบเสร็จ" actions={<Building2 size={15} className="text-ink-soft" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ชื่อหอพัก">
              <input className={inputCls} value={form.DORM_NAME ?? ""} onChange={(e) => set("DORM_NAME", e.target.value)} disabled={!isAdmin} />
            </Field>
            <Field label="เบอร์โทรติดต่อ">
              <input className={inputCls} value={form.DORM_PHONE ?? ""} onChange={(e) => set("DORM_PHONE", e.target.value)} disabled={!isAdmin} />
            </Field>
            <Field label="ที่อยู่">
              <input className={inputCls} value={form.DORM_ADDRESS ?? ""} onChange={(e) => set("DORM_ADDRESS", e.target.value)} disabled={!isAdmin} />
            </Field>
            <Field label="เลขบัญชีธนาคาร (รับเงิน)">
              <input className={inputCls} value={form.BANK_ACCOUNT ?? ""} onChange={(e) => set("BANK_ACCOUNT", e.target.value)} disabled={!isAdmin} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Btn variant="brand" icon={Save} disabled={!isAdmin} onClick={() => save(["DORM_NAME", "DORM_PHONE", "DORM_ADDRESS", "BANK_ACCOUNT"], "ข้อมูลหอพัก")}>
              บันทึก
            </Btn>
          </div>
        </Card>

        <Card title="อัตราค่าใช้จ่าย" desc="ใช้คำนวณบิลรายเดือนจริง" actions={<ReceiptText size={15} className="text-ink-soft" />}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="ค่าน้ำ (บาท/หน่วย)">
                <input inputMode="numeric" className={inputCls} value={form.WATER_RATE ?? ""} onChange={(e) => set("WATER_RATE", e.target.value.replace(/\D/g, ""))} disabled={!isAdmin} />
              </Field>
              <Field label="ค่าไฟ (บาท/หน่วย)">
                <input inputMode="numeric" className={inputCls} value={form.ELEC_RATE ?? ""} onChange={(e) => set("ELEC_RATE", e.target.value.replace(/\D/g, ""))} disabled={!isAdmin} />
              </Field>
              <Field label="ค่าส่วนกลาง (บาท/เดือน)">
                <input inputMode="numeric" className={inputCls} value={form.SERVICE_FEE ?? ""} onChange={(e) => set("SERVICE_FEE", e.target.value.replace(/\D/g, ""))} disabled={!isAdmin} />
              </Field>
            </div>
            <Field label="วันครบกำหนดชำระของทุกเดือน">
              <input inputMode="numeric" className={inputCls} value={form.PAYMENT_DUE_DAY ?? ""} onChange={(e) => set("PAYMENT_DUE_DAY", e.target.value.replace(/\D/g, ""))} disabled={!isAdmin} />
            </Field>
            <div className="rounded-md border border-brand/20 bg-brand-soft px-3 py-2.5 text-xs text-brand-dark">
              ค่าเหล่านี้ถูกใช้ตอนกด “ออกบิล” — บิลที่ออกไปแล้วจะเก็บอัตราเดิมไว้ ไม่เปลี่ยนย้อนหลัง
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Btn variant="brand" icon={Save} disabled={!isAdmin} onClick={() => save(["WATER_RATE", "ELEC_RATE", "SERVICE_FEE", "PAYMENT_DUE_DAY"], "อัตราค่าใช้จ่าย")}>
              บันทึก
            </Btn>
          </div>
        </Card>

        <Card title="ผู้ใช้ระบบ" desc="บัญชีที่ใช้เข้าระบบได้">
          <div className="space-y-2.5">
            {[
              { name: "ก็อต", role: "Admin · เจ้าของหอ", tone: "blue" as const },
              { name: "ป้าแดง", role: "Staff · ผู้ดูแลประจำหอ", tone: "gray" as const },
            ].map((u) => (
              <div key={u.name} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#032d60] text-xs font-semibold text-white">
                  {u.name.replace(/[^ก-ฮ]/g, "").charAt(0)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">{u.name}</p>
                  <p className="text-xs text-ink-soft">{u.role}</p>
                </div>
                <div className="ml-auto">
                  <Badge tone={u.tone}>{u.role.split("·")[0]}</Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft">เพิ่ม/แก้ผู้ใช้ผ่าน seed หรือฐานข้อมูลโดยตรง (UI จัดการผู้ใช้จะมาในเฟสถัดไป)</p>
        </Card>

        <Card title="การแจ้งเตือน" desc="ยังไม่เปิดใช้งาน — วางแผนไว้เฟสถัดไป">
          <div className="space-y-2.5 opacity-60">
            {["เตือนครบกำหนดชำระล่วงหน้า 3 วัน", "แจ้งเมื่อชำระเรียบร้อย (ใบเสร็จ)", "เตือนสัญญาครบกำหนด 30/7 วัน", "แจ้งงานซ่อมเร่งด่วนทันที"].map((t) => (
              <label key={t} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
                <span className="text-sm text-ink">{t}</span>
                <input type="checkbox" disabled className="h-4 w-4 accent-[#0176d3]" />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft">จะเชื่อม LINE Notify ในเฟสถัดไป</p>
        </Card>
      </div>
    </>
  );
}