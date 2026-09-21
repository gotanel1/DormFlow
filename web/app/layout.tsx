import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/shell";

export const metadata: Metadata = {
  title: "DormFlow · ระบบบริหารหอพัก",
  description: "ระบบบริหารจัดการหอพัก — ห้องพัก, ผู้เช่า, สัญญา, บิล และซ่อมบำรุง",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-sans text-ink antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}