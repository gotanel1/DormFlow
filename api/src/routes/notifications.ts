import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const THB = (n: number) => `฿${n.toLocaleString("en-US")}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

/** สร้างแเจ้เตือนจากข้อมูลจริง — dedupe รายวัน (key ที่มีอยู่แล้วไม่สร้างซ้ำ) */
async function sync() {
  const day = todayKey();

  // 1) บิลค้างเกินกำหนด (รอบปัจจุบัน + รอบก่อน)
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const overdue = await prisma.invoice.findMany({
    where: { status: "OVERDUE" },
    include: { room: true, tenant: true },
  });

  const pending: { type: string; key: string; message: string; link: string }[] = [];
  for (const inv of overdue) {
    pending.push({
      type: "overdue",
      key: `overdue:${inv.id}:${day}`,
      message: `บิล ${inv.no} ของ ${inv.tenant.name} (ห้อง ${inv.room.id}) ค้างเกินกำหนด ${THB(inv.total)}`,
      link: `/billing`,
    });
  }

  // 2) สьяัญญาครบกำหนดภายใน 7 วัน
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ["ACTIVE", "EXPIRING"] }, endDate: { gte: now } },
    include: { tenant: true, room: true },
  });
  for (const c of contracts) {
    const d = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000);
    if (d <= 7) {
      pending.push({
        type: "contract_expiring",
        key: `contract_expiring:${c.id}:${day}`,
        message: `สьяัญญา ${c.tenant.name} (ห้อง ${c.room.id}) หดอายุในอีก ${d} วัน`,
        link: `/contracts`,
      });
    }
  }

  // 3) งานซ่อมเร่งด่วนที่ยังดำเนิน
  const highs = await prisma.workOrder.findMany({
    where: { priority: "HIGH", status: { in: ["NEW", "IN_PROGRESS"] } },
    include: { room: true },
  });
  for (const w of highs) {
    pending.push({
      type: "work_high",
      key: `work_high:${w.id}:${day}`,
      message: `งานซ่อมเร่งด่วน: ${w.title} (ห้อง ${w.room.id})`,
      link: `/maintenance`,
    });
  }

  const existing = await prisma.notification.findMany({ where: { key: { in: pending.map((p) => p.key) } }, select: { key: true } });
  const have = new Set(existing.map((e) => e.key));
  for (const p of pending) {
    if (have.has(p.key)) continue;
    await prisma.notification.create({ data: p });
  }
}

router.get("/", requireAuth, async (_req, res) => {
  await sync();
  const items = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  res.json({ items, unread: items.filter((i) => !i.read).length });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } }).catch(() => null);
  res.json({ ok: true });
});

router.post("/read-all", requireAuth, async (_req, res) => {
  await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  res.json({ ok: true });
});

export default router;