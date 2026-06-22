// 스키마에는 있으나 DB에 누락된 테이블 생성 (CREATE TABLE IF NOT EXISTS)
// - signupBonusCampaigns: 신규가입 보너스 캠페인 (파트너 승인 시 에러 원인)
// - mainBanners: 메인 배너 (배너 관리 탭)
// 실행: node scripts/setup-missing-tables.mjs
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL || "mysql://root:Multi@12345@localhost:3306/ductors";
const conn = await mysql.createConnection(url);
try {
  console.log("signupBonusCampaigns 테이블 확인/생성...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS signupBonusCampaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      bonusAmount INT NOT NULL,
      validDays INT NOT NULL,
      startsAt TIMESTAMP NOT NULL,
      endsAt TIMESTAMP NOT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      grantedCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ signupBonusCampaigns 완료");

  console.log("mainBanners 테이블 확인/생성...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS mainBanners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imageUrl TEXT NOT NULL,
      linkUrl VARCHAR(500),
      buttonText VARCHAR(100),
      buttonPosition VARCHAR(2) NOT NULL DEFAULT 'bc',
      sortOrder INT NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      startsAt TIMESTAMP NULL,
      endsAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ mainBanners 완료");

  console.log("\n완료되었습니다. 이제 파트너 승인·배너 관리에서 오류가 사라집니다.");
} catch (e) {
  console.error("오류:", e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
