# PHP Memory Context

**Last Updated**: 2025-10-19  
**PHP Version**: 8.3  
**Framework**: None (will be updated based on project)  
**Module System**: Composer/PSR-4 Autoloading

## Project Context

This file maintains context about your PHP development environment and preferences. The AI assistant will reference this file to provide accurate, project-specific guidance.

## Environment Information

### PHP Runtime
- **Version**: 8.3.x
- **Extensions**: (to be filled based on your project)
  - PDO
  - OpenSSL
  - Mbstring
  - GD/Imagick
  - Redis/Memcached
  - Opcache

### Frameworks & Libraries
- **Framework**: None
- **Database**: None
- **Cache**: None
- **Template Engine**: None
- **Testing**: PHPUnit
- **Code Style**: PSR-12

### Coding Standards
- **PSR Standards**: PSR-1, PSR-4, PSR-12
- **Type Declarations**: Strict types enabled (`declare(strict_types=1)`)
- **Property Types**: All properties have type declarations
- **Return Types**: All functions/methods have return type declarations
- **Naming Conventions**:
  - Classes: PascalCase
  - Methods/Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Properties: camelCase
  - Namespaces: PascalCase

## Development Preferences

### Code Style
```php
<?php

declare(strict_types=1);

namespace App\Example;

use Exception;

class ExampleClass
{
    private int $exampleProperty;
    
    public function __construct(int $value)
    {
        $this->exampleProperty = $value;
    }
    
    public function exampleMethod(string $param): string
    {
        return "Example: {$param}";
    }
}
```

### Error Handling Philosophy
- Use exceptions for error handling
- Create custom exception classes for domain-specific errors
- Always catch and handle exceptions appropriately
- Log errors for debugging

### Security Approach
- Always use prepared statements
- Validate and sanitize all inputs
- Escape all outputs based on context
- Implement CSRF protection
- Use Argon2id for password hashing
- Enable strict session security

### Testing Strategy
- Unit tests for business logic
- Integration tests for database interactions
- Feature tests for HTTP endpoints
- Minimum 80% code coverage goal

## Project Structure

```
src/
├── Controllers/     # HTTP request handlers
├── Models/          # Domain models and entities
├── Services/        # Business logic
├── Repositories/    # Data access layer
├── Middleware/      # HTTP middleware
├── Exceptions/      # Custom exceptions
├── Helpers/         # Utility functions
└── Config/          # Configuration files

tests/
├── Unit/            # Unit tests
├── Integration/     # Integration tests
└── Feature/         # Feature tests

config/              # Application configuration
public/              # Public web root
vendor/              # Composer dependencies
```

## Database Patterns

### Preferred ORM/Query Builder
- **Primary**: PDO with prepared statements
- **Alternative**: Doctrine ORM / Eloquent (if applicable)

### Database Conventions
- Table names: plural, snake_case (users, blog_posts)
- Primary keys: id (integer, auto-increment)
- Timestamps: created_at, updated_at (DATETIME)
- Soft deletes: deleted_at (DATETIME, nullable)
- Foreign keys: singular_name_id (user_id, post_id)

## Common Patterns Used

### Dependency Injection
```php
<?php

class UserService
{
    public function __construct(
        private UserRepository $repository,
        private PasswordManager $passwordManager,
        private LoggerInterface $logger
    ) {}
}
```

### Repository Pattern
```php
<?php

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function save(User $user): void;
    public function delete(int $id): void;
}
```

### Service Layer
```php
<?php

class UserService
{
    public function createUser(string $email, string $password): User
    {
        // Business logic here
    }
}
```

## Performance Considerations

### Caching Strategy
- Opcache enabled for bytecode caching
- Application-level caching with Redis/Memcached
- Database query result caching
- Template caching

### Optimization Priorities
1. Enable Opcache
2. Optimize database queries (use indexes, EXPLAIN)
3. Implement application caching
4. Use lazy loading
5. Minimize memory usage in loops
6. Profile with Xdebug/Blackfire

## Notes and Reminders

### Current Focus Areas
- (Add specific areas you're working on)

### Known Issues
- (Track ongoing problems or technical debt)

### Future Improvements
- (List planned enhancements)

---

## Instructions for AI Assistant

When working with this project:

1. **Always check this file first** for context about PHP version, frameworks, and preferences
2. **Apply strict type declarations** (`declare(strict_types=1)`) to all files
3. **Follow PSR-12 coding standards** for all code generation
4. **Use constructor property promotion** (PHP 8.0+) when appropriate
5. **Implement proper error handling** with exceptions
6. **Add type declarations** to all parameters and return types
7. **Include DocBlock comments** for complex logic
8. **Write secure code** - validate inputs, escape outputs, use prepared statements
9. **Consider performance** - suggest optimizations where applicable
10. **Update this file** if you discover new project-specific information

### Code Generation Guidelines

- Generate modern PHP 8.x code
- Use enums for fixed sets of values (PHP 8.1+)
- Use readonly properties where appropriate (PHP 8.1+)
- Use match expressions over switch statements
- Use arrow functions for simple callbacks
- Use named arguments for better readability
- Use null coalescing and nullsafe operators
- Use spread operator for array merging

### Security Checklist

When generating code involving:
- **User Input**: Always validate and sanitize
- **Database Queries**: Always use prepared statements
- **Output**: Always escape based on context
- **File Operations**: Validate paths and file types
- **Authentication**: Use Argon2id or bcrypt
- **Sessions**: Use secure configuration
- **Passwords**: Never store plain text
- **Cryptography**: Use modern algorithms

---

**This file should be updated whenever:**
- PHP version changes
- New frameworks or libraries are added
- Coding standards are modified
- New patterns are adopted
- Project structure changes
