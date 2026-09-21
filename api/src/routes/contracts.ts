import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";

const router = Router();

function daysLeft(end: Date): number {
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function contractStatus(end: Date): "ACTIVE" | "EXPIRING" | "EXPIRED" {
  const d = daysLeft(end);
  return d < 0 ? "EXPIRED" : d <= 30 ? "EXPIRING" : "ACTIVE";
}

router.get("/", requireAuth, async (req, res) => {
  const contracts = await prisma.contract.findMany({
    include: { tenant: { select: { name: true } }, room: { select: { id: true } } },
    orderBy: { endDate: "asc" },
  });
  const list = contracts.map((c) => ({
    ...c,
    status: c.status === "TERMINATED" ? c.status : contractStatus(c.endDate),
    daysLeft: daysLeft(c.endDate),
  }));
  res.json({ contracts: list });
});

const contractSchema = z.object({
  tenantId: z.string().min(1),
  roomId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  months: z.number().int().min(1),
  deposit: z.number().int().min(0),
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = contractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลสัญญาไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const { startDate, endDate, ...rest } = parsed.data;
  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: { ...rest, startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    await tx.room.update({ where: { id: rest.roomId }, data: { status: "RENTED" } });
    return c;
  });
  res.status(201).json({ contract });
});

router.post("/:id/extend", requireAuth, requireAdmin, async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) {
    res.status(404).json({ error: "ไม่พบสัญญา" });
    return;
  }
  const end = new Date(contract.endDate);
  end.setMonth(end.getMonth() + 12);
  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { endDate: end, months: contract.months + 12, status: "ACTIVE" },
  });
  res.json({ contract: updated });
});

export default router;