// 메인페이지 프로모션 배너 테이블 생성
// 실행: node scripts/setup-banners.mjs
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

async function safeExec(sql, label) {
  try {
    await conn.execute(sql);
    console.log(`✅ ${label}`);
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
      console.log(`(이미 존재) ${label}`);
    } else {
      console.error(`❌ ${label}:`, e.message);
    }
  }
}

await safeExec(`
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
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`, 'mainBanners 테이블');

await conn.end();
console.log('\n🎉 배너 테이블 구축 완료!');
