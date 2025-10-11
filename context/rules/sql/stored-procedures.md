---
description: 'Stored procedure development guidelines and best practices'
applyTo: '**/*.sql'
---

# SQL Stored Procedures - Development Guidelines

**Related**: [Main Index](./sql.instructions.md)

---

## 1. Naming Conventions

### 1.1 Stored Procedure Names

**Pattern**: `usp_{Action}{Entity}[ByCondition]`

- **Prefix**: `usp_` (User Stored Procedure)
- **Case**: PascalCase
- **Verb**: Get, Create, Update, Delete, Process, Calculate, Validate

```sql
-- ✅ CORRECT
usp_GetUserById
usp_GetUsersByStatus
usp_CreateOrder
usp_UpdateUserProfile
usp_DeleteInactiveUsers
usp_ProcessDailyOrders
usp_CalculateMonthlyRevenue

-- ❌ WRONG
sp_GetUser           -- 'sp_' prefix reserved for system
get_user             -- Should use PascalCase
getUserById          -- Should start with usp_
usp_user_select      -- Use descriptive verb
```

### 1.2 Parameter Names

**Pattern**: `@{parameterName}` or `p_{parameterName}`

- **Prefix**: `@` (SQL Server, MySQL) or `p_` (consistent across databases)
- **Case**: camelCase or snake_case (be consistent)
- **Direction**: IN (input), OUT (output), INOUT (both)

```sql
-- ✅ CORRECT - SQL Server style
CREATE PROCEDURE usp_GetUserById
    @userId INT,
    @includeOrders BIT = 0,
    @orderCount INT OUTPUT
AS
...

-- ✅ CORRECT - MySQL style
DELIMITER //
CREATE PROCEDURE usp_GetUserById(
    IN p_userId INT,
    IN p_includeOrders BOOLEAN,
    OUT p_orderCount INT
)
BEGIN
...
END //
DELIMITER ;
```

---

## 2. Stored Procedure Structure

### 2.1 Complete Template

```sql
DELIMITER //

/*******************************************************************************
 * Procedure: usp_GetUserById
 * Description: Retrieves user details by ID with optional order information
 * 
 * Parameters:
 *   @userId INT           - User ID to retrieve
 *   @includeOrders BIT    - Include user orders (default: 0)
 *   @orderCount INT OUT   - Number of orders (output)
 * 
 * Returns:
 *   Result set with user details and optional order information
 * 
 * Return Codes:
 *   0  - Success
 *   -1 - Invalid parameters
 *   -2 - User not found
 *   -3 - Database error
 * 
 * Example:
 *   DECLARE @orderCount INT;
 *   EXEC usp_GetUserById @userId = 123, @includeOrders = 1, @orderCount = @orderCount OUTPUT;
 *   SELECT @orderCount AS OrderCount;
 * 
 * Author: Your Name
 * Created: 2025-10-11
 * Modified: 2025-10-11
 *******************************************************************************/
CREATE PROCEDURE usp_GetUserById(
    IN p_userId INT,
    IN p_includeOrders BOOLEAN,
    OUT p_orderCount INT
)
BEGIN
    -- Variable declarations
    DECLARE v_userExists INT DEFAULT 0;
    
    -- Error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback on error
        ROLLBACK;
        -- Set output to indicate error
        SET p_orderCount = -1;
    END;
    
    -- Validation
    IF p_userId IS NULL OR p_userId <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid userId parameter';
    END IF;
    
    -- Check if user exists
    SELECT COUNT(*) INTO v_userExists
    FROM user
    WHERE id = p_userId;
    
    IF v_userExists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Main query
    START TRANSACTION;
    
    SELECT 
        u.id,
        u.user_name,
        u.email_address,
        u.status,
        u.created_at
    FROM user u
    WHERE u.id = p_userId;
    
    -- Optional: Get orders
    IF p_includeOrders = TRUE THEN
        SELECT 
            o.id,
            o.order_number,
            o.total_amount,
            o.status,
            o.created_at
        FROM order o
        WHERE o.user_id = p_userId
        ORDER BY o.created_at DESC;
        
        -- Set output parameter
        SELECT COUNT(*) INTO p_orderCount
        FROM order
        WHERE user_id = p_userId;
    ELSE
        SET p_orderCount = 0;
    END IF;
    
    COMMIT;
END //

DELIMITER ;
```

---

## 3. Parameter Handling

### 3.1 Parameter Types

```sql
-- ✅ CORRECT - Input parameters with defaults
CREATE PROCEDURE usp_GetUsers(
    IN p_status VARCHAR(20) = 'active',
    IN p_pageSize INT = 20,
    IN p_pageNumber INT = 1,
    OUT p_totalRecords INT
)
BEGIN
    -- Set defaults if NULL
    SET p_status = COALESCE(p_status, 'active');
    SET p_pageSize = COALESCE(p_pageSize, 20);
    SET p_pageNumber = COALESCE(p_pageNumber, 1);
    
    -- ... rest of procedure
END;
```

### 3.2 Parameter Validation

```sql
-- ✅ CORRECT - Always validate parameters
CREATE PROCEDURE usp_CreateOrder(
    IN p_userId INT,
    IN p_totalAmount DECIMAL(10,2),
    OUT p_orderId INT
)
BEGIN
    -- Validate required parameters
    IF p_userId IS NULL OR p_userId <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'userId must be a positive integer';
    END IF;
    
    IF p_totalAmount IS NULL OR p_totalAmount < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'totalAmount must be non-negative';
    END IF;
    
    -- Validate business rules
    IF NOT EXISTS (SELECT 1 FROM user WHERE id = p_userId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User does not exist';
    END IF;
    
    -- ... rest of procedure
END;
```

### 3.3 Parameter Order

**Rule**: Required first, optional last

```sql
-- ✅ CORRECT
CREATE PROCEDURE usp_SearchProducts(
    IN p_categoryId INT,              -- Required
    IN p_minPrice DECIMAL(10,2),      -- Required
    IN p_searchText VARCHAR(200) = NULL,  -- Optional
    IN p_sortBy VARCHAR(50) = 'name',     -- Optional
    IN p_pageSize INT = 20                -- Optional
)
...

-- ❌ WRONG - Optional before required
CREATE PROCEDURE usp_SearchProducts(
    IN p_searchText VARCHAR(200) = NULL,  -- Optional first
    IN p_categoryId INT,                  -- Required last
    IN p_minPrice DECIMAL(10,2)
)
```

---

## 4. Error Handling

### 4.1 TRY-CATCH Pattern (SQL Server)

```sql
CREATE PROCEDURE usp_TransferFunds
    @fromAccountId INT,
    @toAccountId INT,
    @amount DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Start transaction
        BEGIN TRANSACTION;
        
        -- Validation
        IF @amount <= 0
            THROW 50001, 'Amount must be positive', 1;
        
        -- Debit from account
        UPDATE account
        SET balance = balance - @amount
        WHERE id = @fromAccountId
            AND balance >= @amount;
        
        IF @@ROWCOUNT = 0
            THROW 50002, 'Insufficient funds', 1;
        
        -- Credit to account
        UPDATE account
        SET balance = balance + @amount
        WHERE id = @toAccountId;
        
        IF @@ROWCOUNT = 0
            THROW 50003, 'Destination account not found', 1;
        
        -- Commit transaction
        COMMIT TRANSACTION;
        
        -- Return success
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        -- Rollback on error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Log error (optional)
        INSERT INTO error_log (procedure_name, error_message, error_date)
        VALUES ('usp_TransferFunds', ERROR_MESSAGE(), GETDATE());
        
        -- Re-throw or return error code
        THROW;
        
        -- Or return error code
        -- RETURN -1;
    END CATCH
END;
```

### 4.2 Error Handler (MySQL)

```sql
DELIMITER //

CREATE PROCEDURE usp_TransferFunds(
    IN p_fromAccountId INT,
    IN p_toAccountId INT,
    IN p_amount DECIMAL(10,2),
    OUT p_result INT
)
BEGIN
    DECLARE v_fromBalance DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback on error
        ROLLBACK;
        SET p_result = -1;
    END;
    
    -- Validation
    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Amount must be positive';
    END IF;
    
    START TRANSACTION;
    
    -- Check balance
    SELECT balance INTO v_fromBalance
    FROM account
    WHERE id = p_fromAccountId;
    
    IF v_fromBalance < p_amount THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient funds';
    END IF;
    
    -- Debit
    UPDATE account
    SET balance = balance - p_amount
    WHERE id = p_fromAccountId;
    
    -- Credit
    UPDATE account
    SET balance = balance + p_amount
    WHERE id = p_toAccountId;
    
    COMMIT;
    SET p_result = 0;
END //

DELIMITER ;
```

---

## 5. Transaction Management

### 5.1 Transaction Guidelines

```sql
-- ✅ CORRECT - Explicit transaction control
CREATE PROCEDURE usp_ProcessOrder(
    IN p_orderId INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Multiple related operations
    UPDATE order
    SET status = 'processing'
    WHERE id = p_orderId;
    
    UPDATE inventory
    SET quantity = quantity - 1
    WHERE product_id IN (
        SELECT product_id FROM order_item WHERE order_id = p_orderId
    );
    
    INSERT INTO order_log (order_id, action, created_at)
    VALUES (p_orderId, 'processed', NOW());
    
    -- Commit all or nothing
    COMMIT;
END;
```

### 5.2 Keep Transactions Short

```sql
-- ❌ BAD - Long transaction with external call
CREATE PROCEDURE usp_ProcessOrderBad(
    IN p_orderId INT
)
BEGIN
    START TRANSACTION;
    
    -- Database operation
    UPDATE order SET status = 'processing' WHERE id = p_orderId;
    
    -- ❌ WRONG - Don't include external operations in transaction!
    -- CALL external_payment_api(p_orderId);  -- Could take seconds!
    
    COMMIT;
END;

-- ✅ GOOD - Short transaction
CREATE PROCEDURE usp_ProcessOrderGood(
    IN p_orderId INT
)
BEGIN
    -- Call external API BEFORE transaction
    -- (handle this in application layer)
    
    START TRANSACTION;
    
    -- Quick database operations only
    UPDATE order SET status = 'processing' WHERE id = p_orderId;
    UPDATE inventory SET quantity = quantity - 1 WHERE ...;
    
    COMMIT;
END;
```

---

## 6. Performance Best Practices

### 6.1 SET NOCOUNT ON (SQL Server)

```sql
-- ✅ CORRECT - Always use for data modification
CREATE PROCEDURE usp_UpdateUser
    @userId INT,
    @userName VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;  -- Prevents "X rows affected" messages
    
    UPDATE user
    SET user_name = @userName
    WHERE id = @userId;
    
    RETURN 0;
END;
```

### 6.2 Avoid Cursors (Use Set-Based Operations)

```sql
-- ❌ BAD - Cursor (slow)
CREATE PROCEDURE usp_DeactivateOldUsersBad()
BEGIN
    DECLARE v_userId INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT id FROM user WHERE last_login_date < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_userId;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE user SET status = 'inactive' WHERE id = v_userId;
    END LOOP;
    
    CLOSE cur;
END;

-- ✅ GOOD - Set-based operation (fast)
CREATE PROCEDURE usp_DeactivateOldUsersGood()
BEGIN
    UPDATE user
    SET status = 'inactive'
    WHERE last_login_date < DATE_SUB(NOW(), INTERVAL 1 YEAR)
        AND status = 'active';
END;
```

### 6.3 Use Temporary Tables for Complex Processing

```sql
-- ✅ GOOD - Temporary table for multi-step process
CREATE PROCEDURE usp_GenerateMonthlyReport(
    IN p_month INT,
    IN p_year INT
)
BEGIN
    -- Step 1: Create temp table with indexed data
    CREATE TEMPORARY TABLE tmp_monthly_orders (
        user_id INT,
        order_count INT,
        total_amount DECIMAL(10,2),
        INDEX idx_tmp_user_id (user_id)
    );
    
    INSERT INTO tmp_monthly_orders
    SELECT 
        user_id,
        COUNT(*) AS order_count,
        SUM(total_amount) AS total_amount
    FROM order
    WHERE MONTH(created_at) = p_month
        AND YEAR(created_at) = p_year
    GROUP BY user_id;
    
    -- Step 2: Use temp table in complex query
    SELECT 
        u.user_name,
        u.email_address,
        t.order_count,
        t.total_amount,
        CASE
            WHEN t.total_amount > 1000 THEN 'Premium'
            WHEN t.total_amount > 500 THEN 'Standard'
            ELSE 'Basic'
        END AS customer_tier
    FROM user u
    INNER JOIN tmp_monthly_orders t ON t.user_id = u.id
    ORDER BY t.total_amount DESC;
    
    -- Cleanup
    DROP TEMPORARY TABLE tmp_monthly_orders;
END;
```

---

## 7. Return Values and Result Sets

### 7.1 Return Codes

```sql
-- ✅ CORRECT - Consistent return codes
CREATE PROCEDURE usp_CreateUser(
    IN p_userName VARCHAR(100),
    IN p_email VARCHAR(255),
    OUT p_userId INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_userId = -3;  -- Database error
    END;
    
    -- Validation
    IF p_userName IS NULL OR p_email IS NULL THEN
        SET p_userId = -1;  -- Invalid parameters
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid parameters';
    END IF;
    
    -- Check duplicate
    IF EXISTS (SELECT 1 FROM user WHERE email_address = p_email) THEN
        SET p_userId = -2;  -- Duplicate email
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
    END IF;
    
    -- Insert user
    START TRANSACTION;
    
    INSERT INTO user (user_name, email_address, created_at)
    VALUES (p_userName, p_email, NOW());
    
    SET p_userId = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return success (0)
    -- Note: MySQL doesn't have RETURN statement, use OUT parameter
END;
```

**Standard Return Codes**:
- `0` - Success
- `-1` - Invalid parameters
- `-2` - Business rule violation
- `-3` - Database error
- `-4` - Not found
- `-5` - Permission denied

### 7.2 Multiple Result Sets

```sql
-- ✅ CORRECT - Multiple related result sets
CREATE PROCEDURE usp_GetUserDashboard(
    IN p_userId INT
)
BEGIN
    -- Result Set 1: User info
    SELECT 
        id,
        user_name,
        email_address,
        status
    FROM user
    WHERE id = p_userId;
    
    -- Result Set 2: Recent orders
    SELECT 
        id,
        order_number,
        total_amount,
        status,
        created_at
    FROM order
    WHERE user_id = p_userId
    ORDER BY created_at DESC
    LIMIT 10;
    
    -- Result Set 3: Statistics
    SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_spent,
        AVG(total_amount) AS avg_order_value
    FROM order
    WHERE user_id = p_userId;
END;
```

---

## 8. Documentation Standards

### 8.1 Header Comment Block

```sql
/*******************************************************************************
 * Procedure: usp_ProcedureName
 * Description: Brief description of what the procedure does
 * 
 * Parameters:
 *   @param1 TYPE     - Description of parameter 1
 *   @param2 TYPE     - Description of parameter 2 (default: value)
 *   @output TYPE OUT - Description of output parameter
 * 
 * Returns:
 *   Result set description OR return code meaning
 * 
 * Return Codes:
 *   0  - Success
 *   -1 - Invalid parameters
 *   -2 - Business rule violation
 * 
 * Example:
 *   DECLARE @output INT;
 *   EXEC usp_ProcedureName @param1 = 123, @param2 = 'value', @output = @output OUTPUT;
 *   SELECT @output;
 * 
 * Dependencies:
 *   - table_name (SELECT)
 *   - other_table (UPDATE)
 * 
 * Notes:
 *   - Any special considerations
 *   - Performance notes
 *   - Known limitations
 * 
 * Author: Your Name
 * Created: 2025-10-11
 * Modified: 2025-10-11 - Initial version
 *          2025-10-15 - Added validation for param2
 *******************************************************************************/
```

---

## 9. Security Best Practices

### 9.1 Parameterized Queries

```sql
-- ✅ CORRECT - Parameterized
CREATE PROCEDURE usp_GetUserByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT id, user_name, email_address
    FROM user
    WHERE email_address = p_email;  -- Safe: parameterized
END;

-- ❌ WRONG - Dynamic SQL without parameterization
CREATE PROCEDURE usp_GetUserByEmailBad(
    IN p_email VARCHAR(255)
)
BEGIN
    SET @sql = CONCAT('SELECT * FROM user WHERE email_address = ''', p_email, '''');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;  -- SQL Injection vulnerability!
    DEALLOCATE PREPARE stmt;
END;

-- ✅ CORRECT - Dynamic SQL with parameterization
CREATE PROCEDURE usp_GetUserByEmailGood(
    IN p_email VARCHAR(255)
)
BEGIN
    SET @sql = 'SELECT id, user_name, email_address FROM user WHERE email_address = ?';
    PREPARE stmt FROM @sql;
    SET @param1 = p_email;
    EXECUTE stmt USING @param1;  -- Safe: parameterized
    DEALLOCATE PREPARE stmt;
END;
```

### 9.2 Least Privilege

```sql
-- ✅ CORRECT - Grant specific permissions
GRANT EXECUTE ON PROCEDURE usp_GetUserById TO app_user;
GRANT EXECUTE ON PROCEDURE usp_CreateOrder TO app_user;

-- Don't grant direct table access to application users
-- Users interact through stored procedures only
```

---

## 10. Testing Stored Procedures

### 10.1 Test Template

```sql
-- Test: usp_CreateUser
-- Test Case 1: Valid input
CALL usp_CreateUser('testuser', 'test@example.com', @userId);
SELECT @userId;  -- Should return positive ID

-- Test Case 2: Duplicate email
CALL usp_CreateUser('testuser2', 'test@example.com', @userId);
SELECT @userId;  -- Should return -2 (duplicate)

-- Test Case 3: NULL parameters
CALL usp_CreateUser(NULL, NULL, @userId);
SELECT @userId;  -- Should return -1 (invalid parameters)

-- Cleanup
DELETE FROM user WHERE email_address = 'test@example.com';
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related**: [Main Index](./sql.instructions.md) | [Security](./sql-security.instructions.md)
