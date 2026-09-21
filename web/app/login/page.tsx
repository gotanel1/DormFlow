"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { login } from "@/lib/api";
import { Btn, Field, inputCls } from "@/components/ui";

export default function LoginPage() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(u, p);
      router.push("/");
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white shadow-md">
            <Building2 size={22} />
          </div>
          <h1 className="mt-3 text-xl font-bold text-ink">DormFlow</h1>
          <p className="text-sm text-ink-soft">ระบบบริหารหอพักสบายใจ</p>
        </div>

        <form onSubmit={submit} className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_4px_16px_rgba(8,7,7,0.08)]">
          <div className="h-1 bg-brand" />
          <div className="space-y-3 p-6">
            <Field label="ชื่อผู้ใช้">
              <input className={inputCls} value={u} onChange={(e) => setU(e.target.value)} placeholder="admin" autoFocus />
            </Field>
            <Field label="รหัสผ่าน">
              <input className={inputCls} type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" />
            </Field>
            {err && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{err}</p>}
            <Btn type="submit" variant="brand" disabled={busy || !u || !p} className="w-full justify-center py-2">
              {busy && <Loader2 size={15} className="animate-spin" />}
              เข้าสู่ระบบ
            </Btn>
          </div>
        </form>

        <p className="mt-4 rounded-md border border-line bg-white px-4 py-2.5 text-center text-xs text-ink-soft">
          บัญชีทดลอง: <span className="font-mono font-semibold text-ink">admin / admin123</span> (Admin) ·{" "}
          <span className="font-mono font-semibold text-ink">staff / staff123</span> (Staff)
        </p>
      </div>
    </div>
  );
}