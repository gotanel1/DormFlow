import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth, signToken, type AuthUser } from "../lib/auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "กรอก username และ password ให้ครบ" });
    return;
  }
  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "username หรือ password ไม่ถูกต้อง" });
    return;
  }
  const authUser: AuthUser = { id: user.id, username: user.username, name: user.name, role: user.role };
  res.json({ token: signToken(authUser), user: authUser });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as Request & { user: AuthUser }).user;
  res.json({ user });
});

export default router;