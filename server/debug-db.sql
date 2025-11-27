-- Проверка структуры pricing_tiers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'labs' AND table_name = 'pricing_tiers'
ORDER BY ordinal_position;

-- Проверка всех тарифов
SELECT id, cohort_id, name, price, tier_level, is_active
FROM labs.pricing_tiers;

-- Проверка всех потоков
SELECT id, product_id, name, start_date, end_date, is_active
FROM labs.cohorts;

-- Проверка enrollments
SELECT ue.id, ue.user_id, u.username, ue.product_id, ue.cohort_id, ue.pricing_tier_id, ue.status
FROM labs.user_enrollments ue
LEFT JOIN labs.users u ON ue.user_id = u.id
ORDER BY ue.user_id, ue.id;

-- Проверка cohort_members
SELECT cm.cohort_id, cm.user_id, u.username, cm.joined_at, cm.left_at
FROM labs.cohort_members cm
LEFT JOIN labs.users u ON cm.user_id = u.id
ORDER BY cm.cohort_id, cm.user_id;

-- Проверка какие потоки должен видеть пользователь test@test.ru
SELECT DISTINCT c.id, c.name, c.product_id, p.name as product_name
FROM labs.user_enrollments ue
JOIN labs.cohorts c ON ue.cohort_id = c.id
LEFT JOIN labs.products p ON c.product_id = p.id
JOIN labs.users u ON ue.user_id = u.id
WHERE u.email = 'test@test.ru'
  AND ue.status = 'active'
  AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  AND c.is_active = TRUE
ORDER BY c.start_date DESC;
