# PHP Performance Optimization

## Table of Contents
- [OPcache Configuration](#opcache-configuration)
- [Memory Management](#memory-management)
- [Database Optimization](#database-optimization)
- [Caching Strategies](#caching-strategies)
- [Code Optimization](#code-optimization)
- [Profiling and Debugging](#profiling-and-debugging)
- [Best Practices](#best-practices)

## OPcache Configuration

### Enable OPcache (php.ini)
```ini
[opcache]
; Enable OPcache
opcache.enable=1
opcache.enable_cli=0

; Memory Configuration
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000

; Revalidation
opcache.revalidate_freq=2
opcache.validate_timestamps=1  ; Set to 0 in production

; Performance
opcache.fast_shutdown=1
opcache.enable_file_override=1

; Error handling
opcache.log_verbosity_level=1
opcache.error_log=/var/log/php/opcache.log
```

### Verify OPcache Status
```php
<?php

declare(strict_types=1);

function getOpcacheStatus(): array
{
    if (!function_exists('opcache_get_status')) {
        return ['enabled' => false, 'message' => 'OPcache not available'];
    }
    
    $status = opcache_get_status();
    
    return [
        'enabled' => $status['opcache_enabled'],
        'memory_used' => round($status['memory_usage']['used_memory'] / 1024 / 1024, 2) . ' MB',
        'memory_free' => round($status['memory_usage']['free_memory'] / 1024 / 1024, 2) . ' MB',
        'hit_rate' => round($status['opcache_statistics']['opcache_hit_rate'], 2) . '%',
        'cached_scripts' => $status['opcache_statistics']['num_cached_scripts'],
        'max_cached_keys' => $status['opcache_statistics']['max_cached_keys'],
    ];
}

// Display status
print_r(getOpcacheStatus());
```

## Memory Management

### Efficient Memory Usage
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Use generators for large datasets
function readLargeFile(string $filename): \Generator
{
    $handle = fopen($filename, 'r');
    
    if ($handle === false) {
        throw new \RuntimeException('Cannot open file');
    }
    
    try {
        while (($line = fgets($handle)) !== false) {
            yield $line;
        }
    } finally {
        fclose($handle);
    }
}

// Usage: Low memory consumption
foreach (readLargeFile('large.csv') as $line) {
    processLine($line);
}

// ❌ BAD: Loading entire file into memory
$lines = file('large.csv');  // Loads everything into memory!
foreach ($lines as $line) {
    processLine($line);
}
```

### Memory Limit Management
```php
<?php

declare(strict_types=1);

class MemoryManager
{
    /**
     * Get current memory usage
     */
    public static function getCurrentUsage(bool $realUsage = true): string
    {
        $bytes = memory_get_usage($realUsage);
        return self::formatBytes($bytes);
    }
    
    /**
     * Get peak memory usage
     */
    public static function getPeakUsage(bool $realUsage = true): string
    {
        $bytes = memory_get_peak_usage($realUsage);
        return self::formatBytes($bytes);
    }
    
    /**
     * Format bytes to human-readable format
     */
    private static function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        
        return round($bytes / (1024 ** $power), 2) . ' ' . $units[$power];
    }
    
    /**
     * Check if memory limit is close to being reached
     */
    public static function isMemoryLimitClose(int $threshold = 90): bool
    {
        $limit = ini_get('memory_limit');
        
        if ($limit === '-1') {
            return false;  // No limit
        }
        
        $limitBytes = self::parseMemoryLimit($limit);
        $currentBytes = memory_get_usage(true);
        
        $percentage = ($currentBytes / $limitBytes) * 100;
        
        return $percentage >= $threshold;
    }
    
    private static function parseMemoryLimit(string $limit): int
    {
        $unit = strtoupper(substr($limit, -1));
        $value = (int)substr($limit, 0, -1);
        
        return match($unit) {
            'G' => $value * 1024 * 1024 * 1024,
            'M' => $value * 1024 * 1024,
            'K' => $value * 1024,
            default => (int)$limit,
        };
    }
}

// Monitor memory during execution
echo "Current: " . MemoryManager::getCurrentUsage() . "\n";
echo "Peak: " . MemoryManager::getPeakUsage() . "\n";
```

### Unset Large Variables
```php
<?php

declare(strict_types=1);

function processLargeData(): void
{
    $largeArray = range(1, 1000000);
    
    // Process data
    $result = processArray($largeArray);
    
    // Free memory immediately
    unset($largeArray);
    
    // Continue with result
    saveResult($result);
}
```

## Database Optimization

### Use Prepared Statements Efficiently
```php
<?php

declare(strict_types=1);

class UserRepository
{
    public function __construct(
        private PDO $pdo
    ) {
        // Optimize PDO settings
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    
    /**
     * ✅ GOOD: Reuse prepared statement for bulk operations
     */
    public function insertMultiple(array $users): void
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO users (email, name) VALUES (:email, :name)
        ');
        
        $this->pdo->beginTransaction();
        
        try {
            foreach ($users as $user) {
                $stmt->execute([
                    'email' => $user['email'],
                    'name' => $user['name'],
                ]);
            }
            
            $this->pdo->commit();
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * ✅ GOOD: Use LIMIT for pagination
     */
    public function findPaginated(int $page, int $perPage): array
    {
        $offset = ($page - 1) * $perPage;
        
        $stmt = $this->pdo->prepare('
            SELECT * FROM users 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        ');
        
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}
```

### Connection Pooling
```php
<?php

declare(strict_types=1);

class DatabaseConnectionPool
{
    private static ?PDO $instance = null;
    
    /**
     * Get singleton database connection
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$instance = new PDO(
                'mysql:host=localhost;dbname=test;charset=utf8mb4',
                'user',
                'password',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_PERSISTENT => true,  // Persistent connection
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
                ]
            );
        }
        
        return self::$instance;
    }
}
```

### Query Optimization
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Select only needed columns
$stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE active = 1');

// ❌ BAD: Select all columns when not needed
$stmt = $pdo->prepare('SELECT * FROM users WHERE active = 1');

// ✅ GOOD: Use indexes
$pdo->exec('CREATE INDEX idx_email ON users(email)');
$pdo->exec('CREATE INDEX idx_created_at ON users(created_at)');

// ✅ GOOD: Use EXPLAIN to analyze queries
$stmt = $pdo->query('EXPLAIN SELECT * FROM users WHERE email = "test@example.com"');
print_r($stmt->fetchAll());

// ✅ GOOD: Use JOIN instead of multiple queries
$stmt = $pdo->prepare('
    SELECT u.*, COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.active = 1
    GROUP BY u.id
');

// ❌ BAD: N+1 query problem
$users = $pdo->query('SELECT * FROM users')->fetchAll();
foreach ($users as $user) {
    $posts = $pdo->query("SELECT * FROM posts WHERE user_id = {$user['id']}")->fetchAll();
}
```

## Caching Strategies

### APCu Caching
```php
<?php

declare(strict_types=1);

class ApcuCache
{
    /**
     * Get item from cache
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $success = false;
        $value = apcu_fetch($key, $success);
        
        return $success ? $value : $default;
    }
    
    /**
     * Set item in cache
     */
    public function set(string $key, mixed $value, int $ttl = 3600): bool
    {
        return apcu_store($key, $value, $ttl);
    }
    
    /**
     * Delete item from cache
     */
    public function delete(string $key): bool
    {
        return apcu_delete($key);
    }
    
    /**
     * Remember pattern: get or compute and cache
     */
    public function remember(string $key, callable $callback, int $ttl = 3600): mixed
    {
        $value = $this->get($key);
        
        if ($value === null) {
            $value = $callback();
            $this->set($key, $value, $ttl);
        }
        
        return $value;
    }
}

// Usage
$cache = new ApcuCache();

$users = $cache->remember('active_users', function() use ($repository) {
    return $repository->findActive();
}, 600);
```

### Redis Caching
```php
<?php

declare(strict_types=1);

class RedisCache
{
    private \Redis $redis;
    
    public function __construct(string $host = '127.0.0.1', int $port = 6379)
    {
        $this->redis = new \Redis();
        $this->redis->connect($host, $port);
    }
    
    public function get(string $key): mixed
    {
        $value = $this->redis->get($key);
        
        if ($value === false) {
            return null;
        }
        
        return json_decode($value, true);
    }
    
    public function set(string $key, mixed $value, int $ttl = 3600): bool
    {
        return $this->redis->setex($key, $ttl, json_encode($value));
    }
    
    public function delete(string $key): bool
    {
        return $this->redis->del($key) > 0;
    }
    
    public function flush(): bool
    {
        return $this->redis->flushAll();
    }
    
    /**
     * Cache with tags for easy invalidation
     */
    public function tags(array $tags): self
    {
        // Implementation of tag-based caching
        return $this;
    }
}
```

### Response Caching
```php
<?php

declare(strict_types=1);

class ResponseCache
{
    public function __construct(
        private CacheInterface $cache
    ) {}
    
    /**
     * Cache HTTP response
     */
    public function cacheResponse(
        string $key,
        callable $callback,
        int $ttl = 3600
    ): string {
        $cached = $this->cache->get($key);
        
        if ($cached !== null) {
            header('X-Cache: HIT');
            return $cached;
        }
        
        $response = $callback();
        $this->cache->set($key, $response, $ttl);
        
        header('X-Cache: MISS');
        return $response;
    }
}

// Usage
$cache = new ResponseCache(new RedisCache());

$html = $cache->cacheResponse('homepage', function() {
    return renderHomepage();
}, 600);

echo $html;
```

## Code Optimization

### String Optimization
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Use single quotes for simple strings
$name = 'John Doe';

// ✅ GOOD: Use double quotes only when needed
$greeting = "Hello, {$name}!";

// ✅ GOOD: Use implode for concatenating arrays
$parts = ['Hello', 'World', '!'];
$result = implode(' ', $parts);

// ❌ BAD: Multiple concatenations
$result = $parts[0] . ' ' . $parts[1] . ' ' . $parts[2];

// ✅ GOOD: Use sprintf for complex formatting
$message = sprintf('User %s has %d points', $username, $points);

// ❌ BAD: Multiple concatenations
$message = 'User ' . $username . ' has ' . $points . ' points';
```

### Array Optimization
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Use isset() instead of array_key_exists() for simple checks
if (isset($array['key'])) {
    // Faster
}

// ✅ GOOD: Use array functions
$result = array_map(fn($x) => $x * 2, $numbers);
$filtered = array_filter($numbers, fn($x) => $x > 10);

// ✅ GOOD: Pre-allocate arrays when size is known
$array = array_fill(0, 1000, null);

// ✅ GOOD: Use array_column for extracting values
$ids = array_column($users, 'id');

// ❌ BAD: Manual loop
$ids = [];
foreach ($users as $user) {
    $ids[] = $user['id'];
}
```

### Loop Optimization
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Cache count in variable
$count = count($items);
for ($i = 0; $i < $count; $i++) {
    processItem($items[$i]);
}

// ❌ BAD: Count in every iteration
for ($i = 0; $i < count($items); $i++) {
    processItem($items[$i]);
}

// ✅ GOOD: Use foreach for arrays
foreach ($items as $item) {
    processItem($item);
}

// ✅ GOOD: Break early when possible
foreach ($items as $item) {
    if ($item->matches($criteria)) {
        $found = $item;
        break;  // Don't continue if found
    }
}
```

### Function Call Optimization
```php
<?php

declare(strict_types=1);

// ✅ GOOD: Use static methods for utility functions
class StringHelper
{
    public static function sanitize(string $input): string
    {
        return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    }
}

// ✅ GOOD: Use type hints to avoid runtime checks
function processUser(User $user): void
{
    // No need to check if $user is a User object
}

// ✅ GOOD: Use early returns
function validateUser(array $data): bool
{
    if (empty($data['email'])) {
        return false;
    }
    
    if (empty($data['password'])) {
        return false;
    }
    
    return true;
}
```

## Profiling and Debugging

### Xdebug Profiling
```ini
; php.ini configuration
[xdebug]
xdebug.mode=profile
xdebug.output_dir=/tmp/xdebug
xdebug.profiler_output_name=cachegrind.out.%t
```

### Custom Profiler
```php
<?php

declare(strict_types=1);

class Profiler
{
    private array $timers = [];
    
    /**
     * Start timing a section
     */
    public function start(string $name): void
    {
        $this->timers[$name] = [
            'start' => microtime(true),
            'memory_start' => memory_get_usage(),
        ];
    }
    
    /**
     * Stop timing a section
     */
    public function stop(string $name): array
    {
        if (!isset($this->timers[$name])) {
            throw new \RuntimeException("Timer '{$name}' not started");
        }
        
        $timer = $this->timers[$name];
        
        return [
            'time' => (microtime(true) - $timer['start']) * 1000,  // ms
            'memory' => memory_get_usage() - $timer['memory_start'],
        ];
    }
    
    /**
     * Get all results
     */
    public function getResults(): array
    {
        $results = [];
        
        foreach ($this->timers as $name => $timer) {
            $results[$name] = $this->stop($name);
        }
        
        return $results;
    }
}

// Usage
$profiler = new Profiler();

$profiler->start('database_query');
$users = $repository->findAll();
$dbStats = $profiler->stop('database_query');

$profiler->start('processing');
processUsers($users);
$processStats = $profiler->stop('processing');

echo "Database: {$dbStats['time']} ms, {$dbStats['memory']} bytes\n";
echo "Processing: {$processStats['time']} ms, {$processStats['memory']} bytes\n";
```

### Benchmark Utility
```php
<?php

declare(strict_types=1);

class Benchmark
{
    /**
     * Compare performance of multiple implementations
     */
    public static function compare(array $functions, int $iterations = 1000): array
    {
        $results = [];
        
        foreach ($functions as $name => $function) {
            $start = microtime(true);
            
            for ($i = 0; $i < $iterations; $i++) {
                $function();
            }
            
            $results[$name] = (microtime(true) - $start) * 1000;  // ms
        }
        
        arsort($results);
        
        return $results;
    }
}

// Usage
$results = Benchmark::compare([
    'method1' => fn() => method1($data),
    'method2' => fn() => method2($data),
    'method3' => fn() => method3($data),
], 10000);

foreach ($results as $name => $time) {
    echo "{$name}: {$time} ms\n";
}
```

## Best Practices

### DO ✅
- Enable OPcache in production
- Use generators for large datasets
- Implement caching (OPcache, APCu, Redis)
- Profile code before optimizing
- Use prepared statements and connection pooling
- Optimize database queries and use indexes
- Cache expensive computations
- Use efficient data structures
- Minimize file I/O operations
- Use lazy loading when appropriate
- Monitor memory usage
- Set appropriate memory limits
- Use CDN for static assets
- Enable HTTP/2 or HTTP/3
- Implement response compression (gzip)

### DON'T ❌
- Premature optimization
- Ignore OPcache configuration
- Load entire large files into memory
- Use SELECT * in queries
- Skip database indexing
- Ignore N+1 query problems
- Cache everything indefinitely
- Use eval() or create_function()
- Ignore memory leaks
- Use @ error suppression operator
- Perform unnecessary computations in loops
- Load unused classes or libraries
- Skip profiling and benchmarking

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
