// partners 테이블에 businessLicenseUrl 컬럼 추가
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

try {
  await conn.execute('ALTER TABLE partners ADD COLUMN businessLicenseUrl TEXT AFTER logoUrl');
  console.log('✅ businessLicenseUrl 컬럼 추가 완료');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('이미 존재하는 컬럼입니다 (정상)');
  } else {
    throw e;
  }
}

await conn.end();
console.log('완료!');
