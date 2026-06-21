import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');

// 고객1 이메일로 모든 계정 찾기 (중복 가입 가능성)
const [byEmail] = await conn.execute("SELECT id, openId, name, email, role, deletedAt FROM users WHERE email='bill.ju1007@gmail.com' OR name='고객1'");
console.log('=== 고객1 관련 모든 계정 ===');
byEmail.forEach(u => console.log(`  id=${u.id}, role=${u.role}, openId=${u.openId}, email=${u.email}, deleted=${u.deletedAt}`));

// 각 계정이 만든 견적 수
console.log('\n=== 계정별 견적 개수 ===');
for (const u of byEmail) {
  const [q] = await conn.execute("SELECT COUNT(*) as cnt FROM quotes WHERE customerId=?", [u.id]);
  console.log(`  userId=${u.id} → ${q[0].cnt}건`);
}
await conn.end();
