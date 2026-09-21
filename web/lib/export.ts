import * as XLSX from "xlsx";

export interface ExportCol<T> {
  header: string;
  /** คืนค่าที่จะใส่ใน cell */
  value: (row: T) => string | number;
}

/** สร้างไฟล์ .xlsx แล้วดาวน์โหลดในเบราว์เซอร์ */
export function exportXlsx<T>(filename: string, sheetName: string, cols: ExportCol<T>[], rows: T[]) {
  const data = rows.map((r) => {
    const o: Record<string, string | number> = {};
    for (const c of cols) o[c.header] = c.value(r);
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  // ความกว้างคอลัมน์โดยประมาณ
  ws["!cols"] = cols.map((c) => ({ wch: Math.max(12, c.header.length + 6) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}