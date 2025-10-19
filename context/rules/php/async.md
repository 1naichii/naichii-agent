# PHP Asynchronous Programming

## Table of Contents
- [Understanding PHP Async](#understanding-php-async)
- [ReactPHP](#reactphp)
- [Amphp](#amphp)
- [Swoole Extension](#swoole-extension)
- [Fibers (PHP 8.1+)](#fibers-php-81)
- [Promises and Futures](#promises-and-futures)
- [Best Practices](#best-practices)

## Understanding PHP Async

PHP is traditionally synchronous and blocking. However, modern PHP offers several approaches for asynchronous programming:

1. **ReactPHP** - Event-driven, non-blocking I/O library
2. **Amphp** - Async concurrency framework
3. **Swoole** - PHP extension for async programming
4. **Fibers** - Built-in lightweight concurrency (PHP 8.1+)

### When to Use Async PHP

✅ **Good Use Cases:**
- Real-time applications (chat, notifications)
- High-concurrency HTTP services
- WebSocket servers
- Multiple parallel I/O operations
- Long-running processes
- Microservices with many external API calls

❌ **Not Recommended:**
- Simple CRUD applications
- Traditional request-response web apps
- CPU-intensive tasks (use process pooling instead)

## ReactPHP

### Installation
```bash
composer require react/event-loop
composer require react/http
composer require react/promise
```

### Basic Event Loop
```php
<?php

declare(strict_types=1);

use React\EventLoop\Loop;

// Simple timer example
Loop::addTimer(1.0, function () {
    echo "Timer executed after 1 second\n";
});

// Periodic timer
Loop::addPeriodicTimer(2.0, function () {
    echo "Periodic timer executed every 2 seconds\n";
});

// Run the event loop
Loop::run();
```

### HTTP Server with ReactPHP
```php
<?php

declare(strict_types=1);

use Psr\Http\Message\ServerRequestInterface;
use React\Http\HttpServer;
use React\Http\Message\Response;
use React\Socket\SocketServer;

require __DIR__ . '/vendor/autoload.php';

$server = new HttpServer(function (ServerRequestInterface $request) {
    // Handle request asynchronously
    return new Response(
        200,
        ['Content-Type' => 'application/json'],
        json_encode([
            'message' => 'Hello from ReactPHP!',
            'path' => $request->getUri()->getPath(),
            'method' => $request->getMethod(),
        ])
    );
});

$socket = new SocketServer('127.0.0.1:8080');
$server->listen($socket);

echo "Server running at http://127.0.0.1:8080\n";
```

### Promises with ReactPHP
```php
<?php

declare(strict_types=1);

use React\Promise\Promise;
use React\Promise\Deferred;
use function React\Promise\all;

/**
 * Simulate async HTTP request
 */
function fetchUserAsync(int $userId): Promise {
    $deferred = new Deferred();
    
    // Simulate async operation
    Loop::addTimer(0.5, function () use ($deferred, $userId) {
        if ($userId > 0) {
            $deferred->resolve([
                'id' => $userId,
                'name' => "User {$userId}",
                'email' => "user{$userId}@example.com",
            ]);
        } else {
            $deferred->reject(new \InvalidArgumentException('Invalid user ID'));
        }
    });
    
    return $deferred->promise();
}

// Using promises
fetchUserAsync(1)
    ->then(function ($user) {
        echo "User fetched: {$user['name']}\n";
        return $user;
    })
    ->then(function ($user) {
        echo "Email: {$user['email']}\n";
    })
    ->catch(function (\Exception $e) {
        echo "Error: {$e->getMessage()}\n";
    });

// Parallel requests with Promise::all
$promises = [
    fetchUserAsync(1),
    fetchUserAsync(2),
    fetchUserAsync(3),
];

all($promises)
    ->then(function (array $users) {
        echo "All users fetched: " . count($users) . "\n";
        foreach ($users as $user) {
            echo "- {$user['name']}\n";
        }
    })
    ->catch(function (\Exception $e) {
        echo "Error fetching users: {$e->getMessage()}\n";
    });

Loop::run();
```

### Stream Processing
```php
<?php

declare(strict_types=1);

use React\Stream\ReadableResourceStream;
use React\EventLoop\Loop;

// Read file asynchronously
$stream = new ReadableResourceStream(
    fopen('large-file.txt', 'r')
);

$stream->on('data', function ($chunk) {
    echo "Received chunk: " . strlen($chunk) . " bytes\n";
    // Process chunk asynchronously
});

$stream->on('end', function () {
    echo "File reading completed\n";
});

$stream->on('error', function (\Exception $e) {
    echo "Error: {$e->getMessage()}\n";
});

Loop::run();
```

## Amphp

### Installation
```bash
composer require amphp/amp
composer require amphp/http-client
```

### Basic Coroutines
```php
<?php

declare(strict_types=1);

use Amp\Loop;
use Amp\Promise;
use function Amp\call;
use function Amp\delay;

/**
 * Async function using generator
 */
function fetchDataAsync(int $id): Promise {
    return call(function () use ($id) {
        // Simulate delay
        yield delay(500);
        
        return [
            'id' => $id,
            'data' => "Data for ID {$id}",
            'timestamp' => time(),
        ];
    });
}

Loop::run(function () {
    try {
        // Sequential execution
        $result1 = yield fetchDataAsync(1);
        echo "Result 1: {$result1['data']}\n";
        
        $result2 = yield fetchDataAsync(2);
        echo "Result 2: {$result2['data']}\n";
        
        // Parallel execution
        [$result3, $result4] = yield [
            fetchDataAsync(3),
            fetchDataAsync(4),
        ];
        
        echo "Result 3: {$result3['data']}\n";
        echo "Result 4: {$result4['data']}\n";
        
    } catch (\Exception $e) {
        echo "Error: {$e->getMessage()}\n";
    }
});
```

### HTTP Client with Amphp
```php
<?php

declare(strict_types=1);

use Amp\Loop;
use Amp\Http\Client\HttpClientBuilder;
use Amp\Http\Client\Request;
use Amp\Http\Client\Response;

Loop::run(function () {
    $client = HttpClientBuilder::buildDefault();
    
    // Single request
    $request = new Request('https://api.example.com/users/1');
    
    try {
        /** @var Response $response */
        $response = yield $client->request($request);
        $body = yield $response->getBody()->buffer();
        
        echo "Status: {$response->getStatus()}\n";
        echo "Body: {$body}\n";
        
    } catch (\Exception $e) {
        echo "Error: {$e->getMessage()}\n";
    }
    
    // Parallel requests
    $requests = [
        $client->request(new Request('https://api.example.com/users/1')),
        $client->request(new Request('https://api.example.com/users/2')),
        $client->request(new Request('https://api.example.com/users/3')),
    ];
    
    try {
        $responses = yield $requests;
        
        foreach ($responses as $i => $response) {
            $body = yield $response->getBody()->buffer();
            echo "Response {$i}: {$response->getStatus()}\n";
        }
        
    } catch (\Exception $e) {
        echo "Error in parallel requests: {$e->getMessage()}\n";
    }
});
```

## Swoole Extension

### Installation
```bash
pecl install swoole
# Add extension=swoole.so to php.ini
```

### HTTP Server with Swoole
```php
<?php

declare(strict_types=1);

use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);

// Configure server
$server->set([
    'worker_num' => 4,
    'max_request' => 1000,
    'dispatch_mode' => 2,
]);

// Handle requests
$server->on('request', function (Request $request, Response $response) {
    // Async processing
    $response->header('Content-Type', 'application/json');
    
    $data = [
        'message' => 'Hello from Swoole!',
        'path' => $request->server['request_uri'],
        'method' => $request->server['request_method'],
        'worker_id' => $request->server['worker_id'],
    ];
    
    $response->end(json_encode($data));
});

echo "Swoole HTTP server started at http://127.0.0.1:9501\n";
$server->start();
```

### Coroutines with Swoole
```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\Http\Client;

// Enable coroutines
Coroutine::set(['hook_flags' => SWOOLE_HOOK_ALL]);

// Run coroutine
Coroutine\run(function () {
    // Parallel HTTP requests
    $results = [];
    
    $wg = new Coroutine\WaitGroup();
    
    for ($i = 1; $i <= 3; $i++) {
        $wg->add();
        
        Coroutine::create(function () use ($i, &$results, $wg) {
            $client = new Client('api.example.com', 443, true);
            $client->set(['timeout' => 5]);
            $client->get("/users/{$i}");
            
            $results[$i] = [
                'status' => $client->statusCode,
                'body' => $client->body,
            ];
            
            $client->close();
            $wg->done();
        });
    }
    
    // Wait for all coroutines
    $wg->wait();
    
    echo "All requests completed\n";
    print_r($results);
});
```

### Database with Swoole
```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\MySQL;

Coroutine\run(function () {
    $mysql = new MySQL();
    
    $connected = $mysql->connect([
        'host' => '127.0.0.1',
        'port' => 3306,
        'user' => 'root',
        'password' => 'password',
        'database' => 'test',
    ]);
    
    if (!$connected) {
        echo "Connection failed: {$mysql->connect_error}\n";
        return;
    }
    
    // Execute query asynchronously
    $result = $mysql->query('SELECT * FROM users WHERE active = 1');
    
    if ($result === false) {
        echo "Query failed: {$mysql->error}\n";
        return;
    }
    
    foreach ($result as $row) {
        echo "User: {$row['name']} ({$row['email']})\n";
    }
    
    $mysql->close();
});
```

## Fibers (PHP 8.1+)

Fibers provide low-level primitives for implementing lightweight cooperative concurrency.

### Basic Fiber Usage
```php
<?php

declare(strict_types=1);

// Create a fiber
$fiber = new Fiber(function (): void {
    echo "Fiber started\n";
    
    $value = Fiber::suspend('First suspend');
    echo "Resumed with: {$value}\n";
    
    $value = Fiber::suspend('Second suspend');
    echo "Resumed with: {$value}\n";
    
    echo "Fiber completed\n";
});

// Start the fiber
$fiber->start();
echo "Main: Fiber suspended with: " . $fiber->resume('Hello') . "\n";
echo "Main: Fiber suspended with: " . $fiber->resume('World') . "\n";

// Output:
// Fiber started
// Main: Fiber suspended with: First suspend
// Resumed with: Hello
// Main: Fiber suspended with: Second suspend
// Resumed with: World
// Fiber completed
```

### Fiber-based Async Function
```php
<?php

declare(strict_types=1);

class AsyncScheduler {
    private array $pending = [];
    
    public function schedule(callable $callback): Fiber {
        $fiber = new Fiber($callback);
        $this->pending[] = $fiber;
        return $fiber;
    }
    
    public function run(): void {
        while (!empty($this->pending)) {
            foreach ($this->pending as $key => $fiber) {
                if (!$fiber->isStarted()) {
                    $fiber->start();
                } elseif ($fiber->isSuspended()) {
                    $fiber->resume();
                }
                
                if ($fiber->isTerminated()) {
                    unset($this->pending[$key]);
                }
            }
        }
    }
}

// Usage
$scheduler = new AsyncScheduler();

$scheduler->schedule(function () {
    echo "Task 1: Started\n";
    Fiber::suspend();
    echo "Task 1: Resumed\n";
    Fiber::suspend();
    echo "Task 1: Completed\n";
});

$scheduler->schedule(function () {
    echo "Task 2: Started\n";
    Fiber::suspend();
    echo "Task 2: Resumed\n";
    Fiber::suspend();
    echo "Task 2: Completed\n";
});

$scheduler->run();
```

## Promises and Futures

### Custom Promise Implementation
```php
<?php

declare(strict_types=1);

enum PromiseState {
    case PENDING;
    case FULFILLED;
    case REJECTED;
}

class SimplePromise {
    private PromiseState $state = PromiseState::PENDING;
    private mixed $value = null;
    private array $onFulfilled = [];
    private array $onRejected = [];
    
    public function then(callable $onFulfilled): self {
        if ($this->state === PromiseState::FULFILLED) {
            $onFulfilled($this->value);
        } else {
            $this->onFulfilled[] = $onFulfilled;
        }
        return $this;
    }
    
    public function catch(callable $onRejected): self {
        if ($this->state === PromiseState::REJECTED) {
            $onRejected($this->value);
        } else {
            $this->onRejected[] = $onRejected;
        }
        return $this;
    }
    
    public function resolve(mixed $value): void {
        if ($this->state !== PromiseState::PENDING) {
            return;
        }
        
        $this->state = PromiseState::FULFILLED;
        $this->value = $value;
        
        foreach ($this->onFulfilled as $callback) {
            $callback($value);
        }
    }
    
    public function reject(mixed $reason): void {
        if ($this->state !== PromiseState::PENDING) {
            return;
        }
        
        $this->state = PromiseState::REJECTED;
        $this->value = $reason;
        
        foreach ($this->onRejected as $callback) {
            $callback($reason);
        }
    }
}

// Usage
function asyncOperation(): SimplePromise {
    $promise = new SimplePromise();
    
    // Simulate async work
    Loop::addTimer(1.0, function () use ($promise) {
        $promise->resolve('Operation completed!');
    });
    
    return $promise;
}

asyncOperation()
    ->then(fn($result) => echo "Success: {$result}\n")
    ->catch(fn($error) => echo "Error: {$error}\n");
```

## Best Practices

### 1. Error Handling in Async Code
```php
<?php

declare(strict_types=1);

use React\Promise\Promise;

function safeAsyncOperation(): Promise {
    return new Promise(function ($resolve, $reject) {
        try {
            // Async operation
            Loop::addTimer(1.0, function () use ($resolve, $reject) {
                try {
                    $result = performOperation();
                    $resolve($result);
                } catch (\Exception $e) {
                    $reject($e);
                }
            });
        } catch (\Exception $e) {
            $reject($e);
        }
    });
}

// Always handle rejections
safeAsyncOperation()
    ->then(function ($result) {
        // Handle success
    })
    ->catch(function (\Exception $e) {
        // Always catch errors
        error_log("Async error: {$e->getMessage()}");
    });
```

### 2. Timeout Handling
```php
<?php

declare(strict_types=1);

use React\Promise\Promise;
use React\Promise\Deferred;

function withTimeout(Promise $promise, float $timeout): Promise {
    $deferred = new Deferred();
    $timer = null;
    
    $promise
        ->then(function ($value) use ($deferred, &$timer) {
            if ($timer) {
                Loop::cancelTimer($timer);
            }
            $deferred->resolve($value);
        })
        ->catch(function ($error) use ($deferred, &$timer) {
            if ($timer) {
                Loop::cancelTimer($timer);
            }
            $deferred->reject($error);
        });
    
    $timer = Loop::addTimer($timeout, function () use ($deferred) {
        $deferred->reject(new \RuntimeException('Operation timeout'));
    });
    
    return $deferred->promise();
}

// Usage
withTimeout(fetchUserAsync(1), 5.0)
    ->then(fn($user) => echo "User: {$user['name']}\n")
    ->catch(fn($e) => echo "Error: {$e->getMessage()}\n");
```

### 3. Resource Management
```php
<?php

declare(strict_types=1);

class AsyncResource {
    private $connection;
    private bool $closed = false;
    
    public function __construct() {
        $this->connection = $this->createConnection();
    }
    
    public function __destruct() {
        $this->close();
    }
    
    public function close(): void {
        if (!$this->closed && $this->connection) {
            // Cleanup
            $this->closed = true;
        }
    }
    
    private function createConnection() {
        // Create connection
        return null;
    }
}
```

### 4. Avoiding Callback Hell
```php
<?php

// ❌ Bad: Callback hell
fetchUser(1, function($user) {
    fetchPosts($user['id'], function($posts) {
        fetchComments($posts[0]['id'], function($comments) {
            // Deep nesting
        });
    });
});

// ✅ Good: Promise chaining
fetchUserAsync(1)
    ->then(fn($user) => fetchPostsAsync($user['id']))
    ->then(fn($posts) => fetchCommentsAsync($posts[0]['id']))
    ->then(fn($comments) => processComments($comments))
    ->catch(fn($e) => handleError($e));

// ✅ Better: Async/await style with Amphp
Loop::run(function () {
    try {
        $user = yield fetchUserAsync(1);
        $posts = yield fetchPostsAsync($user['id']);
        $comments = yield fetchCommentsAsync($posts[0]['id']);
        processComments($comments);
    } catch (\Exception $e) {
        handleError($e);
    }
});
```

## Performance Considerations

### DO ✅
- Use async for I/O-bound operations
- Implement proper error handling
- Set timeouts for all async operations
- Use connection pooling for databases
- Profile async code performance
- Monitor memory usage
- Use appropriate concurrency limits

### DON'T ❌
- Don't use async for CPU-intensive tasks
- Don't block the event loop
- Don't forget to handle promise rejections
- Don't create too many concurrent operations
- Don't use global state in async code
- Don't mix blocking and non-blocking code
- Don't ignore memory leaks in long-running processes

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
