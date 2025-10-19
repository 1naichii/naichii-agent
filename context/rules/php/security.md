# PHP Security Best Practices

## Table of Contents
- [Input Validation and Sanitization](#input-validation-and-sanitization)
- [SQL Injection Prevention](#sql-injection-prevention)
- [XSS Prevention](#xss-prevention)
- [CSRF Protection](#csrf-protection)
- [Authentication and Authorization](#authentication-and-authorization)
- [Session Security](#session-security)
- [File Upload Security](#file-upload-security)
- [Cryptography](#cryptography)
- [Security Headers](#security-headers)
- [Common Vulnerabilities](#common-vulnerabilities)

## Input Validation and Sanitization

### Always Validate User Input
```php
<?php

declare(strict_types=1);

class InputValidator {
    /**
     * Validate email address
     */
    public static function validateEmail(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate integer with range
     */
    public static function validateInt(mixed $value, int $min, int $max): ?int {
        $int = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => [
                'min_range' => $min,
                'max_range' => $max,
            ],
        ]);
        
        return $int !== false ? $int : null;
    }
    
    /**
     * Validate URL
     */
    public static function validateUrl(string $url): bool {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString(string $input): string {
        // Remove HTML tags and special characters
        $clean = strip_tags($input);
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim($clean);
    }
}

// Usage
$email = $_POST['email'] ?? '';
if (!InputValidator::validateEmail($email)) {
    throw new InvalidArgumentException('Invalid email address');
}

$age = InputValidator::validateInt($_POST['age'] ?? '', 1, 150);
if ($age === null) {
    throw new InvalidArgumentException('Invalid age');
}
```

### Input Filtering
```php
<?php

declare(strict_types=1);

class RequestValidator {
    private array $errors = [];
    
    /**
     * Validate and sanitize POST data
     */
    public function validatePost(array $rules): array {
        $validated = [];
        
        foreach ($rules as $field => $rule) {
            $value = $_POST[$field] ?? null;
            
            if ($rule['required'] && empty($value)) {
                $this->errors[$field] = "{$field} is required";
                continue;
            }
            
            if (!empty($value)) {
                $validated[$field] = $this->applyFilter($value, $rule);
            }
        }
        
        if (!empty($this->errors)) {
            throw new ValidationException('Validation failed', $this->errors);
        }
        
        return $validated;
    }
    
    private function applyFilter(mixed $value, array $rule): mixed {
        return match($rule['type']) {
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL),
            'int' => filter_var($value, FILTER_VALIDATE_INT),
            'float' => filter_var($value, FILTER_VALIDATE_FLOAT),
            'url' => filter_var($value, FILTER_VALIDATE_URL),
            'string' => $this->sanitizeString((string)$value),
            default => $value,
        };
    }
    
    private function sanitizeString(string $value): string {
        return htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
    }
    
    public function getErrors(): array {
        return $this->errors;
    }
}
```

## SQL Injection Prevention

### Always Use Prepared Statements (PDO)
```php
<?php

declare(strict_types=1);

class UserRepository {
    public function __construct(
        private PDO $pdo
    ) {
        // Set PDO to throw exceptions
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    }
    
    /**
     * ✅ SAFE: Using prepared statements
     */
    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    }
    
    /**
     * ✅ SAFE: Multiple parameters with prepared statements
     */
    public function findByEmailAndStatus(string $email, string $status): array {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM users WHERE email = :email AND status = :status'
        );
        $stmt->execute([
            'email' => $email,
            'status' => $status,
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * ✅ SAFE: INSERT with prepared statements
     */
    public function create(string $name, string $email, string $password): int {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (name, email, password, created_at) 
             VALUES (:name, :email, :password, NOW())'
        );
        
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_ARGON2ID),
        ]);
        
        return (int)$this->pdo->lastInsertId();
    }
    
    /**
     * ❌ DANGEROUS: Never do this!
     */
    public function unsafeFind(string $email): array {
        // SQL INJECTION VULNERABILITY!
        $sql = "SELECT * FROM users WHERE email = '{$email}'";
        return $this->pdo->query($sql)->fetchAll();
    }
}
```

### Query Builder Pattern (Safe)
```php
<?php

declare(strict_types=1);

class QueryBuilder {
    private string $table = '';
    private array $wheres = [];
    private array $bindings = [];
    private string $select = '*';
    
    public function __construct(
        private PDO $pdo
    ) {}
    
    public function table(string $table): self {
        $this->table = $table;
        return $this;
    }
    
    public function select(string $columns): self {
        $this->select = $columns;
        return $this;
    }
    
    public function where(string $column, string $operator, mixed $value): self {
        $placeholder = ':param' . count($this->bindings);
        $this->wheres[] = "{$column} {$operator} {$placeholder}";
        $this->bindings[$placeholder] = $value;
        return $this;
    }
    
    public function get(): array {
        $sql = "SELECT {$this->select} FROM {$this->table}";
        
        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->bindings);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Usage
$users = (new QueryBuilder($pdo))
    ->table('users')
    ->select('id, name, email')
    ->where('status', '=', 'active')
    ->where('age', '>=', 18)
    ->get();
```

## XSS Prevention

### Output Escaping
```php
<?php

declare(strict_types=1);

class OutputEscaper {
    /**
     * Escape HTML output
     */
    public static function html(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    /**
     * Escape JavaScript output
     */
    public static function js(string $text): string {
        return json_encode($text, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    }
    
    /**
     * Escape URL parameter
     */
    public static function url(string $text): string {
        return urlencode($text);
    }
    
    /**
     * Escape CSS
     */
    public static function css(string $text): string {
        return preg_replace('/[^a-zA-Z0-9\-_]/', '', $text);
    }
    
    /**
     * Escape for use in HTML attribute
     */
    public static function attr(string $text): string {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}

// Usage in templates
?>
<!-- ✅ SAFE: Properly escaped -->
<div class="user-name"><?= OutputEscaper::html($user['name']) ?></div>
<a href="/user/<?= OutputEscaper::url($user['id']) ?>">Profile</a>
<div data-user='<?= OutputEscaper::attr($user['email']) ?>'>User Info</div>

<script>
    const userName = <?= OutputEscaper::js($user['name']) ?>;
</script>

<!-- ❌ DANGEROUS: Not escaped - XSS vulnerability! -->
<div><?= $user['name'] ?></div>
```

### Content Security Policy (CSP)
```php
<?php

declare(strict_types=1);

class SecurityHeaders {
    public static function setCSP(): void {
        header("Content-Security-Policy: " . implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.example.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]));
    }
    
    public static function setAllSecurityHeaders(): void {
        // CSP
        self::setCSP();
        
        // XSS Protection
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        
        // HSTS
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        
        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions Policy
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    }
}

// Apply at application bootstrap
SecurityHeaders::setAllSecurityHeaders();
```

## CSRF Protection

### CSRF Token Implementation
```php
<?php

declare(strict_types=1);

class CsrfProtection {
    private const TOKEN_NAME = 'csrf_token';
    private const TOKEN_LENGTH = 32;
    
    /**
     * Generate CSRF token
     */
    public static function generateToken(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $_SESSION[self::TOKEN_NAME] = $token;
        
        return $token;
    }
    
    /**
     * Get current CSRF token
     */
    public static function getToken(): ?string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return $_SESSION[self::TOKEN_NAME] ?? null;
    }
    
    /**
     * Validate CSRF token
     */
    public static function validateToken(string $token): bool {
        $sessionToken = self::getToken();
        
        if ($sessionToken === null) {
            return false;
        }
        
        return hash_equals($sessionToken, $token);
    }
    
    /**
     * Validate token from request
     */
    public static function validateRequest(): bool {
        $token = $_POST[self::TOKEN_NAME] 
            ?? $_SERVER['HTTP_X_CSRF_TOKEN'] 
            ?? null;
        
        if ($token === null) {
            return false;
        }
        
        return self::validateToken($token);
    }
    
    /**
     * Generate hidden form field
     */
    public static function formField(): string {
        $token = self::generateToken();
        return sprintf(
            '<input type="hidden" name="%s" value="%s">',
            self::TOKEN_NAME,
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8')
        );
    }
}

// Usage in forms
?>
<form method="POST" action="/update-profile">
    <?= CsrfProtection::formField() ?>
    <input type="text" name="name">
    <button type="submit">Update</button>
</form>

<?php
// Validate in controller
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!CsrfProtection::validateRequest()) {
        http_response_code(403);
        die('CSRF token validation failed');
    }
    
    // Process form
}
```

## Authentication and Authorization

### Secure Password Hashing
```php
<?php

declare(strict_types=1);

class PasswordManager {
    /**
     * Hash password securely
     */
    public static function hash(string $password): string {
        // Use Argon2id (recommended) or bcrypt
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3,
        ]);
        
        // Alternative: bcrypt
        // return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }
    
    /**
     * Verify password
     */
    public static function verify(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }
    
    /**
     * Check if password needs rehashing
     */
    public static function needsRehash(string $hash): bool {
        return password_needs_rehash($hash, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3,
        ]);
    }
    
    /**
     * Validate password strength
     */
    public static function validateStrength(string $password): bool {
        // Minimum 8 characters, at least one uppercase, lowercase, number, special char
        $pattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/';
        return preg_match($pattern, $password) === 1;
    }
}

// Usage
class AuthService {
    public function register(string $email, string $password): void {
        if (!PasswordManager::validateStrength($password)) {
            throw new InvalidArgumentException('Password does not meet requirements');
        }
        
        $hashedPassword = PasswordManager::hash($password);
        
        // Save to database
        $this->userRepository->create($email, $hashedPassword);
    }
    
    public function login(string $email, string $password): ?User {
        $user = $this->userRepository->findByEmail($email);
        
        if ($user === null) {
            // Prevent user enumeration - take same time
            PasswordManager::verify($password, '$2y$10$...');
            return null;
        }
        
        if (!PasswordManager::verify($password, $user['password'])) {
            return null;
        }
        
        // Check if password needs rehashing
        if (PasswordManager::needsRehash($user['password'])) {
            $newHash = PasswordManager::hash($password);
            $this->userRepository->updatePassword($user['id'], $newHash);
        }
        
        return $user;
    }
}
```

### Role-Based Access Control (RBAC)
```php
<?php

declare(strict_types=1);

enum Role: string {
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';
    case USER = 'user';
    case GUEST = 'guest';
}

enum Permission: string {
    case CREATE_POST = 'create_post';
    case EDIT_POST = 'edit_post';
    case DELETE_POST = 'delete_post';
    case MANAGE_USERS = 'manage_users';
    case VIEW_ANALYTICS = 'view_analytics';
}

class Authorization {
    private const ROLE_PERMISSIONS = [
        'admin' => ['*'], // All permissions
        'moderator' => [
            Permission::EDIT_POST->value,
            Permission::DELETE_POST->value,
            Permission::VIEW_ANALYTICS->value,
        ],
        'user' => [
            Permission::CREATE_POST->value,
            Permission::EDIT_POST->value,
        ],
        'guest' => [],
    ];
    
    public static function can(string $role, Permission $permission): bool {
        $permissions = self::ROLE_PERMISSIONS[$role] ?? [];
        
        // Admin has all permissions
        if (in_array('*', $permissions, true)) {
            return true;
        }
        
        return in_array($permission->value, $permissions, true);
    }
    
    public static function authorize(string $role, Permission $permission): void {
        if (!self::can($role, $permission)) {
            throw new UnauthorizedException(
                "Role '{$role}' does not have permission '{$permission->value}'"
            );
        }
    }
}

// Usage
class PostController {
    public function delete(int $postId): void {
        $currentUserRole = $_SESSION['user_role'] ?? 'guest';
        
        Authorization::authorize($currentUserRole, Permission::DELETE_POST);
        
        // Proceed with deletion
        $this->postRepository->delete($postId);
    }
}
```

## Session Security

### Secure Session Configuration
```php
<?php

declare(strict_types=1);

class SessionManager {
    public static function start(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        
        // Secure session configuration
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1'); // HTTPS only
        ini_set('session.cookie_samesite', 'Strict');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.sid_length', '48');
        ini_set('session.sid_bits_per_character', '6');
        
        // Session name
        session_name('SECURE_SESSION_ID');
        
        // Start session
        session_start();
        
        // Regenerate session ID periodically
        self::regenerateIfNeeded();
    }
    
    private static function regenerateIfNeeded(): void {
        $timeout = 300; // 5 minutes
        
        if (!isset($_SESSION['last_regeneration'])) {
            $_SESSION['last_regeneration'] = time();
        } elseif (time() - $_SESSION['last_regeneration'] > $timeout) {
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = time();
        }
    }
    
    public static function destroy(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
            
            session_destroy();
        }
    }
}
```

## File Upload Security

### Secure File Upload Handler
```php
<?php

declare(strict_types=1);

class FileUploadHandler {
    private const ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
    ];
    
    private const MAX_SIZE = 5242880; // 5MB
    
    private const UPLOAD_DIR = __DIR__ . '/uploads/';
    
    /**
     * Validate and process uploaded file
     */
    public function upload(array $file): string {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload failed with error: ' . $file['error']);
        }
        
        // Validate file size
        if ($file['size'] > self::MAX_SIZE) {
            throw new InvalidArgumentException('File too large. Maximum size: 5MB');
        }
        
        // Validate MIME type
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, self::ALLOWED_TYPES, true)) {
            throw new InvalidArgumentException('Invalid file type');
        }
        
        // Validate file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
        
        if (!in_array($extension, $allowedExtensions, true)) {
            throw new InvalidArgumentException('Invalid file extension');
        }
        
        // Generate secure filename
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = self::UPLOAD_DIR . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new RuntimeException('Failed to move uploaded file');
        }
        
        // Set restrictive permissions
        chmod($destination, 0644);
        
        return $filename;
    }
}

// Usage
try {
    $handler = new FileUploadHandler();
    $filename = $handler->upload($_FILES['avatar']);
    echo "File uploaded: {$filename}";
} catch (Exception $e) {
    echo "Upload error: " . $e->getMessage();
}
```

## Cryptography

### Encryption and Decryption
```php
<?php

declare(strict_types=1);

class Encryption {
    private const CIPHER = 'aes-256-gcm';
    
    public function __construct(
        private string $key
    ) {
        if (strlen($key) !== 32) {
            throw new InvalidArgumentException('Key must be 32 bytes');
        }
    }
    
    /**
     * Encrypt data
     */
    public function encrypt(string $data): string {
        $iv = random_bytes(openssl_cipher_iv_length(self::CIPHER));
        $tag = '';
        
        $ciphertext = openssl_encrypt(
            $data,
            self::CIPHER,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );
        
        if ($ciphertext === false) {
            throw new RuntimeException('Encryption failed');
        }
        
        // Combine IV + tag + ciphertext and encode
        return base64_encode($iv . $tag . $ciphertext);
    }
    
    /**
     * Decrypt data
     */
    public function decrypt(string $encrypted): string {
        $decoded = base64_decode($encrypted, true);
        
        if ($decoded === false) {
            throw new InvalidArgumentException('Invalid encrypted data');
        }
        
        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        $iv = substr($decoded, 0, $ivLength);
        $tag = substr($decoded, $ivLength, 16);
        $ciphertext = substr($decoded, $ivLength + 16);
        
        $plaintext = openssl_decrypt(
            $ciphertext,
            self::CIPHER,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
        
        if ($plaintext === false) {
            throw new RuntimeException('Decryption failed');
        }
        
        return $plaintext;
    }
}

// Usage
$key = random_bytes(32); // Store securely!
$encryption = new Encryption($key);

$encrypted = $encryption->encrypt('Sensitive data');
$decrypted = $encryption->decrypt($encrypted);
```

## Best Practices Summary

### DO ✅
- Use `declare(strict_types=1)` in all files
- Validate and sanitize ALL user input
- Use prepared statements for database queries
- Escape output based on context (HTML, JS, URL, etc.)
- Implement CSRF protection for state-changing operations
- Use strong password hashing (Argon2id or bcrypt)
- Enable secure session configuration
- Validate file uploads thoroughly
- Set security headers (CSP, HSTS, X-Frame-Options, etc.)
- Use HTTPS everywhere
- Keep PHP and dependencies updated
- Log security events
- Implement rate limiting
- Use environment variables for secrets

### DON'T ❌
- Don't trust user input
- Don't use MD5 or SHA1 for passwords
- Don't store passwords in plain text
- Don't concatenate SQL queries
- Don't use `eval()` or `exec()` with user input
- Don't expose detailed error messages in production
- Don't use `extract()` with user data
- Don't disable security features
- Don't use weak encryption algorithms
- Don't commit secrets to version control
- Don't use `register_globals`
- Don't use `magic_quotes`

---

**Version**: 1.0  
**Last Updated**: 2025-10-19
