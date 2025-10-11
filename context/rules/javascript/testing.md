# JavaScript Testing - Unit Testing, Integration, and Debugging Best Practices

**Purpose**: Comprehensive testing strategies, debugging techniques, and code quality practices.

---

## Table of Contents
1. [Unit Testing Fundamentals](#unit-testing-fundamentals)
2. [Test-Driven Development (TDD)](#test-driven-development-tdd)
3. [Mocking and Stubbing](#mocking-and-stubbing)
4. [Integration Testing](#integration-testing)
5. [Debugging Techniques](#debugging-techniques)
6. [Code Quality Tools](#code-quality-tools)

---

## Unit Testing Fundamentals

### Rule 1: Write Testable Code

```javascript
// ❌ WRONG - Hard to test (dependencies, side effects)
function processUserData() {
  const data = localStorage.getItem('user');
  const user = JSON.parse(data);
  
  fetch('/api/update', {
    method: 'POST',
    body: JSON.stringify(user)
  });
  
  alert('User updated!');
}

// ✅ CORRECT - Testable (pure, no side effects)
function parseUserData(rawData) {
  return JSON.parse(rawData);
}

function formatUserForAPI(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

async function updateUser(apiClient, user) {
  return await apiClient.post('/api/update', formatUserForAPI(user));
}

// Easy to test each function independently
```

### Rule 2: Follow AAA Pattern (Arrange, Act, Assert)

```javascript
// ✅ CORRECT - Clear test structure
import { describe, it, expect } from 'vitest';

describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    // Arrange
    const calculator = new Calculator();
    const a = 5;
    const b = 3;
    
    // Act
    const result = calculator.add(a, b);
    
    // Assert
    expect(result).toBe(8);
  });
  
  it('should handle negative numbers', () => {
    // Arrange
    const calculator = new Calculator();
    
    // Act
    const result = calculator.add(-5, 3);
    
    // Assert
    expect(result).toBe(-2);
  });
});
```

### Rule 3: Test Edge Cases and Error Conditions

```javascript
// ✅ CORRECT - Comprehensive tests
describe('divide', () => {
  it('should divide two positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  it('should divide negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
    expect(divide(-10, -2)).toBe(5);
  });
  
  it('should handle decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333, 3);
  });
  
  it('should throw error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });
  
  it('should throw error for non-numeric inputs', () => {
    expect(() => divide('10', 2)).toThrow(TypeError);
    expect(() => divide(10, '2')).toThrow(TypeError);
  });
  
  it('should handle very large numbers', () => {
    expect(divide(Number.MAX_SAFE_INTEGER, 2)).toBeDefined();
  });
});
```

### Rule 4: Use Descriptive Test Names

```javascript
// ❌ WRONG - Unclear test names
it('test1', () => { });
it('works', () => { });
it('should return true', () => { });

// ✅ CORRECT - Descriptive names
it('should return user by ID when user exists', () => { });
it('should throw NotFoundError when user does not exist', () => { });
it('should sanitize HTML input to prevent XSS attacks', () => { });
it('should retry failed API calls up to 3 times before throwing', () => { });
```

---

## Test-Driven Development (TDD)

### Rule 5: Write Tests First (Red-Green-Refactor)

```javascript
// Step 1: Write failing test (RED)
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    const userService = new UserService();
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };
    
    const user = await userService.create(userData);
    
    expect(user.email).toBe('test@example.com');
    expect(user.password).not.toBe('SecurePass123!'); // Should be hashed
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt format
    expect(user.id).toBeDefined();
  });
});

// Step 2: Implement minimal code to pass (GREEN)
class UserService {
  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return {
      id: generateId(),
      email: userData.email,
      password: hashedPassword
    };
  }
}

// Step 3: Refactor (if needed)
class UserService {
  constructor(passwordHasher = bcrypt, idGenerator = generateId) {
    this.passwordHasher = passwordHasher;
    this.idGenerator = idGenerator;
  }
  
  async create(userData) {
    this.#validateUserData(userData);
    
    const hashedPassword = await this.passwordHasher.hash(userData.password, 10);
    
    return {
      id: this.idGenerator(),
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    };
  }
  
  #validateUserData(userData) {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password required');
    }
  }
}
```

---

## Mocking and Stubbing

### Rule 6: Mock External Dependencies

```javascript
// ✅ CORRECT - Mock API calls
import { describe, it, expect, vi } from 'vitest';

describe('UserRepository', () => {
  it('should fetch user from API', async () => {
    // Arrange: Mock fetch
    const mockUser = { id: 1, name: 'John' };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    );
    
    const repo = new UserRepository();
    
    // Act
    const user = await repo.getById(1);
    
    // Assert
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });
  
  it('should handle API errors', async () => {
    // Mock failed request
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
    );
    
    const repo = new UserRepository();
    
    await expect(repo.getById(999)).rejects.toThrow('User not found');
  });
});
```

### Rule 7: Use Test Doubles Appropriately

```javascript
// ✅ CORRECT - Different types of test doubles

// Stub: Returns predefined responses
class EmailServiceStub {
  send(to, subject, body) {
    return Promise.resolve({ success: true, messageId: 'stub-123' });
  }
}

// Mock: Tracks calls and can verify expectations
class EmailServiceMock {
  #calls = [];
  
  send(to, subject, body) {
    this.#calls.push({ to, subject, body });
    return Promise.resolve({ success: true, messageId: 'mock-123' });
  }
  
  verify(expectedCalls) {
    expect(this.#calls).toEqual(expectedCalls);
  }
  
  wasCalled() {
    return this.#calls.length > 0;
  }
}

// Spy: Wraps real implementation and tracks calls
function createSpy(realService) {
  const calls = [];
  
  return {
    send: (...args) => {
      calls.push(args);
      return realService.send(...args);
    },
    getCalls: () => calls
  };
}

// Usage in tests
describe('UserService', () => {
  it('should send welcome email after registration', async () => {
    const emailMock = new EmailServiceMock();
    const userService = new UserService(emailMock);
    
    await userService.register({ email: 'user@example.com', password: 'pass' });
    
    expect(emailMock.wasCalled()).toBe(true);
    emailMock.verify([{
      to: 'user@example.com',
      subject: 'Welcome!',
      body: expect.stringContaining('registration')
    }]);
  });
});
```

### Rule 8: Avoid Over-Mocking

```javascript
// ❌ WRONG - Testing implementation details
it('should call private method', () => {
  const service = new UserService();
  const spy = vi.spyOn(service, '_validateEmail');
  
  service.createUser({ email: 'test@example.com' });
  
  expect(spy).toHaveBeenCalled(); // Brittle test!
});

// ✅ CORRECT - Test behavior, not implementation
it('should create user with valid email', () => {
  const service = new UserService();
  
  const user = service.createUser({ email: 'test@example.com' });
  
  expect(user.email).toBe('test@example.com');
});

it('should throw error for invalid email', () => {
  const service = new UserService();
  
  expect(() => service.createUser({ email: 'invalid' }))
    .toThrow('Invalid email');
});
```

---

## Integration Testing

### Rule 9: Test Component Integration

```javascript
// ✅ CORRECT - Integration test with real dependencies
describe('OrderProcessing Integration', () => {
  let database;
  let paymentService;
  let emailService;
  let orderService;
  
  beforeEach(async () => {
    // Setup test environment
    database = await createTestDatabase();
    paymentService = new PaymentService(testConfig);
    emailService = new EmailService(testConfig);
    orderService = new OrderService(database, paymentService, emailService);
  });
  
  afterEach(async () => {
    // Cleanup
    await database.cleanup();
  });
  
  it('should process order end-to-end', async () => {
    // Arrange
    const order = {
      userId: 1,
      items: [{ id: 1, quantity: 2, price: 10 }],
      paymentMethod: 'credit-card'
    };
    
    // Act
    const result = await orderService.process(order);
    
    // Assert
    expect(result.status).toBe('completed');
    
    // Verify database state
    const savedOrder = await database.orders.findById(result.orderId);
    expect(savedOrder).toBeDefined();
    expect(savedOrder.total).toBe(20);
    
    // Verify payment processed
    const payment = await database.payments.findByOrderId(result.orderId);
    expect(payment.status).toBe('completed');
    
    // Verify email sent (check test email service)
    const emails = await emailService.getTestEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toContain('Order Confirmation');
  });
});
```

### Rule 10: Use Test Fixtures and Factories

```javascript
// ✅ CORRECT - Test data factories
class UserFactory {
  static create(overrides = {}) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'John Doe',
      email: `user${Date.now()}@example.com`,
      role: 'user',
      createdAt: new Date(),
      ...overrides
    };
  }
  
  static createAdmin(overrides = {}) {
    return this.create({ role: 'admin', ...overrides });
  }
  
  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// Usage in tests
describe('User permissions', () => {
  it('should allow admin to delete users', () => {
    const admin = UserFactory.createAdmin();
    const user = UserFactory.create();
    
    expect(canDelete(admin, user)).toBe(true);
  });
  
  it('should prevent regular users from deleting others', () => {
    const user1 = UserFactory.create();
    const user2 = UserFactory.create();
    
    expect(canDelete(user1, user2)).toBe(false);
  });
});
```

---

## Debugging Techniques

### Rule 11: Use Debugger and Breakpoints

```javascript
// ✅ CORRECT - Strategic debugger placement
function complexCalculation(data) {
  const step1 = processStep1(data);
  
  debugger; // Pause here to inspect step1
  
  const step2 = processStep2(step1);
  
  if (step2.hasError) {
    debugger; // Conditional inspection
  }
  
  return finalProcess(step2);
}

// ✅ CORRECT - Conditional breakpoints in code
function processItems(items) {
  items.forEach((item, index) => {
    if (index === 42) {
      debugger; // Only break on specific iteration
    }
    
    processItem(item);
  });
}
```

### Rule 12: Use Console Methods Effectively

```javascript
// ✅ CORRECT - Various console methods
function debugComplexOperation(data) {
  // Group related logs
  console.group('Processing data');
  
  console.log('Input:', data);
  console.time('processing'); // Start timer
  
  const processed = heavyOperation(data);
  
  console.timeEnd('processing'); // End timer
  
  // Table for arrays/objects
  console.table(processed);
  
  // Warnings for potential issues
  if (processed.length === 0) {
    console.warn('No results found');
  }
  
  // Count occurrences
  processed.forEach(item => {
    console.count(`Type: ${item.type}`);
  });
  
  console.groupEnd();
  
  return processed;
}

// ✅ CORRECT - Assert for validation
function divide(a, b) {
  console.assert(b !== 0, 'Divisor cannot be zero', { a, b });
  return a / b;
}

// ✅ CORRECT - Trace call stack
function deeplyNestedFunction() {
  console.trace('Call stack trace');
}
```

### Rule 13: Use Error Stack Traces

```javascript
// ✅ CORRECT - Custom errors with stack traces
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      stack: this.stack
    };
  }
}

// Usage
try {
  throw new ValidationError('Invalid email', 'email', 'not-an-email');
} catch (error) {
  console.error('Validation failed:', error.toJSON());
  // Stack trace shows exactly where error originated
}
```

---

## Code Quality Tools

### Rule 14: Use ESLint for Code Quality

```javascript
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "complexity": ["warn", 10],
    "max-lines-per-function": ["warn", 50],
    "max-depth": ["error", 3]
  }
}

// Example code that follows rules
// ✅ CORRECT
const calculateTotal = (items) => {
  if (!items || items.length === 0) {
    return 0;
  }
  
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ❌ WRONG - ESLint will flag these
var x = 5;              // no-var
if (x == 5) { }         // eqeqeq
let unused = 10;        // no-unused-vars
if (x === 5) x++;       // curly
```

### Rule 15: Use Prettier for Formatting

```javascript
// .prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}

// Before Prettier
const user={name:"John",age:30,email:"john@example.com"}
function greet(name){return `Hello, ${name}!`}

// After Prettier
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com',
};

function greet(name) {
  return `Hello, ${name}!`;
}
```

### Rule 16: Measure Test Coverage

```javascript
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}

// vitest.config.js
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.spec.js',
        '**/*.test.js'
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
};

// ✅ Aim for high coverage on critical paths
// ⚠️ Don't obsess over 100% - focus on valuable tests
```

---

## Testing Best Practices Checklist

Before committing code:

- [ ] All new features have tests
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Edge cases and error conditions tested
- [ ] Test names clearly describe what is being tested
- [ ] External dependencies are mocked appropriately
- [ ] Tests are independent (no shared state)
- [ ] Tests run fast (< 1 second for unit tests)
- [ ] Integration tests verify critical paths
- [ ] Test coverage meets project requirements (typically 80%+)
- [ ] ESLint passes with no errors
- [ ] Code formatted with Prettier
- [ ] No console.log statements left in production code
- [ ] Tests are deterministic (no random failures)

---

**Test Pyramid**:

```
        /\
       /  \    E2E Tests (Few, Slow, Expensive)
      /----\
     /      \  Integration Tests (Some, Medium)
    /--------\
   /          \ Unit Tests (Many, Fast, Cheap)
  /____________\
```

**Guidelines**:
- 70% Unit Tests: Fast, isolated, test single functions
- 20% Integration Tests: Test component interactions
- 10% E2E Tests: Test full user workflows

---

**Common Testing Antipatterns to Avoid**:
- ❌ Testing private methods directly
- ❌ Tests that depend on test execution order
- ❌ Over-mocking (mocking everything)
- ❌ Flaky tests (random failures)
- ❌ Tests without assertions
- ❌ Testing implementation instead of behavior
- ❌ Slow tests (unit tests > 1s)
- ❌ One giant test for everything

---

**Related Rules**:
- Code structure → `@basics.md`
- Async testing → `@async.md`
- Security testing → `@security.md`
