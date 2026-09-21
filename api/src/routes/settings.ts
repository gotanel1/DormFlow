import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import type { AuthUser } from "../lib/auth.js";

const router = Router();

export const DEFAULTS: Record<string, string> = {
  DORM_NAME: "หอพักสบายใจ",
  DORM_ADDRESS: "ซอยสุขุมวิท 31 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ",
  DORM_PHONE: "02-xxx-xxxx",
  BANK_ACCOUNT: "123-4-56789-0 · ธ.กรุงเทพ",
  WATER_RATE: "18",
  ELEC_RATE: "7",
  SERVICE_FEE: "0",
  PAYMENT_DUE_DAY: "10",
};

router.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.dormSetting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;
  res.json({ settings });
});

const putSchema = z.record(z.string(), z.string());

router.put("/", requireAuth, requireAdmin, async (req, res) => {
  const user = (req as Request & { user: AuthUser }).user;
  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลตั้งค่าไม่ถูกต้อง" });
    return;
  }
  const entries = Object.entries(parsed.data).filter(([k]) => k in DEFAULTS);
  if (!entries.length) {
    res.status(400).json({ error: "ไม่มีคีย์ที่รองรับ" });
    return;
  }

  // ค่าที่ต้องเป็นตัวเลข
  for (const [k, v] of entries) {
    if (["WATER_RATE", "ELEC_RATE", "SERVICE_FEE", "PAYMENT_DUE_DAY"].includes(k) && !/^\d+$/.test(v)) {
      res.status(400).json({ error: `ค่า ${k} ต้องเป็นตัวเลข` });
      return;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of entries) {
      await tx.dormSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
    }
    await tx.auditLog.create({
      data: { userId: user.id, action: "UPDATE_SETTINGS", entity: "DormSetting", entityId: "-", detail: Object.fromEntries(entries) },
    });
  });

  const rows = await prisma.dormSetting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;
  res.json({ settings });
});

export default router;