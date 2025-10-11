---
description: 'Main JavaScript guidelines - Critical rules and quick reference'
applyTo: '**/*.{js,mjs,cjs,jsx}'
---

# JavaScript Development Guidelines - Main Index

> **📦 Installation**: To install the complete framework in any project, run:
> ```bash
> npx naichii-agent install
> ```
> This will copy all rules, context, and memory files to `.naichii-agent/` in your project.

**Quick Navigation**: This is the main entry point. For detailed guidelines, see `context/rules/javascript/` directory (or `.naichii-agent/rules/javascript/` after installation).

**When to use detailed rules**:
- Code structure and patterns → `@context/rules/javascript/basics.md`
- Performance problems → `@context/rules/javascript/optimization.md`
- Async programming → `@context/rules/javascript/async.md`
- Security concerns → `@context/rules/javascript/security.md`
- Advanced JavaScript features → `@context/rules/javascript/advanced.md`
- Testing and debugging → `@context/rules/javascript/testing.md`

---

## 🔴 CRITICAL RULES (ALWAYS FOLLOW)

### 1. Variable Declarations (Non-Negotiable)
```javascript
// ✅ CORRECT - Use const by default
const API_URL = 'https://api.example.com';
const user = { name: 'John', age: 30 };

// ✅ CORRECT - Use let when reassignment is needed
let counter = 0;
for (let i = 0; i < 10; i++) {
  counter += i;
}

// ❌ WRONG - Never use var
var oldStyle = 'bad';
```

### 2. Always Use Strict Equality
```javascript
// ✅ CORRECT
if (value === 0) { }
if (user !== null) { }

// ❌ WRONG - Type coercion bugs
if (value == 0) { }
if (user != null) { }
```

### 3. Naming Conventions
```javascript
// ✅ CORRECT
const userName = 'John';                    // camelCase for variables
const MAX_RETRIES = 3;                      // UPPER_SNAKE_CASE for constants
class UserAccount { }                       // PascalCase for classes
function calculateTotal() { }               // camelCase for functions

// ❌ WRONG
const UserName = 'John';                    // Wrong case
const max_retries = 3;                      // Wrong case
class userAccount { }                       // Wrong case
function CalculateTotal() { }               // Wrong case
```

### 4. Function Best Practices
```javascript
// ✅ CORRECT - Pure function with validation
function calculateDiscount(price, discountPercent) {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Invalid price');
  }
  return price * (1 - discountPercent / 100);
}

// ✅ CORRECT - Return new array (immutable)
function addItem(array, item) {
  return [...array, item];
}

// ❌ WRONG - Mutating parameters
function addItem(array, item) {
  array.push(item);  // Mutates input!
  return array;
}
```

### 5. Error Handling (Always Required)
```javascript
// ✅ CORRECT - Async with try-catch
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}

// ❌ WRONG - No error handling
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json(); // Can fail silently!
}
```

### 6. Use Modern Array Methods
```javascript
// ✅ CORRECT - Declarative and readable
const activeUsers = users.filter(user => user.isActive);
const userNames = users.map(user => user.name);
const total = prices.reduce((sum, price) => sum + price, 0);

// ❌ WRONG - Imperative loops
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}
```

### 7. Object and Array Destructuring
```javascript
// ✅ CORRECT - Destructuring
const { name, age, email } = user;
const [first, second, ...rest] = array;

// Function parameters
function createUser({ name, email, role = 'user' }) {
  return { name, email, role };
}

// ❌ WRONG - Verbose access
const name = user.name;
const age = user.age;
const email = user.email;
```

### 8. Async/Await Over Promises
```javascript
// ✅ CORRECT - Async/await (readable)
async function getUserPosts(userId) {
  const user = await fetchUser(userId);
  const posts = await fetchPosts(user.id);
  return { user, posts };
}

// ✅ CORRECT - Parallel operations with Promise.all
async function loadDashboard() {
  const [users, posts, stats] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchStats()
  ]);
  return { users, posts, stats };
}

// ❌ WRONG - Promise chains (harder to read)
function getUserPosts(userId) {
  return fetchUser(userId)
    .then(user => fetchPosts(user.id))
    .then(posts => ({ user, posts }));
}
```

### 9. Proper JSDoc Comments
```javascript
// ✅ CORRECT - Comprehensive JSDoc
/**
 * Calculates the total price with tax
 * @param {number} price - The base price
 * @param {number} taxRate - Tax rate as decimal (0.1 for 10%)
 * @returns {number} Total price including tax
 * @throws {Error} If price is invalid
 */
function calculateTotalPrice(price, taxRate) {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Invalid price');
  }
  return price * (1 + taxRate);
}

// ❌ WRONG - No documentation
function calculateTotalPrice(price, taxRate) {
  return price * (1 + taxRate);
}
```

### 10. Avoid Common Pitfalls
```javascript
// ✅ CORRECT - Check for null/undefined
const userName = user?.name ?? 'Guest';  // Optional chaining + nullish coalescing

// ✅ CORRECT - Use Number() for conversion
const num = Number(input);

// ✅ CORRECT - Clone objects properly
const userCopy = { ...user };
const deepCopy = structuredClone(user);

// ❌ WRONG - Loose checking
const userName = user && user.name || 'Guest';  // Fails on empty string

// ❌ WRONG - Type coercion
const num = +input;  // Unclear

// ❌ WRONG - Shallow copy issues
const userCopy = user;  // Just a reference!
```

---

## 📋 Quick Reference Card

### Standard Function Template
```javascript
/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return value description
 */
function functionName(paramName) {
  if (!paramName || typeof paramName !== 'expectedType') {
    throw new Error('Invalid parameter');
  }
  
  const result = processData(paramName);
  return result;
}
```

### Standard Async Function Template
```javascript
/**
 * Async function description
 * @param {Type} paramName - Parameter description
 * @returns {Promise<Type>} Return value description
 */
async function asyncFunctionName(paramName) {
  try {
    if (!paramName) throw new Error('Invalid parameter');
    
    const data = await fetchData(paramName);
    return processData(data);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Standard Class Template
```javascript
class ClassName {
  constructor(param) {
    this.publicField = param;
  }
  
  getResult() {
    return this.publicField;
  }
}
```

---

## 🎯 Performance Goals

| Operation Type | Target Time |
|---------------|-------------|
| DOM manipulation | < 16ms (60 FPS) |
| API calls | < 200ms |
| Data processing | < 100ms |
| Page load | < 3s |
| Time to Interactive | < 5s |

---

## 📚 Detailed Guidelines

**IMPORTANT**: When facing specific JavaScript challenges, reference detailed rules in `context/rules/javascript/`:

| Problem Type | Reference File | Use When |
|-------------|----------------|----------|
| 🏗️ Code structure, patterns, naming | `@context/rules/javascript/basics.md` | Writing functions, classes, modules, organizing code |
| ⚡ Performance issues, optimization | `@context/rules/javascript/optimization.md` | Slow code, memory leaks, inefficient algorithms |
| 🔄 Async programming, promises | `@context/rules/javascript/async.md` | API calls, parallel operations, event handling |
| 🔒 Security, validation, sanitization | `@context/rules/javascript/security.md` | User input, authentication, XSS prevention |
| 🚀 Advanced features, design patterns | `@context/rules/javascript/advanced.md` | Complex patterns, proxies, generators, meta-programming |
| 🧪 Testing, debugging, quality | `@context/rules/javascript/testing.md` | Writing tests, debugging, code quality tools |

**How to use**: Mention the specific file when asking for help:
```
Example: "I need to optimize this slow function @context/rules/javascript/optimization.md"
Example: "Help me handle multiple async operations @context/rules/javascript/async.md"
```

---

## 🚫 Top 15 Anti-Patterns to Avoid

1. ❌ Using `var` instead of `const`/`let`
2. ❌ Using `==` instead of `===`
3. ❌ Mutating function parameters
4. ❌ No error handling in async functions
5. ❌ Using `eval()` or `Function()` constructor
6. ❌ Deeply nested callbacks (callback hell)
7. ❌ Not validating user input
8. ❌ Memory leaks (unclosed listeners, intervals)
9. ❌ Synchronous operations in loops
10. ❌ Not using optional chaining (`?.`) when available
11. ❌ String concatenation instead of template literals
12. ❌ Modifying `Array.prototype` or `Object.prototype`
13. ❌ Using `setTimeout`/`setInterval` without cleanup
14. ❌ Ignoring promise rejections
15. ❌ Not using proper JSDoc comments

---

## 🔧 Code Formatting Standards

- **Indentation**: 2 spaces
- **Line Length**: Max 100 characters
- **Semicolons**: Always use them
- **Spacing**: Space after keywords, around operators

```javascript
// ✅ CORRECT Format
function example() {
  const sum = a + b;
  
  if (condition) {
    doSomething();
  }
  
  return users
    .filter(user => user.isActive)
    .map(user => user.name);
}
```

---

## 📦 Module Organization

```javascript
// ✅ ES Modules (Preferred)
export const config = { };
export function helper() { }
export default class User { }

// Import
import User from './User.js';
import { config, helper } from './utils.js';

// ✅ CommonJS (When Required)
const express = require('express');
module.exports = { config, helper };
```

---

## 🎓 Learning Path

For developers improving their JavaScript skills:

1. **Start with**: `@context/rules/javascript/basics.md`
2. **Then learn**: `@context/rules/javascript/async.md`
3. **Practice**: `@context/rules/javascript/testing.md`
4. **Master**: `@context/rules/javascript/optimization.md`
5. **Advanced**: `@context/rules/javascript/advanced.md`
6. **Security**: `@context/rules/javascript/security.md`

---

**Version**: 1.0  
**Last Updated**: 2025-10-12  
**Optimization**: Modular structure for maintainability and comprehensive coverage
