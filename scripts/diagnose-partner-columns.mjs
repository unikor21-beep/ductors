// partners 테이블의 logoUrl / businessLicenseUrl 컬럼 타입을 확인합니다.
// LONGTEXT 가 아니면 사업자등록증 저장이 실패합니다.
// 실행: node scripts/diagnose-partner-columns.mjs
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL || "mysql://root:Multi@12345@localhost:3306/ductors";
const conn = await mysql.createConnection(url);
try {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'partners'
       AND COLUMN_NAME IN ('logoUrl','businessLicenseUrl')`
  );
  console.log("현재 컬럼 타입:");
  for (const r of rows) {
    const ok = String(r.COLUMN_TYPE).toLowerCase().includes("longtext");
    console.log(`  - ${r.COLUMN_NAME}: ${r.COLUMN_TYPE} ${ok ? "✓ 정상(LONGTEXT)" : "✗ 확장 필요 → setup-partner-longtext.mjs 실행하세요"}`);
  }
  const allOk = rows.every((r) => String(r.COLUMN_TYPE).toLowerCase().includes("longtext"));
  console.log(allOk ? "\n✓ 모든 컬럼이 LONGTEXT 입니다. 첨부 저장이 정상 동작합니다." : "\n✗ 아직 TEXT 입니다. 'node scripts/setup-partner-longtext.mjs' 를 먼저 실행하세요.");
} catch (e) {
  console.error("오류:", e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
