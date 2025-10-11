# JavaScript Security - Input Validation, XSS Prevention, and Safe Coding

**Purpose**: Security best practices for JavaScript applications to prevent vulnerabilities.

---

## Table of Contents
1. [Input Validation and Sanitization](#input-validation-and-sanitization)
2. [XSS Prevention](#xss-prevention)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Secure Data Handling](#secure-data-handling)
5. [API Security](#api-security)
6. [Dependency Security](#dependency-security)

---

## Input Validation and Sanitization

### Rule 1: Always Validate User Input

```javascript
// ✅ CORRECT - Comprehensive validation
function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new TypeError('Email must be a string');
  }
  
  if (email.length === 0) {
    throw new Error('Email cannot be empty');
  }
  
  if (email.length > 255) {
    throw new Error('Email is too long');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

// ✅ CORRECT - Validate complex objects
function validateUserInput(input) {
  const schema = {
    username: (val) => typeof val === 'string' && val.length >= 3 && val.length <= 20,
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    age: (val) => Number.isInteger(val) && val >= 18 && val <= 120
  };
  
  const errors = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    if (!validator(input[field])) {
      errors[field] = `Invalid ${field}`;
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return input;
}

// ❌ WRONG - No validation
function processUser(email) {
  return database.query(`SELECT * FROM users WHERE email = '${email}'`);
  // SQL injection vulnerability!
}
```

### Rule 2: Sanitize HTML Content

```javascript
// ✅ CORRECT - Escape HTML entities
function escapeHtml(unsafe) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return unsafe.replace(/[&<>"']/g, (char) => map[char]);
}

// Usage
const userInput = '<script>alert("XSS")</script>';
const safe = escapeHtml(userInput);
document.getElementById('content').textContent = safe;
// Displays as text, not executed

// ✅ CORRECT - Use DOMPurify for rich content
import DOMPurify from 'dompurify';

function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

// ❌ WRONG - Direct innerHTML with user content
function displayContent(userContent) {
  document.getElementById('content').innerHTML = userContent;
  // XSS vulnerability!
}

// ✅ CORRECT - Use textContent for plain text
function displayContent(userContent) {
  document.getElementById('content').textContent = userContent;
  // Safe - renders as text
}
```

### Rule 3: Validate File Uploads

```javascript
// ✅ CORRECT - Validate file type and size
function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  } = options;
  
  // Check if file exists
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Validate size
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
  }
  
  // Validate MIME type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  // Validate file extension
  const extension = file.name.split('.').pop().toLowerCase();
  const allowedExtensions = allowedTypes.map(type => type.split('/')[1]);
  
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file extension: ${extension}`);
  }
  
  return true;
}

// ✅ CORRECT - Sanitize filename
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')  // Replace unsafe chars
    .replace(/\.{2,}/g, '.')         // No multiple dots
    .substring(0, 255);              // Limit length
}

// Usage
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  
  try {
    validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png']
    });
    
    const safeName = sanitizeFilename(file.name);
    uploadFile(file, safeName);
    
  } catch (error) {
    alert(error.message);
  }
});
```

---

## XSS Prevention

### Rule 4: Never Use eval() or Function Constructor

```javascript
// ❌ WRONG - eval() is dangerous
function calculate(expression) {
  return eval(expression);  // Can execute arbitrary code!
}

calculate('console.log(document.cookie)');  // Leaks cookies!

// ✅ CORRECT - Use safe alternatives
function calculate(expression) {
  const allowedOperators = ['+', '-', '*', '/', '(', ')'];
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
  
  // Use math library or parser
  return math.evaluate(sanitized);
}

// ❌ WRONG - Function constructor
const userFunc = new Function(userInput);
userFunc();  // Can execute arbitrary code!

// ✅ CORRECT - Use predefined safe functions
const allowedFunctions = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

function executeFunction(funcName, ...args) {
  if (!allowedFunctions[funcName]) {
    throw new Error('Function not allowed');
  }
  
  return allowedFunctions[funcName](...args);
}
```

### Rule 5: Use Content Security Policy (CSP)

```javascript
// ✅ CORRECT - Set CSP headers (server-side)
// Express.js example
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://trusted-cdn.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.example.com;"
  );
  next();
});

// ✅ CORRECT - Use nonce for inline scripts
// Server generates nonce
const nonce = crypto.randomBytes(16).toString('base64');

res.setHeader(
  'Content-Security-Policy',
  `script-src 'self' 'nonce-${nonce}'`
);

// In HTML
// <script nonce="${nonce}">
//   // Safe inline script
// </script>
```

### Rule 6: Safely Handle URLs

```javascript
// ✅ CORRECT - Validate and sanitize URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    return true;
    
  } catch {
    return false;
  }
}

function sanitizeUrl(url) {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }
  
  const parsed = new URL(url);
  
  // Remove dangerous protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'about:blank';
  }
  
  return parsed.href;
}

// ❌ WRONG - Direct use of user-provided URLs
link.href = userInput;  // Can be javascript:alert('XSS')

// ✅ CORRECT - Validate before use
try {
  link.href = sanitizeUrl(userInput);
} catch (error) {
  console.error('Invalid URL:', error);
  link.href = '#';
}
```

---

## Authentication and Authorization

### Rule 7: Store Tokens Securely

```javascript
// ✅ CORRECT - Use httpOnly cookies (server-side)
// Express.js example
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  const token = generateToken(user);
  
  res.cookie('token', token, {
    httpOnly: true,      // Not accessible via JavaScript
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 3600000      // 1 hour
  });
  
  res.json({ success: true });
});

// ⚠️ CAUTION - localStorage (vulnerable to XSS)
// Only use if httpOnly cookies aren't possible
function storeToken(token) {
  // Encrypt before storing
  const encrypted = encrypt(token);
  localStorage.setItem('token', encrypted);
}

// ❌ WRONG - Plain token in localStorage
localStorage.setItem('token', token);  // Accessible by any script!
```

### Rule 8: Implement Proper Password Handling

```javascript
// ✅ CORRECT - Client-side validation only (hash server-side!)
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters`);
  }
  
  if (!hasUpperCase || !hasLowerCase) {
    throw new Error('Password must contain both uppercase and lowercase');
  }
  
  if (!hasNumbers) {
    throw new Error('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    throw new Error('Password must contain at least one special character');
  }
  
  return true;
}

// ❌ WRONG - Storing passwords in plain text (even temporarily)
const user = {
  username: 'john',
  password: '12345'  // NEVER store passwords in plain text!
};

// ✅ CORRECT - Server-side hashing (Node.js example)
import bcrypt from 'bcrypt';

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

### Rule 9: Implement Rate Limiting

```javascript
// ✅ CORRECT - Simple rate limiter
class RateLimiter {
  #attempts = new Map();
  
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const userAttempts = this.#attempts.get(identifier) || [];
    
    // Remove old attempts outside window
    const recentAttempts = userAttempts.filter(
      time => now - time < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.#attempts.set(identifier, recentAttempts);
    
    return true;
  }
  
  reset(identifier) {
    this.#attempts.delete(identifier);
  }
}

// Usage
const loginLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min

async function handleLogin(email, password) {
  if (!loginLimiter.isAllowed(email)) {
    throw new Error('Too many login attempts. Please try again later.');
  }
  
  const user = await authenticateUser(email, password);
  
  if (user) {
    loginLimiter.reset(email);
    return user;
  }
  
  throw new Error('Invalid credentials');
}
```

---

## Secure Data Handling

### Rule 10: Never Expose Sensitive Data

```javascript
// ✅ CORRECT - Sanitize data before sending to client
function sanitizeUser(user) {
  const { password, securityQuestions, ssn, ...publicData } = user;
  return publicData;
}

// API endpoint
app.get('/api/user/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(sanitizeUser(user));
});

// ❌ WRONG - Sending entire user object
app.get('/api/user/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);  // Includes password hash, SSN, etc.!
});

// ✅ CORRECT - Encrypt sensitive data in transit
import crypto from 'crypto';

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    data: encrypted
  };
}

function decrypt(encrypted, key) {
  const iv = Buffer.from(encrypted.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Rule 11: Use Environment Variables for Secrets

```javascript
// ✅ CORRECT - Use environment variables
// .env file (NEVER commit to git!)
// API_KEY=your_secret_key_here
// DATABASE_URL=postgres://user:pass@localhost/db

// Load with dotenv
import dotenv from 'dotenv';
dotenv.config();

const config = {
  apiKey: process.env.API_KEY,
  databaseUrl: process.env.DATABASE_URL
};

if (!config.apiKey) {
  throw new Error('API_KEY environment variable is required');
}

// ❌ WRONG - Hardcoded secrets
const API_KEY = 'sk_live_1234567890abcdef';  // NEVER do this!
const config = {
  database: {
    host: 'localhost',
    password: 'mypassword123'  // NEVER do this!
  }
};
```

---

## API Security

### Rule 12: Validate and Sanitize API Requests

```javascript
// ✅ CORRECT - Comprehensive API validation
import Joi from 'joi';

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120),
  role: Joi.string().valid('user', 'admin', 'moderator').default('user')
});

app.post('/api/users', async (req, res) => {
  try {
    // Validate request body
    const validated = await userSchema.validateAsync(req.body);
    
    // Process validated data
    const user = await createUser(validated);
    
    res.status(201).json(sanitizeUser(user));
    
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ WRONG - No validation
app.post('/api/users', async (req, res) => {
  const user = await createUser(req.body);  // Dangerous!
  res.json(user);
});
```

### Rule 13: Implement CORS Properly

```javascript
// ✅ CORRECT - Restrictive CORS configuration
import cors from 'cors';

const corsOptions = {
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));

// ⚠️ CAUTION - Avoid wildcard in production
app.use(cors({
  origin: '*'  // Allows all origins - only for development!
}));

// ✅ CORRECT - Dynamic origin validation
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['https://myapp.com', 'https://admin.myapp.com'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

## Dependency Security

### Rule 14: Keep Dependencies Updated

```javascript
// ✅ CORRECT - Regular security audits
// Run these commands regularly:
// npm audit
// npm audit fix
// npm outdated

// In package.json, use specific versions
{
  "dependencies": {
    "express": "^4.18.2",        // ✅ Caret allows patch updates
    "bcrypt": "~5.1.0"            // ✅ Tilde allows patch updates only
  }
}

// ❌ WRONG - Wildcard versions
{
  "dependencies": {
    "express": "*",               // ❌ Can break on major updates
    "bcrypt": "latest"            // ❌ Unpredictable
  }
}

// ✅ CORRECT - Use npm ci for consistent installs
// In CI/CD pipelines, use:
// npm ci  (instead of npm install)
```

### Rule 15: Validate Third-Party Scripts

```javascript
// ✅ CORRECT - Subresource Integrity (SRI)
<script 
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous"
></script>

// ✅ CORRECT - Load scripts securely
function loadScript(url, integrity) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    
    script.onload = resolve;
    script.onerror = reject;
    
    document.head.appendChild(script);
  });
}

// Usage with SRI
await loadScript(
  'https://cdn.example.com/library.js',
  'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux...'
);
```

---

## Security Checklist

Before deploying, verify:

- [ ] All user input is validated and sanitized
- [ ] HTML content is escaped or sanitized (DOMPurify)
- [ ] No use of eval(), Function(), or innerHTML with user data
- [ ] Tokens stored in httpOnly cookies (not localStorage)
- [ ] Passwords hashed server-side (bcrypt, argon2)
- [ ] Rate limiting implemented for authentication endpoints
- [ ] Sensitive data not exposed in API responses
- [ ] Environment variables used for secrets (not hardcoded)
- [ ] API requests validated with schemas
- [ ] CORS configured properly (not wildcard in production)
- [ ] Content Security Policy (CSP) headers set
- [ ] Dependencies up to date (npm audit clean)
- [ ] Third-party scripts loaded with SRI
- [ ] HTTPS enforced in production
- [ ] Input length limits enforced

---

**Common Vulnerabilities to Avoid**:
- ❌ XSS (Cross-Site Scripting)
- ❌ SQL Injection
- ❌ CSRF (Cross-Site Request Forgery)
- ❌ Broken Authentication
- ❌ Sensitive Data Exposure
- ❌ Broken Access Control
- ❌ Security Misconfiguration
- ❌ Using Components with Known Vulnerabilities

---

**Related Rules**:
- Input handling → `@basics.md`
- Async security → `@async.md`
- API patterns → `@advanced.md`
