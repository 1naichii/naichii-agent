---
description: 'SQL basics - Schema design, naming conventions, and formatting'
applyTo: '**/*.sql'
---

# SQL Basics - Schema Design & Formatting

**Related**: [Main Index](./sql.instructions.md)

---

## 1. Database Schema Generation

### 1.1 Naming Conventions

#### Tables
- **ALWAYS singular form**: `user`, `product`, `order`, `order_item`
- **snake_case** for multi-word: `user_profile`, `product_category`
- **Descriptive names**: Avoid abbreviations unless standard

```sql
-- ✅ CORRECT
CREATE TABLE user (...)
CREATE TABLE product_category (...)
CREATE TABLE order_item (...)

-- ❌ WRONG
CREATE TABLE users (...)
CREATE TABLE ProductCategory (...)
CREATE TABLE OrderItems (...)
CREATE TABLE usr (...)  -- Don't abbreviate
```

#### Columns
- **snake_case**: `user_name`, `email_address`, `created_at`
- **Descriptive**: `first_name` not `fname`
- **Boolean prefix**: `is_active`, `has_permission`, `can_edit`
- **Date/Time suffix**: `_at` for timestamps, `_date` for dates

```sql
-- ✅ CORRECT
CREATE TABLE user (
    id INT PRIMARY KEY,
    user_name VARCHAR(100),
    email_address VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    birth_date DATE
);

-- ❌ WRONG
CREATE TABLE user (
    ID INT PRIMARY KEY,
    userName VARCHAR(100),
    email VARCHAR(255),
    active BOOLEAN,  -- Should be is_active
    created TIMESTAMP,  -- Should be created_at
    dob DATE  -- Should be birth_date
);
```

#### Primary Keys
- **Always named `id`**: Simple and consistent
- **INT or BIGINT**: Use BIGINT if expecting >2 billion records
- **AUTO_INCREMENT**: For most use cases

```sql
-- ✅ CORRECT
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ...
);

-- ❌ WRONG
CREATE TABLE user (
    user_id INT PRIMARY KEY,  -- Just use 'id'
    ...
);
```

#### Foreign Keys
- **Pattern**: `{referenced_table}_id`
- **Descriptive constraint names**: `fk_{table}_{referenced_table}`

```sql
-- ✅ CORRECT
CREATE TABLE order (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    
    CONSTRAINT fk_order_user 
        FOREIGN KEY (user_id) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_order_product 
        FOREIGN KEY (product_id) REFERENCES product(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ❌ WRONG
CREATE TABLE order (
    id INT PRIMARY KEY,
    userId INT,  -- Should be user_id
    prod_id INT,  -- Should be product_id
    FOREIGN KEY (userId) REFERENCES user(id)  -- No constraint name, no ON DELETE/UPDATE
);
```

#### Indexes
- **Pattern**: `idx_{table}_{column(s)}`
- **Descriptive**: Include all columns in name

```sql
-- ✅ CORRECT
CREATE INDEX idx_user_email ON user(email_address);
CREATE INDEX idx_order_user_status ON order(user_id, status);
CREATE INDEX idx_order_created ON order(created_at);

-- ❌ WRONG
CREATE INDEX user_idx ON user(email_address);
CREATE INDEX idx1 ON order(user_id, status);
```

### 1.2 Timestamp Columns

**Standard Pattern**: Always include `created_at` and `updated_at`

```sql
-- ✅ CORRECT - MySQL
CREATE TABLE product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ✅ CORRECT - PostgreSQL
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- For PostgreSQL, add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_updated_at 
    BEFORE UPDATE ON product 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Database Schema Design

### 2.1 Constraint Requirements

#### Primary Key Constraints
```sql
-- ✅ CORRECT - Multiple approaches
-- Approach 1: Inline
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ...
);

-- Approach 2: Named constraint
CREATE TABLE user (
    id INT AUTO_INCREMENT,
    ...,
    CONSTRAINT pk_user PRIMARY KEY (id)
);

-- Approach 3: Composite key
CREATE TABLE user_role (
    user_id INT,
    role_id INT,
    CONSTRAINT pk_user_role PRIMARY KEY (user_id, role_id)
);
```

#### Foreign Key Constraints
**CRITICAL**: Always include `ON DELETE` and `ON UPDATE` clauses

```sql
-- ✅ CORRECT
CREATE TABLE order (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    CONSTRAINT fk_order_user 
        FOREIGN KEY (user_id) REFERENCES user(id)
        ON DELETE CASCADE      -- Delete orders when user is deleted
        ON UPDATE CASCADE      -- Update if user.id changes
);

-- Common ON DELETE options:
-- CASCADE: Delete child records
-- RESTRICT/NO ACTION: Prevent parent deletion if children exist
-- SET NULL: Set foreign key to NULL (column must allow NULL)
-- SET DEFAULT: Set to default value
```

#### Check Constraints
```sql
-- ✅ CORRECT
CREATE TABLE product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    
    CONSTRAINT chk_product_price CHECK (price >= 0),
    CONSTRAINT chk_product_stock CHECK (stock_quantity >= 0)
);
```

#### Unique Constraints
```sql
-- ✅ CORRECT
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email_address VARCHAR(255) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    
    CONSTRAINT uq_user_email UNIQUE (email_address),
    CONSTRAINT uq_user_name UNIQUE (user_name)
);
```

---

## 3. SQL Coding Style

### 3.1 Formatting Standards

#### Keyword Casing
- **UPPERCASE**: All SQL keywords
- **lowercase/snake_case**: Table names, column names, aliases

```sql
-- ✅ CORRECT
SELECT 
    u.id,
    u.user_name,
    u.email_address
FROM user u
WHERE u.is_active = TRUE
    AND u.created_at >= '2024-01-01'
ORDER BY u.created_at DESC;

-- ❌ WRONG
select u.ID, u.UserName, u.EmailAddress
from USER u
where u.IsActive = true and u.CreatedAt >= '2024-01-01'
order by u.CreatedAt desc;
```

#### Indentation
- **4 spaces** or **1 tab** (be consistent)
- Indent subclauses

```sql
-- ✅ CORRECT
SELECT 
    u.id,
    u.user_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM user u
LEFT JOIN order o ON o.user_id = u.id
    AND o.status = 'completed'
WHERE u.is_active = TRUE
    AND u.created_at >= '2024-01-01'
    AND (
        u.user_type = 'premium'
        OR u.total_purchases > 1000
    )
GROUP BY u.id, u.user_name
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 100;
```

#### Line Breaks
- Break **before** major clauses: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY`
- One column per line in SELECT
- Break complex WHERE conditions

```sql
-- ✅ CORRECT - Readable
SELECT 
    p.id,
    p.product_name,
    p.price,
    c.category_name
FROM product p
INNER JOIN product_category c ON c.id = p.category_id
WHERE p.is_active = TRUE
    AND p.price BETWEEN 10 AND 100
ORDER BY p.product_name;

-- ❌ WRONG - Hard to read
SELECT p.id, p.product_name, p.price, c.category_name FROM product p INNER JOIN product_category c ON c.id = p.category_id WHERE p.is_active = TRUE AND p.price BETWEEN 10 AND 100 ORDER BY p.product_name;
```

#### Comments
```sql
-- ✅ CORRECT - Use comments for complex logic

-- Get active users with their order statistics
-- Filters: Active users only, orders from last 12 months
SELECT 
    u.id,
    u.user_name,
    -- Calculate order metrics
    COUNT(DISTINCT o.id) AS order_count,
    SUM(o.total_amount) AS total_spent,
    AVG(o.total_amount) AS avg_order_value
FROM user u
LEFT JOIN order o ON o.user_id = u.id
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)  -- Last 12 months only
WHERE u.is_active = TRUE
GROUP BY u.id, u.user_name;

/* 
 * Multi-line comment for complex procedures
 * This query aggregates user purchase behavior
 * for the marketing team's quarterly review
 */
```

---

## 4. SQL Query Structure

### 4.1 Basic Query Pattern

**Standard Clause Order**:
```sql
SELECT      -- Columns to retrieve
FROM        -- Main table
JOIN        -- Related tables
WHERE       -- Row filtering
GROUP BY    -- Aggregation grouping
HAVING      -- Aggregate filtering
ORDER BY    -- Result sorting
LIMIT       -- Result limiting
```

### 4.2 SELECT Clause

#### Explicit Column Names
```sql
-- ✅ CORRECT - Explicit columns
SELECT 
    u.id,
    u.user_name,
    u.email_address,
    u.created_at
FROM user u;

-- ❌ WRONG - SELECT *
SELECT * FROM user u;

-- Exception: Temporary exploratory queries in development
SELECT * FROM user LIMIT 10;  -- OK for quick checks
```

#### Column Aliases
```sql
-- ✅ CORRECT - Use AS for clarity
SELECT 
    u.id,
    u.user_name,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM user u
LEFT JOIN order o ON o.user_id = u.id
GROUP BY u.id, u.user_name;
```

### 4.3 FROM and JOIN Clauses

#### Table Aliases
```sql
-- ✅ CORRECT - Short, meaningful aliases
SELECT 
    u.user_name,
    o.order_date,
    oi.quantity,
    p.product_name
FROM user u
INNER JOIN order o ON o.user_id = u.id
INNER JOIN order_item oi ON oi.order_id = o.id
INNER JOIN product p ON p.id = oi.product_id;

-- ❌ WRONG - No aliases or unclear aliases
SELECT 
    user_name,
    order_date
FROM user
INNER JOIN order ON order.user_id = user.id;
```

#### JOIN Types
```sql
-- INNER JOIN - Only matching rows
SELECT u.user_name, o.order_date
FROM user u
INNER JOIN order o ON o.user_id = u.id;

-- LEFT JOIN - All from left table + matches from right
SELECT u.user_name, o.order_date
FROM user u
LEFT JOIN order o ON o.user_id = u.id;

-- RIGHT JOIN - All from right table + matches from left (rarely used)
SELECT u.user_name, o.order_date
FROM user u
RIGHT JOIN order o ON o.user_id = u.id;

-- CROSS JOIN - Cartesian product (use with caution!)
SELECT d1.date_value, p.product_name
FROM date_dimension d1
CROSS JOIN product p;
```

### 4.4 WHERE Clause

#### Filtering Best Practices
```sql
-- ✅ CORRECT - Efficient filtering
SELECT 
    u.id,
    u.user_name,
    u.email_address
FROM user u
WHERE u.is_active = TRUE
    AND u.created_at >= '2024-01-01'
    AND u.email_address LIKE '%@company.com'
    AND u.status IN ('active', 'pending')
ORDER BY u.created_at DESC;

-- ❌ WRONG - Functions on indexed columns
SELECT * FROM user
WHERE YEAR(created_at) = 2024;  -- Prevents index usage

-- ✅ CORRECT - Index-friendly
SELECT * FROM user
WHERE created_at >= '2024-01-01' 
    AND created_at < '2025-01-01';
```

### 4.5 GROUP BY and HAVING

```sql
-- ✅ CORRECT - Aggregation with filtering
SELECT 
    u.id,
    u.user_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM user u
LEFT JOIN order o ON o.user_id = u.id
WHERE u.is_active = TRUE
GROUP BY u.id, u.user_name
HAVING COUNT(o.id) > 5
    AND SUM(o.total_amount) > 1000
ORDER BY total_spent DESC;
```

### 4.6 LIMIT and OFFSET

```sql
-- ✅ CORRECT - Pagination
-- Page 1
SELECT * FROM product
ORDER BY id
LIMIT 20 OFFSET 0;

-- Page 2
SELECT * FROM product
ORDER BY id
LIMIT 20 OFFSET 20;

-- Always use LIMIT during development
SELECT * FROM large_table
LIMIT 100;  -- Prevent accidentally loading millions of rows
```

---

## 5. Data Types

### 5.1 Data Type Selection Guidelines

#### Numeric Types
```sql
-- ✅ CORRECT
CREATE TABLE product (
    id INT,                          -- Use INT for most IDs (< 2B records)
    category_id BIGINT,              -- Use BIGINT for high-volume foreign keys
    price DECIMAL(10,2),             -- Use DECIMAL for currency (exact)
    weight DECIMAL(8,3),             -- DECIMAL for precise measurements
    stock_quantity INT,              -- INT for counts
    discount_percent DECIMAL(5,2),   -- e.g., 99.99%
    is_featured BOOLEAN              -- TRUE/FALSE flags
);

-- ❌ WRONG
CREATE TABLE product (
    id BIGINT,                       -- Overkill for most cases
    price FLOAT,                     -- FLOAT causes rounding errors for currency!
    stock_quantity VARCHAR(10)       -- Wrong type for numeric data
);
```

#### String Types
```sql
-- ✅ CORRECT
CREATE TABLE user (
    user_name VARCHAR(100),          -- Variable length, appropriate size
    email_address VARCHAR(255),      -- Standard email length
    description TEXT,                -- Use TEXT for long content
    status ENUM('active', 'inactive', 'pending'),  -- Fixed values
    country_code CHAR(2)             -- Fixed length (ISO codes)
);

-- ❌ WRONG
CREATE TABLE user (
    user_name CHAR(100),             -- Wastes space with fixed length
    email_address VARCHAR(1000),     -- Unnecessarily large
    status VARCHAR(20)               -- Use ENUM instead
);
```

#### Date/Time Types
```sql
-- ✅ CORRECT
CREATE TABLE event (
    event_date DATE,                 -- Just date, no time
    created_at TIMESTAMP,            -- Date + time, timezone-aware
    duration_seconds INT,            -- Store duration as seconds
    scheduled_time TIME              -- Time without date
);

-- ❌ WRONG
CREATE TABLE event (
    event_date VARCHAR(20),          -- Store dates as DATE type!
    created_at DATETIME              -- Use TIMESTAMP for auto-updating
);
```

---

## 6. Code Examples - Complete Patterns

### 6.1 Complete Table Definition
```sql
-- ✅ COMPLETE EXAMPLE
CREATE TABLE order (
    -- Primary key
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Foreign keys
    user_id INT NOT NULL,
    shipping_address_id INT NOT NULL,
    
    -- Data columns
    order_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT fk_order_user 
        FOREIGN KEY (user_id) REFERENCES user(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_order_address 
        FOREIGN KEY (shipping_address_id) REFERENCES address(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT uq_order_number UNIQUE (order_number),
    CONSTRAINT chk_order_amount CHECK (total_amount >= 0),
    
    -- Indexes
    INDEX idx_order_user (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_created (created_at),
    INDEX idx_order_number (order_number)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.2 Complete Query Pattern
```sql
-- ✅ COMPLETE EXAMPLE - User order report
SELECT 
    u.id AS user_id,
    u.user_name,
    u.email_address,
    COUNT(DISTINCT o.id) AS order_count,
    SUM(o.total_amount) AS total_spent,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.created_at) AS last_order_date,
    MIN(o.created_at) AS first_order_date
FROM user u
LEFT JOIN order o ON o.user_id = u.id
    AND o.status IN ('delivered', 'shipped')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
WHERE u.is_active = TRUE
    AND u.created_at >= '2023-01-01'
GROUP BY u.id, u.user_name, u.email_address
HAVING COUNT(DISTINCT o.id) > 0
ORDER BY total_spent DESC, order_count DESC
LIMIT 100;
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related**: [Main Index](./sql.instructions.md) | [Optimization](./sql-optimization.instructions.md)
