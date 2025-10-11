# JavaScript Basics - Code Structure and Patterns

**Purpose**: Fundamental JavaScript coding standards, naming conventions, and basic patterns.

---

## Table of Contents
1. [Variable Declarations](#variable-declarations)
2. [Naming Conventions](#naming-conventions)
3. [Function Basics](#function-basics)
4. [Object and Array Handling](#object-and-array-handling)
5. [Control Structures](#control-structures)
6. [Code Organization](#code-organization)
7. [Comments and Documentation](#comments-and-documentation)

---

## Variable Declarations

### Rule 1: Use const by Default, let When Needed
```javascript
// ✅ CORRECT - const for immutable bindings
const API_URL = 'https://api.example.com';
const user = { name: 'John' };
const numbers = [1, 2, 3];

// ✅ CORRECT - let for reassignment
let counter = 0;
let currentPage = 1;

for (let i = 0; i < 10; i++) {
  counter += i;
}

// ❌ WRONG - Never use var (function-scoped, hoisting issues)
var oldStyle = 'avoid';
```

**Why?**
- `const` prevents accidental reassignment
- `let` has proper block scope
- `var` causes hoisting and scope confusion

### Rule 2: One Variable per Declaration
```javascript
// ✅ CORRECT - Clear and readable
const firstName = 'John';
const lastName = 'Doe';
const age = 30;

// ❌ WRONG - Harder to read and maintain
const firstName = 'John', lastName = 'Doe', age = 30;
```

### Rule 3: Initialize Variables When Declaring
```javascript
// ✅ CORRECT
const items = [];
let total = 0;
const config = {
  timeout: 5000,
  retries: 3
};

// ❌ WRONG - Uninitialized variables
let items;
let total;
// ... later
items = [];
total = 0;
```

---

## Naming Conventions

### Rule 4: Use Descriptive Names

```javascript
// ✅ CORRECT - Self-documenting names
const userAuthentication = new UserAuth();
const maximumRetryAttempts = 3;
const isUserLoggedIn = false;
const fetchUserData = async (userId) => { };

// ❌ WRONG - Unclear abbreviations
const ua = new UserAuth();
const maxRtry = 3;
const flag = false;
const getData = async (id) => { };
```

### Rule 5: Naming Convention Standards

```javascript
// Variables and functions: camelCase
const userName = 'John';
function calculateTotal() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// Classes and Constructors: PascalCase
class UserAccount { }
class PaymentProcessor { }

// Private fields/methods: # prefix (ES2022+)
class User {
  #password;
  #privateMethod() { }
}

// Boolean variables: use is/has/can prefix
const isActive = true;
const hasPermission = false;
const canEdit = true;

// Arrays: use plural names
const users = [];
const products = [];
const orderItems = [];

// Functions returning boolean: use is/has/can/should prefix
function isValidEmail(email) { }
function hasPermission(user, resource) { }
function canAccessPage(user) { }
```

---

## Function Basics

### Rule 6: Use Arrow Functions for Callbacks

```javascript
// ✅ CORRECT - Arrow functions
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
const filtered = numbers.filter(num => num > 2);

// ✅ CORRECT - Arrow function with multiple parameters
const sum = numbers.reduce((acc, num) => acc + num, 0);

// ✅ CORRECT - Arrow function with block
const processed = items.map(item => {
  const normalized = normalize(item);
  return transform(normalized);
});

// ❌ WRONG - Traditional function for simple callbacks
const doubled = numbers.map(function(num) {
  return num * 2;
});
```

### Rule 7: Use Function Declarations for Named Functions

```javascript
// ✅ CORRECT - Function declaration (hoisted, named for stack traces)
function calculateDiscount(price, percent) {
  return price * (1 - percent / 100);
}

// ✅ CORRECT - Named function expression
const calculateTax = function calculateTax(amount, rate) {
  return amount * rate;
};

// ⚠️ ACCEPTABLE - Arrow function for simple operations
const double = (x) => x * 2;

// ❌ WRONG - Anonymous function expression (harder to debug)
const calculate = function(x, y) {
  return x + y;
};
```

### Rule 8: Parameter Handling Best Practices

```javascript
// ✅ CORRECT - Default parameters
function createUser(name, role = 'user', status = 'active') {
  return { name, role, status };
}

// ✅ CORRECT - Destructuring with defaults
function createUser({ name, email, role = 'user', active = true }) {
  return { name, email, role, active };
}

// ✅ CORRECT - Rest parameters
function sum(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}

// ✅ CORRECT - Validate parameters
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  
  return a / b;
}

// ❌ WRONG - Too many parameters (use object instead)
function createUser(name, email, age, role, status, country, city) { }

// ✅ CORRECT - Use object for many parameters
function createUser({ name, email, age, role, status, country, city }) { }
```

### Rule 9: Pure Functions When Possible

```javascript
// ✅ CORRECT - Pure function (no side effects)
function add(a, b) {
  return a + b;
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ CORRECT - Return new array/object
function addItem(array, item) {
  return [...array, item];
}

function updateUser(user, updates) {
  return { ...user, ...updates };
}

// ❌ WRONG - Mutating parameters (side effects)
function addItem(array, item) {
  array.push(item);  // Mutates input!
  return array;
}

function updateUser(user, updates) {
  user.name = updates.name;  // Mutates input!
  return user;
}
```

---

## Object and Array Handling

### Rule 10: Use Destructuring

```javascript
// ✅ CORRECT - Object destructuring
const { name, email, age } = user;
const { address: { city, country } } = user; // Nested

// ✅ CORRECT - Array destructuring
const [first, second, ...rest] = array;
const [, , third] = array; // Skip elements

// ✅ CORRECT - Destructuring in function parameters
function displayUser({ name, email, role = 'user' }) {
  console.log(`${name} (${email}) - ${role}`);
}

// ✅ CORRECT - Swapping variables
let a = 1, b = 2;
[a, b] = [b, a];

// ❌ WRONG - Verbose property access
const name = user.name;
const email = user.email;
const age = user.age;
```

### Rule 11: Use Spread and Rest Operators

```javascript
// ✅ CORRECT - Spread for arrays
const combined = [...array1, ...array2];
const copy = [...original];
const withNew = [...existing, newItem];

// ✅ CORRECT - Spread for objects
const merged = { ...defaults, ...userConfig };
const updated = { ...user, email: 'new@email.com' };

// ✅ CORRECT - Rest in destructuring
const { id, ...restOfUser } = user;
const [first, ...restOfArray] = items;

// ❌ WRONG - concat and Object.assign (less readable)
const combined = array1.concat(array2);
const merged = Object.assign({}, defaults, userConfig);
```

### Rule 12: Use Object Shorthand

```javascript
// ✅ CORRECT - Property shorthand
const name = 'John';
const age = 30;
const user = { name, age };

// ✅ CORRECT - Method shorthand
const obj = {
  method() {
    return 'value';
  },
  
  async asyncMethod() {
    return await fetch('/api');
  }
};

// ❌ WRONG - Redundant syntax
const user = { name: name, age: age };
const obj = {
  method: function() {
    return 'value';
  }
};
```

### Rule 13: Use Array Methods Over Loops

```javascript
// ✅ CORRECT - Declarative array methods
const activeUsers = users.filter(user => user.isActive);
const userNames = users.map(user => user.name);
const hasAdmin = users.some(user => user.role === 'admin');
const allActive = users.every(user => user.isActive);
const firstAdmin = users.find(user => user.role === 'admin');
const total = prices.reduce((sum, price) => sum + price, 0);

// ✅ CORRECT - Method chaining
const result = users
  .filter(user => user.isActive)
  .map(user => user.name)
  .sort();

// ❌ WRONG - Imperative loops (when array methods work)
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}

// ⚠️ ACCEPTABLE - Use for loop when performance is critical
// or when breaking early is needed
for (let i = 0; i < largeArray.length; i++) {
  if (condition) break;
}
```

---

## Control Structures

### Rule 14: Use Strict Equality

```javascript
// ✅ CORRECT - Strict equality
if (value === 0) { }
if (value !== null) { }
if (array.length === 0) { }

// ❌ WRONG - Loose equality (type coercion bugs)
if (value == 0) { }       // '' == 0 is true!
if (value != null) { }    // Confusing behavior
```

### Rule 15: Use Optional Chaining and Nullish Coalescing

```javascript
// ✅ CORRECT - Optional chaining
const userName = user?.profile?.name;
const firstItem = array?.[0];
const result = obj?.method?.();

// ✅ CORRECT - Nullish coalescing (??)
const displayName = userName ?? 'Guest';
const port = config.port ?? 3000;

// ❌ WRONG - Verbose null checking
const userName = user && user.profile && user.profile.name;

// ❌ WRONG - Using || (fails on 0, '', false)
const port = config.port || 3000; // If port is 0, uses 3000!

// ✅ CORRECT - Use ?? (only null/undefined trigger default)
const port = config.port ?? 3000; // If port is 0, uses 0
```

### Rule 16: Early Returns Over Nested If

```javascript
// ✅ CORRECT - Early return pattern
function processUser(user) {
  if (!user) {
    return null;
  }
  
  if (!user.isActive) {
    return null;
  }
  
  if (!user.hasPermission) {
    return null;
  }
  
  return processData(user);
}

// ❌ WRONG - Deep nesting
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return processData(user);
      }
    }
  }
  return null;
}
```

### Rule 17: Use Ternary for Simple Conditions

```javascript
// ✅ CORRECT - Simple ternary
const status = isActive ? 'active' : 'inactive';
const color = isPremium ? 'gold' : 'silver';

// ✅ CORRECT - With null check
const displayName = user?.name ?? 'Guest';

// ❌ WRONG - Nested ternaries (use if-else)
const status = isActive ? 'active' : isPending ? 'pending' : 'inactive';

// ✅ CORRECT - Use if-else for multiple conditions
let status;
if (isActive) {
  status = 'active';
} else if (isPending) {
  status = 'pending';
} else {
  status = 'inactive';
}
```

---

## Code Organization

### Rule 18: Module Structure

```javascript
// ✅ CORRECT - ES Module structure
// 1. Imports at top
import { util1, util2 } from './utils.js';
import config from './config.js';

// 2. Constants
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// 3. Private functions/variables
function privateHelper() {
  // Implementation
}

// 4. Public functions/classes
export function publicFunction() {
  return privateHelper();
}

export class PublicClass {
  // Implementation
}

// 5. Default export (if needed)
export default publicFunction;
```

### Rule 19: Single Responsibility

```javascript
// ✅ CORRECT - Each function does one thing
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password);
}

function validateUser(user) {
  return validateEmail(user.email) && validatePassword(user.password);
}

// ❌ WRONG - Function does too many things
function validateAndSaveUser(user) {
  // Validates email
  if (!/@/.test(user.email)) return false;
  
  // Validates password
  if (user.password.length < 8) return false;
  
  // Saves to database
  database.save(user);
  
  // Sends email
  emailService.send(user.email);
  
  return true;
}
```

### Rule 20: Keep Functions Small

```javascript
// ✅ CORRECT - Small, focused functions
function calculateDiscount(price, discountPercent) {
  return price * (discountPercent / 100);
}

function applyDiscount(price, discountPercent) {
  const discount = calculateDiscount(price, discountPercent);
  return price - discount;
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

// ❌ WRONG - Too long (>50 lines generally indicates complexity)
function processOrder(order) {
  // 100+ lines of code
  // Multiple responsibilities
  // Hard to test and maintain
}
```

---

## Comments and Documentation

### Rule 21: JSDoc for Public APIs

```javascript
// ✅ CORRECT - Comprehensive JSDoc
/**
 * Calculates the total price including tax and discount
 * @param {number} basePrice - The base price of the item
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @param {number} [discountPercent=0] - Discount percentage (0-100)
 * @returns {number} The final price after tax and discount
 * @throws {TypeError} If basePrice or taxRate is not a number
 * @throws {RangeError} If discountPercent is not between 0 and 100
 * @example
 * const price = calculateFinalPrice(100, 0.1, 10);
 * console.log(price); // 99 (100 - 10% discount + 10% tax)
 */
function calculateFinalPrice(basePrice, taxRate, discountPercent = 0) {
  if (typeof basePrice !== 'number' || typeof taxRate !== 'number') {
    throw new TypeError('Price and tax rate must be numbers');
  }
  
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError('Discount must be between 0 and 100');
  }
  
  const discounted = basePrice * (1 - discountPercent / 100);
  return discounted * (1 + taxRate);
}
```

### Rule 22: Comments for Complex Logic

```javascript
// ✅ CORRECT - Explain WHY, not WHAT
function calculateShipping(weight, distance) {
  // Use exponential calculation for long distances to account for
  // multiple shipping zones and handling transfers
  const baseCost = weight * 0.5;
  const distanceFactor = Math.pow(distance / 100, 1.5);
  
  return baseCost * distanceFactor;
}

// ❌ WRONG - Obvious comments
function add(a, b) {
  // Add a and b
  return a + b;  // Return the sum
}

// ✅ CORRECT - No comment needed (self-documenting)
function add(a, b) {
  return a + b;
}
```

### Rule 23: TODO Comments Format

```javascript
// ✅ CORRECT - Structured TODO
/**
 * TODO: Implement caching mechanism
 * Priority: High
 * Estimated: 2 hours
 * Related: Issue #123
 */
function fetchUserData(userId) {
  // Current implementation
}

// ❌ WRONG - Vague TODO
// TODO: fix this
function fetchUserData(userId) {
  // ...
}
```

---

## Summary Checklist

Before committing code, verify:

- [ ] Used `const` by default, `let` only when needed, never `var`
- [ ] Followed naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE)
- [ ] Functions are pure when possible, no parameter mutation
- [ ] Used destructuring for objects and arrays
- [ ] Used strict equality (`===`, `!==`)
- [ ] Used optional chaining (`?.`) and nullish coalescing (`??`)
- [ ] Used array methods instead of loops where appropriate
- [ ] Added JSDoc comments to public functions
- [ ] Functions follow single responsibility principle
- [ ] Code is formatted consistently with 2-space indentation

---

**Related Rules**:
- Performance optimization → `@optimization.md`
- Async patterns → `@async.md`
- Security practices → `@security.md`
