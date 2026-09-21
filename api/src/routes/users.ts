import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import type { AuthUser } from "../lib/auth.js";

const router = Router();

/** หาย passwordHash ออกจาก response ทุก query user */
function safe(u: Record<string, unknown>): Record<string, unknown> {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ users: users.map((u) => ({ ...safe(u), isYou: false })) });
});

const createSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, "username ใช้ได้ตัว/เลข/._- เท่านั้น"),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z.string().min(6),
  phone: z.string().optional().nullable(),
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  const exists = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (exists) {
    res.status(409).json({ error: "username นี้มีอยู่แล้ว" });
    return;
  }
  const user = await prisma.user.create({
    data: { username: parsed.data.username, name: parsed.data.name, role: parsed.data.role, phone: parsed.data.phone, passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });
  res.status(201).json({ user: safe(user) });
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  active: z.boolean().optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const me = (req as Request & { user: AuthUser }).user;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    return;
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) {
    res.status(404).json({ error: "ไม่พบผู้ใช้" });
    return;
  }
  // กันถอดสิทธิ์/ปิดตัวเอง
  if (target.id === me.id && (parsed.data.active === false || (parsed.data.role && parsed.data.role !== "ADMIN"))) {
    res.status(400).json({ error: "ไม่สามารถถอดสิทธิ์ผู้ใช้ตัวเอง" });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  delete data.password;
  const user = await prisma.user.update({ where: { id: target.id }, data });
  res.json({ user: safe(user) });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const me = (req as Request & { user: AuthUser }).user;
  if (req.params.id === me.id) {
    res.status(400).json({ error: "ลบผู้ใช้ตัวเองไม่ได้" });
    return;
  }
  await prisma.user.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ ok: true });
});

export default router;