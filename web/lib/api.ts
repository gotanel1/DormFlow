import useSWR from "swr";

export const API_BASE = "http://localhost:3001/api";
export const CURRENT_PERIOD = "2026-09";

const TOKEN_KEY = "dormflow_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function loggedInUser(): { name: string; role: string; username: string } | null {
  const t = getToken();
  if (!t) return null;
  try {
    const p = JSON.parse(atob(t.split(".")[1]));
    return { name: p.name, role: p.role, username: p.username };
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as Record<string, string>) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) {
    setToken(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.href = "/login";
    throw new Error("unauthorized");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `HTTP ${res.status}`);
  return json as T;
}

export async function login(username: string, password: string) {
  const data = await api<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  setToken(data.token);
  return data;
}

/* ---------- SWR hook ---------- */
export function useApi<T = unknown>(path: string | null) {
  return useSWR<T>(path, (p) => api<T>(p), { revalidateOnFocus: false, shouldRetryOnError: false, revalidateOnReconnect: false });
}

/* ---------- Type maps (EN → TH) ---------- */
export const ROOM_STATUS: Record<string, { label: string; tone: "green" | "gray" | "amber" | "red" }> = {
  RENTED: { label: "มีผู้เช่า", tone: "green" },
  VACANT: { label: "ว่าง", tone: "gray" },
  RESERVED: { label: "จอง", tone: "amber" },
  MAINTENANCE: { label: "ปิดปรับปรุง", tone: "red" },
};

export const INV_STATUS: Record<string, { label: string; tone: "green" | "amber" | "red" }> = {
  PAID: { label: "ชำระแล้ว", tone: "green" },
  PENDING: { label: "รอชำระ", tone: "amber" },
  OVERDUE: { label: "ค้างชำระ", tone: "red" },
};

export const WORK_STATUS: Record<string, { label: string; tone: "blue" | "amber" | "green" }> = {
  NEW: { label: "รับเรื่อง", tone: "blue" },
  IN_PROGRESS: { label: "กำลังซ่อม", tone: "amber" },
  DONE: { label: "เสร็จแล้ว", tone: "green" },
};

export const WORK_PRIORITY: Record<string, { label: string; tone: "red" | "amber" | "gray" }> = {
  HIGH: { label: "เร่งด่วน", tone: "red" },
  NORMAL: { label: "ปกติ", tone: "amber" },
  LOW: { label: "ต่ำ", tone: "gray" },
};

export const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function thaiMonth(period: string): string {
  // "2026-09" -> "ก.ย. 69"
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS_TH[m - 1]} ${String(y).slice(-2)}`;
}

export function thaiDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export const THB = (n: number) => `฿${n.toLocaleString("en-US")}`;

/* ---------- DTOs ---------- */
export interface RoomDTO {
  id: string;
  floor: number;
  type: string;
  rent: number;
  status: "RENTED" | "VACANT" | "RESERVED" | "MAINTENANCE";
  waterMeter: number;
  elecMeter: number;
  currentTenant: { id: string; name: string } | null;
}

export interface TenantDTO {
  id: string;
  name: string;
  phone: string | null;
  idCard: string | null;
  deposit: number;
  balance: number;
  status: "ACTIVE" | "MOVED_OUT";
  moveInAt: string | null;
  currentRoom: { id: string } | null;
}

export interface ContractDTO {
  id: string;
  months: number;
  deposit: number;
  startDate: string;
  endDate: string;
  daysLeft: number;
  tenant: { name: string };
  room: { id: string };
}

export interface InvoiceDTO {
  id: string;
  no: string;
  period: string;
  room: { id: string };
  tenant: { name: string };
  rentAmount: number;
  waterUnits: number;
  elecUnits: number;
  waterRate: number;
  elecRate: number;
  waterAmount: number;
  elecAmount: number;
  total: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  paidAt: string | null;
}

export interface WorkDTO {
  id: string;
  room: { id: string };
  title: string;
  category: string;
  priority: "HIGH" | "NORMAL" | "LOW";
  status: "NEW" | "IN_PROGRESS" | "DONE";
  createdAt: string;
}

export interface SummaryDTO {
  monthly: { label: string; value: number }[];
  overdue: { value: number; count: number };
  occupancy: number;
  roomCount: number;
  tenantCount: number;
  monthIncome: number;
}