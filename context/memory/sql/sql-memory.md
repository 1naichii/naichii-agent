# SQL Database Context

**Database System**: (Not yet configured)
**Version**: (Not yet configured)
**Last Updated**: 2025-10-12

## Database Configuration

- **Character Set**: (Not yet configured)
- **Collation**: (Not yet configured)
- **Storage Engine**: (Not yet configured)

## Database-Specific Features

(Will be populated based on your database system)

## Connection Details

- **Default Port**: (Not yet configured)
- **Time Zone**: (Not yet configured)

## Naming Conventions

Following guidelines from context/rules/sql/:

### Tables & Columns
- **Tables**: Singular nouns, snake_case
  - Examples: user, order, order_item
- **Columns**: snake_case
  - Examples: user_name, email_address, created_at

### Primary Keys
- **Format**: id or {table_name}_id
- **Type**: INT or BIGINT with AUTO_INCREMENT

### Foreign Keys
- **Format**: {referenced_table}_id
- **Example**: user_id references user(id)

### Indexes
- **Naming**: idx_{table}_{column(s)}
- **Example**: idx_user_email, idx_order_user_id_created_at

### Constraints
- **Naming**: {type}_{table}_{column(s)}
- **Examples**: 
  - fk_order_user_id
  - uk_user_email
  - chk_order_status

### Stored Procedures
- **Pattern**: usp_{Action}{Entity}[ByCondition]
- **Examples**: usp_GetUserById, usp_CreateOrder, usp_UpdateUserProfile

### Variables
- **Local variables**: v_variableName
- **Parameters**: p_parameterName or @parameterName

## Project-Specific Schema

(Will be populated with your project schema information)

## Performance Notes

- Use EXPLAIN or EXPLAIN ANALYZE for query optimization
- Consider covering indexes for frequently queried columns
- Monitor slow query log for optimization opportunities

## Common Patterns

### Date/Time Functions
- Current datetime functions
- Date arithmetic operations
- Timestamp calculations

### String Functions
- String concatenation
- Substring extraction
- Case conversion

### Aggregation
- Standard aggregation functions
- Grouping and summarization

## Notes

- Always use prepared statements/parameterized queries
- Use transactions for data consistency
- Regular backups recommended
- Follow database-specific best practices

## Project-Specific Notes

(Add any project-specific database configurations, custom functions, or conventions here)

---

## Usage Instructions

This file is automatically created/updated when the SQL Database Expert Mode chatmode is initialized.

The AI assistant will use this context to generate optimized queries, follow naming conventions, and use database-specific features.

**This memory file has been cleaned and is ready for a new project.**

---

**Maintained By**: AI Agent (SQL Development Expert Mode)
**Mode Version**: 1.0
