---
description: 'SQL performance optimization - Indexing, query tuning, and performance monitoring'
applyTo: '**/*.sql'
---

# SQL Optimization - Performance & Indexing

**Related**: [Main Index](./sql.instructions.md) | [Basics](./sql-basics.instructions.md)

---

## 1. Execution Plan Analysis

### 1.1 When to Analyze
- **ALWAYS** before deploying complex queries to production
- Queries on tables with >100,000 rows
- Queries running longer than target times
- Frequently executed queries (>100 times/day)

### 1.2 How to Analyze

```sql
-- MySQL
EXPLAIN SELECT u.id, u.user_name
FROM user u
WHERE u.status = 'active';

-- MySQL with JSON format (more details)
EXPLAIN FORMAT=JSON
SELECT u.id, u.user_name
FROM user u
WHERE u.status = 'active';

-- PostgreSQL (shows actual execution)
EXPLAIN ANALYZE
SELECT u.id, u.user_name
FROM user u
WHERE u.status = 'active';

-- SQL Server
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT u.id, u.user_name
FROM user u
WHERE u.status = 'active';
```

### 1.3 Key Metrics to Check

**Rows Examined vs Rows Returned**
- ✅ **Good**: Ratio close to 1:1
- ⚠️ **Warning**: Ratio > 10:1
- ❌ **Bad**: Ratio > 100:1

```sql
-- ❌ BAD - Examining 1M rows to return 100
EXPLAIN SELECT * FROM user WHERE status = 'active';
-- type: ALL, rows: 1000000, filtered: 0.01

-- ✅ GOOD - Index on status column
CREATE INDEX idx_user_status ON user(status);
-- type: ref, rows: 100, filtered: 100.00
```

**Index Usage**
- ✅ **type: const** - Primary key or unique index lookup (fastest)
- ✅ **type: ref** - Non-unique index lookup (good)
- ⚠️ **type: range** - Index range scan (acceptable)
- ❌ **type: ALL** - Full table scan (bad for large tables)

**Temporary Tables & Filesort**
- ❌ **Using temporary** - Creates temp table (slow)
- ❌ **Using filesort** - Sorts without index (slow)

```sql
-- ❌ BAD - Filesort on unindexed column
SELECT * FROM user
ORDER BY last_login_date;

-- ✅ GOOD - Add index
CREATE INDEX idx_user_last_login ON user(last_login_date);
```

---

## 2. Advanced Indexing Strategy

### 2.1 Index Types

#### Single Column Index
**Use when**: Filtering by one column

```sql
-- ✅ CORRECT
CREATE INDEX idx_user_email ON user(email_address);
CREATE INDEX idx_order_date ON order(created_at);

-- Query benefits
SELECT * FROM user WHERE email_address = 'john@example.com';
SELECT * FROM order WHERE created_at >= '2024-01-01';
```

#### Composite Index (Multi-Column)
**Use when**: Filtering by multiple columns  
**CRITICAL**: Column order matters! Most selective column first.

```sql
-- ✅ CORRECT - status filtered more, then date
CREATE INDEX idx_order_status_date ON order(status, created_at);

-- Queries that benefit:
-- 1. Both columns
SELECT * FROM order 
WHERE status = 'pending' AND created_at >= '2024-01-01';

-- 2. First column only (leftmost prefix rule)
SELECT * FROM order WHERE status = 'pending';

-- ❌ Second column only does NOT use this index!
SELECT * FROM order WHERE created_at >= '2024-01-01';
-- Need separate index: CREATE INDEX idx_order_date ON order(created_at);
```

**Leftmost Prefix Rule**
```sql
-- Index: (col1, col2, col3)
CREATE INDEX idx_composite ON table(col1, col2, col3);

-- ✅ These queries use the index:
WHERE col1 = 1
WHERE col1 = 1 AND col2 = 2
WHERE col1 = 1 AND col2 = 2 AND col3 = 3
WHERE col1 = 1 AND col3 = 3  -- Uses partial index (col1 only)

-- ❌ These queries DON'T use the index:
WHERE col2 = 2
WHERE col3 = 3
WHERE col2 = 2 AND col3 = 3
```

#### Covering Index (Include Columns)
**Use when**: Avoid table lookups

```sql
-- ✅ CORRECT - Covering index includes all selected columns
CREATE INDEX idx_user_email_covering 
ON user(email_address, user_name, status);

-- This query doesn't need to access the table!
SELECT user_name, status
FROM user
WHERE email_address = 'john@example.com';
-- Extra: Using index (covering index used)
```

#### Partial/Filtered Index
**Use when**: Indexing subset of rows (PostgreSQL, SQL Server)

```sql
-- PostgreSQL
CREATE INDEX idx_user_active 
ON user(created_at) 
WHERE status = 'active';

-- SQL Server
CREATE INDEX idx_user_active 
ON user(created_at)
WHERE status = 'active';

-- Benefits query:
SELECT * FROM user 
WHERE status = 'active' 
    AND created_at >= '2024-01-01';
```

#### Full-Text Index
**Use when**: Text search operations

```sql
-- MySQL
CREATE FULLTEXT INDEX idx_product_search 
ON product(product_name, description);

-- Query usage
SELECT * FROM product
WHERE MATCH(product_name, description) 
AGAINST('laptop computer' IN NATURAL LANGUAGE MODE);

-- ❌ WRONG - LIKE with leading wildcard
SELECT * FROM product 
WHERE description LIKE '%laptop%';  -- Cannot use regular index!
```

### 2.2 Index Selection Rules

**Must Index**:
1. ✅ Primary keys (automatic)
2. ✅ Foreign keys (manual)
3. ✅ Columns in WHERE clauses
4. ✅ Columns in JOIN conditions
5. ✅ Columns in ORDER BY (if frequently used)

**Should Index**:
- Columns with high cardinality (many unique values)
- Columns used in GROUP BY
- Columns in HAVING clauses

**Should NOT Index**:
- ❌ Low cardinality columns (< 5% unique values)
  - Example: `gender` (2 values), `boolean` flags
- ❌ Small tables (< 1,000 rows)
- ❌ Columns with frequent updates
- ❌ Very wide columns (TEXT, BLOB)

```sql
-- ❌ BAD - Low cardinality index
CREATE INDEX idx_user_gender ON user(gender);  -- Only 2-3 values!

-- ✅ BETTER - Composite index if combined with high cardinality
CREATE INDEX idx_user_gender_city ON user(gender, city);
```

### 2.3 Index Maintenance

**Maximum Indexes per Table**: 5-7 indexes
- Too many = slow INSERT/UPDATE/DELETE
- Monitor index usage, drop unused indexes

```sql
-- MySQL - Find unused indexes
SELECT 
    s.table_schema,
    s.table_name,
    s.index_name,
    s.column_name
FROM information_schema.statistics s
LEFT JOIN performance_schema.table_io_waits_summary_by_index_usage i
    ON s.table_schema = i.object_schema
    AND s.table_name = i.object_name
    AND s.index_name = i.index_name
WHERE i.index_name IS NULL
    AND s.table_schema NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY s.table_schema, s.table_name;
```

### 2.4 Index Anti-Patterns

#### Functions on Indexed Columns
```sql
-- ❌ BAD - Function prevents index usage
SELECT * FROM user
WHERE YEAR(created_at) = 2024;

-- ✅ GOOD - Index-friendly
SELECT * FROM user
WHERE created_at >= '2024-01-01' 
    AND created_at < '2025-01-01';
```

```sql
-- ❌ BAD
SELECT * FROM user
WHERE LOWER(email_address) = 'john@example.com';

-- ✅ GOOD - Use case-insensitive collation or generated column
ALTER TABLE user 
MODIFY email_address VARCHAR(255) COLLATE utf8mb4_0900_ai_ci;

SELECT * FROM user
WHERE email_address = 'john@example.com';
```

#### Leading Wildcards in LIKE
```sql
-- ❌ BAD - Cannot use index
SELECT * FROM user
WHERE user_name LIKE '%son';

-- ✅ GOOD - Can use index
SELECT * FROM user
WHERE user_name LIKE 'John%';

-- ✅ BETTER - Full-text index for contains searches
CREATE FULLTEXT INDEX idx_user_name_ft ON user(user_name);
SELECT * FROM user
WHERE MATCH(user_name) AGAINST('son');
```

#### Type Mismatches
```sql
-- ❌ BAD - id is INT, comparing to string
SELECT * FROM user
WHERE id = '123';  -- Implicit conversion prevents index usage!

-- ✅ GOOD - Correct type
SELECT * FROM user
WHERE id = 123;
```

#### OR Conditions Across Different Columns
```sql
-- ❌ BAD - Cannot efficiently use indexes
SELECT * FROM user
WHERE email_address = 'john@example.com'
    OR user_name = 'john';

-- ✅ GOOD - Use UNION
SELECT * FROM user WHERE email_address = 'john@example.com'
UNION
SELECT * FROM user WHERE user_name = 'john';
```

---

## 3. JOIN Optimization

### 3.1 JOIN Order Strategy

**Rule**: Join smaller result sets first

```sql
-- ✅ CORRECT - Filter early, join smaller result
SELECT 
    o.id,
    o.order_number,
    u.user_name
FROM (
    -- Filter orders first (reduces rows)
    SELECT * FROM order
    WHERE created_at >= '2024-01-01'
        AND status = 'completed'
) o
INNER JOIN user u ON u.id = o.user_id;

-- Modern optimizers often handle this, but be aware
```

### 3.2 JOIN Type Performance

**Performance Order** (fastest to slowest):
1. ✅ **INNER JOIN** - Only matching rows
2. ⚠️ **LEFT/RIGHT JOIN** - Includes NULL rows
3. ❌ **CROSS JOIN** - Cartesian product (avoid!)

```sql
-- ✅ FAST - INNER JOIN
SELECT u.user_name, o.order_date
FROM user u
INNER JOIN order o ON o.user_id = u.id;

-- ⚠️ SLOWER - LEFT JOIN (includes users with no orders)
SELECT u.user_name, o.order_date
FROM user u
LEFT JOIN order o ON o.user_id = u.id;

-- ❌ VERY SLOW - Accidental cartesian product
SELECT u.user_name, o.order_date
FROM user u, order o;  -- Missing JOIN condition!
```

### 3.3 JOIN Optimization Checklist

- ✅ Index foreign key columns
- ✅ Index JOIN condition columns
- ✅ Use INNER JOIN when possible
- ✅ Filter early (WHERE before JOIN if possible)
- ✅ Avoid joining on calculated columns
- ✅ Check EXPLAIN plan for table scan

```sql
-- ✅ OPTIMIZED JOIN
SELECT 
    u.id,
    u.user_name,
    o.order_date
FROM user u
INNER JOIN order o ON o.user_id = u.id  -- Indexed FK
WHERE u.status = 'active'  -- Indexed column
    AND o.created_at >= '2024-01-01'  -- Indexed column
ORDER BY o.created_at DESC;  -- Indexed column

-- Required indexes:
-- CREATE INDEX idx_order_user_id ON order(user_id);
-- CREATE INDEX idx_user_status ON user(status);
-- CREATE INDEX idx_order_created ON order(created_at);
```

---

## 4. Subquery vs CTE vs Temporary Tables

### 4.1 Subquery
**Use for**: Simple, one-time filtering

```sql
-- ✅ GOOD USE - Simple scalar subquery
SELECT 
    user_name,
    (SELECT COUNT(*) FROM order o WHERE o.user_id = u.id) AS order_count
FROM user u;

-- ✅ GOOD USE - IN clause with small list
SELECT * FROM user
WHERE id IN (SELECT user_id FROM premium_user);
```

**Limitations**:
- ❌ Cannot be referenced multiple times
- ❌ Re-executed for each row (correlated subquery)
- ❌ Hard to read when nested

### 4.2 CTE (Common Table Expression)
**Use for**: Complex logic, readability, multiple references

```sql
-- ✅ GOOD USE - Complex, readable query
WITH active_users AS (
    SELECT id, user_name
    FROM user
    WHERE status = 'active'
        AND created_at >= '2024-01-01'
),
user_orders AS (
    SELECT 
        u.id,
        u.user_name,
        COUNT(o.id) AS order_count
    FROM active_users u
    LEFT JOIN order o ON o.user_id = u.id
    GROUP BY u.id, u.user_name
)
SELECT *
FROM user_orders
WHERE order_count > 5;
```

**Benefits**:
- ✅ Clean, readable syntax
- ✅ Can reference CTE multiple times
- ✅ Easier to debug

**Limitations**:
- ⚠️ Not materialized (re-executed each time)
- ⚠️ Cannot have indexes

### 4.3 Temporary Tables
**Use for**: Large intermediate results, multi-step processing

```sql
-- ✅ GOOD USE - Large intermediate result set
CREATE TEMPORARY TABLE tmp_active_users (
    id INT PRIMARY KEY,
    user_name VARCHAR(100),
    INDEX idx_tmp_user_name (user_name)
);

INSERT INTO tmp_active_users
SELECT id, user_name
FROM user
WHERE status = 'active'
    AND created_at >= '2024-01-01';

-- Now use with index benefit
SELECT 
    u.id,
    u.user_name,
    COUNT(o.id) AS order_count
FROM tmp_active_users u
LEFT JOIN order o ON o.user_id = u.id
GROUP BY u.id, u.user_name;

-- Cleanup
DROP TEMPORARY TABLE tmp_active_users;
```

**Benefits**:
- ✅ Can be indexed
- ✅ Persistent in session
- ✅ Good for complex multi-step processing

**When to Use**:
- Large result sets (>10,000 rows)
- Referenced multiple times
- Need index on intermediate result

---

## 5. Query Pattern Performance

### 5.1 EXISTS vs IN vs JOIN

#### EXISTS - Best for Existence Checks
```sql
-- ✅ FAST - Stops at first match
SELECT u.user_name
FROM user u
WHERE EXISTS (
    SELECT 1 FROM order o
    WHERE o.user_id = u.id
);
```

#### IN - Good for Small Lists
```sql
-- ✅ GOOD - Small, static list
SELECT * FROM user
WHERE status IN ('active', 'pending', 'trial');

-- ⚠️ SLOWER - Large dynamic list
SELECT * FROM user
WHERE id IN (SELECT user_id FROM large_table);

-- ✅ BETTER - Use JOIN
SELECT DISTINCT u.*
FROM user u
INNER JOIN large_table lt ON lt.user_id = u.id;
```

#### JOIN - Best for Retrieving Related Data
```sql
-- ✅ BEST - When you need related data
SELECT 
    u.user_name,
    o.order_date,
    o.total_amount
FROM user u
INNER JOIN order o ON o.user_id = u.id;
```

### 5.2 UNION vs UNION ALL

```sql
-- ⚠️ SLOWER - UNION (removes duplicates)
SELECT user_name FROM user WHERE status = 'active'
UNION
SELECT user_name FROM user WHERE status = 'pending';

-- ✅ FASTER - UNION ALL (keeps all rows)
SELECT user_name FROM user WHERE status = 'active'
UNION ALL
SELECT user_name FROM user WHERE status = 'pending';
```

**Rule**: Use `UNION ALL` unless you specifically need to remove duplicates.

### 5.3 Window Functions vs Subquery

```sql
-- ❌ SLOW - Correlated subquery (N+1 pattern)
SELECT 
    u.user_name,
    (SELECT COUNT(*) FROM order o WHERE o.user_id = u.id) AS order_count,
    (SELECT SUM(total_amount) FROM order o WHERE o.user_id = u.id) AS total_spent
FROM user u;

-- ✅ FAST - Window function (single scan)
SELECT 
    u.user_name,
    COUNT(o.id) OVER (PARTITION BY u.id) AS order_count,
    SUM(o.total_amount) OVER (PARTITION BY u.id) AS total_spent
FROM user u
LEFT JOIN order o ON o.user_id = u.id;

-- ✅ ALSO FAST - Simple GROUP BY (often better than window function)
SELECT 
    u.user_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM user u
LEFT JOIN order o ON o.user_id = u.id
GROUP BY u.id, u.user_name;
```

---

## 6. Data Type Optimization

### 6.1 Type Selection Impact

```sql
-- ❌ BAD - Oversized types
CREATE TABLE user (
    id BIGINT,              -- Overkill for most apps
    user_name VARCHAR(500), -- Too large
    age VARCHAR(10),        -- Wrong type!
    is_active VARCHAR(10)   -- Should be BOOLEAN
);

-- ✅ GOOD - Right-sized types
CREATE TABLE user (
    id INT,                 -- Sufficient for 2B records
    user_name VARCHAR(100), -- Appropriate size
    age TINYINT,           -- 0-255 range
    is_active BOOLEAN      -- TRUE/FALSE
);
```

**Storage Savings Example**:
- 1M records with VARCHAR(500) → ~500 MB
- 1M records with VARCHAR(100) → ~100 MB
- **Savings**: 400 MB storage + smaller indexes + faster queries

### 6.2 Type Selection Guide

| Data | Wrong Type | Right Type | Reason |
|------|-----------|------------|---------|
| ID | BIGINT | INT | INT sufficient unless >2B records |
| Price | FLOAT | DECIMAL(10,2) | FLOAT has rounding errors |
| Date | VARCHAR | DATE | Date type enables date functions |
| Age | INT | TINYINT | TINYINT (0-255) is sufficient |
| Flag | VARCHAR | BOOLEAN | Boolean is 1 bit vs 1+ bytes |
| Status | VARCHAR(50) | ENUM(...) | ENUM stores as integer |

---

## 7. Batch Processing

### 7.1 Batch Large Operations

```sql
-- ❌ BAD - Single huge transaction
UPDATE user SET status = 'inactive'
WHERE last_login_date < '2023-01-01';  -- Could be millions of rows!

-- ✅ GOOD - Batch processing
DECLARE @batchSize INT = 1000;
DECLARE @rowsAffected INT = @batchSize;

WHILE @rowsAffected = @batchSize
BEGIN
    UPDATE TOP (@batchSize) user
    SET status = 'inactive'
    WHERE last_login_date < '2023-01-01'
        AND status != 'inactive';
    
    SET @rowsAffected = @@ROWCOUNT;
    
    -- Small delay to reduce lock pressure
    WAITFOR DELAY '00:00:01';
END;
```

**Batch Size Guidelines**:
- Small tables (<100k rows): 5,000 per batch
- Medium tables (100k-1M rows): 1,000 per batch  
- Large tables (>1M rows): 500 per batch

---

## 8. Query Optimization Checklist

### Before Production

- [ ] Run `EXPLAIN` on complex queries
- [ ] Verify indexes on foreign keys
- [ ] Verify indexes on WHERE/JOIN columns
- [ ] Check for table scans on large tables (>100k rows)
- [ ] Validate composite index column order
- [ ] Confirm no implicit type conversions
- [ ] Verify JOINs use appropriate indexes
- [ ] Check for N+1 patterns
- [ ] Test with production-like data volume
- [ ] Review nested subqueries (consider CTE)
- [ ] Ensure transactions are short
- [ ] Add query timeout limits

### Ongoing Monitoring

- [ ] Monitor slow query logs weekly
- [ ] Review missing indexes monthly
- [ ] Drop unused indexes quarterly
- [ ] Analyze execution plan regression
- [ ] Monitor index fragmentation
- [ ] Update statistics regularly
- [ ] Check for blocking/deadlocks

---

## 9. Performance Metrics

### 9.1 Target Metrics

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Query execution time (simple) | < 100ms | Add index, optimize query |
| Query execution time (complex) | < 1s | Review joins, add indexes |
| Rows examined / rows returned | < 10:1 | Add selective index |
| Index hit rate | > 95% | Add missing indexes |
| Lock wait time | < 1s | Shorten transactions |

### 9.2 Query Performance Formula

**Efficiency Ratio** = Rows Returned / Rows Examined

- ✅ **> 0.1** (1:10): Good
- ⚠️ **0.01 - 0.1** (1:100): Review
- ❌ **< 0.01** (1:100+): Needs optimization

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related**: [Main Index](./sql.instructions.md) | [Basics](./sql-basics.instructions.md)
