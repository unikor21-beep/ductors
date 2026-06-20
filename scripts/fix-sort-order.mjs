// 카테고리 sortOrder NULL 값 수정 스크립트
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

// 현재 상태 확인
const [rows] = await conn.execute(
  'SELECT id, parentId, name, sortOrder FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC, id'
);

console.log('\n현재 상태:');
rows.forEach(r => console.log(`  [${r.id}] ${r.parentId ? '  └─' : ''} ${r.name} | sortOrder: ${r.sortOrder}`));

// 대분류와 소분류 분리
const parents = rows.filter(r => r.parentId === null);
const children = rows.filter(r => r.parentId !== null);

// 대분류 sortOrder 업데이트 (id 순서 기준)
for (let i = 0; i < parents.length; i++) {
  await conn.execute('UPDATE categories SET sortOrder = ? WHERE id = ?', [i + 1, parents[i].id]);
}

// 소분류 sortOrder 업데이트 (같은 부모 안에서 id 순서 기준)
const parentIds = [...new Set(children.map(c => c.parentId))];
for (const pid of parentIds) {
  const subs = children.filter(c => c.parentId === pid);
  for (let i = 0; i < subs.length; i++) {
    await conn.execute('UPDATE categories SET sortOrder = ? WHERE id = ?', [i + 1, subs[i].id]);
  }
}

// 결과 확인
const [updated] = await conn.execute(
  'SELECT id, parentId, name, sortOrder FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC, sortOrder'
);

console.log('\n수정 후:');
updated.forEach(r => console.log(`  [${r.id}] ${r.parentId ? '  └─' : ''} ${r.name} | sortOrder: ${r.sortOrder}`));
console.log('\nsortOrder 초기화 완료! 이제 위아래 버튼이 정상 작동합니다.');

await conn.end();
