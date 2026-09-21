import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";

const router = Router();

export const EXPENSE_CATEGORIES = ["ค่าไฟส่วนกลาง", "ค่าน้ำส่วนกลาง", "ซ่อมบำรุง", "เงินเดือนพนักงาน", "ทำความสะอาด", "อื่นๆ"];

// GET /api/expenses?month=2026-09  (ไม่ใส่ month = ทั้งหมด)
router.get("/", requireAuth, async (req, res) => {
  const month = String(req.query.month ?? "");
  const expenses = await prisma.expense.findMany({
    where: month ? { month } : undefined,
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
  });
  const byMonth = new Map<string, number>();
  for (const e of expenses) byMonth.set(e.month, (byMonth.get(e.month) ?? 0) + e.amount);
  res.json({
    expenses,
    total: expenses.reduce((s, e) => s + e.amount, 0),
    byMonth: [...byMonth.entries()].sort().map(([label, value]) => ({ label, value })),
  });
});

const createSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  category: z.string().min(1),
  amount: z.number().int().min(1),
  note: z.string().optional().nullable(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลค่าใช้จ่ายไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const expense = await prisma.expense.create({ data: parsed.data });
  res.status(201).json({ expense });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ ok: true });
});

export default router;