"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Loader2, AlertTriangle } from "lucide-react";
import { Btn, Modal } from "@/components/ui";
import { API_BASE, THB, getToken, thaiDate } from "@/lib/api";
import type { InvoiceDTO } from "@/lib/api";

interface QrInfo {
  no: string;
  period: string;
  room: string;
  tenant: string;
  total: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  phone: string;
  dormName: string;
  payload: string;
}

/** รูป QR ต้องแนบ Bearer token — <img> ส่ง header เองไม่ได้ เลยดึงเป็น data URL */
function useQrImage(invoiceId: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!invoiceId) return;
    let dead = false;
    setUrl(null);
    setErr("");
    fetch(`${API_BASE}/qr/png/${invoiceId}`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
        return URL.createObjectURL(await r.blob());
      })
      .then((u) => {
        if (dead) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch((e) => !dead && setErr(e instanceof Error ? e.message : "โหลด QR ไม่สำเร็จ"));
    return () => {
      dead = true;
    };
  }, [invoiceId]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return { url, err };
}

export function QrModal({ invoice, onClose }: { invoice: InvoiceDTO | null; onClose: () => void }) {
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [copied, setCopied] = useState(false);
  const { url: qrUrl, err: imgErr } = useQrImage(invoice?.id ?? null);

  useEffect(() => {
    if (!invoice) {
      setInfo(null);
      return;
    }
    let dead = false;
    setLoadErr("");
    fetch(`${API_BASE}/qr/invoices/${invoice.id}`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
        return j;
      })
      .then((d) => !dead && setInfo(d))
      .catch((e) => !dead && setLoadErr(e instanceof Error ? e.message : "โหลดข้อมูล QR ไม่สำเร็จ"));
    return () => {
      dead = true;
    };
  }, [invoice]);

  if (!invoice) return null;

  const copyPayload = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLoadErr("คัดลอกไม่สำเร็จ — ให้กดค้างที่ QR แล้วเลือกคัดลอกลิงก์แทน");
    }
  };

  const download = () => {
    if (!qrUrl || !info) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-${info.no}-${info.room}.png`;
    a.click();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`QR รับชำระ · ห้อง ${invoice.room.id}`}
      subtitle={`${invoice.no} · ${invoice.tenant.name} · ครบกำหนด ${thaiDate(invoice.dueDate)}`}
      footer={
        <>
          <Btn variant="neutral" icon={Copy} onClick={copyPayload} disabled={!info}>
            {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ QR"}
          </Btn>
          <Btn variant="brand" icon={Download} onClick={download} disabled={!qrUrl}>
            ดาวน์โหลด PNG
          </Btn>
        </>
      }
    >
      {loadErr || imgErr ? (
        <div className="flex items-start gap-2 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{loadErr || imgErr}</p>
            <a href="/settings" className="mt-1 inline-block font-medium underline">
              ไปที่หน้าตั้งค่า → ใส่เบอร์พร้อมเพย์ 10 หลัก
            </a>
          </div>
        </div>
      ) : !info || !qrUrl ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> กำลังสร้าง QR...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-lg border border-line bg-white p-3">
              <img src={qrUrl} alt={`QR ชำระบิล ${info.no}`} className="h-56 w-56" />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-line bg-page/50 px-4 py-3 text-sm">
            {[
              ["ผู้ประกอบการ", `${info.dormName} (${info.phone})`],
              ["ยอดที่ต้องชำระ", THB(info.total)],
              ["เลขที่บิล", info.no],
              ["รอบบิล", info.period],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-2">
                <dt className="text-xs text-ink-soft">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs leading-relaxed text-ink-soft">
            ผู้เช่าสแกนด้วยแอปธนาคารไทย (พร้อมเพย์, กรุงไทย, KPLUS, ทหารไทย ฯลฯ) — ยอดและเลขบิลถูกใส่ไว้ให้แล้ว
            แต่ระบบนี้ <strong className="text-ink">ยังไม่ตรวจจับการโอนอัตโนมัติ</strong> ต้องกด “รับชำระ” เองหลังผู้เช่าแจ้งว่าโอนแล้ว
          </p>
        </div>
      )}
    </Modal>
  );
}
