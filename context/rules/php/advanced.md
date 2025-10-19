# PHP Advanced Patterns and Features

## Table of Contents
- [Design Patterns](#design-patterns)
- [Advanced OOP Features](#advanced-oop-features)
- [Attributes (Annotations)](#attributes-annotations)
- [Reflection API](#reflection-api)
- [Generators and Iterators](#generators-and-iterators)
- [Magic Methods](#magic-methods)
- [Late Static Binding](#late-static-binding)
- [Traits](#traits)
- [Anonymous Classes](#anonymous-classes)

## Design Patterns

### Repository Pattern
```php
<?php

declare(strict_types=1);

namespace App\Repositories;

interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findAll(): array;
    public function save(User $user): void;
    public function delete(int $id): void;
}

class DatabaseUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}
    
    public function find(int $id): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $data ? User::fromArray($data) : null;
    }
    
    public function findAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM users');
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(fn($data) => User::fromArray($data), $results);
    }
    
    public function save(User $user): void
    {
        if ($user->getId()) {
            $this->update($user);
        } else {
            $this->insert($user);
        }
    }
    
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
    
    private function insert(User $user): void
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, created_at)
            VALUES (:name, :email, :created_at)
        ');
        
        $stmt->execute([
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
        
        $user->setId((int)$this->pdo->lastInsertId());
    }
    
    private function update(User $user): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE users 
            SET name = :name, email = :email 
            WHERE id = :id
        ');
        
        $stmt->execute([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
        ]);
    }
}
```

### Factory Pattern
```php
<?php

declare(strict_types=1);

namespace App\Factories;

interface PaymentGatewayInterface
{
    public function charge(float $amount): array;
}

class PaymentGatewayFactory
{
    /**
     * Create payment gateway based on type
     */
    public static function create(string $type): PaymentGatewayInterface
    {
        return match($type) {
            'stripe' => new StripeGateway(getenv('STRIPE_KEY')),
            'paypal' => new PayPalGateway(getenv('PAYPAL_CLIENT_ID')),
            'braintree' => new BraintreeGateway(getenv('BRAINTREE_MERCHANT_ID')),
            default => throw new \InvalidArgumentException("Unknown gateway type: {$type}"),
        };
    }
}

// Usage
$gateway = PaymentGatewayFactory::create('stripe');
$result = $gateway->charge(100.0);
```

### Strategy Pattern
```php
<?php

declare(strict_types=1);

namespace App\Strategies;

interface ShippingStrategy
{
    public function calculate(float $weight, string $destination): float;
}

class StandardShipping implements ShippingStrategy
{
    public function calculate(float $weight, string $destination): float
    {
        return $weight * 5.0;
    }
}

class ExpressShipping implements ShippingStrategy
{
    public function calculate(float $weight, string $destination): float
    {
        return $weight * 10.0;
    }
}

class InternationalShipping implements ShippingStrategy
{
    public function calculate(float $weight, string $destination): float
    {
        $baseRate = $weight * 15.0;
        return $baseRate * $this->getCountryMultiplier($destination);
    }
    
    private function getCountryMultiplier(string $country): float
    {
        return match($country) {
            'US', 'CA', 'MX' => 1.0,
            'UK', 'FR', 'DE' => 1.5,
            default => 2.0,
        };
    }
}

class ShippingCalculator
{
    private ShippingStrategy $strategy;
    
    public function setStrategy(ShippingStrategy $strategy): void
    {
        $this->strategy = $strategy;
    }
    
    public function calculate(float $weight, string $destination): float
    {
        return $this->strategy->calculate($weight, $destination);
    }
}

// Usage
$calculator = new ShippingCalculator();

$calculator->setStrategy(new StandardShipping());
echo $calculator->calculate(10, 'US');  // Standard rate

$calculator->setStrategy(new ExpressShipping());
echo $calculator->calculate(10, 'US');  // Express rate
```

### Observer Pattern
```php
<?php

declare(strict_types=1);

namespace App\Events;

interface EventDispatcherInterface
{
    public function attach(string $event, callable $listener): void;
    public function detach(string $event, callable $listener): void;
    public function dispatch(string $event, mixed $data = null): void;
}

class EventDispatcher implements EventDispatcherInterface
{
    private array $listeners = [];
    
    public function attach(string $event, callable $listener): void
    {
        $this->listeners[$event][] = $listener;
    }
    
    public function detach(string $event, callable $listener): void
    {
        if (!isset($this->listeners[$event])) {
            return;
        }
        
        $this->listeners[$event] = array_filter(
            $this->listeners[$event],
            fn($l) => $l !== $listener
        );
    }
    
    public function dispatch(string $event, mixed $data = null): void
    {
        if (!isset($this->listeners[$event])) {
            return;
        }
        
        foreach ($this->listeners[$event] as $listener) {
            $listener($data);
        }
    }
}

// Usage
$dispatcher = new EventDispatcher();

$dispatcher->attach('user.created', function($user) {
    // Send welcome email
    sendWelcomeEmail($user);
});

$dispatcher->attach('user.created', function($user) {
    // Log user creation
    logEvent('User created', $user);
});

// Trigger event
$dispatcher->dispatch('user.created', $newUser);
```

### Singleton Pattern
```php
<?php

declare(strict_types=1);

namespace App\Services;

class Configuration
{
    private static ?Configuration $instance = null;
    private array $config = [];
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct()
    {
        $this->config = require __DIR__ . '/../../config/app.php';
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        
        return self::$instance;
    }
    
    /**
     * Get configuration value
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup()
    {
        throw new \Exception('Cannot unserialize singleton');
    }
}

// Usage
$config = Configuration::getInstance();
$dbHost = $config->get('database.host');
```

## Advanced OOP Features

### Abstract Classes and Methods
```php
<?php

declare(strict_types=1);

namespace App\Models;

abstract class BaseModel
{
    protected int $id;
    protected \DateTime $createdAt;
    protected ?\DateTime $updatedAt = null;
    
    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }
    
    /**
     * Abstract method - must be implemented by child classes
     */
    abstract public function validate(): bool;
    
    /**
     * Abstract method for getting table name
     */
    abstract public static function getTableName(): string;
    
    /**
     * Concrete method available to all child classes
     */
    public function touch(): void
    {
        $this->updatedAt = new \DateTime();
    }
    
    public function getId(): int
    {
        return $this->id;
    }
}

class User extends BaseModel
{
    private string $email;
    private string $name;
    
    public function validate(): bool
    {
        return !empty($this->email) 
            && filter_var($this->email, FILTER_VALIDATE_EMAIL)
            && !empty($this->name);
    }
    
    public static function getTableName(): string
    {
        return 'users';
    }
}
```

### Interface Inheritance
```php
<?php

declare(strict_types=1);

namespace App\Contracts;

interface Timestampable
{
    public function getCreatedAt(): \DateTime;
    public function getUpdatedAt(): ?\DateTime;
}

interface Identifiable
{
    public function getId(): int;
}

interface Entity extends Timestampable, Identifiable
{
    public function toArray(): array;
}

class User implements Entity
{
    public function __construct(
        private readonly int $id,
        private string $name,
        private readonly \DateTime $createdAt,
        private ?\DateTime $updatedAt = null
    ) {}
    
    public function getId(): int
    {
        return $this->id;
    }
    
    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }
    
    public function getUpdatedAt(): ?\DateTime
    {
        return $this->updatedAt;
    }
    
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt?->format('Y-m-d H:i:s'),
        ];
    }
}
```

## Attributes (Annotations)

### PHP 8.0+ Attributes
```php
<?php

declare(strict_types=1);

namespace App\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public string $path,
        public string $method = 'GET',
        public array $middleware = []
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Validate
{
    public function __construct(
        public string $rule,
        public ?string $message = null
    ) {}
}

#[Attribute(Attribute::TARGET_METHOD)]
class Cache
{
    public function __construct(
        public int $ttl = 3600,
        public ?string $key = null
    ) {}
}

// Usage
#[Route('/api/users', method: 'GET')]
class UserController
{
    #[Route('/api/users/{id}', method: 'GET')]
    #[Cache(ttl: 600)]
    public function show(int $id): array
    {
        return $this->userService->getUserById($id);
    }
    
    #[Route('/api/users', method: 'POST')]
    public function store(array $data): array
    {
        return $this->userService->createUser($data);
    }
}

class UserDTO
{
    #[Validate(rule: 'email', message: 'Invalid email format')]
    public string $email;
    
    #[Validate(rule: 'min:3|max:100', message: 'Name must be between 3 and 100 characters')]
    public string $name;
}
```

### Reading Attributes
```php
<?php

declare(strict_types=1);

namespace App\Router;

class AttributeRouter
{
    private array $routes = [];
    
    /**
     * Register routes from controller attributes
     */
    public function registerController(string $controllerClass): void
    {
        $reflection = new \ReflectionClass($controllerClass);
        
        // Get class-level route attribute
        $classAttributes = $reflection->getAttributes(Route::class);
        $baseRoute = $classAttributes[0]?->newInstance() ?? null;
        
        // Get method-level route attributes
        foreach ($reflection->getMethods() as $method) {
            $methodAttributes = $method->getAttributes(Route::class);
            
            if (empty($methodAttributes)) {
                continue;
            }
            
            $route = $methodAttributes[0]->newInstance();
            
            $this->routes[] = [
                'path' => $route->path,
                'method' => $route->method,
                'handler' => [$controllerClass, $method->getName()],
                'middleware' => $route->middleware,
            ];
        }
    }
    
    public function getRoutes(): array
    {
        return $this->routes;
    }
}
```

## Reflection API

### Inspecting Classes
```php
<?php

declare(strict_types=1);

namespace App\Utils;

class ClassInspector
{
    /**
     * Get detailed information about a class
     */
    public static function inspect(string $className): array
    {
        if (!class_exists($className)) {
            throw new \InvalidArgumentException("Class {$className} not found");
        }
        
        $reflection = new \ReflectionClass($className);
        
        return [
            'name' => $reflection->getName(),
            'namespace' => $reflection->getNamespaceName(),
            'short_name' => $reflection->getShortName(),
            'filename' => $reflection->getFileName(),
            'is_abstract' => $reflection->isAbstract(),
            'is_final' => $reflection->isFinal(),
            'is_interface' => $reflection->isInterface(),
            'is_trait' => $reflection->isTrait(),
            'parent' => $reflection->getParentClass()?->getName(),
            'interfaces' => $reflection->getInterfaceNames(),
            'traits' => $reflection->getTraitNames(),
            'constants' => $reflection->getConstants(),
            'properties' => self::getProperties($reflection),
            'methods' => self::getMethods($reflection),
        ];
    }
    
    private static function getProperties(\ReflectionClass $reflection): array
    {
        $properties = [];
        
        foreach ($reflection->getProperties() as $property) {
            $properties[] = [
                'name' => $property->getName(),
                'visibility' => self::getVisibility($property),
                'static' => $property->isStatic(),
                'type' => $property->getType()?->getName(),
            ];
        }
        
        return $properties;
    }
    
    private static function getMethods(\ReflectionClass $reflection): array
    {
        $methods = [];
        
        foreach ($reflection->getMethods() as $method) {
            $methods[] = [
                'name' => $method->getName(),
                'visibility' => self::getVisibility($method),
                'static' => $method->isStatic(),
                'abstract' => $method->isAbstract(),
                'final' => $method->isFinal(),
                'parameters' => self::getParameters($method),
                'return_type' => $method->getReturnType()?->getName(),
            ];
        }
        
        return $methods;
    }
    
    private static function getParameters(\ReflectionMethod $method): array
    {
        $parameters = [];
        
        foreach ($method->getParameters() as $parameter) {
            $parameters[] = [
                'name' => $parameter->getName(),
                'type' => $parameter->getType()?->getName(),
                'optional' => $parameter->isOptional(),
                'default' => $parameter->isDefaultValueAvailable() 
                    ? $parameter->getDefaultValue() 
                    : null,
            ];
        }
        
        return $parameters;
    }
    
    private static function getVisibility(\ReflectionProperty|\ReflectionMethod $member): string
    {
        if ($member->isPublic()) return 'public';
        if ($member->isProtected()) return 'protected';
        if ($member->isPrivate()) return 'private';
        return 'unknown';
    }
}

// Usage
$info = ClassInspector::inspect(User::class);
print_r($info);
```

### Dynamic Method Invocation
```php
<?php

declare(strict_types=1);

namespace App\Utils;

class DynamicInvoker
{
    /**
     * Call method dynamically with parameters
     */
    public static function call(object $object, string $method, array $params = []): mixed
    {
        $reflection = new \ReflectionMethod($object, $method);
        
        if (!$reflection->isPublic()) {
            throw new \RuntimeException("Method {$method} is not public");
        }
        
        return $reflection->invokeArgs($object, $params);
    }
    
    /**
     * Get property value (even private/protected)
     */
    public static function getPropertyValue(object $object, string $property): mixed
    {
        $reflection = new \ReflectionProperty($object, $property);
        $reflection->setAccessible(true);
        
        return $reflection->getValue($object);
    }
    
    /**
     * Set property value (even private/protected)
     */
    public static function setPropertyValue(object $object, string $property, mixed $value): void
    {
        $reflection = new \ReflectionProperty($object, $property);
        $reflection->setAccessible(true);
        $reflection->setValue($object, $value);
    }
}
```

## Generators and Iterators

### Custom Iterator
```php
<?php

declare(strict_types=1);

namespace App\Collections;

class Collection implements \Iterator, \Countable
{
    private array $items = [];
    private int $position = 0;
    
    public function __construct(array $items = [])
    {
        $this->items = array_values($items);
    }
    
    // Iterator methods
    public function current(): mixed
    {
        return $this->items[$this->position];
    }
    
    public function key(): int
    {
        return $this->position;
    }
    
    public function next(): void
    {
        ++$this->position;
    }
    
    public function rewind(): void
    {
        $this->position = 0;
    }
    
    public function valid(): bool
    {
        return isset($this->items[$this->position]);
    }
    
    // Countable method
    public function count(): int
    {
        return count($this->items);
    }
    
    // Collection methods
    public function map(callable $callback): self
    {
        return new self(array_map($callback, $this->items));
    }
    
    public function filter(callable $callback): self
    {
        return new self(array_filter($this->items, $callback));
    }
    
    public function toArray(): array
    {
        return $this->items;
    }
}

// Usage
$collection = new Collection([1, 2, 3, 4, 5]);

foreach ($collection as $item) {
    echo $item . "\n";
}

$doubled = $collection->map(fn($x) => $x * 2);
$filtered = $collection->filter(fn($x) => $x > 2);
```

### Generator Functions
```php
<?php

declare(strict_types=1);

namespace App\Generators;

class DataGenerator
{
    /**
     * Generate range of numbers (memory efficient)
     */
    public static function range(int $start, int $end, int $step = 1): \Generator
    {
        for ($i = $start; $i <= $end; $i += $step) {
            yield $i;
        }
    }
    
    /**
     * Read file line by line (memory efficient)
     */
    public static function readLines(string $filename): \Generator
    {
        $handle = fopen($filename, 'r');
        
        if ($handle === false) {
            throw new \RuntimeException("Cannot open file: {$filename}");
        }
        
        try {
            while (($line = fgets($handle)) !== false) {
                yield rtrim($line);
            }
        } finally {
            fclose($handle);
        }
    }
    
    /**
     * Generate from database query (memory efficient)
     */
    public static function fromQuery(PDO $pdo, string $query): \Generator
    {
        $stmt = $pdo->query($query);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            yield $row;
        }
    }
}

// Usage
foreach (DataGenerator::range(1, 1000000) as $number) {
    // Process millions of numbers without loading all into memory
}

foreach (DataGenerator::readLines('large-file.txt') as $line) {
    processLine($line);
}
```

## Magic Methods

### Complete Magic Methods Example
```php
<?php

declare(strict_types=1);

namespace App\Models;

class MagicModel
{
    private array $data = [];
    
    /**
     * Called when object is created
     */
    public function __construct(array $data = [])
    {
        $this->data = $data;
    }
    
    /**
     * Get property
     */
    public function __get(string $name): mixed
    {
        return $this->data[$name] ?? null;
    }
    
    /**
     * Set property
     */
    public function __set(string $name, mixed $value): void
    {
        $this->data[$name] = $value;
    }
    
    /**
     * Check if property exists
     */
    public function __isset(string $name): bool
    {
        return isset($this->data[$name]);
    }
    
    /**
     * Unset property
     */
    public function __unset(string $name): void
    {
        unset($this->data[$name]);
    }
    
    /**
     * Call inaccessible method
     */
    public function __call(string $name, array $arguments): mixed
    {
        if (str_starts_with($name, 'get')) {
            $property = lcfirst(substr($name, 3));
            return $this->data[$property] ?? null;
        }
        
        if (str_starts_with($name, 'set')) {
            $property = lcfirst(substr($name, 3));
            $this->data[$property] = $arguments[0] ?? null;
            return $this;
        }
        
        throw new \BadMethodCallException("Method {$name} not found");
    }
    
    /**
     * Convert to string
     */
    public function __toString(): string
    {
        return json_encode($this->data);
    }
    
    /**
     * Invoke as function
     */
    public function __invoke(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }
    
    /**
     * Clone object
     */
    public function __clone()
    {
        // Deep clone if needed
    }
    
    /**
     * Serialize object
     */
    public function __serialize(): array
    {
        return $this->data;
    }
    
    /**
     * Unserialize object
     */
    public function __unserialize(array $data): void
    {
        $this->data = $data;
    }
}

// Usage
$model = new MagicModel(['name' => 'John', 'age' => 30]);

echo $model->name;              // __get
$model->email = 'john@test.com'; // __set
isset($model->name);             // __isset
unset($model->age);              // __unset

echo $model->getName();          // __call
$model->setEmail('new@test.com');// __call

echo $model;                     // __toString
echo $model('name');             // __invoke
```

## Late Static Binding

### Using static:: vs self::
```php
<?php

declare(strict_types=1);

namespace App\Models;

class BaseModel
{
    protected static string $table;
    
    /**
     * Using self:: - refers to BaseModel
     */
    public static function getSelfTable(): string
    {
        return self::$table;
    }
    
    /**
     * Using static:: - refers to calling class (late static binding)
     */
    public static function getStaticTable(): string
    {
        return static::$table;
    }
    
    /**
     * Factory method using late static binding
     */
    public static function create(array $data): static
    {
        return new static($data);
    }
}

class User extends BaseModel
{
    protected static string $table = 'users';
}

class Product extends BaseModel
{
    protected static string $table = 'products';
}

// Usage
echo User::getStaticTable();    // 'users' (late static binding)
echo Product::getStaticTable(); // 'products' (late static binding)

$user = User::create(['name' => 'John']);       // Returns User instance
$product = Product::create(['name' => 'Item']); // Returns Product instance
```

## Traits

### Advanced Trait Usage
```php
<?php

declare(strict_types=1);

namespace App\Traits;

trait Timestampable
{
    private \DateTime $createdAt;
    private ?\DateTime $updatedAt = null;
    
    public function initTimestamps(): void
    {
        $this->createdAt = new \DateTime();
    }
    
    public function touch(): void
    {
        $this->updatedAt = new \DateTime();
    }
}

trait SoftDeletes
{
    private ?\DateTime $deletedAt = null;
    
    public function delete(): void
    {
        $this->deletedAt = new \DateTime();
    }
    
    public function restore(): void
    {
        $this->deletedAt = null;
    }
    
    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }
}

// Trait conflict resolution
class Post
{
    use Timestampable, SoftDeletes {
        Timestampable::touch insteadof SoftDeletes;
        SoftDeletes::delete as softDelete;
    }
    
    public function delete(): void
    {
        $this->touch();
        $this->softDelete();
    }
}
```

## Anonymous Classes

### Using Anonymous Classes
```php
<?php

declare(strict_types=1);

// Anonymous class for one-time use
$logger = new class {
    public function log(string $message): void
    {
        echo "[" . date('Y-m-d H:i:s') . "] {$message}\n";
    }
};

$logger->log('Test message');

// Anonymous class implementing interface
interface HandlerInterface
{
    public function handle(array $data): void;
}

function processData(array $data, HandlerInterface $handler): void
{
    $handler->handle($data);
}

processData(['key' => 'value'], new class implements HandlerInterface {
    public function handle(array $data): void
    {
        print_r($data);
    }
});

// Anonymous class for testing
$mock = new class {
    private array $calls = [];
    
    public function __call(string $method, array $args): mixed
    {
        $this->calls[] = ['method' => $method, 'args' => $args];
        return $this;
    }
    
    public function getCalls(): array
    {
        return $this->calls;
    }
};
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
