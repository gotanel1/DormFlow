import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- ข้อมูลตัวอย่าง (ตรงกับ mock data ในเว็บ) ----------

const ROOMS: Prisma.RoomCreateInput[] = [
  { id: "A201", floor: 2, type: "ห้องเดี่ยว แอร์", rent: 3500, status: "RENTED", waterMeter: 12, elecMeter: 145 },
  { id: "A202", floor: 2, type: "ห้องเดี่ยว แอร์", rent: 3800, status: "RENTED", waterMeter: 9, elecMeter: 132 },
  { id: "A203", floor: 2, type: "ห้องเดี่ยว พัดลม", rent: 2500, status: "VACANT" },
  { id: "A204", floor: 2, type: "ห้องเดี่ยว พัดลม", rent: 2500, status: "RESERVED" },
  { id: "B301", floor: 3, type: "ห้องเดี่ยว แอร์", rent: 4200, status: "RENTED", waterMeter: 11, elecMeter: 139 },
  { id: "B302", floor: 3, type: "ห้องเดี่ยว แอร์", rent: 4500, status: "RENTED", waterMeter: 10, elecMeter: 158 },
  { id: "B303", floor: 3, type: "ห้องเดี่ยว พัดลม", rent: 3000, status: "RENTED", waterMeter: 7, elecMeter: 95 },
  { id: "B304", floor: 3, type: "ห้องสวีท", rent: 6500, status: "RENTED", waterMeter: 14, elecMeter: 208 },
  { id: "C401", floor: 4, type: "ห้องเดี่ยว แอร์", rent: 4000, status: "RENTED", waterMeter: 9, elecMeter: 152 },
  { id: "C402", floor: 4, type: "ห้องเดี่ยว แอร์", rent: 4000, status: "RENTED", waterMeter: 10, elecMeter: 141 },
  { id: "C403", floor: 4, type: "ห้องเดี่ยว พัดลม", rent: 2800, status: "VACANT" },
  { id: "C404", floor: 4, type: "ห้องสวีท", rent: 6000, status: "MAINTENANCE" },
];

const TENANTS: { name: string; phone: string; idCard: string; room: string; moveIn: string; deposit: number; balance: number }[] = [
  { name: "สมชาย ทรัพย์เจริญ", phone: "089-xxx-xxxx", idCard: "1-1021-xxxxx-xx-x", room: "A201", moveIn: "2026-06-01", deposit: 3500, balance: 0 },
  { name: "มิ้นท์ จิรพรรณ", phone: "081-xxx-xxxx", idCard: "1-3099-xxxxx-xx-x", room: "A202", moveIn: "2026-07-15", deposit: 3800, balance: 0 },
  { name: "ตาแก้ว ใจดี", phone: "086-xxx-xxxx", idCard: "1-1099-xxxxx-xx-x", room: "B301", moveIn: "2026-04-01", deposit: 4200, balance: 0 },
  { name: "เก่ง กิตติพงษ์", phone: "090-xxx-xxxx", idCard: "3-1101-xxxxx-xx-x", room: "B302", moveIn: "2026-05-01", deposit: 4500, balance: 5786 },
  { name: "สมปอง วงค์ทอง", phone: "092-xxx-xxxx", idCard: "5-1022-xxxxx-xx-x", room: "B303", moveIn: "2026-08-10", deposit: 3000, balance: 0 },
  { name: "จ๋า พัชราภา", phone: "087-xxx-xxxx", idCard: "1-2012-xxxxx-xx-x", room: "B304", moveIn: "2026-07-01", deposit: 6500, balance: 7188 },
  { name: "แนน นภัสสร", phone: "095-xxx-xxxx", idCard: "1-1088-xxxxx-xx-x", room: "C401", moveIn: "2026-09-01", deposit: 4000, balance: 4418 },
  { name: "เกียรติ วรวุฒิ", phone: "098-xxx-xxxx", idCard: "3-3004-xxxxx-xx-x", room: "C402", moveIn: "2026-08-15", deposit: 4000, balance: 4323 },
];

const CONTRACTS: { tenant: string; room: string; start: string; end: string; months: number; deposit: number; status: Prisma.ContractStatus }[] = [
  { tenant: "สมชาย", room: "A201", start: "2026-06-01", end: "2026-09-30", months: 4, deposit: 3500, status: "ACTIVE" },
  { tenant: "มิ้นท์", room: "A202", start: "2026-07-15", end: "2026-09-30", months: 3, deposit: 3800, status: "ACTIVE" },
  { tenant: "ตาแก้ว", room: "B301", start: "2026-04-01", end: "2026-10-31", months: 7, deposit: 4200, status: "ACTIVE" },
  { tenant: "เก่ง", room: "B302", start: "2026-05-01", end: "2026-08-31", months: 4, deposit: 4500, status: "EXPIRED" },
  { tenant: "จ๋า", room: "B304", start: "2026-07-01", end: "2026-10-31", months: 4, deposit: 6500, status: "ACTIVE" },
  { tenant: "แนน", room: "C401", start: "2026-09-01", end: "2027-03-31", months: 7, deposit: 4000, status: "ACTIVE" },
  { tenant: "เกียรติ", room: "C402", start: "2026-08-15", end: "2027-01-31", months: 6, deposit: 4000, status: "ACTIVE" },
  { tenant: "สมปอง", room: "B303", start: "2026-08-10", end: "2026-09-30", months: 2, deposit: 3000, status: "ACTIVE" },
];

const WATER_RATE = 18;
const ELEC_RATE = 7;

const INVOICES: { tenant: string; room: string; status: Prisma.InvoiceStatus; paid?: string }[] = [
  { tenant: "สมชาย", room: "A201", status: "PAID", paid: "2026-09-05" },
  { tenant: "มิ้นท์", room: "A202", status: "PAID", paid: "2026-09-06" },
  { tenant: "ตาแก้ว", room: "B301", status: "PAID", paid: "2026-09-08" },
  { tenant: "เก่ง", room: "B302", status: "OVERDUE" },
  { tenant: "สมปอง", room: "B303", status: "PAID", paid: "2026-09-09" },
  { tenant: "จ๋า", room: "B304", status: "OVERDUE" },
  { tenant: "แนน", room: "C401", status: "PENDING" },
  { tenant: "เกียรติ", room: "C402", status: "OVERDUE" },
];

const WORK_ORDERS: { room: string; title: string; category: string; priority: Prisma.WorkPriority; status: Prisma.WorkStatus; daysAgo: number }[] = [
  { room: "B304", title: "ท่อน้ำรั่วในห้องน้ำ", category: "ประปา", priority: "HIGH", status: "NEW", daysAgo: 1 },
  { room: "C402", title: "ปลั๊กไฟไหม้ข้างเตียง", category: "ไฟฟ้า", priority: "HIGH", status: "NEW", daysAgo: 3 },
  { room: "A202", title: "แอร์ไม่เย็น ตั้ง 16 องศาแล้ว", category: "เครื่องใช้ไฟฟ้า", priority: "NORMAL", status: "IN_PROGRESS", daysAgo: 6 },
  { room: "B301", title: "บานประตูห้องเอียง ปิดไม่สนิท", category: "เครื่องเรือน", priority: "NORMAL", status: "DONE", daysAgo: 10 },
  { room: "C401", title: "หลอดไฟโถงทางเดินเสีย 2 ดวง", category: "ไฟฟ้า", priority: "LOW", status: "DONE", daysAgo: 13 },
  { room: "B303", title: "ฝักบัวตัน น้ำไหลซึม", category: "ประปา", priority: "NORMAL", status: "DONE", daysAgo: 15 },
];

// ---------- Seed ----------

async function main() {
  console.log("🧹 ล้างข้อมูลเดิม...");
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dormSetting.deleteMany();

  console.log("👤 สร้างผู้ใช้...");
  const admin = await prisma.user.create({
    data: { username: "admin", passwordHash: await bcrypt.hash("admin123", 10), name: "ก็อต", role: "ADMIN", phone: "089-xxx-xxxx" },
  });
  await prisma.user.create({
    data: { username: "staff", passwordHash: await bcrypt.hash("staff123", 10), name: "ป้าแดง", role: "STAFF", phone: "086-xxx-xxxx" },
  });

  console.log("🚪 สร้างห้องพัก...");
  for (const r of ROOMS) {
    await prisma.room.create({ data: r });
  }

  console.log("🧑‍🤝‍🧑 สร้างผู้เช่า + เชื่อมห้อง...");
  const tenantByName = new Map<string, string>();
  for (const t of TENANTS) {
    const created = await prisma.tenant.create({
      data: {
        name: t.name,
        phone: t.phone,
        idCard: t.idCard,
        deposit: t.deposit,
        balance: t.balance,
        moveInAt: new Date(t.moveIn),
        currentRoom: { connect: { id: t.room } },
      },
    });
    tenantByName.set(t.name.split(" ")[0], created.id);
  }

  console.log("📜 สร้างสัญญา...");
  for (const c of CONTRACTS) {
    const tenantId = tenantByName.get(c.tenant)!;
    const tenant = TENANTS.find((x) => x.name === c.tenant)!;
    await prisma.contract.create({
      data: {
        tenant: { connect: { id: tenantId } },
        room: { connect: { id: c.room } },
        startDate: new Date(c.start),
        endDate: new Date(c.end),
        months: c.months,
        deposit: c.deposit,
        status: c.status === "ACTIVE" && new Date(c.end).getTime() < Date.now() ? "EXPIRED" : c.status,
      },
    });
  }

  console.log("📅 สร้างบิลย้อนหลัง 8 เดือน (ม.ค.–ส.ค. 2569)...");
  const roomsWithMeters = new Map(ROOMS.map((r) => [r.id, r]));
  const tenantOfRoom = new Map(TENANTS.map((t) => [t.room, t.name.split(" ")[0]]));
  const HIST_ROOMS = ["A201", "A202", "B301", "B302", "B303", "B304", "C401", "C402"];
  for (let m = 0; m < 8; m++) {
    const dt = new Date(2026, m, 1);
    const period = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const mlabel = `${String(dt.getMonth() + 1).padStart(2, "0")}`;
    for (const rid of HIST_ROOMS) {
      const rm = roomsWithMeters.get(rid)!;
      const tenantId = tenantByName.get(tenantOfRoom.get(rid)!)!;
      const waterUnits = rm.waterMeter + (m % 3);
      const elecUnits = rm.elecMeter + m * 3;
      const waterAmount = waterUnits * WATER_RATE;
      const elecAmount = elecUnits * ELEC_RATE;
      const total = rm.rent + waterAmount + elecAmount;
      await prisma.invoice.create({
        data: {
          no: `INV-2026-${mlabel}-${rid.slice(-3)}-${m + 1}`,
          period,
          room: { connect: { id: rid } },
          tenant: { connect: { id: tenantId } },
          rentAmount: rm.rent,
          waterUnits,
          elecUnits,
          waterRate: WATER_RATE,
          elecRate: ELEC_RATE,
          waterAmount,
          elecAmount,
          total,
          dueDate: new Date(2026, m, 10),
          status: "PAID",
          paidAt: new Date(2026, m, Math.min(5, 28)),
        },
      });
    }
  }

  console.log("🧾 สร้างบิล กันยายน 2569...");
  let seq = 0;
  for (const inv of INVOICES) {
    seq++;
    const rm = roomsWithMeters.get(inv.room)!;
    const tenantId = tenantByName.get(inv.tenant)!;
    const waterAmount = rm.waterMeter * WATER_RATE;
    const elecAmount = rm.elecMeter * ELEC_RATE;
    const total = rm.rent + waterAmount + elecAmount;
    await prisma.invoice.create({
      data: {
        no: `INV-2026-09-${String(seq).padStart(3, "0")}`,
        period: "2026-09",
        room: { connect: { id: inv.room } },
        tenant: { connect: { id: tenantId } },
        rentAmount: rm.rent,
        waterUnits: rm.waterMeter,
        elecUnits: rm.elecMeter,
        waterRate: WATER_RATE,
        elecRate: ELEC_RATE,
        waterAmount,
        elecAmount,
        total,
        dueDate: new Date("2026-09-10T00:00:00"),
        status: inv.status,
        paidAt: inv.paid ? new Date(inv.paid) : null,
      },
    });
    if (inv.paid) {
      await prisma.payment.create({
        data: {
          invoice: { connect: { no: `INV-2026-09-${String(seq).padStart(3, "0")}` } },
          amount: total,
          method: "TRANSFER",
          receivedAt: new Date(inv.paid),
          recordedBy: { connect: { id: admin.id } },
        },
      });
    }
  }
  void tenantOfRoom;

  console.log("🔧 สร้างงานซ่อม...");
  for (const w of WORK_ORDERS) {
    const created = new Date();
    created.setDate(created.getDate() - w.daysAgo);
    await prisma.workOrder.create({
      data: {
        room: { connect: { id: w.room } },
        title: w.title,
        category: w.category,
        priority: w.priority,
        status: w.status,
        createdAt: created,
        completedAt: w.status === "DONE" ? created : null,
      },
    });
  }

  console.log("💧 สร้างบันทึกมิเตอร์ ก.ย. 2569...");
  const METER_ROOMS = ["A201", "A202", "B301", "B302", "B303", "B304", "C401", "C402"];
  for (const rid of METER_ROOMS) {
    const rm = roomsWithMeters.get(rid)!;
    // เลขสะสมสมมติ: ก่อนหน้า = ฐาน, ครั้งนี้ = ฐาน + หน่วยที่ใช้จริงของเดือน ก.ย.
    const waterPrev = 1000 + rm.waterMeter * 8;
    const elecPrev = 5000 + rm.elecMeter * 8;
    await prisma.meterReading.create({
      data: {
        room: { connect: { id: rid } },
        month: "2026-09",
        waterPrev,
        waterCurr: waterPrev + rm.waterMeter,
        elecPrev,
        elecCurr: elecPrev + rm.elecMeter,
        waterUnits: rm.waterMeter,
        elecUnits: rm.elecMeter,
      },
    });
  }

  console.log("💸 สร้างรายจ่ายย้อนหลัง...");
  const EXPENSES: [string, string, number][] = [
    ["2026-07", "ค่าไฟส่วนกลาง", 4200],
    ["2026-07", "ทำความสะอาด", 3500],
    ["2026-07", "เงินเดือนพนักงาน", 9000],
    ["2026-08", "ค่าไฟส่วนกลาง", 4500],
    ["2026-08", "ซ่อมบำรุง", 2800],
    ["2026-08", "ทำความสะอาด", 3500],
    ["2026-08", "เงินเดือนพนักงาน", 9000],
    ["2026-09", "ค่าไฟส่วนกลาง", 4350],
    ["2026-09", "ซ่อมบำรุง", 1800],
    ["2026-09", "ทำความสะอาด", 3500],
    ["2026-09", "เงินเดือนพนักงาน", 9000],
  ];
  for (const [month, category, amount] of EXPENSES) {
    await prisma.expense.create({ data: { month, category, amount } });
  }

  console.log("⚙️ ตั้งค่าระบบ...");
  const settings: [string, string][] = [
    ["DORM_NAME", "หอพักสบายใจ"],
    ["DORM_ADDRESS", "ซอยสุขุมวิท 31 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ"],
    ["DORM_PHONE", "02-xxx-xxxx"],
    ["BANK_ACCOUNT", "123-4-56789-0 · ธ.กรุงเทพ"],
    ["WATER_RATE", String(WATER_RATE)],
    ["ELEC_RATE", String(ELEC_RATE)],
    ["SERVICE_FEE", "0"],
    ["PAYMENT_DUE_DAY", "10"],
  ];
  for (const [key, value] of settings) {
    await prisma.dormSetting.create({ data: { key, value } });
  }

  console.log("✅ Seed เรียบร้อย — เข้าสู่ระบบด้วย admin/admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());