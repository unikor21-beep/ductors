// users 테이블에 자체 로그인 컬럼 추가
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

await safeExec('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER openId', 'users.username 컬럼');
await safeExec('ALTER TABLE users ADD COLUMN passwordHash TEXT AFTER username', 'users.passwordHash 컬럼');
await safeExec('ALTER TABLE users ADD COLUMN securityQuestion VARCHAR(200) AFTER passwordHash', 'users.securityQuestion 컬럼');
await safeExec('ALTER TABLE users ADD COLUMN securityAnswerHash TEXT AFTER securityQuestion', 'users.securityAnswerHash 컬럼');

await conn.end();
console.log('\n🎉 자체 로그인 DB 구축 완료!');
