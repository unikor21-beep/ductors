// 지갑 시스템 DB 테이블 및 컬럼 추가
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
    if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`(이미 존재) ${label}`);
    } else {
      console.error(`❌ ${label}:`, e.message);
    }
  }
}

// 1. partners 테이블에 잔액 컬럼 추가
await safeExec(
  'ALTER TABLE partners ADD COLUMN tokenBalance INT NOT NULL DEFAULT 0 AFTER viewCredits',
  'partners.tokenBalance 컬럼'
);
await safeExec(
  'ALTER TABLE partners ADD COLUMN pointBalance INT NOT NULL DEFAULT 0 AFTER tokenBalance',
  'partners.pointBalance 컬럼'
);

// 2. 거래내역 테이블
await safeExec(`
  CREATE TABLE walletTransactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partnerId INT NOT NULL,
    currency ENUM('token','point') NOT NULL,
    type ENUM('charge','deduct','expire','refund') NOT NULL,
    amount INT NOT NULL,
    balanceAfter INT NOT NULL,
    description VARCHAR(300),
    relatedQuoteId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partner (partnerId)
  )
`, 'walletTransactions 테이블');

// 3. 포인트 배치 테이블
await safeExec(`
  CREATE TABLE pointBatches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partnerId INT NOT NULL,
    amount INT NOT NULL,
    remaining INT NOT NULL,
    reason VARCHAR(300),
    expiresAt TIMESTAMP NOT NULL,
    isExpired BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_partner (partnerId)
  )
`, 'pointBatches 테이블');

// 4. 지갑 설정 테이블
await safeExec(`
  CREATE TABLE walletSettings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    settingKey VARCHAR(100) NOT NULL UNIQUE,
    settingValue INT NOT NULL,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`, 'walletSettings 테이블');

// 5. 기본 가격 설정값 삽입
async function insertSetting(key, value) {
  try {
    await conn.execute(
      'INSERT INTO walletSettings (settingKey, settingValue) VALUES (?, ?)',
      [key, value]
    );
    console.log(`✅ 기본설정: ${key} = ${value}원`);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') console.log(`(이미 존재) ${key}`);
    else console.error(`❌ ${key}:`, e.message);
  }
}

await insertSetting('designatedViewPrice', 50000);  // 지정 견적 열람가
await insertSetting('publicViewPrice', 10000);       // 공개 견적 열람가
await insertSetting('monthlySubscription', 50000);   // 월 구독료

await conn.end();
console.log('\n🎉 지갑 시스템 DB 구축 완료!');
