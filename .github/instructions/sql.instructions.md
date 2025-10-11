---
description: 'Main SQL guidelines - Critical rules and quick reference'
applyTo: '**/*.sql'
---

# SQL Development Guidelines - Main Index

> **📦 Installation**: To install the complete framework in any project, run:
> ```bash
> npx naichii-agent install
> ```
> This will copy all rules, context, and memory files to `.naichii-agent/` in your project.

**Quick Navigation**: This is the main entry point. For detailed guidelines, see `context/rules/sql/` directory (or `.naichii-agent/rules/sql/` after installation).

**When to use detailed rules**:
- Schema design issues → `@context/rules/sql/basics.md`
- Performance problems → `@context/rules/sql/optimization.md`
- Stored procedure work → `@context/rules/sql/stored-procedures.md`
- Security concerns → `@context/rules/sql/security.md`
- Advanced SQL features → `@context/rules/sql/advanced.md`

---

## 🔴 CRITICAL RULES (ALWAYS FOLLOW)

### 1. Naming Conventions (Non-Negotiable)
```sql
-- ✅ CORRECT - Singular form
CREATE TABLE user (
    id INT PRIMARY KEY,
    user_name VARCHAR(100),
    created_at TIMESTAMP
);

-- ❌ WRONG - Plural form
CREATE TABLE users (
    userId INT PRIMARY KEY,
    userName VARCHAR(100)
);
```

### 2. Always Use Explicit Column Names
```sql
-- ✅ CORRECT
SELECT u.id, u.user_name, u.email
FROM user u;

-- ❌ WRONG
SELECT * FROM user;
```

### 3. Qualify Columns in Multi-Table Queries
```sql
-- ✅ CORRECT
SELECT u.id, u.user_name, o.order_date
FROM user u
JOIN order o ON o.user_id = u.id;

-- ❌ WRONG
SELECT id, user_name, order_date
FROM user u
JOIN order o ON o.user_id = u.id;
```

### 4. Foreign Keys Must Have ON DELETE/UPDATE
```sql
-- ✅ CORRECT
CREATE TABLE order (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ❌ WRONG
CREATE TABLE order (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### 5. Index Foreign Keys and WHERE Columns
```sql
-- ✅ CORRECT
CREATE INDEX idx_order_user_id ON order(user_id);
CREATE INDEX idx_order_status_date ON order(status, order_date);

-- ❌ WRONG - No indexes on foreign keys
```

### 6. Use Parameterized Queries (Prevent SQL Injection)
```sql
-- ✅ CORRECT
DECLARE @userId INT = @inputUserId;
SELECT * FROM user WHERE id = @userId;

-- ❌ WRONG - SQL Injection vulnerability
-- EXEC('SELECT * FROM user WHERE id = ' + @inputUserId);
```

### 7. Explicit Transaction Control
```sql
-- ✅ CORRECT
BEGIN TRANSACTION;
    UPDATE account SET balance = balance - 100 WHERE id = 1;
    UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- ❌ WRONG - No transaction control for related operations
```

### 8. Always Format with SQL Standards
- **UPPERCASE** for SQL keywords: `SELECT`, `FROM`, `WHERE`, `JOIN`
- **lowercase** or **snake_case** for identifiers: `user_name`, `order_date`
- **Indentation**: 4 spaces or 1 tab
- **Line breaks** before major clauses

```sql
-- ✅ CORRECT FORMAT
SELECT 
    u.id,
    u.user_name,
    COUNT(o.id) AS order_count
FROM user u
LEFT JOIN order o ON o.user_id = u.id
WHERE u.status = 'active'
    AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.user_name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 100;
```

---

## 📋 Quick Reference Card

### Standard Table Structure
```sql
CREATE TABLE entity_name (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_entity_name_status (status),
    INDEX idx_entity_name_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Standard Query Pattern
```sql
SELECT 
    t1.column1,
    t1.column2,
    t2.related_column
FROM main_table t1
INNER JOIN related_table t2 ON t2.main_table_id = t1.id
WHERE t1.status = @status
    AND t1.created_at >= @startDate
ORDER BY t1.created_at DESC
LIMIT @pageSize OFFSET @offset;
```

### Standard Stored Procedure Template
```sql
DELIMITER //
CREATE PROCEDURE usp_GetEntityById(
    IN p_id INT
)
BEGIN
    -- Validate input
    IF p_id IS NULL OR p_id <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid ID parameter';
    END IF;
    
    -- Main query
    SELECT 
        id,
        name,
        status,
        created_at
    FROM entity_name
    WHERE id = p_id;
END //
DELIMITER ;
```

---

## 🎯 Performance Goals

| Query Type | Target Time |
|------------|-------------|
| Simple SELECT | < 100ms |
| Complex JOIN | < 1s |
| Reports | < 5s |
| Transaction | < 500ms |

---

## 📚 Detailed Guidelines

**IMPORTANT**: When facing specific SQL challenges, reference detailed rules in `context/rules/sql/`:

| Problem Type | Reference File | Use When |
|-------------|----------------|----------|
| 🏗️ Schema design, table creation, naming | `@context/rules/sql/basics.md` | Creating tables, designing schema, formatting queries |
| ⚡ Slow queries, indexing strategy | `@context/rules/sql/optimization.md` | Query performance issues, index planning, execution plans |
| 🔧 Creating stored procedures | `@context/rules/sql/stored-procedures.md` | Writing procedures, error handling, transactions |
| 🔒 SQL injection, authentication, encryption | `@context/rules/sql/security.md` | Security issues, access control, data protection |
| 🚀 CTEs, window functions, JSON, partitioning | `@context/rules/sql/advanced.md` | Complex queries, hierarchical data, advanced features |

**How to use**: Mention the specific file when asking for help:
```
Example: "I need to optimize this slow query @context/rules/sql/optimization.md"
Example: "Help me create a secure login procedure @context/rules/sql/security.md"
```

---

## 🚫 Top 10 Anti-Patterns to Avoid

1. ❌ Using `SELECT *` in production code
2. ❌ Missing indexes on foreign keys
3. ❌ String concatenation for dynamic SQL
4. ❌ No transaction control for multi-statement operations
5. ❌ Using `LIKE '%value'` without full-text index
6. ❌ Functions on indexed columns in WHERE clause
7. ❌ Missing JOIN conditions (cartesian product)
8. ❌ N+1 query pattern
9. ❌ Implicit type conversions
10. ❌ Overly complex nested subqueries

---

**Version**: 3.0  
**Last Updated**: 2025-10-11  
**Optimization**: Split into modular files for better maintainability
