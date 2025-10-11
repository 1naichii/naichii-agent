---
description: 'Advanced SQL techniques - CTEs, window functions, JSON, full-text search, partitioning'
applyTo: '**/*.sql'
---

# SQL Advanced Techniques

**Related**: [Main Index](./sql.instructions.md)

---

## 1. Common Table Expressions (CTEs)

### 1.1 Basic CTE

```sql
-- ✅ CORRECT - Simple CTE for readability
WITH active_users AS (
    SELECT 
        id,
        user_name,
        email_address
    FROM user
    WHERE status = 'active'
        AND created_at >= '2024-01-01'
)
SELECT 
    au.id,
    au.user_name,
    COUNT(o.id) AS order_count
FROM active_users au
LEFT JOIN order o ON o.user_id = au.id
GROUP BY au.id, au.user_name
ORDER BY order_count DESC;
```

### 1.2 Multiple CTEs

```sql
-- ✅ CORRECT - Chain multiple CTEs
WITH 
-- CTE 1: Get active users
active_users AS (
    SELECT id, user_name, email_address
    FROM user
    WHERE status = 'active'
),
-- CTE 2: Calculate user orders
user_orders AS (
    SELECT 
        u.id,
        u.user_name,
        COUNT(o.id) AS order_count,
        SUM(o.total_amount) AS total_spent
    FROM active_users u
    LEFT JOIN order o ON o.user_id = u.id
        AND o.status = 'completed'
    GROUP BY u.id, u.user_name
),
-- CTE 3: Categorize users
user_tiers AS (
    SELECT 
        id,
        user_name,
        order_count,
        total_spent,
        CASE
            WHEN total_spent >= 10000 THEN 'Platinum'
            WHEN total_spent >= 5000 THEN 'Gold'
            WHEN total_spent >= 1000 THEN 'Silver'
            ELSE 'Bronze'
        END AS tier
    FROM user_orders
)
SELECT * FROM user_tiers
WHERE tier IN ('Gold', 'Platinum')
ORDER BY total_spent DESC;
```

### 1.3 Recursive CTE

**Use for**: Hierarchical data (org charts, categories, bill of materials)

```sql
-- ✅ CORRECT - Recursive CTE for organization hierarchy
WITH RECURSIVE org_hierarchy AS (
    -- Anchor: Start with CEO (no manager)
    SELECT 
        id,
        employee_name,
        manager_id,
        1 AS level,
        CAST(employee_name AS CHAR(500)) AS path
    FROM employee
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: Get employees reporting to previous level
    SELECT 
        e.id,
        e.employee_name,
        e.manager_id,
        oh.level + 1,
        CONCAT(oh.path, ' > ', e.employee_name)
    FROM employee e
    INNER JOIN org_hierarchy oh ON oh.id = e.manager_id
    WHERE oh.level < 10  -- Prevent infinite recursion
)
SELECT 
    level,
    REPEAT('  ', level - 1) AS indent,
    employee_name,
    path
FROM org_hierarchy
ORDER BY path;

/*
Result:
level | indent | employee_name | path
------|--------|---------------|------------------
1     |        | CEO           | CEO
2     |        | VP Sales      | CEO > VP Sales
3     |        | Sales Mgr     | CEO > VP Sales > Sales Mgr
2     |        | VP Eng        | CEO > VP Eng
*/
```

```sql
-- ✅ CORRECT - Category tree with depth
WITH RECURSIVE category_tree AS (
    -- Root categories
    SELECT 
        id,
        category_name,
        parent_category_id,
        0 AS depth,
        CAST(id AS CHAR(255)) AS path
    FROM product_category
    WHERE parent_category_id IS NULL
    
    UNION ALL
    
    -- Child categories
    SELECT 
        c.id,
        c.category_name,
        c.parent_category_id,
        ct.depth + 1,
        CONCAT(ct.path, '/', c.id)
    FROM product_category c
    INNER JOIN category_tree ct ON ct.id = c.parent_category_id
    WHERE ct.depth < 5  -- Limit depth
)
SELECT 
    id,
    CONCAT(REPEAT('--', depth), ' ', category_name) AS category_display,
    depth,
    path
FROM category_tree
ORDER BY path;
```

---

## 2. Window Functions

### 2.1 Ranking Functions

```sql
-- ✅ CORRECT - ROW_NUMBER, RANK, DENSE_RANK
SELECT 
    user_name,
    total_spent,
    -- ROW_NUMBER: 1, 2, 3, 4, 5 (unique, even for ties)
    ROW_NUMBER() OVER (ORDER BY total_spent DESC) AS row_num,
    
    -- RANK: 1, 2, 2, 4, 5 (skips numbers after ties)
    RANK() OVER (ORDER BY total_spent DESC) AS rank,
    
    -- DENSE_RANK: 1, 2, 2, 3, 4 (no gaps after ties)
    DENSE_RANK() OVER (ORDER BY total_spent DESC) AS dense_rank
FROM (
    SELECT 
        u.user_name,
        SUM(o.total_amount) AS total_spent
    FROM user u
    INNER JOIN order o ON o.user_id = u.id
    GROUP BY u.id, u.user_name
) user_totals;
```

### 2.2 PARTITION BY

```sql
-- ✅ CORRECT - Ranking within groups
SELECT 
    category_name,
    product_name,
    price,
    -- Rank products within each category
    RANK() OVER (
        PARTITION BY category_id 
        ORDER BY price DESC
    ) AS price_rank_in_category,
    
    -- Average price in category
    AVG(price) OVER (
        PARTITION BY category_id
    ) AS avg_category_price,
    
    -- Total products in category
    COUNT(*) OVER (
        PARTITION BY category_id
    ) AS products_in_category
FROM product p
INNER JOIN product_category c ON c.id = p.category_id
ORDER BY category_name, price_rank_in_category;
```

### 2.3 Running Totals and Moving Averages

```sql
-- ✅ CORRECT - Running total
SELECT 
    order_date,
    daily_revenue,
    -- Running total (cumulative sum)
    SUM(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    
    -- 7-day moving average
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day,
    
    -- Previous day comparison
    LAG(daily_revenue, 1) OVER (ORDER BY order_date) AS prev_day_revenue,
    
    -- Percent change from previous day
    CASE 
        WHEN LAG(daily_revenue, 1) OVER (ORDER BY order_date) IS NOT NULL 
        THEN ((daily_revenue - LAG(daily_revenue, 1) OVER (ORDER BY order_date)) 
              / LAG(daily_revenue, 1) OVER (ORDER BY order_date) * 100)
    END AS pct_change
FROM (
    SELECT 
        DATE(created_at) AS order_date,
        SUM(total_amount) AS daily_revenue
    FROM order
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
) daily_sales
ORDER BY order_date;
```

### 2.4 LAG and LEAD Functions

```sql
-- ✅ CORRECT - Compare with previous/next rows
SELECT 
    user_id,
    order_date,
    total_amount,
    
    -- Previous order date
    LAG(order_date, 1) OVER (
        PARTITION BY user_id 
        ORDER BY order_date
    ) AS prev_order_date,
    
    -- Days since last order
    DATEDIFF(
        order_date,
        LAG(order_date, 1) OVER (PARTITION BY user_id ORDER BY order_date)
    ) AS days_since_last_order,
    
    -- Next order amount
    LEAD(total_amount, 1) OVER (
        PARTITION BY user_id 
        ORDER BY order_date
    ) AS next_order_amount
FROM order
WHERE user_id = 123
ORDER BY order_date;
```

### 2.5 NTILE (Distribution into Buckets)

```sql
-- ✅ CORRECT - Divide into quartiles
SELECT 
    user_name,
    total_spent,
    -- Divide into 4 equal groups (quartiles)
    NTILE(4) OVER (ORDER BY total_spent DESC) AS quartile,
    
    -- Divide into 10 groups (deciles)
    NTILE(10) OVER (ORDER BY total_spent DESC) AS decile
FROM (
    SELECT 
        u.user_name,
        SUM(o.total_amount) AS total_spent
    FROM user u
    INNER JOIN order o ON o.user_id = u.id
    GROUP BY u.id, u.user_name
) user_totals
ORDER BY total_spent DESC;
```

---

## 3. JSON Operations

### 3.1 Storing JSON Data

```sql
-- ✅ CORRECT - JSON column for semi-structured data
CREATE TABLE user_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    preferences JSON,  -- Store user preferences as JSON
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_profile_user (user_id)
);

-- Insert JSON data
INSERT INTO user_profile (user_id, preferences, metadata)
VALUES (
    123,
    JSON_OBJECT(
        'theme', 'dark',
        'language', 'en',
        'notifications', JSON_OBJECT(
            'email', true,
            'sms', false,
            'push', true
        )
    ),
    JSON_OBJECT(
        'last_login_ip', '192.168.1.1',
        'login_count', 42,
        'tags', JSON_ARRAY('premium', 'verified')
    )
);
```

### 3.2 Querying JSON Data

```sql
-- ✅ CORRECT - Extract JSON values
SELECT 
    user_id,
    -- Extract simple value
    JSON_UNQUOTE(JSON_EXTRACT(preferences, '$.theme')) AS theme,
    -- Shorthand: ->
    preferences->'$.language' AS language,
    -- Shorthand (unquoted): ->>
    preferences->>'$.language' AS language_unquoted,
    
    -- Extract nested value
    JSON_EXTRACT(preferences, '$.notifications.email') AS email_notif,
    
    -- Extract array element
    JSON_EXTRACT(metadata, '$.tags[0]') AS first_tag
FROM user_profile;

-- ✅ CORRECT - Filter by JSON value
SELECT *
FROM user_profile
WHERE JSON_EXTRACT(preferences, '$.theme') = 'dark'
    AND JSON_EXTRACT(preferences, '$.notifications.email') = true;

-- ✅ CORRECT - Check if JSON key exists
SELECT *
FROM user_profile
WHERE JSON_CONTAINS_PATH(preferences, 'one', '$.notifications.sms');
```

### 3.3 Updating JSON Data

```sql
-- ✅ CORRECT - Update JSON field
UPDATE user_profile
SET preferences = JSON_SET(
    preferences,
    '$.theme', 'light',  -- Update existing key
    '$.timezone', 'UTC'  -- Add new key
)
WHERE user_id = 123;

-- ✅ CORRECT - Update nested value
UPDATE user_profile
SET preferences = JSON_SET(
    preferences,
    '$.notifications.email', false
)
WHERE user_id = 123;

-- ✅ CORRECT - Remove JSON key
UPDATE user_profile
SET preferences = JSON_REMOVE(preferences, '$.timezone')
WHERE user_id = 123;

-- ✅ CORRECT - Append to JSON array
UPDATE user_profile
SET metadata = JSON_ARRAY_APPEND(metadata, '$.tags', 'new_tag')
WHERE user_id = 123;
```

### 3.4 JSON Indexes (MySQL 5.7+)

```sql
-- ✅ CORRECT - Generated column for JSON indexing
ALTER TABLE user_profile
ADD COLUMN theme VARCHAR(20) 
    AS (JSON_UNQUOTE(JSON_EXTRACT(preferences, '$.theme'))) STORED,
ADD INDEX idx_user_profile_theme (theme);

-- Now queries can use index
SELECT * FROM user_profile
WHERE theme = 'dark';  -- Uses index!
```

---

## 4. Full-Text Search

### 4.1 Creating Full-Text Index

```sql
-- ✅ CORRECT - Full-text index on text columns
CREATE TABLE article (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200),
    content TEXT,
    author VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FULLTEXT INDEX idx_article_search (title, content)
) ENGINE=InnoDB;
```

### 4.2 Natural Language Search

```sql
-- ✅ CORRECT - Full-text search query
SELECT 
    id,
    title,
    -- Relevance score
    MATCH(title, content) AGAINST('database optimization' IN NATURAL LANGUAGE MODE) AS relevance
FROM article
WHERE MATCH(title, content) AGAINST('database optimization' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC
LIMIT 20;
```

### 4.3 Boolean Search

```sql
-- ✅ CORRECT - Boolean full-text search with operators
SELECT id, title
FROM article
WHERE MATCH(title, content) AGAINST(
    '+database -mysql +optimization' 
    IN BOOLEAN MODE
)
-- Operators:
-- + : Must include word
-- - : Must exclude word
-- * : Wildcard (mysql*)
-- "" : Exact phrase ("full text search")
-- () : Grouping
ORDER BY created_at DESC;

-- Example: Must have "database", must not have "mysql", should have "optimization"
SELECT id, title
FROM article
WHERE MATCH(title, content) AGAINST(
    '+"database" -mysql optimization*' 
    IN BOOLEAN MODE
);
```

### 4.4 Full-Text Search with Minimum Word Length

```sql
-- ⚠️ NOTE: MySQL full-text search ignores words < 3 characters by default
-- To change, edit my.cnf:
-- [mysqld]
-- ft_min_word_len=2
-- Then rebuild indexes: REPAIR TABLE article QUICK;

-- ✅ CORRECT - Search with relevance threshold
SELECT 
    id,
    title,
    MATCH(title, content) AGAINST('SQL optimization tips') AS score
FROM article
WHERE MATCH(title, content) AGAINST('SQL optimization tips')
HAVING score > 0.5  -- Relevance threshold
ORDER BY score DESC;
```

---

## 5. Table Partitioning

### 5.1 Range Partitioning (by Date)

```sql
-- ✅ CORRECT - Partition by year for time-series data
CREATE TABLE order_history (
    id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    
    INDEX idx_order_history_user (user_id),
    INDEX idx_order_history_date (order_date)
)
PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p_2022 VALUES LESS THAN (2023),
    PARTITION p_2023 VALUES LESS THAN (2024),
    PARTITION p_2024 VALUES LESS THAN (2025),
    PARTITION p_2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Query benefits from partition pruning
SELECT * FROM order_history
WHERE order_date >= '2024-01-01'
    AND order_date < '2025-01-01';
-- Only scans p_2024 partition!
```

### 5.2 List Partitioning

```sql
-- ✅ CORRECT - Partition by discrete values
CREATE TABLE user_regional (
    id INT PRIMARY KEY,
    user_name VARCHAR(100),
    region VARCHAR(50),
    email_address VARCHAR(255)
)
PARTITION BY LIST COLUMNS(region) (
    PARTITION p_north_america VALUES IN ('US', 'CA', 'MX'),
    PARTITION p_europe VALUES IN ('UK', 'DE', 'FR', 'ES'),
    PARTITION p_asia VALUES IN ('CN', 'JP', 'IN', 'SG'),
    PARTITION p_other VALUES IN (DEFAULT)
);
```

### 5.3 Hash Partitioning

```sql
-- ✅ CORRECT - Even distribution by hash
CREATE TABLE user_distributed (
    id INT PRIMARY KEY,
    user_name VARCHAR(100),
    email_address VARCHAR(255)
)
PARTITION BY HASH(id)
PARTITIONS 8;  -- 8 partitions for even distribution
```

### 5.4 Managing Partitions

```sql
-- Add new partition (for range partitioning)
ALTER TABLE order_history
ADD PARTITION (PARTITION p_2026 VALUES LESS THAN (2027));

-- Drop old partition (delete data)
ALTER TABLE order_history
DROP PARTITION p_2022;

-- Archive and drop
-- Step 1: Archive
CREATE TABLE order_archive_2022 LIKE order_history;
ALTER TABLE order_archive_2022 REMOVE PARTITIONING;
INSERT INTO order_archive_2022 SELECT * FROM order_history PARTITION (p_2022);

-- Step 2: Drop partition
ALTER TABLE order_history DROP PARTITION p_2022;
```

---

## 6. Pivot and Unpivot

### 6.1 PIVOT (Rows to Columns)

```sql
-- ✅ CORRECT - Pivot order counts by month
SELECT 
    user_id,
    user_name,
    SUM(CASE WHEN MONTH(order_date) = 1 THEN 1 ELSE 0 END) AS Jan,
    SUM(CASE WHEN MONTH(order_date) = 2 THEN 1 ELSE 0 END) AS Feb,
    SUM(CASE WHEN MONTH(order_date) = 3 THEN 1 ELSE 0 END) AS Mar,
    SUM(CASE WHEN MONTH(order_date) = 4 THEN 1 ELSE 0 END) AS Apr,
    SUM(CASE WHEN MONTH(order_date) = 5 THEN 1 ELSE 0 END) AS May,
    SUM(CASE WHEN MONTH(order_date) = 6 THEN 1 ELSE 0 END) AS Jun
FROM (
    SELECT 
        u.id AS user_id,
        u.user_name,
        o.created_at AS order_date
    FROM user u
    LEFT JOIN order o ON o.user_id = u.id
        AND YEAR(o.created_at) = 2024
) monthly_data
GROUP BY user_id, user_name;
```

### 6.2 UNPIVOT (Columns to Rows)

```sql
-- ✅ CORRECT - Unpivot sales data
-- Source table: sales (year, q1, q2, q3, q4)
-- Target: sales_unpivot (year, quarter, amount)

SELECT year, 'Q1' AS quarter, q1 AS amount FROM sales
UNION ALL
SELECT year, 'Q2' AS quarter, q2 AS amount FROM sales
UNION ALL
SELECT year, 'Q3' AS quarter, q3 AS amount FROM sales
UNION ALL
SELECT year, 'Q4' AS quarter, q4 AS amount FROM sales
ORDER BY year, quarter;
```

---

## 7. Advanced Aggregation

### 7.1 ROLLUP (Subtotals and Grand Total)

```sql
-- ✅ CORRECT - Sales report with subtotals
SELECT 
    COALESCE(category_name, 'TOTAL') AS category,
    COALESCE(product_name, 'Subtotal') AS product,
    SUM(quantity) AS total_quantity,
    SUM(total_amount) AS total_amount
FROM order_item oi
INNER JOIN product p ON p.id = oi.product_id
INNER JOIN product_category c ON c.id = p.category_id
GROUP BY category_name, product_name WITH ROLLUP;

/*
Result:
category    | product       | total_quantity | total_amount
------------|---------------|----------------|-------------
Electronics | Laptop        | 100            | 50000
Electronics | Phone         | 200            | 40000
Electronics | Subtotal      | 300            | 90000
Furniture   | Chair         | 150            | 15000
Furniture   | Desk          | 50             | 10000
Furniture   | Subtotal      | 200            | 25000
TOTAL       | Subtotal      | 500            | 115000
*/
```

### 7.2 GROUPING SETS

```sql
-- PostgreSQL only
SELECT 
    region,
    product_category,
    SUM(sales_amount) AS total_sales
FROM sales
GROUP BY GROUPING SETS (
    (region, product_category),  -- Group by both
    (region),                     -- Group by region only
    (product_category),           -- Group by category only
    ()                            -- Grand total
)
ORDER BY region, product_category;
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related**: [Main Index](./sql.instructions.md) | [Optimization](./sql-optimization.instructions.md)
