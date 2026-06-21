import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공\n');

const [users] = await conn.execute("SELECT id, openId, name, role, username, loginMethod FROM users WHERE role='partner' OR openId LIKE '%kakao%' OR loginMethod='local' LIMIT 15");
console.log('=== 파트너/카카오/자체가입 계정 ===');
users.forEach(u => console.log(`  id=${u.id}, role=${u.role}, openId=${u.openId}, name=${u.name}, username=${u.username || '-'}, login=${u.loginMethod || '-'}`));

const [partners] = await conn.execute("SELECT id, userId, companyName, status FROM partners LIMIT 10");
console.log('\n=== 파트너 테이블 ===');
partners.forEach(p => console.log(`  partnerId=${p.id}, userId=${p.userId}, company=${p.companyName}, status=${p.status}`));

await conn.end();
