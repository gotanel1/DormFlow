import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const orders = await prisma.workOrder.findMany({
    include: { room: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
});

const orderSchema = z.object({
  roomId: z.string().min(1),
  title: z.string().min(1),
  category: z.string().default("อื่นๆ"),
  priority: z.enum(["HIGH", "NORMAL", "LOW"]).default("NORMAL"),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลงานซ่อมไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const order = await prisma.workOrder.create({ data: parsed.data });
  res.status(201).json({ order });
});

const advanceSchema = z.object({ status: z.enum(["NEW", "IN_PROGRESS", "DONE"]) });

router.patch("/:id/status", requireAuth, async (req, res) => {
  const parsed = advanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
    return;
  }
  const order = await prisma.workOrder.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status, completedAt: parsed.data.status === "DONE" ? new Date() : null },
  });
  res.json({ order });
});

export default router;