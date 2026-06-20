// 덕터스 카테고리 등록 스크립트 (기존 데이터 유지, 없는 것만 추가)
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

// 현재 DB에 있는 카테고리 조회
const [existing] = await conn.execute('SELECT id, parentId, name FROM categories');
const existingNames = new Map(); // "parentId:name" => id
for (const row of existing) {
  const key = `${row.parentId ?? 'null'}:${row.name}`;
  existingNames.set(key, row.id);
}

async function insertIfNotExists(name, parentId, desc, order) {
  const key = `${parentId ?? 'null'}:${name}`;
  if (existingNames.has(key)) {
    console.log(`  (이미 있음) ${name}`);
    return existingNames.get(key);
  }
  const [result] = await conn.execute(
    'INSERT INTO categories (name, parentId, description, sortOrder, isActive) VALUES (?, ?, ?, ?, true)',
    [name, parentId, desc, order]
  );
  existingNames.set(key, result.insertId);
  console.log(`  ✅ 등록: ${name} (id: ${result.insertId})`);
  return result.insertId;
}

// 대분류
console.log('\n[ 대분류 ]');
const idSikdang  = await insertIfNotExists('식당', null, '식당 음식점 환기 및 주방 닥트 시공', 1);
const idGajeong  = await insertIfNotExists('가정', null, '가정용 환기 및 욕실 주방 닥트 시공', 2);
const idGongjang = await insertIfNotExists('공장', null, '공장 산업시설 환기 및 국소배기 시공', 3);
const idSangeop  = await insertIfNotExists('상업', null, '상업시설 환기 및 닥트 시공', 4);

// 소분류
console.log('\n[ 소분류 - 식당 ]');
await insertIfNotExists('후드공사', idSikdang, '식당 주방 후드 및 배기 닥트 시공', 1);
await insertIfNotExists('주방공사', idSikdang, '식당 주방 전체 환기 시스템 시공', 2);

console.log('\n[ 소분류 - 가정 ]');
await insertIfNotExists('욕실환기',   idGajeong, '욕실 환풍기 및 닥트 시공', 1);
await insertIfNotExists('주방후드',   idGajeong, '가정용 주방 후드 및 닥트 시공', 2);
await insertIfNotExists('전열교환기', idGajeong, '전열교환기 설치 및 닥트 시공', 3);

console.log('\n[ 소분류 - 공장 ]');
await insertIfNotExists('환기시공', idGongjang, '공장 전반 환기 시스템 설계 및 시공', 1);
await insertIfNotExists('국소배기', idGongjang, '유해물질 국소배기장치 설치 시공', 2);
await insertIfNotExists('공조시공', idGongjang, '공장 공기조화 시스템 시공', 3);

console.log('\n[ 소분류 - 상업 ]');
await insertIfNotExists('환기시공', idSangeop, '상업시설 환기 시스템 설계 및 시공', 1);

// 최종 확인
console.log('\n======== 최종 카테고리 목록 ========');
const [rows] = await conn.execute(
  'SELECT id, parentId, name, sortOrder FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC, sortOrder'
);
rows.forEach(r => console.log(r.parentId ? `  └─ [${r.id}] ${r.name}` : `[${r.id}] ${r.name}`));
console.log('=====================================');
console.log('완료!');

await conn.end();
