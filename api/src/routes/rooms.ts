import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const status = String(req.query.status ?? "");
  const rooms = await prisma.room.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q } },
              { type: { contains: q } },
              { currentTenant: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { currentTenant: { select: { id: true, name: true } } },
    orderBy: { id: "asc" },
  });
  res.json({ rooms });
});

const roomSchema = z.object({
  id: z.string().min(1).max(10),
  floor: z.number().int().min(1).max(20),
  type: z.string().min(1),
  rent: z.number().int().min(0),
  status: z.enum(["RENTED", "VACANT", "RESERVED", "MAINTENANCE"]),
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลห้องไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const exists = await prisma.room.findUnique({ where: { id: parsed.data.id } });
  if (exists) {
    res.status(409).json({ error: "หมายเลขห้องนี้มีอยู่แล้ว" });
    return;
  }
  const room = await prisma.room.create({ data: parsed.data });
  res.status(201).json({ room });
});

const patchSchema = z.object({
  status: z.enum(["RENTED", "VACANT", "RESERVED", "MAINTENANCE"]).optional(),
  rent: z.number().int().min(0).optional(),
  type: z.string().min(1).optional(),
  waterMeter: z.number().int().min(0).optional(),
  elecMeter: z.number().int().min(0).optional(),
});

router.get("/:id", requireAuth, async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    include: {
      currentTenant: true,
      contracts: { include: { tenant: { select: { name: true } } }, orderBy: { startDate: "desc" } },
      readings: { orderBy: { month: "desc" }, take: 8 },
      workOrders: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!room) {
    res.status(404).json({ error: "ไม่พบห้อง" });
    return;
  }
  res.json({ room });
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  const room = await prisma.room.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ room });
});

export default router;