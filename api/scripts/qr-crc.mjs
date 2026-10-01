// ตรวจ CRC16-CCITT (poly 0x1021, init 0xFFFF) ตามมาตรฐาน EMVCo เอง ไม่พึ่งไลบรารี
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const payload = process.argv[2];
const idx = payload.indexOf("6304");
const body = payload.slice(0, idx);
const stated = payload.slice(idx + 4);
const computed = crc16(body);
console.log("payload   :", payload);
console.log("CRC in tag:", stated);
// EMVCo: CRC คำนวณจากทั้ง payload รวม tag "6304" (ไม่รวมค่า CRC เอง)
const computedWithTag = crc16(body + "6304");
console.log("CRC calc  :", computedWithTag);
console.log("MATCH     :", stated === computedWithTag ? "OK (คิดรวม 6304)" : `MISMATCH (คิดไม่รวม 6304 ได้ ${computed})`);

// TLV length check — เดินทั้ง payload แล้วดูว่าปิดพอดีไหม
function walk(s, depth = 0) {
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = parseInt(s.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len)) return { ok: false, why: `bad length at ${i}` };
    const val = s.slice(i + 4, i + 4 + len);
    if (val.length !== len) return { ok: false, why: `tag ${id} truncated (want ${len}, got ${val.length})` };
    const pad = "  ".repeat(depth);
    if (id === "29") console.log(`${pad}29 = ${val}`), walk(val, depth + 1);
    else console.log(`${pad}${id} = ${val}`);
    i += 4 + len;
  }
  return { ok: i === s.length, consumed: i, total: s.length };
}
console.log("--- TLV walk ---");
const r = walk(payload);
console.log("walk ok   :", r.ok, r.consumed === r.total ? "(ครบพอดี)" : `(กิน ${r.consumed}/${r.total})`);
