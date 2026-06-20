// 덕터스 카테고리 초기 데이터 등록 스크립트
// 실행: node scripts/seed-categories.mjs

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ .env 파일에 DATABASE_URL이 없습니다.');
  process.exit(1);
}

// DATABASE_URL 파싱 (mysql://user:pass@host:port/db 형식)
const conn = await mysql.createConnection(url + '?charset=utf8mb4');

console.log('✅ DB 연결 성공');

// ── 대분류 4개 ──────────────────────────────────────────
const parents = [
  { name: '식당', desc: '식당·음식점 환기 및 주방 닥트 시공', order: 1 },
  { name: '가정', desc: '가정용 환기 및 욕실·주방 닥트 시공', order: 2 },
  { name: '공장', desc: '공장·산업시설 환기 및 국소배기 시공', order: 3 },
  { name: '상업', desc: '상업시설 환기 및 닥트 시공',          order: 4 },
];

// ── 소분류 ──────────────────────────────────────────────
const children = {
  '식당': [
    { name: '후드공사',   desc: '식당 주방 후드 및 배기 닥트 시공', order: 1 },
    { name: '주방공사',   desc: '식당 주방 전체 환기 시스템 시공',  order: 2 },
  ],
  '가정': [
    { name: '욕실환기',   desc: '욕실 환풍기 및 닥트 시공',        order: 1 },
    { name: '주방후드',   desc: '가정용 주방 후드 및 닥트 시공',   order: 2 },
    { name: '전열교환기', desc: '전열교환기 설치 및 닥트 시공',    order: 3 },
  ],
  '공장': [
    { name: '환기시공',   desc: '공장 전반 환기 시스템 설계 및 시공', order: 1 },
    { name: '국소배기',   desc: '유해물질 국소배기장치 설치 시공',    order: 2 },
    { name: '공조시공',   desc: '공장 공기조화(공조) 시스템 시공',   order: 3 },
  ],
  '상업': [
    { name: '환기시공',   desc: '상업시설 환기 시스템 설계 및 시공', order: 1 },
  ],
};

// ── 실행 ────────────────────────────────────────────────
try {
  // 기존 데이터 확인
  const [existing] = await conn.execute('SELECT COUNT(*) as cnt FROM categories');
  const count = existing[0].cnt;
  
  if (count > 0) {
    console.log(`\n⚠️  이미 카테고리가 ${count}개 있습니다.`);
    console.log('중복 등록을 막기 위해 기존 데이터를 확인합니다...\n');
    const [rows] = await conn.execute('SELECT id, parentId, name FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC');
    rows.forEach(r => console.log(r.parentId ? `  └─ [${r.id}] ${r.name}` : `[${r.id}] ${r.name}`));
    console.log('\n이미 등록되어 있으면 종료합니다. 재등록이 필요하면 DB에서 categories 테이블을 비운 후 다시 실행하세요.');
    await conn.end();
    process.exit(0);
  }

  // 대분류 등록
  const parentIds = {};
  for (const p of parents) {
    const [result] = await conn.execute(
      'INSERT INTO categories (name, parentId, description, sortOrder, isActive) VALUES (?, NULL, ?, ?, true)',
      [p.name, p.desc, p.order]
    );
    parentIds[p.name] = result.insertId;
    console.log(`✅ 대분류 등록: ${p.name} (id: ${result.insertId})`);
  }

  // 소분류 등록
  for (const [parentName, subs] of Object.entries(children)) {
    const parentId = parentIds[parentName];
    for (const s of subs) {
      const [result] = await conn.execute(
        'INSERT INTO categories (name, parentId, description, sortOrder, isActive) VALUES (?, ?, ?, ?, true)',
        [s.name, parentId, s.desc, s.order]
      );
      console.log(`  ✅ 소분류 등록: ${parentName} > ${s.name} (id: ${result.insertId})`);
    }
  }

  // 결과 확인
  console.log('\n──────────────── 등록 완료 ────────────────');
  const [rows] = await conn.execute(
    'SELECT id, parentId, name, sortOrder FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC, sortOrder'
  );
  rows.forEach(r => console.log(r.parentId ? `  └─ [${r.id}] ${r.name}` : `[${r.id}] ${r.name}`));
  console.log('────────────────────────────────────────────\n');
  console.log('🎉 카테고리 등록이 모두 완료되었습니다!');

} catch (err) {
  console.error('❌ 오류 발생:', err.message);
} finally {
  await conn.end();
}
