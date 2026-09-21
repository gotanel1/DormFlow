import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import type { AuthUser } from "../lib/auth.js";

const router = Router();

function periodOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// GET /api/invoices?status=&period=
router.get("/", requireAuth, async (req, res) => {
  const status = String(req.query.status ?? "");
  const period = String(req.query.period ?? periodOf(new Date()));
  const invoices = await prisma.invoice.findMany({
    where: { ...(status ? { status: status as never } : {}), period },
    include: { room: { select: { id: true } }, tenant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const totals = await prisma.invoice.groupBy({
    by: ["status"],
    where: { period },
    _sum: { total: true },
    _count: { _all: true },
  });
  res.json({ invoices, totals, period });
});

// GET /api/invoices/summary — สรุปยอด 8 เดือน + KPI
router.get("/summary", requireAuth, async (_req, res) => {
  const invoices = await prisma.invoice.findMany({ select: { period: true, total: true, status: true, paidAt: true } });
  const byPeriod = new Map<string, number>();
  const overdueTotal = { value: 0, count: 0 };
  for (const i of invoices) {
    const income = i.status === "PAID" && i.paidAt ? i.total : 0;
    byPeriod.set(i.period, (byPeriod.get(i.period) ?? 0) + income);
    if (i.status === "OVERDUE") {
      overdueTotal.value += i.total;
      overdueTotal.count++;
    }
  }
  const [rooms, tenants, monthPaid] = await Promise.all([
    prisma.room.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({ where: { status: "PAID", period: periodOf(new Date()) }, _sum: { total: true } }),
  ]);
  const occupancy = rooms.find((r) => r.status === "RENTED")?._count._all ?? 0;
  res.json({
    monthly: [...byPeriod.entries()].sort().map(([label, value]) => ({ label, value })),
    overdue: overdueTotal,
    occupancy,
    roomCount: rooms.reduce((s, r) => s + r._count._all, 0),
    tenantCount: tenants,
    monthIncome: monthPaid._sum.total ?? 0,
  });
});

// POST /api/invoices/generate — ออกบิลจากมิเตอร์ที่จดไว้ของเดือนนั้น
router.post("/generate", requireAuth, async (req, res) => {
  const user = (req as Request & { user: AuthUser }).user;
  const month = String(req.body.period ?? "");
  const target = month || nextPeriod(periodOf(new Date()));

  const settings = await prisma.dormSetting.findMany();
  const get = (k: string, def: number) => Number(settings.find((s) => s.key === k)?.value ?? def);
  const waterRate = get("WATER_RATE", 18);
  const elecRate = get("ELEC_RATE", 7);
  const serviceFee = get("SERVICE_FEE", 0);
  const dueDay = get("PAYMENT_DUE_DAY", 10);

  const [y, m] = target.split("-").map(Number);
  const dueDate = new Date(y, m - 1, dueDay);

  // ต้องมีการจดมิเตอร์ของเดือนนี้ก่อน
  const readings = await prisma.meterReading.findMany({ where: { month: target } });
  if (readings.length === 0) {
    res.status(400).json({ error: `ยังไม่ได้จดมิเตอร์ของเดือน ${target} — กรุณาจดมิเตอร์ก่อนออกบิล` });
    return;
  }
  const readingByRoom = new Map(readings.map((r) => [r.roomId, r]));

  const activeContracts = await prisma.contract.findMany({
    where: { status: { in: ["ACTIVE", "EXPIRING"] } },
    include: { room: true },
  });

  const exists = await prisma.invoice.findMany({ where: { period: target }, select: { roomId: true } });
  const existingRooms = new Set(exists.map((e) => e.roomId));

  const roomIds = new Set(activeContracts.map((c) => c.room.id));
  const rooms = await prisma.room.findMany({ where: { id: { in: [...roomIds] } }, include: { currentTenant: true } });

  // เลขบิลต้องต่อจากที่มีอยู่แล้วในรอบนี้ (กันชนเมื่อออกบิลหลายครั้ง)
  let seq = await prisma.invoice.count({ where: { period: target } });

  let created = 0;
  const skipped: string[] = [];
  for (const room of rooms) {
    if (existingRooms.has(room.id) || !room.currentTenant) continue;
    const reading = readingByRoom.get(room.id);
    if (!reading) {
      skipped.push(room.id);
      continue;
    }
    const waterAmount = reading.waterUnits * waterRate;
    const elecAmount = reading.elecUnits * elecRate;
    const total = room.rent + waterAmount + elecAmount + serviceFee;
    seq++;
    const no = `INV-${target}-${String(seq).padStart(3, "0")}`;
    await prisma.invoice.create({
      data: {
        no,
        period: target,
        roomId: room.id,
        tenantId: room.currentTenant.id,
        rentAmount: room.rent + serviceFee,
        waterUnits: reading.waterUnits,
        elecUnits: reading.elecUnits,
        waterRate,
        elecRate,
        waterAmount,
        elecAmount,
        total,
        dueDate,
      },
    });
    await prisma.tenant.update({ where: { id: room.currentTenant.id }, data: { balance: { increment: total } } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE_INVOICE", entity: "Invoice", entityId: no, detail: { period: target, total } } });
    created++;
  }
  res.status(201).json({ created, period: target, skipped });
});

// POST /api/invoices/:id/pay — รับชำระ
const paySchema = z.object({ method: z.enum(["CASH", "TRANSFER", "QR"]).default("CASH"), note: z.string().optional() });

router.post("/:id/pay", requireAuth, async (req, res) => {
  const user = (req as Request & { user: AuthUser }).user;
  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลการชำระไม่ถูกต้อง" });
    return;
  }
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { tenant: true } });
  if (!invoice) {
    res.status(404).json({ error: "ไม่พบบิล" });
    return;
  }
  if (invoice.status === "PAID") {
    res.status(409).json({ error: "บิลนี้ชำระแล้ว" });
    return;
  }
  const result = await prisma.$transaction(async (tx) => {
    const paid = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.payment.create({
      data: { invoiceId: invoice.id, amount: invoice.total, method: parsed.data.method, note: parsed.data.note, recordedById: user.id },
    });
    await tx.tenant.update({ where: { id: invoice.tenantId }, data: { balance: { decrement: invoice.total } } });
    await tx.auditLog.create({
      data: { userId: user.id, action: "RECEIVE_PAYMENT", entity: "Invoice", entityId: invoice.no, detail: { amount: invoice.total, method: parsed.data.method } },
    });
    return paid;
  });
  res.json({ invoice: { ...invoice, status: "PAID", paidAt: result.paidAt } });
});

function nextPeriod(p: string): string {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 1 + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default router;