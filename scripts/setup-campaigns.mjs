// 신규가입 보너스 캠페인 테이블 추가
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

try {
  await conn.execute(`
    CREATE TABLE signupBonusCampaigns (
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
  console.log('✅ signupBonusCampaigns 테이블 생성 완료');
} catch (e) {
  if (e.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('(이미 존재) signupBonusCampaigns 테이블');
  } else {
    console.error('❌', e.message);
  }
}

await conn.end();
console.log('완료!');
