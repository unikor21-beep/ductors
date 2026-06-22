// users 테이블에 유선전화(landline) 컬럼 추가
// 실행: node scripts/setup-landline.mjs
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

try {
  await conn.execute('ALTER TABLE users ADD COLUMN landline VARCHAR(20) AFTER phone');
  console.log('✅ users.landline 컬럼 추가');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') console.log('(이미 존재) users.landline');
  else console.error('❌', e.message);
}

await conn.end();
console.log('\n🎉 완료!');
