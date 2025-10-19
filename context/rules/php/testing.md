# PHP Testing Best Practices

## Table of Contents
- [PHPUnit Basics](#phpunit-basics)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Test Doubles (Mocks, Stubs, Fakes)](#test-doubles)
- [Database Testing](#database-testing)
- [HTTP Testing](#http-testing)
- [Code Coverage](#code-coverage)
- [Best Practices](#best-practices)

## PHPUnit Basics

### Installation
```bash
composer require --dev phpunit/phpunit
```

### Configuration (phpunit.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         failOnWarning="true"
         failOnRisky="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">src</directory>
        </include>
        <exclude>
            <directory>src/Config</directory>
        </exclude>
    </coverage>
</phpunit>
```

### Running Tests
```bash
# Run all tests
vendor/bin/phpunit

# Run specific test suite
vendor/bin/phpunit --testsuite=Unit

# Run specific test file
vendor/bin/phpunit tests/Unit/UserServiceTest.php

# Run with coverage
vendor/bin/phpunit --coverage-html coverage

# Run specific test method
vendor/bin/phpunit --filter testUserCanLogin
```

## Unit Testing

### Basic Test Structure
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Calculator;
use PHPUnit\Framework\TestCase;

class CalculatorTest extends TestCase
{
    private Calculator $calculator;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new Calculator();
    }
    
    protected function tearDown(): void
    {
        parent::tearDown();
        // Cleanup if needed
    }
    
    public function testAdditionOfTwoNumbers(): void
    {
        $result = $this->calculator->add(2, 3);
        
        $this->assertEquals(5, $result);
    }
    
    public function testSubtractionOfTwoNumbers(): void
    {
        $result = $this->calculator->subtract(5, 3);
        
        $this->assertEquals(2, $result);
    }
}
```

### Data Providers
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Validators\EmailValidator;
use PHPUnit\Framework\TestCase;

class EmailValidatorTest extends TestCase
{
    private EmailValidator $validator;
    
    protected function setUp(): void
    {
        $this->validator = new EmailValidator();
    }
    
    /**
     * @dataProvider validEmailProvider
     */
    public function testValidEmails(string $email): void
    {
        $this->assertTrue($this->validator->isValid($email));
    }
    
    /**
     * @dataProvider invalidEmailProvider
     */
    public function testInvalidEmails(string $email): void
    {
        $this->assertFalse($this->validator->isValid($email));
    }
    
    public static function validEmailProvider(): array
    {
        return [
            ['user@example.com'],
            ['john.doe@example.co.uk'],
            ['test+tag@domain.com'],
            ['user123@test-domain.com'],
        ];
    }
    
    public static function invalidEmailProvider(): array
    {
        return [
            ['invalid'],
            ['@example.com'],
            ['user@'],
            ['user @example.com'],
            ['user@.com'],
        ];
    }
}
```

### Testing Exceptions
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\UserService;
use App\Exceptions\UserNotFoundException;
use App\Exceptions\ValidationException;
use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    private UserService $service;
    
    protected function setUp(): void
    {
        $this->service = new UserService();
    }
    
    public function testThrowsExceptionWhenUserNotFound(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('User with ID 999 not found');
        
        $this->service->getUserById(999);
    }
    
    public function testThrowsExceptionForInvalidEmail(): void
    {
        $this->expectException(ValidationException::class);
        
        $this->service->createUser('invalid-email', 'password');
    }
    
    public function testExceptionContainsExpectedData(): void
    {
        try {
            $this->service->validateUser(['email' => '']);
            $this->fail('Expected ValidationException was not thrown');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('email', $e->getErrors());
            $this->assertEquals('Email is required', $e->getErrors()['email']);
        }
    }
}
```

### Assertions
```php
<?php

// Equality assertions
$this->assertEquals(expected, actual);
$this->assertSame(expected, actual);  // Strict comparison (===)
$this->assertNotEquals(expected, actual);

// Boolean assertions
$this->assertTrue(condition);
$this->assertFalse(condition);
$this->assertNull(variable);
$this->assertNotNull(variable);

// String assertions
$this->assertStringContains('needle', 'haystack');
$this->assertStringStartsWith('prefix', 'prefixed string');
$this->assertStringEndsWith('suffix', 'string suffix');
$this->assertMatchesRegularExpression('/pattern/', 'subject');

// Array assertions
$this->assertCount(3, $array);
$this->assertEmpty($array);
$this->assertNotEmpty($array);
$this->assertArrayHasKey('key', $array);
$this->assertContains('value', $array);

// Type assertions
$this->assertIsInt($variable);
$this->assertIsString($variable);
$this->assertIsArray($variable);
$this->assertIsObject($variable);
$this->assertInstanceOf(ClassName::class, $object);

// File assertions
$this->assertFileExists('/path/to/file');
$this->assertDirectoryExists('/path/to/directory');
$this->assertIsReadable('/path/to/file');
```

## Test Doubles

### Mocking with PHPUnit
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\UserService;
use App\Repositories\UserRepository;
use App\Services\EmailService;
use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    public function testCreateUserSendsWelcomeEmail(): void
    {
        // Create mock repository
        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())
            ->method('create')
            ->with($this->callback(function ($user) {
                return $user['email'] === 'test@example.com';
            }))
            ->willReturn(1);
        
        // Create mock email service
        $emailService = $this->createMock(EmailService::class);
        $emailService->expects($this->once())
            ->method('sendWelcomeEmail')
            ->with('test@example.com');
        
        // Test the service
        $service = new UserService($repository, $emailService);
        $userId = $service->createUser('test@example.com', 'password');
        
        $this->assertEquals(1, $userId);
    }
    
    public function testGetUserByIdCallsRepository(): void
    {
        $expectedUser = ['id' => 1, 'name' => 'John'];
        
        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($expectedUser);
        
        $emailService = $this->createMock(EmailService::class);
        
        $service = new UserService($repository, $emailService);
        $user = $service->getUserById(1);
        
        $this->assertEquals($expectedUser, $user);
    }
}
```

### Stubs
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\PaymentService;
use App\Gateways\PaymentGateway;
use PHPUnit\Framework\TestCase;

class PaymentServiceTest extends TestCase
{
    public function testProcessPaymentWithSuccessfulGateway(): void
    {
        // Create stub (no expectations)
        $gateway = $this->createStub(PaymentGateway::class);
        $gateway->method('charge')
            ->willReturn([
                'success' => true,
                'transaction_id' => 'txn_123',
            ]);
        
        $service = new PaymentService($gateway);
        $result = $service->processPayment(100.0);
        
        $this->assertTrue($result['success']);
        $this->assertEquals('txn_123', $result['transaction_id']);
    }
    
    public function testProcessPaymentWithFailedGateway(): void
    {
        $gateway = $this->createStub(PaymentGateway::class);
        $gateway->method('charge')
            ->willReturn([
                'success' => false,
                'error' => 'Insufficient funds',
            ]);
        
        $service = new PaymentService($gateway);
        $result = $service->processPayment(100.0);
        
        $this->assertFalse($result['success']);
        $this->assertEquals('Insufficient funds', $result['error']);
    }
}
```

### Test Spy Pattern
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\LoggerService;
use PHPUnit\Framework\TestCase;

class LoggerServiceTest extends TestCase
{
    public function testLoggerRecordsMessages(): void
    {
        $logger = new class extends LoggerService {
            public array $logs = [];
            
            public function log(string $level, string $message): void
            {
                $this->logs[] = ['level' => $level, 'message' => $message];
            }
        };
        
        $logger->info('Test message');
        $logger->error('Error message');
        
        $this->assertCount(2, $logger->logs);
        $this->assertEquals('info', $logger->logs[0]['level']);
        $this->assertEquals('error', $logger->logs[1]['level']);
    }
}
```

## Database Testing

### Using Transactions
```php
<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Repositories\UserRepository;
use PHPUnit\Framework\TestCase;
use PDO;

class UserRepositoryTest extends TestCase
{
    private PDO $pdo;
    private UserRepository $repository;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test database connection
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create tables
        $this->createSchema();
        
        // Start transaction
        $this->pdo->beginTransaction();
        
        $this->repository = new UserRepository($this->pdo);
    }
    
    protected function tearDown(): void
    {
        // Rollback transaction to clean up
        $this->pdo->rollBack();
        
        parent::tearDown();
    }
    
    private function createSchema(): void
    {
        $this->pdo->exec('
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ');
    }
    
    public function testCanCreateUser(): void
    {
        $userId = $this->repository->create([
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);
        
        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);
    }
    
    public function testCanFindUserById(): void
    {
        $userId = $this->repository->create([
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);
        
        $user = $this->repository->findById($userId);
        
        $this->assertNotNull($user);
        $this->assertEquals('test@example.com', $user['email']);
        $this->assertEquals('Test User', $user['name']);
    }
}
```

### Database Fixtures
```php
<?php

declare(strict_types=1);

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use PDO;

abstract class DatabaseTestCase extends TestCase
{
    protected PDO $pdo;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $this->createSchema();
        $this->loadFixtures();
    }
    
    abstract protected function createSchema(): void;
    
    protected function loadFixtures(): void
    {
        // Override in child classes to load test data
    }
    
    protected function insertUser(array $data): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO users (email, name, password)
            VALUES (:email, :name, :password)
        ');
        
        $stmt->execute($data);
        
        return (int)$this->pdo->lastInsertId();
    }
}

// Usage
class UserRepositoryTest extends DatabaseTestCase
{
    protected function createSchema(): void
    {
        $this->pdo->exec('
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        ');
    }
    
    protected function loadFixtures(): void
    {
        $this->insertUser([
            'email' => 'admin@example.com',
            'name' => 'Admin User',
            'password' => password_hash('password', PASSWORD_DEFAULT),
        ]);
    }
    
    public function testCanFindAdminUser(): void
    {
        $repository = new UserRepository($this->pdo);
        $user = $repository->findByEmail('admin@example.com');
        
        $this->assertNotNull($user);
        $this->assertEquals('Admin User', $user['name']);
    }
}
```

## HTTP Testing

### Testing HTTP Responses
```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use PHPUnit\Framework\TestCase;

class ApiTest extends TestCase
{
    private string $baseUrl = 'http://localhost:8000';
    
    public function testGetUserReturnsJson(): void
    {
        $response = $this->get('/api/users/1');
        
        $this->assertEquals(200, $response['status']);
        $this->assertJson($response['body']);
        
        $data = json_decode($response['body'], true);
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('email', $data);
    }
    
    public function testCreateUserReturns201(): void
    {
        $response = $this->post('/api/users', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'password123',
        ]);
        
        $this->assertEquals(201, $response['status']);
        
        $data = json_decode($response['body'], true);
        $this->assertArrayHasKey('id', $data);
    }
    
    private function get(string $path): array
    {
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['status' => $status, 'body' => $body];
    }
    
    private function post(string $path, array $data): array
    {
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['status' => $status, 'body' => $body];
    }
}
```

## Code Coverage

### Measuring Coverage
```bash
# HTML report
vendor/bin/phpunit --coverage-html coverage

# Text report in terminal
vendor/bin/phpunit --coverage-text

# Clover XML (for CI/CD)
vendor/bin/phpunit --coverage-clover coverage.xml
```

### Coverage Annotations
```php
<?php

declare(strict_types=1);

namespace App\Services;

class ReportGenerator
{
    /**
     * @codeCoverageIgnore
     */
    public function debugMethod(): void
    {
        // This method won't be included in coverage
    }
    
    public function generateReport(): array
    {
        // @codeCoverageIgnoreStart
        if (getenv('DEBUG')) {
            echo "Debug mode\n";
        }
        // @codeCoverageIgnoreEnd
        
        return ['status' => 'complete'];
    }
}
```

## Best Practices

### Test Naming Conventions
```php
<?php

// ✅ GOOD: Descriptive test names
public function testUserCanLoginWithValidCredentials(): void {}
public function testOrderTotalIsCalculatedCorrectly(): void {}
public function testEmailValidatorRejectsInvalidFormat(): void {}

// ❌ BAD: Vague test names
public function testUser(): void {}
public function testLogin(): void {}
public function testIt(): void {}
```

### Test Organization
```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class UserServiceTest extends TestCase
{
    // Arrange
    protected function setUp(): void
    {
        parent::setUp();
        // Set up test dependencies
    }
    
    // Act & Assert
    public function testUserCanBeCreated(): void
    {
        // Arrange: Set up test data
        $userData = [
            'email' => 'test@example.com',
            'name' => 'Test User',
        ];
        
        // Act: Execute the method being tested
        $user = $this->service->createUser($userData);
        
        // Assert: Verify the results
        $this->assertNotNull($user);
        $this->assertEquals('test@example.com', $user->getEmail());
    }
    
    // Cleanup
    protected function tearDown(): void
    {
        parent::tearDown();
        // Clean up test resources
    }
}
```

### Test Independence
```php
<?php

// ✅ GOOD: Each test is independent
class UserServiceTest extends TestCase
{
    public function testCreateUser(): void
    {
        $user = $this->service->createUser(['email' => 'test1@example.com']);
        $this->assertNotNull($user);
    }
    
    public function testUpdateUser(): void
    {
        // Create fresh user for this test
        $user = $this->service->createUser(['email' => 'test2@example.com']);
        $updated = $this->service->updateUser($user->getId(), ['name' => 'Updated']);
        $this->assertEquals('Updated', $updated->getName());
    }
}

// ❌ BAD: Tests depend on each other
class UserServiceTest extends TestCase
{
    private static $userId;
    
    public function testCreateUser(): void
    {
        $user = $this->service->createUser(['email' => 'test@example.com']);
        self::$userId = $user->getId();  // Shared state!
    }
    
    public function testUpdateUser(): void
    {
        // Depends on testCreateUser running first!
        $updated = $this->service->updateUser(self::$userId, ['name' => 'Updated']);
        $this->assertEquals('Updated', $updated->getName());
    }
}
```

### Testing Private Methods
```php
<?php

// ✅ GOOD: Test through public interface
class UserService
{
    public function createUser(array $data): User
    {
        $this->validateEmail($data['email']);  // Private method
        // ...
    }
    
    private function validateEmail(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('Invalid email');
        }
    }
}

class UserServiceTest extends TestCase
{
    public function testCreateUserValidatesEmail(): void
    {
        $this->expectException(ValidationException::class);
        $this->service->createUser(['email' => 'invalid']);
    }
}

// ❌ AVOID: Using reflection to test private methods
// (Only test private methods through public interface)
```

## Summary

### DO ✅
- Write descriptive test names
- Keep tests simple and focused
- Use data providers for similar test cases
- Mock external dependencies
- Test edge cases and error conditions
- Maintain high code coverage (80%+ recommended)
- Make tests fast and independent
- Use transactions for database tests
- Follow Arrange-Act-Assert pattern
- Test behavior, not implementation

### DON'T ❌
- Write tests that depend on each other
- Test private methods directly
- Use production database for tests
- Ignore test failures
- Write tests after deployment
- Test framework code
- Create complex test setup
- Use sleep() or time-dependent tests
- Share state between tests
- Skip error case testing

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
