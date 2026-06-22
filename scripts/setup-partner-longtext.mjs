// partners.logoUrl / businessLicenseUrl 컬럼을 TEXT → LONGTEXT 로 확장
// (사업자등록증·로고를 base64로 저장할 때 TEXT(64KB) 한계로 저장 실패하는 문제 해결)
// 실행: node scripts/setup-partner-longtext.mjs
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL || "mysql://root:Multi@12345@localhost:3306/ductors";

const conn = await mysql.createConnection(url);
try {
  console.log("partners.logoUrl → LONGTEXT 변경 중...");
  await conn.query("ALTER TABLE partners MODIFY COLUMN logoUrl LONGTEXT NULL");
  console.log("✓ logoUrl 완료");

  console.log("partners.businessLicenseUrl → LONGTEXT 변경 중...");
  await conn.query("ALTER TABLE partners MODIFY COLUMN businessLicenseUrl LONGTEXT NULL");
  console.log("✓ businessLicenseUrl 완료");

  console.log("\n모든 변경이 완료되었습니다. 이제 사업자등록증·로고 첨부가 정상 저장됩니다.");
} catch (err) {
  console.error("오류:", err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
