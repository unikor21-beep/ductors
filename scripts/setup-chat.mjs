// 채팅 메시지 테이블 생성
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL + '?charset=utf8mb4');
console.log('DB 연결 성공');

async function safeExec(sql, label) {
  try {
    await conn.execute(sql);
    console.log(`✅ ${label}`);
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`(이미 존재) ${label}`);
    } else {
      console.error(`❌ ${label}:`, e.message);
    }
  }
}

await safeExec(`
  CREATE TABLE chatMessages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quoteId INT NOT NULL,
    partnerId INT NOT NULL,
    senderRole ENUM('customer','partner') NOT NULL,
    senderId INT NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quote_partner (quoteId, partnerId),
    INDEX idx_partner (partnerId)
  )
`, 'chatMessages 테이블');

await conn.end();
console.log('\n🎉 채팅 DB 구축 완료!');
