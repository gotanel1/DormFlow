import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import tenantRoutes from "./routes/tenants.js";
import contractRoutes from "./routes/contracts.js";
import invoiceRoutes from "./routes/invoices.js";
import workorderRoutes from "./routes/workorders.js";
import meterRoutes from "./routes/meters.js";
import settingRoutes from "./routes/settings.js";
import expenseRoutes from "./routes/expenses.js";
import pdfRoutes from "./routes/pdfs.js";
import notificationRoutes from "./routes/notifications.js";
import userRoutes from "./routes/users.js";

const app = express();
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:3000"], credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "dormflow-api", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/workorders", workorderRoutes);
app.use("/api/meters", meterRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// 404 + error handler
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API ERROR]", err);
  const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์";
  res.status(500).json({ error: msg });
});

// กัน process ตายจาก unhandled async error ใน route handler
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => console.log(`🚀 DormFlow API listening on :${PORT}`));