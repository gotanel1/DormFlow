export const THB = (n: number) => `฿${n.toLocaleString("en-US")}`;

export const WATER_RATE = 18;
export const ELEC_RATE = 7;

export type RoomStatus = "มีผู้เช่า" | "ว่าง" | "จอง" | "ปิดปรับปรุง";

export interface Room {
  id: string;
  floor: number;
  type: string;
  rent: number;
  status: RoomStatus;
  tenant: string | null;
  water: number;
  elec: number;
}

export const ROOMS: Room[] = [
  { id: "A201", floor: 2, type: "ห้องเดี่ยว แอร์", rent: 3500, status: "มีผู้เช่า", tenant: "สมชาย", water: 12, elec: 145 },
  { id: "A202", floor: 2, type: "ห้องเดี่ยว แอร์", rent: 3800, status: "มีผู้เช่า", tenant: "มิ้นท์", water: 9, elec: 132 },
  { id: "A203", floor: 2, type: "ห้องเดี่ยว พัดลม", rent: 2500, status: "ว่าง", tenant: null, water: 0, elec: 0 },
  { id: "A204", floor: 2, type: "ห้องเดี่ยว พัดลม", rent: 2500, status: "จอง", tenant: "นัดชมห้อง (19/9)", water: 0, elec: 0 },
  { id: "B301", floor: 3, type: "ห้องเดี่ยว แอร์", rent: 4200, status: "มีผู้เช่า", tenant: "ตาแก้ว", water: 11, elec: 139 },
  { id: "B302", floor: 3, type: "ห้องเดี่ยว แอร์", rent: 4500, status: "มีผู้เช่า", tenant: "เก่ง", water: 10, elec: 158 },
  { id: "B303", floor: 3, type: "ห้องเดี่ยว พัดลม", rent: 3000, status: "มีผู้เช่า", tenant: "สมปอง", water: 7, elec: 95 },
  { id: "B304", floor: 3, type: "ห้องสวีท", rent: 6500, status: "มีผู้เช่า", tenant: "จ๋า", water: 14, elec: 208 },
  { id: "C401", floor: 4, type: "ห้องเดี่ยว แอร์", rent: 4000, status: "มีผู้เช่า", tenant: "แนน", water: 9, elec: 152 },
  { id: "C402", floor: 4, type: "ห้องเดี่ยว แอร์", rent: 4000, status: "มีผู้เช่า", tenant: "เกียรติ", water: 10, elec: 141 },
  { id: "C403", floor: 4, type: "ห้องเดี่ยว พัดลม", rent: 2800, status: "ว่าง", tenant: null, water: 0, elec: 0 },
  { id: "C404", floor: 4, type: "ห้องสวีท", rent: 6000, status: "ปิดปรับปรุง", tenant: null, water: 0, elec: 0 },
];

export interface Tenant {
  id: number;
  name: string;
  phone: string;
  idCard: string;
  room: string;
  from: string;
  deposit: number;
  balance: number;
}

export const TENANTS: Tenant[] = [
  { id: 1, name: "สมชาย ทรัพย์เจริญ", phone: "089-xxx-xxxx", idCard: "1-1021-xxxxx-xx-x", room: "A201", from: "1 มิ.ย. 2569", deposit: 3500, balance: 0 },
  { id: 2, name: "มิ้นท์ จิรพรรณ", phone: "081-xxx-xxxx", idCard: "1-3099-xxxxx-xx-x", room: "A202", from: "15 ก.ค. 2569", deposit: 3800, balance: 0 },
  { id: 3, name: "ตาแก้ว ใจดี", phone: "086-xxx-xxxx", idCard: "1-1099-xxxxx-xx-x", room: "B301", from: "1 เม.ย. 2569", deposit: 4200, balance: 0 },
  { id: 4, name: "เก่ง กิตติพงษ์", phone: "090-xxx-xxxx", idCard: "3-1101-xxxxx-xx-x", room: "B302", from: "1 พ.ค. 2569", deposit: 4500, balance: 5786 },
  { id: 5, name: "สมปอง วงค์ทอง", phone: "092-xxx-xxxx", idCard: "5-1022-xxxxx-xx-x", room: "B303", from: "10 ส.ค. 2569", deposit: 3000, balance: 0 },
  { id: 6, name: "จ๋า พัชราภา", phone: "087-xxx-xxxx", idCard: "1-2012-xxxxx-xx-x", room: "B304", from: "1 ก.ค. 2569", deposit: 6500, balance: 7188 },
  { id: 7, name: "แนน นภัสสร", phone: "095-xxx-xxxx", idCard: "1-1088-xxxxx-xx-x", room: "C401", from: "1 ก.ย. 2569", deposit: 4000, balance: 4418 },
  { id: 8, name: "เกียรติ วรวุฒิ", phone: "098-xxx-xxxx", idCard: "3-3004-xxxxx-xx-x", room: "C402", from: "15 ส.ค. 2569", deposit: 4000, balance: 4323 },
];

export type InvStatus = "ชำระแล้ว" | "รอชำระ" | "ค้างชำระ";

export interface Invoice {
  id: string;
  period: string;
  room: string;
  tenant: string;
  rent: number;
  water: number;
  elec: number;
  due: string;
  status: InvStatus;
  paid: string | null;
}

export const invTotal = (i: Invoice) => i.rent + i.water * WATER_RATE + i.elec * ELEC_RATE;

export const INVOICES: Invoice[] = [
  { id: "INV-0901", period: "ก.ย. 2569", room: "A201", tenant: "สมชาย", rent: 3500, water: 12, elec: 145, due: "10 ก.ย. 2569", status: "ชำระแล้ว", paid: "5 ก.ย. 2569" },
  { id: "INV-0902", period: "ก.ย. 2569", room: "A202", tenant: "มิ้นท์", rent: 3800, water: 9, elec: 132, due: "10 ก.ย. 2569", status: "ชำระแล้ว", paid: "6 ก.ย. 2569" },
  { id: "INV-0903", period: "ก.ย. 2569", room: "B301", tenant: "ตาแก้ว", rent: 4200, water: 11, elec: 139, due: "10 ก.ย. 2569", status: "ชำระแล้ว", paid: "8 ก.ย. 2569" },
  { id: "INV-0904", period: "ก.ย. 2569", room: "B302", tenant: "เก่ง", rent: 4500, water: 10, elec: 158, due: "10 ก.ย. 2569", status: "ค้างชำระ", paid: null },
  { id: "INV-0905", period: "ก.ย. 2569", room: "B303", tenant: "สมปอง", rent: 3000, water: 7, elec: 95, due: "10 ก.ย. 2569", status: "ชำระแล้ว", paid: "9 ก.ย. 2569" },
  { id: "INV-0906", period: "ก.ย. 2569", room: "B304", tenant: "จ๋า", rent: 6500, water: 14, elec: 208, due: "10 ก.ย. 2569", status: "ค้างชำระ", paid: null },
  { id: "INV-0907", period: "ก.ย. 2569", room: "C401", tenant: "แนน", rent: 4000, water: 9, elec: 152, due: "10 ก.ย. 2569", status: "รอชำระ", paid: null },
  { id: "INV-0908", period: "ก.ย. 2569", room: "C402", tenant: "เกียรติ", rent: 4000, water: 10, elec: 141, due: "10 ก.ย. 2569", status: "ค้างชำระ", paid: null },
];

export const MONTHLY_INCOME = [
  { label: "ม.ค.", value: 63500 },
  { label: "ก.พ.", value: 58800 },
  { label: "มี.ค.", value: 71200 },
  { label: "เม.ย.", value: 74800 },
  { label: "พ.ค.", value: 69000 },
  { label: "มิ.ย.", value: 77900 },
  { label: "ก.ค.", value: 81200 },
  { label: "ส.ค.", value: 84300 },
];

export const MONTHLY_EXPENSE = [21000, 19500, 23400, 22800, 24700, 25600, 27100, 28900];

export const RATES_HISTORY = [
  { month: "ส.ค. 2569", rent: 76000, utility: 18324, other: 500, income: 94824, expense: 28900, net: 65924 },
  { month: "ก.ค. 2569", rent: 73000, utility: 16410, other: 0, income: 89410, expense: 27100, net: 62310 },
  { month: "มิ.ย. 2569", rent: 71000, utility: 15562, other: 0, income: 86562, expense: 25600, net: 60962 },
];

export type WorkStatus = "รับเรื่อง" | "กำลังซ่อม" | "เสร็จแล้ว";

export interface WorkOrder {
  id: string;
  room: string;
  title: string;
  cat: string;
  pr: "เร่งด่วน" | "ปกติ" | "ต่ำ";
  status: WorkStatus;
  date: string;
}

export const WORK_ORDERS: WorkOrder[] = [
  { id: "WK-0917", room: "B304", title: "ท่อน้ำรั่วในห้องน้ำ", cat: "ประปา", pr: "เร่งด่วน", status: "รับเรื่อง", date: "17 ก.ย." },
  { id: "WK-0915", room: "C402", title: "ปลั๊กไฟไหม้ข้างเตียง", cat: "ไฟฟ้า", pr: "เร่งด่วน", status: "รับเรื่อง", date: "15 ก.ย." },
  { id: "WK-0912", room: "A202", title: "แอร์ไม่เย็น ตั้ง 16 องศาแล้ว", cat: "เครื่องใช้ไฟฟ้า", pr: "ปกติ", status: "กำลังซ่อม", date: "12 ก.ย." },
  { id: "WK-0908", room: "B301", title: "บานประตูห้องเอียง ปิดไม่สนิท", cat: "เครื่องเรือน", pr: "ปกติ", status: "เสร็จแล้ว", date: "8 ก.ย." },
  { id: "WK-0905", room: "C401", title: "หลอดไฟโถงทางเดินเสีย 2 ดวง", cat: "ไฟฟ้า", pr: "ต่ำ", status: "เสร็จแล้ว", date: "5 ก.ย." },
  { id: "WK-0903", room: "B303", title: "ฝักบัวตัน น้ำไหลซึม", cat: "ประปา", pr: "ปกติ", status: "เสร็จแล้ว", date: "3 ก.ย." },
];

export type ContractStatus = "ยังดำเนิน" | "ใกล้หมดอายุ" | "หมดอายุแล้ว";

export interface Contract {
  id: string;
  tenant: string;
  room: string;
  start: string;
  end: string;
  months: number;
  deposit: number;
  status: ContractStatus;
}

export const CONTRACTS: Contract[] = [
  { id: "C-001", tenant: "สมชาย", room: "A201", start: "1 มิ.ย. 2569", end: "30 ก.ย. 2569", months: 4, deposit: 3500, status: "ใกล้หมดอายุ" },
  { id: "C-002", tenant: "มิ้นท์", room: "A202", start: "15 ก.ค. 2569", end: "30 ก.ย. 2569", months: 3, deposit: 3800, status: "ใกล้หมดอายุ" },
  { id: "C-003", tenant: "ตาแก้ว", room: "B301", start: "1 เม.ย. 2569", end: "31 ต.ค. 2569", months: 7, deposit: 4200, status: "ยังดำเนิน" },
  { id: "C-004", tenant: "เก่ง", room: "B302", start: "1 พ.ค. 2569", end: "31 ส.ค. 2569", months: 4, deposit: 4500, status: "หมดอายุแล้ว" },
  { id: "C-005", tenant: "จ๋า", room: "B304", start: "1 ก.ค. 2569", end: "31 ต.ค. 2569", months: 4, deposit: 6500, status: "ยังดำเนิน" },
  { id: "C-006", tenant: "แนน", room: "C401", start: "1 ก.ย. 2569", end: "31 มี.ค. 2570", months: 7, deposit: 4000, status: "ยังดำเนิน" },
  { id: "C-007", tenant: "เกียรติ", room: "C402", start: "15 ส.ค. 2569", end: "31 ม.ค. 2570", months: 6, deposit: 4000, status: "ยังดำเนิน" },
  { id: "C-008", tenant: "สมปอง", room: "B303", start: "10 ส.ค. 2569", end: "30 ก.ย. 2569", months: 2, deposit: 3000, status: "ใกล้หมดอายุ" },
];

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  "มีผู้เช่า": "bg-success-soft text-success",
  ว่าง: "bg-gray-100 text-ink-soft",
  จอง: "bg-warn-soft text-warn",
  "ปิดปรับปรุง": "bg-danger-soft text-danger",
};

export const INV_STATUS_COLORS: Record<InvStatus, string> = {
  "ชำระแล้ว": "bg-success-soft text-success",
  "รอชำระ": "bg-warn-soft text-warn",
  "ค้างชำระ": "bg-danger-soft text-danger",
};

export const WORK_STATUS_COLORS: Record<WorkStatus, string> = {
  รับเรื่อง: "bg-brand-soft text-brand-dark",
  "กำลังซ่อม": "bg-warn-soft text-warn",
  "เสร็จแล้ว": "bg-success-soft text-success",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  "ยังดำเนิน": "bg-success-soft text-success",
  "ใกล้หมดอายุ": "bg-warn-soft text-warn",
  "หมดอายุแล้ว": "bg-danger-soft text-danger",
};