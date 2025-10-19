# PHP Rules and Guidelines

This directory contains comprehensive PHP development guidelines and best practices for maintaining code quality, security, and performance in PHP projects.

## 📚 Available Guidelines

### Core PHP Development
- **[basics.md](./basics.md)** - PHP fundamentals, syntax, and core concepts
- **[async.md](./async.md)** - Asynchronous programming patterns and ReactPHP
- **[security.md](./security.md)** - Security best practices and vulnerability prevention
- **[testing.md](./testing.md)** - Unit testing, integration testing, and PHPUnit
- **[optimization.md](./optimization.md)** - Performance optimization and caching strategies
- **[advanced.md](./advanced.md)** - Advanced patterns, traits, and modern PHP features

## 🎯 Purpose

These guidelines serve as a reference for:
- Writing clean, maintainable PHP code
- Following PSR standards (PSR-1, PSR-2, PSR-4, PSR-12)
- Implementing secure coding practices
- Optimizing PHP application performance
- Applying modern PHP 8.x features
- Testing and quality assurance

## 📖 How to Use

1. **For New Projects**: Review all guidelines to establish coding standards
2. **For Code Reviews**: Reference specific sections when reviewing code
3. **For Learning**: Study each file to understand PHP best practices
4. **For AI Agents**: These files provide context for code generation and analysis

## 🔗 Related Resources

- **Memory Context**: `context/memory/php/php-memory.md` - Project-specific PHP context
- **PSR Standards**: [PHP-FIG PSR Standards](https://www.php-fig.org/psr/)
- **PHP Documentation**: [Official PHP Manual](https://www.php.net/manual/)

## 📋 Quick Reference

### PSR Standards Applied
- **PSR-1**: Basic Coding Standard
- **PSR-2**: Coding Style Guide (deprecated, use PSR-12)
- **PSR-4**: Autoloading Standard
- **PSR-12**: Extended Coding Style Guide
- **PSR-3**: Logger Interface
- **PSR-7**: HTTP Message Interface

### Naming Conventions
- **Classes**: PascalCase (`UserController`, `DatabaseConnection`)
- **Methods**: camelCase (`getUserById()`, `processPayment()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_VERSION`)
- **Properties**: camelCase (`$userName`, `$isActive`)
- **Namespaces**: PascalCase (`App\Controllers\Api`)

### File Organization
```
src/
├── Controllers/     # HTTP controllers
├── Models/          # Data models and entities
├── Services/        # Business logic services
├── Repositories/    # Data access layer
├── Middleware/      # HTTP middleware
├── Helpers/         # Helper functions
└── Config/          # Configuration files
```

## 🚀 Modern PHP Features (8.0+)

- Named Arguments
- Union Types
- Match Expressions
- Nullsafe Operator
- Constructor Property Promotion
- Attributes (Annotations)
- Enumerations
- Readonly Properties
- Fibers (Asynchronous Programming)

## 🛡️ Security Priorities

1. **Input Validation**: Always validate and sanitize user input
2. **SQL Injection Prevention**: Use prepared statements
3. **XSS Protection**: Escape output properly
4. **CSRF Protection**: Implement token validation
5. **Authentication**: Use secure password hashing (bcrypt, argon2)
6. **Authorization**: Implement proper access control

## ⚡ Performance Best Practices

1. Use OPcache for bytecode caching
2. Implement application-level caching (Redis, Memcached)
3. Optimize database queries and use indexes
4. Use lazy loading and eager loading appropriately
5. Minimize memory usage in loops
6. Profile with Xdebug or Blackfire

## 📞 Support

For questions or suggestions about these guidelines:
- Create an issue on the repository
- Submit a pull request with improvements
- Contact the maintainer: @1naichii

---

**Version**: 1.0  
**Last Updated**: 2025-10-19  
**Maintained By**: 1naichii
