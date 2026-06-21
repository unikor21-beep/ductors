SET NAMES utf8mb4;
INSERT INTO categories (name, parentId, icon, description, sortOrder, isActive) VALUES ('restaurant', NULL, NULL, 'restaurant', 1, true),('home', NULL, NULL, 'home', 2, true),('factory', NULL, NULL, 'factory', 3, true),('commercial', NULL, NULL, 'commercial', 4, true);
SELECT id, name FROM categories WHERE parentId IS NULL;
