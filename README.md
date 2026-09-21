# DormFlow — ระบบบริหารจัดการหอพัก

ระบบบริหารหอพักรายเดือนสำหรับเจ้าของหอ/ผู้ดูแล: จัดการห้องพัก ผู้เช่า สัญญาเช่า จดมิเตอร์ ออกบิลอัตโนมัติ รับชำระ บันทึกรายจ่าย และดูรายงานกำไรสุทธิ

UI สไตล์ Salesforce Lightning · ภาษาไทยทั้งระบบ · ใช้งานได้บนมือถือ

## Screenshots

| หน้าหลัก | จดมิเตอร์ |
|---|---|
| ![Dashboard](preview/api_dashboard.png) | ![Meters](preview/p4_meters.png) |

| บิลและการเงิน | รายงาน |
|---|---|
| ![Billing](preview/api_billing_paid.png) | ![Reports](preview/p4_reports.png) |

## Features

**จัดการพื้นฐาน**
- ห้องพัก — CRUD, กรองตามสถานะ (มีผู้เช่า/ว่าง/จอง/ปิดปรับปรุง), ค้นหา
- ผู้เช่า — ข้อมูลติดต่อ, เงินประกัน, ยอดคงค้าง, ผูกห้องอัตโนมัติ
- สัญญาเช่า — สร้างสัญญา, นับวันคงเหลืออัตโนมัติ, ต่ออายุ 12 เดือน

**การเงิน (หัวใจของระบบ)**
- **จดมิเตอร์รายเดือน** — กรอกเลขมิเตอร์ทุกห้องในหน้าเดียว, ดึงเลขครั้งก่อนอัตโนมัติ, กันเลขย้อนหลัง, พรีวิวยอดบิลสด
- **ออกบิลอัตโนมัติ** — คำนวณจากมิเตอร์จริง + อัตราที่ตั้งไว้ + ค่าส่วนกลาง, กันออกบิลซ้ำ
- **รับชำระ** — บันทึก Payment, ตัดยอดค้างผู้เช่า, กันจ่ายซ้ำ (409)
- **รายจ่าย** — บันทึกค่าใช้จ่ายแยกหมวด → คำนวณกำไรสุทธิจริง
- **รายงาน** — รายได้ vs รายจ่าย, อัตรากำไร, อัตราการเข้าพัก

**อื่นๆ**
- ซ่อมบำรุง — กระดาน Kanban (รับเรื่อง → กำลังซ่อม → เสร็จ)
- ตั้งค่า — อัตราค่าน้ำ/ไฟ/ส่วนกลาง, วันครบกำหนด (มีผลกับการออกบิลจริง)
- สิทธิ์ผู้ใช้ — Admin แก้ได้ทุกอย่าง / Staff ดูและทำงานประจำวัน
- Audit log ทุกธุรกรรมการเงิน

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, SWR |
| Backend | Express 4, TypeScript, Prisma ORM, Zod, JWT (bcrypt) |
| Database | SQLite (dev) — พร้อมสลับเป็น PostgreSQL |

## Getting Started

```bash
# 1) Backend
cd api
npm install
npx prisma migrate dev      # สร้างฐานข้อมูล
npx prisma db seed          # ใส่ข้อมูลตัวอย่าง
npm run dev                 # → http://localhost:3001

# 2) Frontend (อีก terminal)
cd web
npm install
npm run dev -- -p 8080      # → http://localhost:8080
```

เปิด http://localhost:8080 แล้วเข้าสู่ระบบ:

| บัญชี | รหัสผ่าน | สิทธิ์ |
|---|---|---|
| `admin` | `admin123` | Admin — แก้ไขได้ทุกอย่าง |
| `staff` | `staff123` | Staff — งานประจำวัน |

### ย้ายไป PostgreSQL

```bash
docker compose up -d postgres        # ใช้ docker-compose.yml ที่ให้มา
# แก้ api/prisma/schema.prisma → provider = "postgresql"
# แก้ api/.env → DATABASE_URL="postgresql://dorm:dormpass@localhost:5432/dormflow"
cd api && npx prisma migrate dev && npx prisma db seed
```

## API

ทุก endpoint อยู่ใต้ `/api` และต้องใช้ JWT Bearer token (ยกเว้น login/health)

| Method | Endpoint | หมายเหตุ |
|---|---|---|
| POST | `/auth/login` | รับ token |
| GET | `/rooms` · POST · PATCH `/:id` | POST/PATCH = Admin |
| GET | `/tenants` · `/tenants/:id` · POST | เช็คห้องว่างก่อนผูก |
| GET | `/contracts` · POST · POST `/:id/extend` | ตอบ `daysLeft` คำนวณแล้ว |
| GET | `/meters?month=YYYY-MM` · POST | ดึงเลขครั้งก่อนอัตโนมัติ |
| GET | `/invoices?period=` · `/invoices/summary` | |
| POST | `/invoices/generate` | ต้องจดมิเตอร์ก่อน |
| POST | `/invoices/:id/pay` | สร้าง Payment + ตัดยอดค้าง |
| GET | `/expenses` · POST · DELETE `/:id` | |
| GET | `/settings` · PUT | PUT = Admin |
| GET | `/workorders` · POST · PATCH `/:id/status` | |

## Project Structure

```
dormitory-system/
├── api/                    Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma   13 models
│   │   └── seed.ts         ข้อมูลตัวอย่าง (12 ห้อง, 8 ผู้เช่า, บิลย้อนหลัง 8 เดือน)
│   └── src/
│       ├── lib/            prisma client, JWT auth
│       └── routes/         auth, rooms, tenants, contracts, meters, invoices, expenses, settings, workorders
├── web/                    Next.js + Tailwind
│   ├── app/                11 หน้า (รวมหน้า login)
│   ├── components/         UI kit, charts (SVG ล้วน ไม่ใช้ไลบรารี), sidebar, topbar
│   └── lib/api.ts          fetch wrapper + SWR + แปลง enum เป็นภาษาไทย
├── docker-compose.yml      PostgreSQL
└── requirements.md         ข้อกำหนดฉบับเต็ม
```

## Roadmap

- [x] UI ครบทุกหน้า + responsive
- [x] Backend API + ฐานข้อมูล + Auth
- [x] เชื่อม Frontend กับ API จริง
- [x] จดมิเตอร์ → ออกบิลอัตโนมัติ → รับชำระ → รายงานกำไรสุทธิ
- [ ] PromptPay QR รับชำระ
- [ ] แจ้งเตือนผ่าน LINE (ค้างชำระ / สัญญาครบกำหนด)
- [ ] ใบเสร็จ & สัญญาเป็น PDF
- [ ] ส่งออก Excel
- [ ] ย้าย PostgreSQL + Deploy (Docker/VPS)

## License

MIT