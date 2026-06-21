// 견적 INSERT 실패 원인 진단
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공\n');

// 1. customerId=697 사용자 존재 확인
const [users] = await conn.execute('SELECT id, openId, name, role, deletedAt FROM users WHERE id = 697');
console.log('=== 사용자 697 ===');
console.log(users.length ? users[0] : '❌ 사용자 697이 존재하지 않음');

// 2. categoryId=8 존재 확인
const [cats] = await conn.execute('SELECT id, name, parentId FROM categories WHERE id = 8');
console.log('\n=== 카테고리 8 ===');
console.log(cats.length ? cats[0] : '❌ 카테고리 8이 존재하지 않음');

// 3. quotes 테이블 외래키 제약 확인
const [fks] = await conn.execute(`
  SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_NAME = 'quotes' AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_SCHEMA = DATABASE()
`);
console.log('\n=== quotes 외래키 제약 ===');
console.log(fks.length ? fks : '외래키 제약 없음');

// 4. quotes 테이블 실제 컬럼 구조
const [cols] = await conn.execute(`
  SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_DEFAULT
  FROM information_schema.COLUMNS
  WHERE TABLE_NAME = 'quotes' AND TABLE_SCHEMA = DATABASE()
  ORDER BY ORDINAL_POSITION
`);
console.log('\n=== quotes 컬럼 구조 ===');
cols.forEach(c => console.log(`  ${c.COLUMN_NAME}: ${c.COLUMN_TYPE} ${c.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${c.COLUMN_DEFAULT ? 'default=' + c.COLUMN_DEFAULT : ''}`));

await conn.end();
