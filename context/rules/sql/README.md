# SQL Development Rules

This directory contains detailed SQL development guidelines organized by concern.

## 📁 File Structure

```
context/rules/sql/
├── basics.md                  # Schema design, naming conventions, formatting
├── optimization.md            # Performance tuning, indexing, query optimization
├── stored-procedures.md       # Stored procedure development guidelines
├── security.md               # Security best practices, injection prevention
└── advanced.md               # Advanced SQL techniques (CTEs, JSON, etc.)
```

## 🎯 How to Use These Rules

### For Developers

**Quick Reference**: Always start with `.github/instructions/sql.instructions.md` for critical rules.

**Detailed Help**: Reference specific files based on your task:

| Task | File to Reference |
|------|-------------------|
| Creating tables, designing schema | `basics.md` |
| Fixing slow queries, adding indexes | `optimization.md` |
| Writing stored procedures | `stored-procedures.md` |
| Implementing security features | `security.md` |
| Using CTEs, window functions, JSON | `advanced.md` |

### For GitHub Copilot

When working on SQL files, Copilot will automatically apply:
- **Critical rules** from `.github/instructions/sql.instructions.md` (always)
- **Detailed rules** from relevant file in `context/rules/sql/` (on-demand)

**To get better suggestions**, mention the specific rule file:
```
// Example in your prompt:
"Optimize this query following @context/rules/sql/optimization.md"
"Create secure stored procedure using @context/rules/sql/security.md"
```

## 📊 File Overview

### basics.md (~640 lines)
- Naming conventions (tables, columns, indexes)
- Schema design patterns
- SQL formatting standards
- Query structure basics
- Data type selection

### optimization.md (~580 lines)
- Execution plan analysis
- Advanced indexing strategies
- JOIN optimization techniques
- Query pattern performance
- Batch processing

### stored-procedures.md (~780 lines)
- Naming conventions for procedures
- Parameter handling
- Error handling patterns
- Transaction management
- Performance best practices

### security.md (~570 lines)
- SQL injection prevention
- Access control and permissions
- Data encryption
- Auditing and logging
- Row-level security

### advanced.md (~500 lines)
- Common Table Expressions (CTEs)
- Recursive queries
- Window functions
- JSON operations
- Full-text search
- Table partitioning

## 🔄 Update History

**Version 3.0** (2025-10-11)
- Moved detailed rules from `.github/instructions/` to `context/rules/sql/`
- Simplified file names (removed `.instructions` suffix)
- Updated main index to reference new structure
- Improved on-demand rule loading for Copilot

**Previous Version**: Monolithic `sql.instructions.md` (~3000 lines)

---

**Maintained by**: Development Team  
**Last Updated**: 2025-10-11
