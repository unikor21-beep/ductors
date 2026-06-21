import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공\n');

const [quotes] = await conn.execute("SELECT id, title, type, designatedPartnerId, customerId, createdAt FROM quotes WHERE type='designated' ORDER BY createdAt DESC LIMIT 10");
console.log('=== 지정 견적 목록 ===');
quotes.forEach(q => console.log(`  id=${q.id} "${q.title}" → 지정파트너ID=${q.designatedPartnerId}, 의뢰자=${q.customerId}`));

const [partners] = await conn.execute("SELECT id, userId, companyName, status FROM partners");
console.log('\n=== 파트너 목록 ===');
partners.forEach(p => console.log(`  partnerId=${p.id}, userId=${p.userId}, ${p.companyName}, status=${p.status}`));

await conn.end();
