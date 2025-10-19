# PHP Basics - Core Fundamentals and Best Practices

## Table of Contents
- [PHP Syntax Fundamentals](#php-syntax-fundamentals)
- [Variable Declaration](#variable-declaration)
- [Data Types](#data-types)
- [Functions](#functions)
- [Classes and Objects](#classes-and-objects)
- [Namespaces](#namespaces)
- [Error Handling](#error-handling)
- [PSR Standards](#psr-standards)

## PHP Syntax Fundamentals

### PHP Tags
```php
<?php
// Always use full opening tag
// Never use short tags <? or <?= in libraries

// Code here
```

**Best Practices:**
- ✅ Always use `<?php` opening tag
- ✅ Omit closing `?>` tag in pure PHP files
- ✅ Use `<?=` only for template output
- ❌ Never use short tags `<?` (deprecated)

### Comments
```php
<?php

// Single-line comment

/*
 * Multi-line comment
 * Use for longer explanations
 */

/**
 * DocBlock comment for documentation
 * 
 * @param string $name User's name
 * @return string Greeting message
 */
function greet(string $name): string {
    return "Hello, {$name}!";
}
```

## Variable Declaration

### Naming Conventions (PSR-1)
```php
<?php

// Variables: camelCase
$userName = 'John';
$isActive = true;
$totalCount = 100;

// Constants: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 3;
define('API_KEY', 'your-api-key');

// Class constants
class Config {
    public const DEFAULT_TIMEOUT = 30;
    private const SECRET_KEY = 'secret';
}
```

### Variable Scope
```php
<?php

// Global scope
$globalVar = 'I am global';

function testScope() {
    // Local scope
    $localVar = 'I am local';
    
    // Access global variable
    global $globalVar;
    echo $globalVar;
    
    // Better: use parameter
    // testScope($globalVar);
}

// Static variables
function counter() {
    static $count = 0;
    return ++$count;
}

echo counter(); // 1
echo counter(); // 2
```

**Best Practices:**
- ✅ Minimize global variable usage
- ✅ Pass variables as parameters
- ✅ Use dependency injection over globals
- ❌ Avoid `global` keyword when possible

## Data Types

### Scalar Types
```php
<?php

// String
$name = 'John Doe';
$message = "Hello, {$name}"; // String interpolation

// Integer
$age = 30;
$hexValue = 0x1A; // Hexadecimal
$binaryValue = 0b1010; // Binary

// Float
$price = 19.99;
$scientific = 1.2e3; // 1200

// Boolean
$isActive = true;
$hasPermission = false;

// Null
$emptyValue = null;
```

### Compound Types
```php
<?php

// Array (indexed)
$fruits = ['apple', 'banana', 'orange'];
$numbers = [1, 2, 3, 4, 5];

// Array (associative)
$user = [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'age' => 30,
];

// Multi-dimensional array
$users = [
    ['name' => 'John', 'age' => 30],
    ['name' => 'Jane', 'age' => 25],
];

// Object
$user = new stdClass();
$user->name = 'John';
$user->email = 'john@example.com';
```

### Type Declarations (PHP 7.0+)
```php
<?php

// Scalar type hints (strict mode)
declare(strict_types=1);

function addNumbers(int $a, int $b): int {
    return $a + $b;
}

// Return type declarations
function getUser(int $id): ?array {
    // ? indicates nullable return
    return $id > 0 ? ['id' => $id] : null;
}

// Union types (PHP 8.0+)
function processValue(int|float $value): int|float {
    return $value * 2;
}

// Mixed type (PHP 8.0+)
function handleData(mixed $data): mixed {
    return $data;
}
```

**Best Practices:**
- ✅ Always use `declare(strict_types=1)` at the top of files
- ✅ Use type declarations for function parameters
- ✅ Use return type declarations
- ✅ Use nullable types `?` when appropriate
- ✅ Prefer union types over mixed when possible

## Functions

### Function Declaration
```php
<?php

declare(strict_types=1);

/**
 * Calculate the total price with tax
 * 
 * @param float $price Base price
 * @param float $taxRate Tax rate (e.g., 0.1 for 10%)
 * @return float Total price with tax
 */
function calculateTotal(float $price, float $taxRate = 0.1): float {
    return $price * (1 + $taxRate);
}

// Named arguments (PHP 8.0+)
$total = calculateTotal(price: 100.0, taxRate: 0.15);
```

### Arrow Functions (PHP 7.4+)
```php
<?php

// Traditional anonymous function
$multiply = function($x, $y) {
    return $x * $y;
};

// Arrow function (short closure)
$multiply = fn($x, $y) => $x * $y;

// Use in array operations
$numbers = [1, 2, 3, 4, 5];
$squared = array_map(fn($n) => $n * $n, $numbers);
```

### Variable Functions
```php
<?php

function greet(string $name): string {
    return "Hello, {$name}!";
}

// Call function by name
$functionName = 'greet';
echo $functionName('John'); // Hello, John!

// Callback functions
function processArray(array $data, callable $callback): array {
    return array_map($callback, $data);
}

$result = processArray([1, 2, 3], fn($n) => $n * 2);
```

## Classes and Objects

### Class Definition (PSR-1, PSR-12)
```php
<?php

declare(strict_types=1);

namespace App\Models;

/**
 * User model representing a user entity
 */
class User {
    // Properties with type declarations (PHP 7.4+)
    private int $id;
    private string $name;
    private string $email;
    private bool $isActive;
    
    // Constructor property promotion (PHP 8.0+)
    public function __construct(
        int $id,
        string $name,
        string $email,
        bool $isActive = true
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->isActive = $isActive;
    }
    
    // Getter methods
    public function getId(): int {
        return $this->id;
    }
    
    public function getName(): string {
        return $this->name;
    }
    
    public function getEmail(): string {
        return $this->email;
    }
    
    public function isActive(): bool {
        return $this->isActive;
    }
    
    // Setter methods with validation
    public function setName(string $name): self {
        if (empty($name)) {
            throw new \InvalidArgumentException('Name cannot be empty');
        }
        $this->name = $name;
        return $this;
    }
    
    public function activate(): self {
        $this->isActive = true;
        return $this;
    }
    
    public function deactivate(): self {
        $this->isActive = false;
        return $this;
    }
}
```

### Constructor Property Promotion (PHP 8.0+)
```php
<?php

// Before PHP 8.0
class UserOld {
    private int $id;
    private string $name;
    
    public function __construct(int $id, string $name) {
        $this->id = $id;
        $this->name = $name;
    }
}

// PHP 8.0+ (cleaner)
class User {
    public function __construct(
        private int $id,
        private string $name,
        private readonly string $email // Readonly property (PHP 8.1+)
    ) {}
    
    public function getId(): int {
        return $this->id;
    }
}
```

### Inheritance
```php
<?php

declare(strict_types=1);

namespace App\Models;

abstract class BaseModel {
    protected int $id;
    protected \DateTime $createdAt;
    
    public function __construct(int $id) {
        $this->id = $id;
        $this->createdAt = new \DateTime();
    }
    
    abstract public function validate(): bool;
    
    public function getId(): int {
        return $this->id;
    }
}

class Product extends BaseModel {
    public function __construct(
        int $id,
        private string $name,
        private float $price
    ) {
        parent::__construct($id);
    }
    
    public function validate(): bool {
        return !empty($this->name) && $this->price > 0;
    }
}
```

### Interfaces and Traits
```php
<?php

// Interface
interface LoggerInterface {
    public function log(string $message): void;
    public function error(string $message): void;
}

// Trait
trait TimestampTrait {
    private \DateTime $createdAt;
    private ?\DateTime $updatedAt = null;
    
    public function initTimestamps(): void {
        $this->createdAt = new \DateTime();
    }
    
    public function updateTimestamp(): void {
        $this->updatedAt = new \DateTime();
    }
}

// Using interface and trait
class FileLogger implements LoggerInterface {
    use TimestampTrait;
    
    public function __construct(private string $filePath) {
        $this->initTimestamps();
    }
    
    public function log(string $message): void {
        $this->writeToFile('INFO', $message);
    }
    
    public function error(string $message): void {
        $this->writeToFile('ERROR', $message);
    }
    
    private function writeToFile(string $level, string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$level}: {$message}\n";
        file_put_contents($this->filePath, $logEntry, FILE_APPEND);
    }
}
```

## Namespaces

### Namespace Declaration (PSR-4)
```php
<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Models\User;
use App\Services\UserService;
use App\Exceptions\ValidationException;

class UserController {
    public function __construct(
        private UserService $userService
    ) {}
    
    public function getUser(int $id): User {
        return $this->userService->findById($id);
    }
}
```

### Importing Classes
```php
<?php

// Import with use
use App\Models\User;
use App\Models\Product as ProductModel; // Alias
use App\Services\{UserService, ProductService}; // Group use

// Fully qualified name
$user = new \App\Models\User();

// With alias
$product = new ProductModel();
```

**Best Practices:**
- ✅ One class per file
- ✅ Namespace matches directory structure (PSR-4)
- ✅ Use `use` statements at the top
- ✅ Group related imports
- ✅ Use aliases to avoid conflicts

## Error Handling

### Exceptions
```php
<?php

declare(strict_types=1);

// Custom exception
class ValidationException extends \Exception {
    public function __construct(
        string $message,
        private array $errors = []
    ) {
        parent::__construct($message);
    }
    
    public function getErrors(): array {
        return $this->errors;
    }
}

// Using exceptions
function validateUser(array $data): void {
    $errors = [];
    
    if (empty($data['email'])) {
        $errors['email'] = 'Email is required';
    }
    
    if (empty($data['password'])) {
        $errors['password'] = 'Password is required';
    }
    
    if (!empty($errors)) {
        throw new ValidationException('Validation failed', $errors);
    }
}

// Catching exceptions
try {
    validateUser(['email' => '']);
} catch (ValidationException $e) {
    echo $e->getMessage();
    print_r($e->getErrors());
} catch (\Exception $e) {
    echo 'An error occurred: ' . $e->getMessage();
} finally {
    // Cleanup code
    echo 'Cleanup completed';
}
```

### Error Handling
```php
<?php

// Set error reporting (development)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Set error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// Set exception handler
set_exception_handler(function($exception) {
    error_log($exception->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
});
```

## PSR Standards

### PSR-1: Basic Coding Standard
- Files MUST use only `<?php` tags
- Files MUST use only UTF-8 without BOM
- Class names MUST be in PascalCase
- Method names MUST be in camelCase
- Constants MUST be in UPPER_SNAKE_CASE

### PSR-12: Extended Coding Style
```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;

class UserService
{
    public function __construct(
        private UserRepository $repository
    ) {
    }

    public function createUser(
        string $name,
        string $email,
        string $password
    ): User {
        // Method body with 4-space indentation
        $user = new User(
            name: $name,
            email: $email
        );
        
        return $this->repository->save($user);
    }
}
```

**Key Points:**
- 4 spaces for indentation (never tabs)
- Opening brace on new line for classes
- Opening brace on same line for methods
- One blank line after namespace declaration
- One blank line after use statements

## Best Practices Summary

### DO ✅
- Use `declare(strict_types=1)` at the beginning
- Use type declarations for all parameters and return types
- Follow PSR-1 and PSR-12 coding standards
- Use meaningful variable and function names
- Document complex code with DocBlocks
- Use exceptions for error handling
- Validate all user input
- Use prepared statements for database queries
- Implement proper error logging

### DON'T ❌
- Don't use short PHP tags `<?`
- Don't suppress errors with `@` operator
- Don't use global variables
- Don't use `var_dump()` or `print_r()` in production
- Don't concatenate SQL queries
- Don't store passwords in plain text
- Don't use `==` for comparisons (use `===`)
- Don't ignore return values
- Don't write functions longer than 50 lines

## Performance Tips

1. **Use OPcache** - Enable bytecode caching
2. **Lazy Loading** - Load classes only when needed
3. **String Optimization** - Use single quotes for simple strings
4. **Array Operations** - Use built-in array functions
5. **Database** - Use indexes and optimize queries
6. **Caching** - Implement Redis or Memcached
7. **Profile** - Use Xdebug or Blackfire for profiling

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
