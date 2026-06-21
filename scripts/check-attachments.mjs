// 견적별 사진(attachments) 저장 여부 확인
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공\n');

const [quotes] = await conn.execute("SELECT id, title, attachments, formData FROM quotes ORDER BY createdAt DESC LIMIT 10");
console.log('=== 견적별 사진/추가항목 ===');
quotes.forEach(q => {
  let attachCount = 0;
  let attachType = '없음';
  try {
    const att = typeof q.attachments === 'string' ? JSON.parse(q.attachments) : q.attachments;
    if (Array.isArray(att)) {
      attachCount = att.length;
      if (att.length > 0) {
        attachType = att[0].startsWith('data:image') ? 'base64이미지' : att[0].slice(0, 30);
      }
    }
  } catch (e) { attachType = '파싱오류'; }

  let formKeys = '없음';
  try {
    const fd = typeof q.formData === 'string' ? JSON.parse(q.formData) : q.formData;
    if (fd && Object.keys(fd).length > 0) formKeys = Object.keys(fd).join(', ');
  } catch (e) {}

  console.log(`  id=${q.id} "${q.title}" → 사진 ${attachCount}장(${attachType}), formData: ${formKeys}`);
});

await conn.end();
