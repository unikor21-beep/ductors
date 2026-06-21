// .env 파일에 국세청 사업자 인증 API 키를 추가하는 스크립트
// 실행: node scripts/setup-nts-key.mjs
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env');

// ⚠️ 여기에 공공데이터포털에서 발급받은 인증키를 넣으세요
const NTS_API_KEY = '704359486ede4c8267ab2af11082050c3ddaecca3cf0d1b68558bbe0b5e307a3';

let env = '';
if (fs.existsSync(envPath)) {
  env = fs.readFileSync(envPath, 'utf-8');
}

if (env.includes('NTS_API_KEY=')) {
  // 기존 키 교체
  env = env.replace(/NTS_API_KEY=.*/g, `NTS_API_KEY=${NTS_API_KEY}`);
  console.log('✅ 기존 NTS_API_KEY를 새 값으로 교체했습니다.');
} else {
  // 새로 추가
  if (env && !env.endsWith('\n')) env += '\n';
  env += `NTS_API_KEY=${NTS_API_KEY}\n`;
  console.log('✅ .env에 NTS_API_KEY를 추가했습니다.');
}

fs.writeFileSync(envPath, env);
console.log('완료! 서버를 재시작(pnpm dev)하면 사업자 인증이 작동합니다.');
