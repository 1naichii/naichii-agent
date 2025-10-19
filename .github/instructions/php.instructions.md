# PHP Development Instructions for GitHub Copilot

These instructions guide GitHub Copilot when working with PHP code in this project.

## Core Principles

### 1. Always Use Strict Types
```php
<?php

declare(strict_types=1);
```

### 2. Follow PSR Standards
- **PSR-1**: Basic Coding Standard
- **PSR-4**: Autoloading Standard
- **PSR-12**: Extended Coding Style Guide

### 3. Type Declarations Required
```php
// ✅ CORRECT: With type declarations
public function getUserById(int $id): ?User
{
    return $this->repository->find($id);
}

// ❌ WRONG: No type declarations
public function getUserById($id)
{
    return $this->repository->find($id);
}
```

## Naming Conventions

### Classes and Interfaces
```php
class UserController {}        // PascalCase
interface LoggerInterface {}   // PascalCase + Interface suffix
abstract class BaseModel {}    // PascalCase + descriptive
trait TimestampTrait {}        // PascalCase + Trait suffix
enum Status {}                 // PascalCase
```

### Methods and Functions
```php
public function getUserById(int $id): ?User {}     // camelCase
private function validateEmail(string $email): bool {}  // camelCase
protected function processData(array $data): void {}    // camelCase
```

### Properties and Variables
```php
private int $userId;              // camelCase
protected string $userName;       // camelCase
private readonly string $email;   // camelCase + readonly
```

### Constants
```php
const MAX_LOGIN_ATTEMPTS = 3;                  // UPPER_SNAKE_CASE
public const DEFAULT_TIMEOUT = 30;             // UPPER_SNAKE_CASE
private const SECRET_KEY = 'secret';           // UPPER_SNAKE_CASE
```

## Code Structure

### File Structure
```php
<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use App\Exceptions\ValidationException;
use Psr\Log\LoggerInterface;

/**
 * User controller handling HTTP requests
 */
class UserController
{
    public function __construct(
        private UserService $userService,
        private LoggerInterface $logger
    ) {}
    
    public function show(int $id): array
    {
        try {
            return $this->userService->getUserById($id);
        } catch (ValidationException $e) {
            $this->logger->error($e->getMessage());
            throw $e;
        }
    }
}
```

### Constructor Property Promotion (PHP 8.0+)
```php
// ✅ PREFERRED: Constructor property promotion
class UserService
{
    public function __construct(
        private UserRepository $repository,
        private LoggerInterface $logger
    ) {}
}

// ❌ AVOID: Old style (only if PHP < 8.0)
class UserService
{
    private UserRepository $repository;
    private LoggerInterface $logger;
    
    public function __construct(UserRepository $repository, LoggerInterface $logger)
    {
        $this->repository = $repository;
        $this->logger = $logger;
    }
}
```

## Security Requirements

### 1. SQL Injection Prevention
```php
// ✅ ALWAYS: Use prepared statements
public function findByEmail(string $email): ?User
{
    $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// ❌ NEVER: Concatenate queries
public function findByEmail(string $email): ?User
{
    $query = "SELECT * FROM users WHERE email = '{$email}'"; // SQL INJECTION!
    return $this->pdo->query($query)->fetch();
}
```

### 2. XSS Prevention
```php
// ✅ ALWAYS: Escape output based on context
echo htmlspecialchars($user['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8');  // HTML context
echo json_encode($user['name'], JSON_HEX_TAG | JSON_HEX_AMP);           // JS context
echo urlencode($user['name']);                                           // URL context

// ❌ NEVER: Raw output
echo $user['name'];  // XSS vulnerability!
```

### 3. Password Hashing
```php
// ✅ ALWAYS: Use Argon2id or bcrypt
$hash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost' => 4,
    'threads' => 3,
]);

// ❌ NEVER: Use MD5, SHA1, or plain text
$hash = md5($password);        // Insecure!
$hash = sha1($password);       // Insecure!
$hash = $password;             // Insecure!
```

### 4. Input Validation
```php
// ✅ ALWAYS: Validate all inputs
public function createUser(string $email, string $password): User
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ValidationException('Invalid email format');
    }
    
    if (strlen($password) < 8) {
        throw new ValidationException('Password too short');
    }
    
    // Continue with creation
}

// ❌ NEVER: Trust user input
public function createUser(string $email, string $password): User
{
    // No validation - dangerous!
    return $this->repository->create($email, $password);
}
```

### 5. CSRF Protection
```php
// ✅ ALWAYS: Validate CSRF tokens for state-changing operations
public function updateProfile(array $data): void
{
    if (!$this->validateCsrfToken($_POST['csrf_token'] ?? '')) {
        throw new SecurityException('Invalid CSRF token');
    }
    
    $this->userService->update($data);
}
```

## Error Handling

### Use Exceptions
```php
// ✅ PREFERRED: Use exceptions
public function getUserById(int $id): User
{
    $user = $this->repository->find($id);
    
    if ($user === null) {
        throw new UserNotFoundException("User with ID {$id} not found");
    }
    
    return $user;
}

// ❌ AVOID: Returning null or false for errors
public function getUserById(int $id): ?User
{
    return $this->repository->find($id);  // Caller must check for null
}
```

### Custom Exceptions
```php
namespace App\Exceptions;

class ValidationException extends \Exception
{
    public function __construct(
        string $message,
        private array $errors = []
    ) {
        parent::__construct($message);
    }
    
    public function getErrors(): array
    {
        return $this->errors;
    }
}
```

### Try-Catch Blocks
```php
// ✅ CORRECT: Specific exceptions first
try {
    $result = $this->processPayment($amount);
} catch (InsufficientFundsException $e) {
    $this->logger->warning('Insufficient funds', ['user' => $userId]);
    throw $e;
} catch (PaymentGatewayException $e) {
    $this->logger->error('Payment gateway error', ['error' => $e->getMessage()]);
    throw new PaymentFailedException('Payment processing failed', 0, $e);
} finally {
    // Cleanup code
    $this->closeConnection();
}
```

## Modern PHP Features

### Use Enums (PHP 8.1+)
```php
enum Status: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';
    
    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            self::SUSPENDED => 'Suspended',
        };
    }
}

// Usage
$status = Status::ACTIVE;
if ($status === Status::ACTIVE) {
    // Handle active status
}
```

### Use Match Expressions
```php
// ✅ PREFERRED: Match expression
$message = match($status) {
    Status::ACTIVE => 'User is active',
    Status::INACTIVE => 'User is inactive',
    Status::SUSPENDED => 'User is suspended',
    default => 'Unknown status',
};

// ❌ AVOID: Switch statement (when match is cleaner)
switch ($status) {
    case Status::ACTIVE:
        $message = 'User is active';
        break;
    case Status::INACTIVE:
        $message = 'User is inactive';
        break;
    // ...
}
```

### Use Readonly Properties (PHP 8.1+)
```php
class User
{
    public function __construct(
        private readonly int $id,
        private readonly string $email,
        private string $name  // Not readonly - can be changed
    ) {}
}
```

### Use Named Arguments
```php
// ✅ PREFERRED: Named arguments for clarity
$user = new User(
    id: 1,
    email: 'user@example.com',
    name: 'John Doe'
);

// ✅ Also good: Especially with many parameters or optional ones
$result = $this->calculateTotal(
    price: 100.0,
    taxRate: 0.15,
    discount: 10.0,
    shipping: 5.0
);
```

## Documentation

### DocBlock Comments
```php
/**
 * Retrieve user by ID
 * 
 * @param int $id User identifier
 * @return User User object
 * @throws UserNotFoundException If user not found
 */
public function getUserById(int $id): User
{
    // Implementation
}

/**
 * Process payment transaction
 * 
 * @param float $amount Payment amount
 * @param string $currency Currency code (e.g., 'USD')
 * @param array<string, mixed> $metadata Additional payment metadata
 * @return PaymentResult Payment processing result
 * @throws InsufficientFundsException If balance is too low
 * @throws PaymentGatewayException If gateway communication fails
 */
public function processPayment(float $amount, string $currency, array $metadata = []): PaymentResult
{
    // Implementation
}
```

## Code Style (PSR-12)

### Indentation and Braces
```php
// ✅ CORRECT: PSR-12 style
class UserService
{
    public function processUser(int $id): void
    {
        if ($this->isValid($id)) {
            $this->process($id);
        } else {
            throw new ValidationException('Invalid user ID');
        }
    }
}

// ❌ WRONG: Incorrect brace placement
class UserService {
    public function processUser(int $id): void {
        if ($this->isValid($id)) {
            $this->process($id);
        }
    }
}
```

### Line Length and Method Chaining
```php
// ✅ CORRECT: Readable line length (120 characters max)
$user = $this->userRepository
    ->with(['posts', 'comments'])
    ->where('active', true)
    ->orderBy('created_at', 'desc')
    ->first();

// ✅ CORRECT: Long parameter lists
public function createOrder(
    int $userId,
    array $items,
    string $shippingAddress,
    string $billingAddress,
    string $paymentMethod
): Order {
    // Implementation
}
```

## Performance

### Use OPcache
```php
// Configure in php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### Efficient Database Queries
```php
// ✅ GOOD: Single query with JOIN
$stmt = $pdo->prepare('
    SELECT u.*, p.title, p.content
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.id = :id
');

// ❌ BAD: N+1 query problem
$user = $this->getUser($id);
foreach ($user->posts as $post) {  // Multiple queries!
    // Process post
}
```

### Use Generators for Memory Efficiency
```php
// ✅ GOOD: Generator for large datasets
public function getAllUsers(): \Generator
{
    $stmt = $this->pdo->query('SELECT * FROM users');
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        yield new User($row);
    }
}

// Usage
foreach ($this->getAllUsers() as $user) {
    // Process one user at a time - low memory usage
}
```

## Testing

### PHPUnit Test Structure
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\UserService;
use App\Repositories\UserRepository;
use App\Exceptions\ValidationException;
use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    private UserService $service;
    private UserRepository $repository;
    
    protected function setUp(): void
    {
        $this->repository = $this->createMock(UserRepository::class);
        $this->service = new UserService($this->repository);
    }
    
    public function testGetUserByIdReturnsUser(): void
    {
        $userId = 1;
        $expectedUser = ['id' => $userId, 'name' => 'John'];
        
        $this->repository
            ->expects($this->once())
            ->method('find')
            ->with($userId)
            ->willReturn($expectedUser);
        
        $result = $this->service->getUserById($userId);
        
        $this->assertEquals($expectedUser, $result);
    }
    
    public function testGetUserByIdThrowsExceptionWhenNotFound(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('User with ID 999 not found');
        
        $this->repository
            ->expects($this->once())
            ->method('find')
            ->with(999)
            ->willReturn(null);
        
        $this->service->getUserById(999);
    }
}
```

## Common Patterns

### Repository Pattern
```php
interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function save(User $user): void;
    public function delete(int $id): void;
    public function findByEmail(string $email): ?User;
}
```

### Service Layer
```php
class UserService
{
    public function __construct(
        private UserRepositoryInterface $repository,
        private PasswordHasher $hasher,
        private EventDispatcherInterface $eventDispatcher
    ) {}
    
    public function registerUser(string $email, string $password): User
    {
        $this->validateEmail($email);
        $this->validatePassword($password);
        
        $user = new User(
            email: $email,
            password: $this->hasher->hash($password)
        );
        
        $this->repository->save($user);
        $this->eventDispatcher->dispatch(new UserRegistered($user));
        
        return $user;
    }
}
```

### Dependency Injection
```php
// ✅ PREFERRED: Constructor injection
class OrderController
{
    public function __construct(
        private OrderService $orderService,
        private LoggerInterface $logger
    ) {}
}

// ❌ AVOID: Service locator or global state
class OrderController
{
    public function __construct()
    {
        $this->orderService = App::make(OrderService::class);  // Bad!
    }
}
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-19  
**Maintained By**: 1naichii
