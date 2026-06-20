-- ============================================================
-- 덕터스(Ductors) 카테고리 초기 데이터 등록
-- ============================================================

-- 대분류 4개
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive) VALUES
  ('식당', NULL, NULL, '식당 음식점 환기 및 주방 닥트 시공', 1, true),
  ('가정', NULL, NULL, '가정용 환기 및 욕실 주방 닥트 시공', 2, true),
  ('공장', NULL, NULL, '공장 산업시설 환기 및 국소배기 시공', 3, true),
  ('상업', NULL, NULL, '상업시설 환기 및 닥트 시공', 4, true);

-- 식당 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '후드공사', id, NULL, '식당 주방 후드 및 배기 닥트 시공', 1, true
FROM categories WHERE name = '식당' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '주방공사', id, NULL, '식당 주방 전체 환기 시스템 시공', 2, true
FROM categories WHERE name = '식당' AND parentId IS NULL LIMIT 1;

-- 가정 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '욕실환기', id, NULL, '욕실 환풍기 및 닥트 시공', 1, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '주방후드', id, NULL, '가정용 주방 후드 및 닥트 시공', 2, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '전열교환기', id, NULL, '전열교환기 설치 및 닥트 시공', 3, true
FROM categories WHERE name = '가정' AND parentId IS NULL LIMIT 1;

-- 공장 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '환기시공', id, NULL, '공장 전반 환기 시스템 설계 및 시공', 1, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '국소배기', id, NULL, '유해물질 국소배기장치 설치 시공', 2, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '공조시공', id, NULL, '공장 공기조화 시스템 시공', 3, true
FROM categories WHERE name = '공장' AND parentId IS NULL LIMIT 1;

-- 상업 소분류
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive)
SELECT '환기시공', id, NULL, '상업시설 환기 시스템 설계 및 시공', 1, true
FROM categories WHERE name = '상업' AND parentId IS NULL LIMIT 1;

-- 결과 확인
SELECT id, parentId, name, sortOrder, isActive FROM categories ORDER BY COALESCE(parentId, id), parentId IS NULL DESC, sortOrder;
