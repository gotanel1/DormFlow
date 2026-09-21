import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import type { AuthUser } from "../lib/auth.js";

const router = Router();

function prevMonth(p: string): string {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * GET /api/meters?month=2026-10
 * คืนรายการห้องที่มีผู้เช่า พร้อมเลขมิเตอร์ครั้งก่อน และค่าที่จดไว้แล้วของเดือนนี้ (ถ้ามี)
 */
router.get("/", requireAuth, async (req, res) => {
  const month = String(req.query.month ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "ต้องระบุ month รูปแบบ YYYY-MM" });
    return;
  }

  const rooms = await prisma.room.findMany({
    where: { status: "RENTED" },
    include: { currentTenant: { select: { id: true, name: true } } },
    orderBy: { id: "asc" },
  });

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.meterReading.findMany({ where: { month } }),
    prisma.meterReading.findMany({ where: { month: prevMonth(month) } }),
  ]);
  const cur = new Map(thisMonth.map((r) => [r.roomId, r]));
  const prev = new Map(lastMonth.map((r) => [r.roomId, r]));

  const settings = await prisma.dormSetting.findMany();
  const rate = (k: string, d: number) => Number(settings.find((s) => s.key === k)?.value ?? d);
  const waterRate = rate("WATER_RATE", 18);
  const elecRate = rate("ELEC_RATE", 7);

  const list = rooms.map((room) => {
    const saved = cur.get(room.id);
    const last = prev.get(room.id);
    // ฐานอ้างอิง: เดือนก่อนมีบันทึก -> ใช้เลขนั้น, ไม่มี -> ใช้เลขมิเตอร์ล่าสุดในตารางห้อง
    const waterPrev = saved?.waterPrev ?? last?.waterCurr ?? room.waterMeter;
    const elecPrev = saved?.elecPrev ?? last?.elecCurr ?? room.elecMeter;
    return {
      roomId: room.id,
      tenant: room.currentTenant?.name ?? null,
      rent: room.rent,
      waterPrev,
      elecPrev,
      waterCurr: saved?.waterCurr ?? null,
      elecCurr: saved?.elecCurr ?? null,
      waterUnits: saved?.waterUnits ?? null,
      elecUnits: saved?.elecUnits ?? null,
      saved: !!saved,
    };
  });

  res.json({ month, waterRate, elecRate, rooms: list, savedCount: thisMonth.length });
});

/**
 * POST /api/meters
 * บันทึกเลขมิเตอร์หลายห้องพร้อมกัน (upsert) + อัปเดตเลขมิเตอร์ล่าสุดของห้อง
 */
const bodySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  readings: z
    .array(
      z.object({
        roomId: z.string().min(1),
        waterPrev: z.number().int().min(0),
        waterCurr: z.number().int().min(0),
        elecPrev: z.number().int().min(0),
        elecCurr: z.number().int().min(0),
      })
    )
    .min(1),
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as Request & { user: AuthUser }).user;
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลมิเตอร์ไม่ถูกต้อง", detail: parsed.error.issues });
    return;
  }
  const { month, readings } = parsed.data;

  // ตรวจว่าเลขใหม่ต้องไม่น้อยกว่าเลขเดิม
  const bad = readings.filter((r) => r.waterCurr < r.waterPrev || r.elecCurr < r.elecPrev);
  if (bad.length) {
    res.status(400).json({ error: `เลขมิเตอร์ครั้งนี้น้อยกว่าครั้งก่อน: ${bad.map((b) => b.roomId).join(", ")}` });
    return;
  }

  const saved = await prisma.$transaction(async (tx) => {
    let n = 0;
    for (const r of readings) {
      const waterUnits = r.waterCurr - r.waterPrev;
      const elecUnits = r.elecCurr - r.elecPrev;
      await tx.meterReading.upsert({
        where: { roomId_month: { roomId: r.roomId, month } },
        create: { roomId: r.roomId, month, waterPrev: r.waterPrev, waterCurr: r.waterCurr, elecPrev: r.elecPrev, elecCurr: r.elecCurr, waterUnits, elecUnits },
        update: { waterPrev: r.waterPrev, waterCurr: r.waterCurr, elecPrev: r.elecPrev, elecCurr: r.elecCurr, waterUnits, elecUnits, recordedAt: new Date() },
      });
      await tx.room.update({ where: { id: r.roomId }, data: { waterMeter: r.waterCurr, elecMeter: r.elecCurr } });
      n++;
    }
    await tx.auditLog.create({
      data: { userId: user.id, action: "SAVE_METER_READING", entity: "MeterReading", entityId: month, detail: { rooms: n } },
    });
    return n;
  });

  res.status(201).json({ saved, month });
});

export default router;