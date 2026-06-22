// users 테이블에 passwordRemindAt 컬럼 추가 (비밀번호 변경 알림용)
// 기존 회원은 지금부터 90일 뒤 첫 알림이 뜨도록 설정 (즉시 알림 방지)
// 실행: node scripts/setup-password-remind.mjs
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL || "mysql://root:Multi@12345@localhost:3306/ductors";
const conn = await mysql.createConnection(url);
try {
  // 컬럼 존재 여부 확인
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordRemindAt'`
  );
  if (cols.length === 0) {
    console.log("passwordRemindAt 컬럼 추가 중...");
    await conn.query("ALTER TABLE users ADD COLUMN passwordRemindAt TIMESTAMP NULL");
    console.log("✓ 컬럼 추가 완료");
  } else {
    console.log("passwordRemindAt 컬럼이 이미 있습니다.");
  }

  // 로컬 비번 계정 중 값이 비어있는 회원은 90일 뒤로 초기화
  const [r] = await conn.query(
    "UPDATE users SET passwordRemindAt = DATE_ADD(NOW(), INTERVAL 90 DAY) WHERE passwordHash IS NOT NULL AND passwordRemindAt IS NULL"
  );
  console.log(`✓ 기존 회원 ${r.affectedRows}명 알림일 초기화(90일 뒤)`);
  console.log("\n완료되었습니다.");
} catch (e) {
  console.error("오류:", e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
