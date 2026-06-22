// [진단 전용 · 읽기만 함] 견적 목록이 비는 원인 확정
// formData/attachments(json) 깨짐 + 컬럼 타입/크기 점검
// 실행: node scripts/diagnose-quotes-json.mjs
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// rowsAsArray=false, 그리고 json 자동파싱을 끄기 위해 typeCast로 raw 문자열을 받음
const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL + '?charset=utf8mb4',
  typeCast: function (field, next) {
    if (field.type === 'JSON' || field.type === 'BLOB' || field.type === 'STRING' || field.type === 'VAR_STRING') {
      return field.string();
    }
    return next();
  },
});
console.log('DB 연결 성공\n');
const line = (s = '') => console.log(s);
const hr = () => line('────────────────────────────────────────');

// 1) 컬럼 타입/크기
hr(); line('1. quotes 테이블 컬럼 타입 (formData/attachments 가 JSON 인지 TEXT 인지)'); hr();
const [cols] = await conn.query(`SHOW COLUMNS FROM quotes`);
for (const c of cols) {
  if (['formData', 'attachments', 'description', 'address'].includes(c.Field)) {
    line(`   ${c.Field}: ${c.Type} (null허용=${c.Null})`);
  }
}

// 2) 각 견적의 json 값 무결성
hr(); line('2. 견적별 json 무결성 (parse 실패 = 목록 깨짐의 원인)'); hr();
const [rows] = await conn.query(`SELECT id, type, status, customerId, formData, attachments FROM quotes ORDER BY id`);
let broken = [];
for (const r of rows) {
  const checks = [];
  for (const key of ['formData', 'attachments']) {
    const v = r[key];
    if (v === null || v === undefined) { checks.push(`${key}=NULL`); continue; }
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    const len = s.length;
    let ok = true;
    if (typeof v === 'string') {
      try { JSON.parse(v); } catch { ok = false; }
    }
    checks.push(`${key}=${ok ? 'OK' : '❌깨짐'}(len ${len})`);
    if (!ok) broken.push({ id: r.id, key, len, head: s.slice(0, 40), tail: s.slice(-20) });
  }
  line(`   견적 ${r.id} [${r.type}/${r.status}] cust=${r.customerId} → ${checks.join(' , ')}`);
}

// 3) 판정
hr(); line('3. 판정'); hr();
if (broken.length === 0) {
  line('   json 깨진 견적 없음 → 원인은 다른 곳. 서버 터미널 에러를 봐야 함.');
} else {
  line(`   ❌ json 깨진 견적 ${broken.length}건 발견 — 이게 목록이 비는 원인입니다:`);
  for (const b of broken) {
    line(`      견적 ${b.id} / ${b.key} / 길이 ${b.len} / 시작="${b.head}..." / 끝="...${b.tail}"`);
  }
  line('   → 다음 단계에서 이 값을 안전하게 정리(빈 값으로 복구)하면 목록이 다시 보입니다.');
}

await conn.end();
line('\n진단 끝. 위 1~3 출력 전체를 복사해서 보내주세요.');
