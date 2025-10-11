---
description: 'SQL security best practices - Injection prevention, access control, data protection'
applyTo: '**/*.sql'
---

# SQL Security - Best Practices

**Related**: [Main Index](./sql.instructions.md)

---

## 🔴 CRITICAL SECURITY RULES

**Rule 1:** NEVER Concatenate User Input into SQL  
**Rule 2:** ALWAYS Use Parameterized Queries  
**Rule 3:** Apply Least Privilege Access  
**Rule 4:** Encrypt Sensitive Data  
**Rule 5:** Audit All Security-Related Operations

---

## 1. SQL Injection Prevention

### 1.1 SQL Injection Vulnerability

```sql
-- ❌ CRITICAL VULNERABILITY - SQL Injection
CREATE PROCEDURE usp_GetUserByEmailBAD(
    IN p_email VARCHAR(255)
)
BEGIN
    SET @sql = CONCAT('SELECT * FROM user WHERE email_address = ''', p_email, '''');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;  -- VULNERABLE!
    DEALLOCATE PREPARE stmt;
END;

-- Attack example:
-- CALL usp_GetUserByEmailBAD("' OR '1'='1");
-- Results in: SELECT * FROM user WHERE email_address = '' OR '1'='1'
-- Returns ALL users!
```

### 1.2 Parameterized Queries (Safe)

```sql
-- ✅ CORRECT - Parameterized query
CREATE PROCEDURE usp_GetUserByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT 
        id,
        user_name,
        email_address,
        status
    FROM user
    WHERE email_address = p_email;  -- Safe: parameterized
END;
```

### 1.3 Dynamic SQL with Parameters (When Necessary)

```sql
-- ✅ CORRECT - Dynamic SQL with proper parameterization
CREATE PROCEDURE usp_GetUserByEmailDynamic(
    IN p_email VARCHAR(255)
)
BEGIN
    -- Use placeholder
    SET @sql = 'SELECT id, user_name, email_address FROM user WHERE email_address = ?';
    
    PREPARE stmt FROM @sql;
    SET @email_param = p_email;
    EXECUTE stmt USING @email_param;  -- Safe: using parameters
    DEALLOCATE PREPARE stmt;
END;
```

### 1.4 Validating Dynamic Table/Column Names

```sql
-- ❌ VULNERABLE - Direct concatenation of table name
CREATE PROCEDURE usp_GetDataBAD(
    IN p_tableName VARCHAR(100)
)
BEGIN
    SET @sql = CONCAT('SELECT * FROM ', p_tableName);  -- VULNERABLE!
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- ✅ CORRECT - Whitelist validation
CREATE PROCEDURE usp_GetData(
    IN p_tableName VARCHAR(100)
)
BEGIN
    -- Validate against whitelist
    IF p_tableName NOT IN ('user', 'order', 'product') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid table name';
    END IF;
    
    -- Use CASE to build safe query
    CASE p_tableName
        WHEN 'user' THEN
            SELECT id, user_name FROM user;
        WHEN 'order' THEN
            SELECT id, order_number FROM order;
        WHEN 'product' THEN
            SELECT id, product_name FROM product;
    END CASE;
END;

-- ✅ ALTERNATIVE - Use QUOTENAME (SQL Server)
CREATE PROCEDURE usp_GetDataSafe
    @tableName NVARCHAR(100)
AS
BEGIN
    -- Validate against whitelist first
    IF @tableName NOT IN ('user', 'order', 'product')
        THROW 50001, 'Invalid table name', 1;
    
    -- Use QUOTENAME to escape identifier
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'SELECT * FROM ' + QUOTENAME(@tableName);
    EXEC sp_executesql @sql;
END;
```

### 1.5 Input Validation

```sql
-- ✅ CORRECT - Comprehensive input validation
CREATE PROCEDURE usp_CreateUser(
    IN p_userName VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_age INT,
    OUT p_userId INT
)
BEGIN
    -- 1. NULL checks
    IF p_userName IS NULL OR p_email IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Required fields cannot be null';
    END IF;
    
    -- 2. Length validation
    IF LENGTH(p_userName) < 3 OR LENGTH(p_userName) > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username must be 3-100 characters';
    END IF;
    
    -- 3. Format validation (email)
    IF p_email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email format';
    END IF;
    
    -- 4. Range validation
    IF p_age IS NOT NULL AND (p_age < 0 OR p_age > 150) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Age must be between 0 and 150';
    END IF;
    
    -- 5. Business rule validation
    IF EXISTS (SELECT 1 FROM user WHERE email_address = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
    END IF;
    
    -- Insert after all validations pass
    INSERT INTO user (user_name, email_address, age, created_at)
    VALUES (p_userName, p_email, p_age, NOW());
    
    SET p_userId = LAST_INSERT_ID();
END;
```

---

## 2. Access Control and Permissions

### 2.1 Principle of Least Privilege

```sql
-- ✅ CORRECT - Create application-specific user with minimal permissions

-- Create dedicated application user (don't use root/sa!)
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';

-- Grant only necessary permissions
-- Option 1: Grant specific table permissions
GRANT SELECT, INSERT, UPDATE ON mydb.user TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.order TO 'app_user'@'localhost';
GRANT SELECT ON mydb.product TO 'app_user'@'localhost';  -- Read-only

-- Option 2: Grant stored procedure execution only (RECOMMENDED)
GRANT EXECUTE ON PROCEDURE mydb.usp_GetUserById TO 'app_user'@'localhost';
GRANT EXECUTE ON PROCEDURE mydb.usp_CreateOrder TO 'app_user'@'localhost';
GRANT EXECUTE ON PROCEDURE mydb.usp_GetProducts TO 'app_user'@'localhost';

-- ❌ WRONG - Excessive permissions
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'localhost';  -- Never do this!
GRANT ALL ON mydb.* TO 'app_user'@'localhost';  -- Too broad!
```

### 2.2 Role-Based Access Control

```sql
-- ✅ CORRECT - Define roles for different access levels

-- Create roles
CREATE ROLE 'app_readonly';
CREATE ROLE 'app_readwrite';
CREATE ROLE 'app_admin';

-- Grant permissions to roles
-- Read-only role
GRANT SELECT ON mydb.user TO 'app_readonly';
GRANT SELECT ON mydb.order TO 'app_readonly';
GRANT SELECT ON mydb.product TO 'app_readonly';
GRANT EXECUTE ON PROCEDURE mydb.usp_GetUserById TO 'app_readonly';

-- Read-write role
GRANT SELECT, INSERT, UPDATE ON mydb.user TO 'app_readwrite';
GRANT SELECT, INSERT, UPDATE ON mydb.order TO 'app_readwrite';
GRANT EXECUTE ON PROCEDURE mydb.usp_CreateOrder TO 'app_readwrite';

-- Admin role
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_admin';

-- Assign roles to users
CREATE USER 'report_user'@'localhost' IDENTIFIED BY 'Password123!';
GRANT 'app_readonly' TO 'report_user'@'localhost';

CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'Password123!';
GRANT 'app_readwrite' TO 'api_user'@'localhost';
```

### 2.3 Connection Security

```sql
-- ✅ CORRECT - Restrict by host
CREATE USER 'app_user'@'192.168.1.100' IDENTIFIED BY 'Password123!';  -- Specific IP
CREATE USER 'app_user'@'192.168.1.%' IDENTIFIED BY 'Password123!';    -- IP range
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'Password123!';      -- Local only

-- ❌ WRONG - Allow from anywhere
CREATE USER 'app_user'@'%' IDENTIFIED BY 'Password123!';  -- Insecure!

-- ✅ CORRECT - Require SSL/TLS
CREATE USER 'app_user'@'%' 
IDENTIFIED BY 'Password123!' 
REQUIRE SSL;  -- Enforce encrypted connection

-- Or require specific certificate
CREATE USER 'app_user'@'%'
IDENTIFIED BY 'Password123!'
REQUIRE X509;  -- Require client certificate
```

---

## 3. Data Encryption

### 3.1 Column-Level Encryption (MySQL)

```sql
-- ✅ CORRECT - Encrypt sensitive data

-- Encrypt on INSERT
INSERT INTO user (user_name, email_address, ssn_encrypted, created_at)
VALUES (
    'John Doe',
    'john@example.com',
    AES_ENCRYPT('123-45-6789', 'encryption_key_here'),  -- Encrypt SSN
    NOW()
);

-- Decrypt on SELECT
SELECT 
    id,
    user_name,
    email_address,
    CAST(AES_DECRYPT(ssn_encrypted, 'encryption_key_here') AS CHAR) AS ssn
FROM user
WHERE id = 123;
```

### 3.2 Encryption Key Management

```sql
-- ❌ WRONG - Hardcoded encryption key
SET @key = 'my_secret_key';  -- Never hardcode!

-- ✅ CORRECT - Use key management system
-- Store keys in:
-- 1. Environment variables (accessed by application)
-- 2. Key Management Service (AWS KMS, Azure Key Vault, etc.)
-- 3. Hardware Security Module (HSM)

-- Pass key from application layer
CREATE PROCEDURE usp_CreateUserWithEncryption(
    IN p_userName VARCHAR(100),
    IN p_ssn VARCHAR(50),
    IN p_encryptionKey VARCHAR(255),  -- Key from application
    OUT p_userId INT
)
BEGIN
    INSERT INTO user (user_name, ssn_encrypted, created_at)
    VALUES (
        p_userName,
        AES_ENCRYPT(p_ssn, p_encryptionKey),
        NOW()
    );
    
    SET p_userId = LAST_INSERT_ID();
END;
```

### 3.3 Hashing Passwords

```sql
-- ✅ CORRECT - Hash passwords (never store plaintext!)

-- MySQL 5.7+
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100),
    password_hash VARCHAR(255),  -- Store hash, not password!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert with hashed password
INSERT INTO user (user_name, password_hash)
VALUES ('john', SHA2('user_password', 256));  -- SHA-256 hash

-- Verify login
SELECT id, user_name
FROM user
WHERE user_name = 'john'
    AND password_hash = SHA2('input_password', 256);

-- ⚠️ BETTER - Use bcrypt/scrypt in application layer
-- SHA2 is fast, making brute-force easier
-- Use bcrypt/scrypt/Argon2 in your application code instead
```

---

## 4. Auditing and Logging

### 4.1 Audit Table Structure

```sql
-- ✅ CORRECT - Create audit log table
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE
    user_name VARCHAR(100),
    user_ip VARCHAR(45),
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_user (user_name)
);
```

### 4.2 Audit Triggers

```sql
-- ✅ CORRECT - Audit sensitive operations

DELIMITER //

-- Trigger for UPDATE
CREATE TRIGGER trg_user_update_audit
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        user_name,
        old_values,
        new_values
    ) VALUES (
        'user',
        NEW.id,
        'UPDATE',
        USER(),
        JSON_OBJECT(
            'user_name', OLD.user_name,
            'email_address', OLD.email_address,
            'status', OLD.status
        ),
        JSON_OBJECT(
            'user_name', NEW.user_name,
            'email_address', NEW.email_address,
            'status', NEW.status
        )
    );
END //

-- Trigger for DELETE
CREATE TRIGGER trg_user_delete_audit
BEFORE DELETE ON user
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        user_name,
        old_values
    ) VALUES (
        'user',
        OLD.id,
        'DELETE',
        USER(),
        JSON_OBJECT(
            'user_name', OLD.user_name,
            'email_address', OLD.email_address,
            'status', OLD.status
        )
    );
END //

DELIMITER ;
```

### 4.3 Login Attempts Tracking

```sql
-- ✅ CORRECT - Track failed login attempts
CREATE TABLE login_attempt (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100),
    ip_address VARCHAR(45),
    success BOOLEAN,
    failure_reason VARCHAR(255),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_login_user_time (user_name, attempted_at),
    INDEX idx_login_ip_time (ip_address, attempted_at)
);

CREATE PROCEDURE usp_ValidateLogin(
    IN p_userName VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    OUT p_userId INT,
    OUT p_result VARCHAR(50)
)
BEGIN
    DECLARE v_failedAttempts INT DEFAULT 0;
    DECLARE v_storedHash VARCHAR(255);
    
    -- Check for account lockout (5 failed attempts in last 15 minutes)
    SELECT COUNT(*) INTO v_failedAttempts
    FROM login_attempt
    WHERE user_name = p_userName
        AND success = FALSE
        AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE);
    
    IF v_failedAttempts >= 5 THEN
        SET p_result = 'ACCOUNT_LOCKED';
        
        -- Log lockout attempt
        INSERT INTO login_attempt (user_name, ip_address, success, failure_reason)
        VALUES (p_userName, p_ipAddress, FALSE, 'Account locked');
        
        SET p_userId = NULL;
        RETURN;
    END IF;
    
    -- Verify credentials
    SELECT id, password_hash INTO p_userId, v_storedHash
    FROM user
    WHERE user_name = p_userName
        AND status = 'active';
    
    IF p_userId IS NULL THEN
        SET p_result = 'USER_NOT_FOUND';
        
        INSERT INTO login_attempt (user_name, ip_address, success, failure_reason)
        VALUES (p_userName, p_ipAddress, FALSE, 'User not found');
        
        RETURN;
    END IF;
    
    -- Check password (in reality, use bcrypt in application)
    IF v_storedHash != SHA2(p_password, 256) THEN
        SET p_result = 'INVALID_PASSWORD';
        
        INSERT INTO login_attempt (user_name, ip_address, success, failure_reason)
        VALUES (p_userName, p_ipAddress, FALSE, 'Invalid password');
        
        SET p_userId = NULL;
        RETURN;
    END IF;
    
    -- Success
    SET p_result = 'SUCCESS';
    
    INSERT INTO login_attempt (user_name, ip_address, success)
    VALUES (p_userName, p_ipAddress, TRUE);
END;
```

---

## 5. Row-Level Security

### 5.1 Application-Level Row Security

```sql
-- ✅ CORRECT - Filter by user context
CREATE PROCEDURE usp_GetMyOrders(
    IN p_userId INT  -- From authenticated session
)
BEGIN
    -- Users can only see their own orders
    SELECT 
        id,
        order_number,
        total_amount,
        status,
        created_at
    FROM order
    WHERE user_id = p_userId  -- Security filter
    ORDER BY created_at DESC;
END;

-- ✅ CORRECT - Multi-tenant isolation
CREATE PROCEDURE usp_GetTenantData(
    IN p_tenantId INT,  -- From authenticated session
    IN p_recordId INT
)
BEGIN
    -- Ensure tenant can only access their own data
    SELECT 
        id,
        data_column,
        created_at
    FROM sensitive_table
    WHERE tenant_id = p_tenantId  -- Tenant isolation
        AND id = p_recordId;
END;
```

### 5.2 Views for Security Filtering

```sql
-- ✅ CORRECT - Create view with security filter
CREATE VIEW vw_user_safe AS
SELECT 
    id,
    user_name,
    email_address,
    status,
    created_at
    -- Exclude: password_hash, ssn_encrypted, etc.
FROM user
WHERE status = 'active';  -- Only show active users

-- Grant access to view, not underlying table
GRANT SELECT ON vw_user_safe TO 'app_readonly'@'localhost';
-- DO NOT grant access to user table directly
```

---

## 6. Sensitive Data Protection

### 6.1 Masking Sensitive Data

```sql
-- ✅ CORRECT - Mask sensitive data in queries
CREATE PROCEDURE usp_GetUserProfile(
    IN p_userId INT,
    IN p_requestingUserId INT,
    IN p_isAdmin BOOLEAN
)
BEGIN
    IF p_isAdmin THEN
        -- Admin sees full data
        SELECT 
            id,
            user_name,
            email_address,
            phone_number,
            ssn
        FROM user
        WHERE id = p_userId;
    ELSE
        -- Regular user sees masked data
        SELECT 
            id,
            user_name,
            CONCAT(
                LEFT(email_address, 3), 
                '***@', 
                SUBSTRING_INDEX(email_address, '@', -1)
            ) AS email_address,  -- Masked email
            CONCAT('***-***-', RIGHT(phone_number, 4)) AS phone_number,  -- Masked phone
            '***-**-****' AS ssn  -- Fully masked
        FROM user
        WHERE id = p_userId
            AND id = p_requestingUserId;  -- Can only see own data
    END IF;
END;
```

### 6.2 Redacting PII in Logs

```sql
-- ✅ CORRECT - Don't log sensitive data
CREATE PROCEDURE usp_ProcessPayment(
    IN p_orderId INT,
    IN p_creditCardNumber VARCHAR(20)
)
BEGIN
    DECLARE v_last4Digits VARCHAR(4);
    
    -- Extract last 4 digits for logging
    SET v_last4Digits = RIGHT(p_creditCardNumber, 4);
    
    -- Process payment (implementation details omitted)
    -- ...
    
    -- Log transaction WITHOUT full credit card
    INSERT INTO transaction_log (
        order_id,
        card_last4,  -- Only last 4 digits
        amount,
        created_at
    ) VALUES (
        p_orderId,
        v_last4Digits,  -- ✅ Safe to log
        100.00,
        NOW()
    );
    
    -- ❌ NEVER do this:
    -- INSERT INTO transaction_log (order_id, credit_card, ...)
    -- VALUES (p_orderId, p_creditCardNumber, ...);
END;
```

---

## 7. Security Checklist

### Before Production

- [ ] All user input is validated
- [ ] All queries use parameterized inputs (no string concatenation)
- [ ] Dynamic SQL uses proper escaping/whitelisting
- [ ] Application uses dedicated database user (not root/sa)
- [ ] Database user has minimal required permissions
- [ ] Sensitive data is encrypted at rest
- [ ] Database connections use SSL/TLS
- [ ] Passwords are hashed (never plaintext)
- [ ] Audit logging is enabled for sensitive tables
- [ ] Failed login attempts are tracked and limited
- [ ] Personal Identifiable Information (PII) is masked appropriately
- [ ] No sensitive data in error messages
- [ ] No hardcoded credentials in code
- [ ] Row-level security is enforced where needed
- [ ] Regular security audits are scheduled

### Ongoing Security

- [ ] Review user permissions quarterly
- [ ] Audit logs reviewed weekly
- [ ] Failed login attempts monitored
- [ ] Update database software with security patches
- [ ] Rotate encryption keys annually
- [ ] Remove inactive users/roles
- [ ] Test backup restoration procedures
- [ ] Verify SSL/TLS certificate validity

---

## 8. Common Security Anti-Patterns

### 8.1 Avoid These!

```sql
-- ❌ String concatenation with user input
SET @sql = 'SELECT * FROM user WHERE name = ''' + @userInput + '''';

-- ❌ Hardcoded credentials
CREATE USER 'app'@'%' IDENTIFIED BY 'password123';

-- ❌ Granting excessive permissions
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'%';

-- ❌ Storing passwords in plaintext
INSERT INTO user (username, password) VALUES ('john', 'MyPassword123');

-- ❌ No input validation
CREATE PROCEDURE usp_GetData(IN p_id INT)
BEGIN
    SELECT * FROM user WHERE id = p_id;  -- What if p_id is NULL or negative?
END;

-- ❌ Exposing sensitive data in error messages
SIGNAL SQLSTATE '45000' 
SET MESSAGE_TEXT = CONCAT('User not found: ', @email, ' with password: ', @password);

-- ❌ No audit logging for sensitive operations
DELETE FROM user WHERE id = @userId;  -- No record of deletion!
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related**: [Main Index](./sql.instructions.md) | [Stored Procedures](./sql-stored-procedures.instructions.md)
