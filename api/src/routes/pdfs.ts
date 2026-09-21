import { Router } from "express";
import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// ---------- Font (Thai-capable) ----------
const FONT_CANDIDATES = [
  "C:/Windows/Fonts/segoeui.ttf",
  "C:/Windows/Fonts/LeelawadeeUI.ttf",
  "C:/Windows/Fonts/tahoma.ttf",
  "C:/Windows/Fonts/arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

let fontBytes: Uint8Array | null = null;
function getFont(): Uint8Array {
  if (fontBytes) return fontBytes;
  for (const p of FONT_CANDIDATES) {
    try {
      fs.statSync(p);
      fontBytes = new Uint8Array(fs.readFileSync(p));
      return fontBytes;
    } catch {
      /* try next */
    }
  }
  throw new Error("no Thai-capable font found");
}

const THB2 = (n: number) => `฿ ${n.toLocaleString("en-US")}`;

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`;
}

function mkPage(doc: Awaited<ReturnType<typeof PDFDocument.create>>, font: PDFFont) {
  const page = doc.addPage([595, 842]); // A4 portrait
  const W = page.getWidth();
  let y = 800;
  const line =
    (text: string, size = 11, x = 40, color = rgb(0.08, 0.08, 0.08)) => {
      const w = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: x < 0 ? (W - w) / 2 : x, y, size, font, color });
      y -= size + 7;
    };
  const hr = (inset = 14) => {
    y += 2;
    page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.6, color: rgb(0.65, 0.65, 0.65) });
    y -= inset;
  };
  const row = (label: string, value: string, labelSize = 10.5, valueSize = 11.5) => {
    const lw = font.widthOfTextAtSize(label, labelSize);
    page.drawText(label, { x: 40, y: y + 5, size: labelSize, font, color: rgb(0.35, 0.35, 0.35) });
    const vw = font.widthOfTextAtSize(value, valueSize);
    page.drawText(value, { x: 420 - vw, y: y + 5, size: valueSize, font, color: rgb(0.08, 0.08, 0.08) });
    void lw;
    y -= 16;
  };
  return { page, line, hr, row, get y() { return y; }, set y(v: number) { y = v; } };
}

/* ---------- GET /api/pdf/invoices/:id/receipt ---------- */
router.get("/invoices/:id/receipt", requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { room: true, tenant: true, payments: { orderBy: { receivedAt: "desc" }, take: 1 } },
    });
    if (!invoice) {
      res.status(404).json({ error: "invoice not found" });
      return;
    }
    const settings = await prisma.dormSetting.findMany();
    const get = (k: string, d: string) => settings.find((s) => s.key === k)?.value ?? d;
    const dormName = get("DORM_NAME", "DormName");
    const dormAddress = get("DORM_ADDRESS", "");
    const dormPhone = get("DORM_PHONE", "");
    const bank = get("BANK_ACCOUNT", "");
    const pay = invoice.payments[0];
    const methodLabel = pay ? (pay.method === "CASH" ? "Cash" : pay.method === "TRANSFER" ? "Bank transfer" : "QR") : "";

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(getFont());
    const c = mkPage(doc, font);

    // Header
    c.line(dormName, 24, -1, rgb(0.01, 0.3, 0.7));
    c.line(dormAddress, 9.5, -1);
    c.line(`Tel: ${dormPhone}`, 9.5, -1);
    c.y -= 10;
    c.hr();
    c.line("OFFICIAL RECEIPT", 16, -1, rgb(0.01, 0.3, 0.7));
    c.y -= 14;
    c.hr();

    c.row("Receipt No.", invoice.no);
    c.row("Billing period", invoice.period.replace("-", "/"));
    c.row("Issue date", fmtDate(invoice.createdAt));
    c.row("Status", invoice.status === "PAID" ? `PAID on ${fmtDate(invoice.paidAt)} (${methodLabel})` : "UNPAID", 10.5, 11.5);
    c.y -= 6;
    c.hr();

    c.row("Room", `${invoice.room.id}`);
    c.row("Tenant", invoice.tenant.name);
    c.y -= 6;
    c.hr();

    // Amounts
    c.row("Rent (monthly)", THB2(invoice.rentAmount));
    c.row(`Water  ${invoice.waterUnits} u x ${THB2(invoice.waterRate)}`, THB2(invoice.waterAmount));
    c.row(`Electricity  ${invoice.elecUnits} u x ${THB2(invoice.elecRate)}`, THB2(invoice.elecAmount));
    c.y -= 4;
    c.hr();
    c.y += 6;
    c.line("TOTAL AMOUNT", 13, 40, rgb(0.01, 0.3, 0.7));
    const totalW = font.widthOfTextAtSize(THB2(invoice.total), 15);
    c.page.drawText(THB2(invoice.total), { x: 540 - totalW, y: c.y + 6, size: 15, font, color: rgb(0.01, 0.3, 0.7) });
    c.y -= 20;
    c.hr();
    c.row("Bank account: ", bank, 10, 9.5);
    c.row("Due date", fmtDate(invoice.dueDate));
    c.y -= 4;
    c.line("Thank you.", 10, -1, rgb(0.35, 0.35, 0.35));

    const bytes = await doc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt-${invoice.no}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (e) {
    console.error("[PDF]", e);
    res.status(500).json({ error: `PDF failed: ${e instanceof Error ? e.message : e}` });
  }
});

/* ---------- GET /api/contracts/:id/pdf ---------- */
router.get("/contracts/:id/pdf", requireAuth, async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: { tenant: true, room: true },
    });
    if (!contract) {
      res.status(404).json({ error: "contract not found" });
      return;
    }
    const settings = await prisma.dormSetting.findMany();
    const get = (k: string, d: string) => settings.find((s) => s.key === k)?.value ?? d;
    const dormName = get("DORM_NAME", "DormName");
    const dormAddress = get("DORM_ADDRESS", "");
    const dormPhone = get("DORM_PHONE", "");

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(getFont());
    const c = mkPage(doc, font);

    c.line(dormName, 24, -1, rgb(0.01, 0.3, 0.7));
    c.line(dormAddress, 9.5, -1);
    c.line(`Tel: ${dormPhone}`, 9.5, -1);
    c.y -= 10;
    c.hr();
    c.line("RENTAL AGREEMENT", 16, -1, rgb(0.01, 0.3, 0.7));
    c.y -= 14;
    c.hr();

    c.row("Contract No.", contract.id.slice(0, 8).toUpperCase());
    c.row("Signed date", fmtDate(contract.createdAt));
    c.y -= 6;
    c.hr();

    c.row("Landlord", dormName);
    c.row("Address", dormAddress);
    c.y -= 6;
    c.row("Tenant", contract.tenant.name);
    c.row("Room", `${contract.room.id}  (Floor ${contract.room.floor} · ${contract.room.type})`);
    c.row("Rent / month", THB2(contract.room.rent));
    c.y -= 8;
    c.hr();

    c.line("TERMS", 12, 40, rgb(0.01, 0.3, 0.7));
    c.y -= 4;
    const terms = [
      "1. Period: from {start} to {end} ({months} months)",
      "2. Rent is payable monthly, no later than the 10th of each month.",
      "3. Water & electricity: billed from real meter readings x the configured rate.",
      "4. Security deposit: {deposit}. Refunded at move-out if no outstanding balance or damage.",
      "5. The tenant keeps the room and its furnishings in good condition.",
      "6. All maintenance issues must be reported through the dorm maintenance board.",
      "7. Early termination requires 30 days advance notice.",
      "8. Items of high value are the tenant's own responsibility.",
    ]
      .map((t) =>
        t
          .replace("{start}", fmtDate(contract.startDate))
          .replace("{end}", fmtDate(contract.endDate))
          .replace("{months}", String(contract.months))
          .replace("{deposit}", THB2(contract.deposit))
      );
    for (const t of terms) c.line(t, 10);
    c.y -= 20;
    c.hr();
    c.line("Signatures", 12, 40, rgb(0.01, 0.3, 0.7));
    c.y -= 46;
    c.line(`_________________________   Landlord (${dormName})`, 11);
    c.y -= 30;
    c.line(`_________________________   Tenant (${contract.tenant.name})`, 11);

    const bytes = await doc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="contract-${contract.id.slice(0, 8)}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (e) {
    console.error("[PDF]", e);
    res.status(500).json({ error: `PDF failed: ${e instanceof Error ? e.message : e}` });
  }
});

export default router;