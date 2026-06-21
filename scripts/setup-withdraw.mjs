// users 테이블에 회원탈퇴(Soft Delete) 컬럼 추가
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
    if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
      console.log(`(이미 존재) ${label}`);
    } else {
      console.error(`❌ ${label}:`, e.message);
    }
  }
}

await safeExec('ALTER TABLE users ADD COLUMN deletedAt TIMESTAMP NULL', 'users.deletedAt 컬럼');
await safeExec('ALTER TABLE users ADD COLUMN deactivatedReason VARCHAR(500) NULL', 'users.deactivatedReason 컬럼');

await conn.end();
console.log('\n🎉 회원탈퇴 DB 구축 완료!');
