import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "STAFF";
}

export function signToken(u: AuthUser): string {
  return jwt.sign(u, process.env.JWT_SECRET!, { expiresIn: "12h" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    res.status(401).json({ error: "ไม่พบ token กรุณาเข้าสู่ระบบ" });
    return;
  }
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET!) as AuthUser;
    (req as Request & { user: AuthUser }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "token หมดอายุหรือไม่ถูกต้อง" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user: AuthUser }).user;
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "ต้องเป็น Admin เท่านั้น" });
    return;
  }
  next();
}