"use client";

import { useState } from "react";
import { KeyRound, Loader2, Plus, Trash2, X, XCircle } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, PageHeader, Row, Td, Th, inputCls } from "@/components/ui";
import { api, loggedInUser, useApi } from "@/lib/api";

interface UserDTO {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "STAFF";
  phone: string | null;
  active: boolean;
}

export default function UsersPage() {
  const { data, mutate: refetch } = useApi<{ users: UserDTO[] }>("/users");
  const users = data?.users ?? [];
  const me = loggedInUser();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<UserDTO | null>(null);
  const [f, setF] = useState({ username: "", name: "", role: "STAFF", password: "", phone: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const openAdd = () => {
    setEdit(null);
    setF({ username: "", name: "", role: "STAFF", password: "", phone: "" });
    setOpen(true);
  };

  const openEdit = (u: UserDTO) => {
    setEdit(u);
    setF({ username: u.username, name: u.name, role: u.role, password: "", phone: u.phone ?? "" });
    setOpen(true);
  };

  const save = async () => {
    setErr("");
    setMsg("");
    try {
      if (edit) {
        await api(`/users/${edit.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: f.name,
            role: f.role,
            phone: f.phone || null,
            ...(f.password ? { password: f.password } : {}),
          }),
        });
        setMsg("แก้ผู้ใช้เรียบร้อย");
      } else {
        await api("/users", { method: "POST", body: JSON.stringify(f) });
        setMsg("สร้างผู้ใช้เรียบร้อย");
      }
      refetch();
      setOpen(false);
      setTimeout(() => setMsg(""), 4000);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "ไม่สำเร็จ");
    }
  };

  const toggleActive = async (u: UserDTO) => {
    setErr("");
    try {
      await api(`/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ active: !u.active }) });
      refetch();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "ไม่สำเร็จ");
    }
  };

  const remove = async (u: UserDTO) => {
    setErr("");
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      refetch();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "ไม่สำเร็จ");
    }
  };

  return (
    <>
      <PageHeader
        title="ผู้ใช้ระบบ"
        desc={`บัญที ${users.length} ราย — Admin แก้ได้ทุกอย่าง / Staff งานประจำวัน`}
        actions={
          <Btn variant="brand" icon={Plus} onClick={openAdd}>
            เพิ่มผู้ใช้
          </Btn>
        }
      />

      {msg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
          ✓ {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger">
          <XCircle size={16} /> {err}
        </div>
      )}

      <Card noPad title="รายชื่อผู้ใช้" desc="รหัสผ่านเก็บเป็น bcrypt hash — อ่านย้อนไม่ได้">
        <div className="overflow-x-auto">
          {!data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-page/60">
                  <Th>ชื่อผู้ใช้</Th>
                  <Th>ชื่อจริง</Th>
                  <Th>เบอร์โทร</Th>
                  <Th>สิทธิ์</Th>
                  <Th>สถานะ</Th>
                  <Th right>จัดการ</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Row key={u.id}>
                    <Td className="font-mono text-[13px] font-semibold">{u.username}</Td>
                    <Td>{u.name}</Td>
                    <Td className="text-ink-soft">{u.phone ?? "—"}</Td>
                    <Td>
                      <Badge tone={u.role === "ADMIN" ? "blue" : "gray"}>{u.role === "ADMIN" ? "Admin" : "Staff"}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={u.active ? "green" : "red"} dot>
                        {u.active ? "ใช้งาน" : "ปิด"}
                      </Badge>
                    </Td>
                    <Td right>
                      <div className="flex justify-end gap-1.5">
                        <Btn size="sm" variant="ghost" icon={KeyRound} onClick={() => openEdit(u)}>
                          แг้ไข
                        </Btn>
                        <Btn size="sm" variant="neutral" onClick={() => toggleActive(u)}>
                          {u.active ? "ปิด" : "เปิด"}
                        </Btn>
                        {u.id !== me?.id && (
                          <Btn size="sm" variant="danger" icon={Trash2} onClick={() => remove(u)}>
                            ลบ
                          </Btn>
                        )}
                      </div>
                    </Td>
                  </Row>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? `แก้ผู้ใช้: ${edit.username}` : "เพิ่มผู้ใช้ใหม่"}
        footer={
          <>
            <Btn variant="neutral" onClick={() => setOpen(false)}>
              ยกเลิก
            </Btn>
            <Btn variant="brand" onClick={save}>
              {edit ? "บันทึกแก้" : "สร้างผู้ใช้"}
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อผู้ใช้ *" hint={edit ? "เปลี่ยนไม่ได้" : "3–30 ตัว, ใช้ได้ a-z 0-9 _ . -"}>
            <input className={inputCls} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} disabled={!!edit} placeholder="เช่น staff2" />
          </Field>
          <Field label="ชื่อจริง *">
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="เช่น สมปอง ใจดี" />
          </Field>
          <Field label="สิทธิ์">
            <select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="STAFF">Staff — งานประจำวัน</option>
              <option value="ADMIN">Admin — ทุกอย่าง</option>
            </select>
          </Field>
          <Field label="เบอร์โทร">
            <input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="08x-xxx-xxxx" />
          </Field>
          <Field label={edit ? "รหัสผ่านใหม่ (ว่าง = ไม่เปลี่ยน)" : "รหัสผ่าน *"} hint="ขั้นต่ 6 ตัว">
            <input type="password" className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="••••••" />
          </Field>
        </div>
      </Modal>
    </>
  );
}