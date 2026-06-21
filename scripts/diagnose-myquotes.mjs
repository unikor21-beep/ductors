// [진단 전용 · 읽기만 함 · 데이터 변경 없음]
// 고객 마이페이지 "내 견적 요청 0건" 버그 원인 확정용
// 실행: node scripts/diagnose-myquotes.mjs
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공\n');

const line = (s = '') => console.log(s);
const hr = () => line('────────────────────────────────────────');

// 1) customer1 계정 찾기 (username / openId 양쪽으로)
hr();
line('1. customer1 로 보이는 모든 계정 (이름/이메일 중복까지 추적)');
hr();
const [c1rows] = await conn.query(
  `SELECT id, openId, username, name, email, role, deletedAt, loginMethod, createdAt
   FROM users
   WHERE username = 'customer1' OR openId = 'local_customer1' OR openId LIKE '%customer1%'`
);
console.table(c1rows);

// 같은 이메일/이름을 가진 다른 행(=중복 계정) 추적
let dupRows = [];
if (c1rows.length) {
  const emails = [...new Set(c1rows.map(r => r.email).filter(Boolean))];
  const names = [...new Set(c1rows.map(r => r.name).filter(Boolean))];
  if (emails.length || names.length) {
    const [dups] = await conn.query(
      `SELECT id, openId, username, name, email, role, deletedAt, loginMethod
       FROM users
       WHERE (email IN (?) OR name IN (?))`,
      [emails.length ? emails : [''], names.length ? names : ['']]
    );
    dupRows = dups;
    hr();
    line('2. 같은 이메일/이름을 쓰는 모든 행 (중복 계정 = 이게 핵심 단서)');
    hr();
    console.table(dups);
  }
}

// 3) 문제의 견적 4~8번 (실제 customerId 확인)
hr();
line('3. 견적 id 4,5,6,7,8 의 실제 customerId');
hr();
const [quoteRows] = await conn.query(
  `SELECT id, customerId, type, designatedPartnerId, status, createdAt
   FROM quotes WHERE id IN (4,5,6,7,8) ORDER BY id`
);
console.table(quoteRows);

// 4) 그 customerId 들이 각각 누구인지
const custIds = [...new Set(quoteRows.map(q => q.customerId))];
if (custIds.length) {
  hr();
  line('4. 위 견적들의 customerId 가 가리키는 실제 user 행');
  hr();
  const [owners] = await conn.query(
    `SELECT id, openId, username, name, email, role FROM users WHERE id IN (?)`,
    [custIds]
  );
  console.table(owners);
}

// 5) getQuotesByCustomer 와 동일한 조회를 customer1 후보 id 마다 실행
hr();
line('5. 각 customer1 후보 id 로 "내 견적" 쿼리 실제 실행 결과 건수');
hr();
const candidateIds = [...new Set(c1rows.map(r => r.id))];
for (const id of candidateIds) {
  const [cnt] = await conn.query(
    `SELECT COUNT(*) AS n FROM quotes WHERE customerId = ?`, [id]
  );
  line(`   user.id=${id} → 내 견적 ${cnt[0].n}건`);
}

// 판정 도우미
hr();
line('● 판정 가이드');
hr();
line('- 견적 4~8의 customerId 가 customer1 계정 id 와 다르면 → 데이터 불일치(옛 계정 id로 박힘). 원인 확정.');
line('- customer1 행이 2개 이상이면 → 카카오/자체 중복 계정. 위 표의 어느 id가 견적 주인인지 보면 됨.');
line('- 다 일치하는데 0건이면 → 그때 프론트/캐시 문제로 넘어감.');
line('');

await conn.end();
line('진단 끝. 위 1~5 출력 전체를 복사해서 보내주세요.');
