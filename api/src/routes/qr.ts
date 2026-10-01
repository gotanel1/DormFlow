import { Router } from "express";
import QRCode from "qrcode";
import { encode, tag, withCrcTag } from "promptparse";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

/* ---------- PromptPay helpers ---------- */

/** รับได้ทั้ง 0812345678 / 081-234-5678 / 66812345678 / +66812345678 -> 0812345678 */
export function normalizePhone(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("66") && d.length >= 11) d = `0${d.slice(2)}`;
  if (d.length === 9 && d.startsWith("8")) d = `0${d}`;
  if (!/^0\d{9}$/.test(d)) return null;
  return d;
}

/** tag 59 (merchant name) ต้องเป็น ASCII — ตัดอักษรไทย/อักขระพิเศษออก */
function asciiName(raw: string, fallback = "DORM"): string {
  const clean = String(raw ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
  if (!clean) return fallback;
  return clean.slice(0, 25);
}

/**
 * สร้าง payload มาตรฐาน PromptPay (EMVCo)
 * 00=01 (QR payment) · 01=12 (มียอด) · 29=PromptPay proxy (เบอร์ 13 หลักขึ้นต้น 66)
 * 53=764 (THB) · 54=ยอด · 58=TH · 59=ชื่อผู้รับเงิน · 62=ref (เลขบิล) · 63=CRC16
 */
export function buildPromptPayPayload(o: { phone: string; amount: number; ref?: string; name?: string }): string {
  const target = ("0000000000000" + o.phone.replace(/^0/, "66")).slice(-13);
  const tag29 = encode([tag("00", "A000000677010111"), tag("01", target)]);
  const parts = [
    tag("00", "01"),
    tag("01", o.amount > 0 ? "12" : "11"),
    tag("29", tag29),
    tag("53", "764"),
    tag("58", "TH"),
  ];
  if (o.amount > 0) parts.push(tag("54", Number(o.amount).toFixed(2)));
  if (o.name) parts.push(tag("59", asciiName(o.name)));
  if (o.ref) parts.push(tag("62", String(o.ref).replace(/[^\x20-\x7E]/g, "").slice(0, 25)));
  return withCrcTag(encode(parts), "63");
}

async function loadInvoiceWithQr(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { room: true, tenant: true } });
  if (!invoice) return null;

  const settings = await prisma.dormSetting.findMany();
  const get = (k: string, d = "") => settings.find((s) => s.key === k)?.value ?? d;
  const phone = normalizePhone(get("PROMPTPAY_PHONE", ""));
  const dormName = get("DORM_NAME", "Dorm");

  const payload = phone
    ? buildPromptPayPayload({ phone, amount: invoice.total, ref: invoice.no, name: dormName })
    : null;

  return { invoice, payload, phone, dormName };
}

const noPhone = (res: Parameters<typeof requireAuth>[1]) =>
  res.status(400).json({ error: "ยังไม่ได้ตั้งเลขพร้อมเพย์ — ไปที่หน้า ตั้งค่า แล้วใส่เบอร์โทร 10 หลัก" });

/* ---------- GET /api/qr/invoices/:id ---------- */
router.get("/invoices/:id", requireAuth, async (req, res) => {
  const data = await loadInvoiceWithQr(req.params.id);
  if (!data) {
    res.status(404).json({ error: "ไม่พบบิล" });
    return;
  }
  if (!data.payload) return noPhone(res);
  res.json({
    no: data.invoice.no,
    period: data.invoice.period,
    room: data.invoice.room.id,
    tenant: data.invoice.tenant.name,
    total: data.invoice.total,
    dueDate: data.invoice.dueDate,
    status: data.invoice.status,
    phone: data.phone,
    dormName: data.dormName,
    payload: data.payload,
  });
});

/* ---------- GET /api/qr/png/:id ---------- */
router.get("/png/:id", requireAuth, async (req, res) => {
  const data = await loadInvoiceWithQr(req.params.id);
  if (!data) {
    res.status(404).json({ error: "ไม่พบบิล" });
    return;
  }
  if (!data.payload) return noPhone(res);
  const png = await QRCode.toBuffer(data.payload, { width: 640, margin: 2, errorCorrectionLevel: "M" });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `inline; filename="qr-${data.invoice.no}.png"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(png);
});

/* ---------- GET /api/qr/svg/:id ---------- */
router.get("/svg/:id", requireAuth, async (req, res) => {
  const data = await loadInvoiceWithQr(req.params.id);
  if (!data) {
    res.status(404).json({ error: "ไม่พบบิล" });
    return;
  }
  if (!data.payload) return noPhone(res);
  const svg = await QRCode.toString(data.payload, { type: "svg", margin: 1, width: 480, errorCorrectionLevel: "M" });
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "no-store");
  res.send(svg);
});

/* ---------- GET /api/qr/unpaid?period=YYYY-MM — สรุปบิลค้างทั้งรอบ ---------- */
router.get("/unpaid", requireAuth, async (req, res) => {
  const period = String(req.query.period ?? "");
  const invoices = await prisma.invoice.findMany({
    where: { ...(period ? { period } : {}), status: { not: "PAID" } },
    include: { room: { select: { id: true } }, tenant: { select: { name: true } } },
    orderBy: { roomId: "asc" },
  });
  const settings = await prisma.dormSetting.findMany();
  const get = (k: string, d = "") => settings.find((s) => s.key === k)?.value ?? d;
  const phone = normalizePhone(get("PROMPTPAY_PHONE", ""));
  const dormName = get("DORM_NAME", "Dorm");
  res.json({
    phone,
    dormName,
    count: invoices.length,
    total: invoices.reduce((s, i) => s + i.total, 0),
    invoices: invoices.map((i) => ({
      id: i.id,
      no: i.no,
      room: i.room.id,
      tenant: i.tenant.name,
      total: i.total,
      status: i.status,
    })),
  });
});

export default router;
