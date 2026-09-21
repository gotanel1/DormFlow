import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const tenants = await prisma.tenant.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { currentRoom: { id: { contains: q } } },
          ],
        }
      : undefined,
    include: { currentRoom: { select: { id: true } }, contracts: { orderBy: { startDate: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tenants });
});

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  idCard: z.string().optional().nullable(),
  deposit: z.number().int().min(0).default(0),
  roomId: z.string().optional().nullable(),
  moveInAt: z.string().optional().nullable(),
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = tenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลผู้เช่าไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const { roomId, moveInAt, ...rest } = parsed.data;

  // ถ้าระบุห้อง: เช็คว่าห้องว่าง และอัปเดตสถานะห้องเป็น มีผู้เช่า
  if (roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || (room.status !== "VACANT" && room.status !== "RESERVED")) {
      res.status(409).json({ error: `ห้อง ${roomId} ไม่พร้อมให้เช่า` });
      return;
    }
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const t = await tx.tenant.create({
      data: { ...rest, moveInAt: moveInAt ? new Date(moveInAt) : new Date() },
    });
    if (roomId) {
      await tx.room.update({ where: { id: roomId }, data: { status: "RENTED", currentTenant: { connect: { id: t.id } } } });
    }
    return t;
  });

  res.status(201).json({ tenant });
});

router.get("/:id", requireAuth, async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      currentRoom: true,
      contracts: { orderBy: { startDate: "desc" } },
      invoices: { orderBy: { period: "desc" }, take: 12 },
    },
  });
  if (!tenant) {
    res.status(404).json({ error: "ไม่พบผู้เช่า" });
    return;
  }
  res.json({ tenant });
});

export default router;