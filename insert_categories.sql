-- ============================================================
-- 덕터스(Ductors) 카테고리 초기 데이터 등록
-- 실행 방법: MySQL에서 이 파일 통째로 붙여넣기
-- ============================================================

-- 기존 카테고리 데이터 확인 후 중복 방지 (처음 실행 시에만 적용)
-- 이미 데이터가 있으면 아래 INSERT IGNORE가 중복을 건너뜁니다

-- ── 대분류 4개 ──────────────────────────────────────────────
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive) VALUES
  ('식당',  NULL, '🍽️', '식당·음식점 환기 및 주방 닥트 시공', 1, true),
  ('가정',  NULL, '🏠', '가정용 환기 및 욕실·주방 닥트 시공', 2, true),
  ('공장',  NULL, '🏭', '공장·산업시설 환기 및 국소배기 시공', 3, true),
  ('상업',  NULL, '🏢', '상업시설 환기 및 닥트 시공',          4, true);

-- ── 소분류 등록 (대분류 ID를 서브쿼리로 자동 참조) ──────────
-- 식당 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '후드공사', id, '💨', '식당 주방 후드 및 배기 닥트 시공', 1, true
FROM categories WHERE name = '식당' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '주방공사', id, '🔧', '식당 주방 전체 환기 시스템 시공', 2, true
FROM categories WHERE name = '식당' AND parentId IS NULL LIMIT 1;

-- 가정 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '욕실환기', id, '🚿', '욕실 환풍기 및 닥트 시공', 1, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '주방후드', id, '🍳', '가정용 주방 후드 및 닥트 시공', 2, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '전열교환기', id, '🌀', '전열교환기 설치 및 닥트 시공', 3, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

-- 공장 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '환기시공', id, '🏭', '공장 전반 환기 시스템 설계 및 시공', 1, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '국소배기', id, '☁️', '유해물질 국소배기장치 설치 시공', 2, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '공조시공', id, '❄️', '공장 공기조화(공조) 시스템 시공', 3, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

-- 상업 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '환기시공', id, '🏢', '상업시설 환기 시스템 설계 및 시공', 1, true
FROM categories WHERE name = '상업' AND parentId IS NULL LIMIT 1;

-- ── 결과 확인 ─────────────────────────────────────────────
SELECT
  CASE WHEN c.parentId IS NULL THEN c.name ELSE CONCAT('  └─ ', c.name) END AS 카테고리,
  c.id,
  c.parentId AS 부모ID,
  c.sortOrder AS 순서,
  c.isActive AS 활성
FROM categories c
ORDER BY
  COALESCE(c.parentId, c.id),
  c.parentId IS NULL DESC,
  c.sortOrder;
