# JavaScript Advanced - Design Patterns, Advanced Features, and Meta-Programming

**Purpose**: Advanced JavaScript techniques, design patterns, and modern language features.

---

## Table of Contents
1. [Design Patterns](#design-patterns)
2. [Advanced Functions](#advanced-functions)
3. [Proxies and Reflection](#proxies-and-reflection)
4. [Generators and Iterators](#generators-and-iterators)
5. [Symbols and Well-Known Symbols](#symbols-and-well-known-symbols)
6. [Advanced Async Patterns](#advanced-async-patterns)
7. [Meta-Programming](#meta-programming)

---

## Design Patterns

### Rule 1: Module Pattern

```javascript
// ✅ CORRECT - Module pattern with private members
const UserModule = (() => {
  // Private variables
  const users = new Map();
  let nextId = 1;
  
  // Private functions
  function validateUser(user) {
    if (!user.name || !user.email) {
      throw new Error('Invalid user data');
    }
  }
  
  // Public API
  return {
    create(userData) {
      validateUser(userData);
      const id = nextId++;
      const user = { id, ...userData };
      users.set(id, user);
      return user;
    },
    
    get(id) {
      return users.get(id);
    },
    
    getAll() {
      return Array.from(users.values());
    },
    
    delete(id) {
      return users.delete(id);
    }
  };
})();

// Usage
const user = UserModule.create({ name: 'John', email: 'john@example.com' });
```

### Rule 2: Singleton Pattern

```javascript
// ✅ CORRECT - Singleton with ES6 class
class DatabaseConnection {
  static #instance = null;
  #connected = false;
  
  constructor() {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    
    DatabaseConnection.#instance = this;
  }
  
  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }
  
  async connect(config) {
    if (this.#connected) {
      return true;
    }
    
    // Connection logic
    this.#connected = true;
    return true;
  }
  
  isConnected() {
    return this.#connected;
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true - same instance
```

### Rule 3: Factory Pattern

```javascript
// ✅ CORRECT - Factory pattern
class UserFactory {
  static createUser(type, data) {
    const userTypes = {
      admin: () => new AdminUser(data),
      moderator: () => new ModeratorUser(data),
      regular: () => new RegularUser(data)
    };
    
    const creator = userTypes[type];
    
    if (!creator) {
      throw new Error(`Unknown user type: ${type}`);
    }
    
    return creator();
  }
}

class AdminUser {
  constructor(data) {
    this.name = data.name;
    this.permissions = ['read', 'write', 'delete', 'admin'];
  }
  
  canDelete() {
    return true;
  }
}

class ModeratorUser {
  constructor(data) {
    this.name = data.name;
    this.permissions = ['read', 'write', 'moderate'];
  }
  
  canDelete() {
    return false;
  }
}

class RegularUser {
  constructor(data) {
    this.name = data.name;
    this.permissions = ['read'];
  }
  
  canDelete() {
    return false;
  }
}

// Usage
const admin = UserFactory.createUser('admin', { name: 'Alice' });
const user = UserFactory.createUser('regular', { name: 'Bob' });
```

### Rule 4: Observer Pattern (Pub/Sub)

```javascript
// ✅ CORRECT - Event emitter / Pub-Sub
class EventEmitter {
  #events = new Map();
  
  on(event, callback) {
    if (!this.#events.has(event)) {
      this.#events.set(event, []);
    }
    
    this.#events.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.#events.has(event)) {
      return;
    }
    
    const callbacks = this.#events.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  emit(event, ...args) {
    if (!this.#events.has(event)) {
      return;
    }
    
    this.#events.get(event).forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
  
  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    
    this.on(event, onceCallback);
  }
}

// Usage
const emitter = new EventEmitter();

const unsubscribe = emitter.on('user:login', (user) => {
  console.log(`User ${user.name} logged in`);
});

emitter.once('user:logout', () => {
  console.log('User logged out (fires once)');
});

emitter.emit('user:login', { name: 'John' });
unsubscribe(); // Remove listener
```

### Rule 5: Strategy Pattern

```javascript
// ✅ CORRECT - Strategy pattern for algorithms
class PaymentProcessor {
  #strategies = new Map();
  
  registerStrategy(name, strategy) {
    this.#strategies.set(name, strategy);
  }
  
  process(strategyName, amount, details) {
    const strategy = this.#strategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Unknown payment strategy: ${strategyName}`);
    }
    
    return strategy.process(amount, details);
  }
}

// Different payment strategies
class CreditCardStrategy {
  process(amount, { cardNumber, cvv, expiry }) {
    console.log(`Processing $${amount} via Credit Card`);
    // Implementation
    return { success: true, transactionId: 'cc_123' };
  }
}

class PayPalStrategy {
  process(amount, { email }) {
    console.log(`Processing $${amount} via PayPal`);
    // Implementation
    return { success: true, transactionId: 'pp_456' };
  }
}

class CryptoStrategy {
  process(amount, { walletAddress, currency }) {
    console.log(`Processing $${amount} via ${currency}`);
    // Implementation
    return { success: true, transactionId: 'crypto_789' };
  }
}

// Usage
const processor = new PaymentProcessor();
processor.registerStrategy('credit-card', new CreditCardStrategy());
processor.registerStrategy('paypal', new PayPalStrategy());
processor.registerStrategy('crypto', new CryptoStrategy());

const result = processor.process('paypal', 99.99, { email: 'user@example.com' });
```

---

## Advanced Functions

### Rule 6: Function Composition

```javascript
// ✅ CORRECT - Function composition
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

// Example functions
const addTax = (price) => price * 1.1;
const addShipping = (price) => price + 10;
const formatCurrency = (price) => `$${price.toFixed(2)}`;

// Compose right-to-left
const calculateTotal = compose(
  formatCurrency,
  addShipping,
  addTax
);

console.log(calculateTotal(100)); // "$120.00"

// Pipe left-to-right (more intuitive)
const calculateTotalPipe = pipe(
  addTax,
  addShipping,
  formatCurrency
);

console.log(calculateTotalPipe(100)); // "$120.00"
```

### Rule 7: Currying and Partial Application

```javascript
// ✅ CORRECT - Currying
const curry = (fn) => {
  const arity = fn.length;
  
  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    
    return function(...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
};

// Example
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));        // 6
console.log(curriedAdd(1, 2)(3));        // 6
console.log(curriedAdd(1)(2, 3));        // 6

// Practical use case
const multiply = (a, b) => a * b;
const curriedMultiply = curry(multiply);
const double = curriedMultiply(2);
const triple = curriedMultiply(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// ✅ CORRECT - Partial application
const partial = (fn, ...presetArgs) => {
  return (...laterArgs) => fn(...presetArgs, ...laterArgs);
};

const greet = (greeting, name) => `${greeting}, ${name}!`;
const sayHello = partial(greet, 'Hello');

console.log(sayHello('John'));  // "Hello, John!"
```

### Rule 8: Memoization

```javascript
// ✅ CORRECT - Advanced memoization with expiry
class Memoize {
  #cache = new Map();
  #ttl;
  
  constructor(fn, ttl = null) {
    this.fn = fn;
    this.#ttl = ttl;
  }
  
  call(...args) {
    const key = JSON.stringify(args);
    const cached = this.#cache.get(key);
    
    if (cached) {
      if (!this.#ttl || Date.now() - cached.timestamp < this.#ttl) {
        return cached.value;
      }
      
      this.#cache.delete(key);
    }
    
    const value = this.fn(...args);
    this.#cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }
  
  clear() {
    this.#cache.clear();
  }
}

// Usage
const expensiveCalculation = (n) => {
  console.log('Calculating...');
  return n * n;
};

const memoized = new Memoize(expensiveCalculation, 5000); // 5 second TTL

console.log(memoized.call(5)); // Calculating... 25
console.log(memoized.call(5)); // 25 (from cache)
```

---

## Proxies and Reflection

### Rule 9: Use Proxies for Validation

```javascript
// ✅ CORRECT - Validation proxy
function createValidatedObject(target, schema) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (schema[prop]) {
        if (!schema[prop](value)) {
          throw new TypeError(`Invalid value for ${prop}: ${value}`);
        }
      }
      
      obj[prop] = value;
      return true;
    }
  });
}

// Usage
const userSchema = {
  name: (val) => typeof val === 'string' && val.length > 0,
  age: (val) => typeof val === 'number' && val >= 0 && val <= 120,
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
};

const user = createValidatedObject({}, userSchema);

user.name = 'John';      // ✅ OK
user.age = 30;           // ✅ OK
// user.age = -5;        // ❌ Error: Invalid value
// user.email = 'bad';   // ❌ Error: Invalid value
```

### Rule 10: Reactive Objects with Proxies

```javascript
// ✅ CORRECT - Reactive state management
function createReactive(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      
      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      
      return true;
    },
    
    deleteProperty(obj, prop) {
      const oldValue = obj[prop];
      delete obj[prop];
      onChange(prop, undefined, oldValue);
      return true;
    }
  });
}

// Usage
const state = createReactive(
  { count: 0, name: 'John' },
  (prop, newValue, oldValue) => {
    console.log(`${prop} changed from ${oldValue} to ${newValue}`);
    updateUI();
  }
);

state.count++;           // "count changed from 0 to 1"
state.name = 'Jane';     // "name changed from John to Jane"
```

### Rule 11: Method Call Logging with Proxies

```javascript
// ✅ CORRECT - Auto-logging proxy
function createLoggingProxy(target, name = 'Object') {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      
      if (typeof value === 'function') {
        return new Proxy(value, {
          apply(fn, thisArg, args) {
            console.log(`[${name}] Calling ${prop} with args:`, args);
            const result = fn.apply(thisArg, args);
            console.log(`[${name}] ${prop} returned:`, result);
            return result;
          }
        });
      }
      
      return value;
    }
  });
}

// Usage
class Calculator {
  add(a, b) {
    return a + b;
  }
  
  multiply(a, b) {
    return a * b;
  }
}

const calc = createLoggingProxy(new Calculator(), 'Calculator');
calc.add(2, 3);        // Logs: Calling add with args: [2, 3], add returned: 5
calc.multiply(4, 5);   // Logs: Calling multiply with args: [4, 5], multiply returned: 20
```

---

## Generators and Iterators

### Rule 12: Use Generators for Lazy Evaluation

```javascript
// ✅ CORRECT - Generator for infinite sequences
function* fibonacci() {
  let [prev, curr] = [0, 1];
  
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

// Take only what you need
function take(iterator, n) {
  const result = [];
  
  for (let i = 0; i < n; i++) {
    const { value, done } = iterator.next();
    
    if (done) break;
    result.push(value);
  }
  
  return result;
}

const fib = fibonacci();
console.log(take(fib, 10)); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

// ✅ CORRECT - Generator for pagination
async function* fetchPages(apiUrl) {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${apiUrl}?page=${page}`);
    const data = await response.json();
    
    yield data.items;
    
    hasMore = data.hasMore;
    page++;
  }
}

// Usage
const pages = fetchPages('https://api.example.com/users');

for await (const items of pages) {
  console.log('Processing page:', items);
}
```

### Rule 13: Custom Iterators

```javascript
// ✅ CORRECT - Custom iterable collection
class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }
  
  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i += this.step) {
      yield i;
    }
  }
  
  // Alternative: manually implement iterator
  // [Symbol.iterator]() {
  //   let current = this.start;
  //   const end = this.end;
  //   const step = this.step;
  //   
  //   return {
  //     next() {
  //       if (current <= end) {
  //         const value = current;
  //         current += step;
  //         return { value, done: false };
  //       }
  //       return { done: true };
  //     }
  //   };
  // }
}

// Usage
const range = new Range(1, 10, 2);

for (const num of range) {
  console.log(num); // 1, 3, 5, 7, 9
}

const arr = [...range]; // [1, 3, 5, 7, 9]
```

---

## Symbols and Well-Known Symbols

### Rule 14: Use Symbols for Private Properties

```javascript
// ✅ CORRECT - Symbols for truly private properties
const _privateData = Symbol('privateData');
const _privateMethod = Symbol('privateMethod');

class SecureClass {
  constructor(data) {
    this[_privateData] = data;
  }
  
  [_privateMethod]() {
    return this[_privateData];
  }
  
  getSecureData() {
    return this[_privateMethod]();
  }
}

const obj = new SecureClass('secret');
console.log(obj.getSecureData());      // "secret"
console.log(obj[_privateData]);        // "secret" (if symbol is accessible)
console.log(Object.keys(obj));         // [] (symbol not enumerable)
```

### Rule 15: Custom Well-Known Symbols

```javascript
// ✅ CORRECT - Custom toString behavior
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  [Symbol.toStringTag]() {
    return 'User';
  }
  
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      return `${this.name} <${this.email}>`;
    }
    
    if (hint === 'number') {
      return this.name.length;
    }
    
    return this.email;
  }
}

const user = new User('John', 'john@example.com');

console.log(String(user));    // "John <john@example.com>"
console.log(Number(user));    // 4 (length of "John")
console.log(`${user}`);       // "John <john@example.com>"
```

---

## Advanced Async Patterns

### Rule 16: Async Iterators

```javascript
// ✅ CORRECT - Async iterator for data streams
class DataStream {
  constructor(source) {
    this.source = source;
  }
  
  async *[Symbol.asyncIterator]() {
    let index = 0;
    
    while (index < this.source.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield this.source[index++];
    }
  }
}

// Usage
const stream = new DataStream([1, 2, 3, 4, 5]);

(async () => {
  for await (const item of stream) {
    console.log(item);
  }
})();
```

---

## Meta-Programming

### Rule 17: Dynamic Property Access

```javascript
// ✅ CORRECT - Reflect API for meta-programming
const obj = { x: 1, y: 2 };

// Better than direct property access for meta-programming
Reflect.set(obj, 'z', 3);
console.log(Reflect.get(obj, 'z')); // 3
console.log(Reflect.has(obj, 'z')); // true
Reflect.deleteProperty(obj, 'z');

// Function calls
function greet(name) {
  return `Hello, ${name}!`;
}

const result = Reflect.apply(greet, null, ['John']);
console.log(result); // "Hello, John!"

// Object creation
class Person {
  constructor(name) {
    this.name = name;
  }
}

const person = Reflect.construct(Person, ['John']);
console.log(person.name); // "John"
```

---

## Advanced Patterns Checklist

When implementing advanced patterns:

- [ ] Used appropriate design pattern for the problem
- [ ] Implemented proper encapsulation (private fields/symbols)
- [ ] Added type validation where needed (proxies)
- [ ] Used generators for lazy evaluation of large datasets
- [ ] Implemented custom iterators for special collections
- [ ] Used symbols for meta-properties
- [ ] Applied function composition for data transformations
- [ ] Memoized expensive pure functions
- [ ] Used Reflect API for meta-programming
- [ ] Documented complex patterns with comments

---

**Pattern Selection Guide**:

| Problem | Pattern | Use Case |
|---------|---------|----------|
| Ensure one instance | Singleton | Database connections, config |
| Create objects flexibly | Factory | Multiple types of similar objects |
| Add behavior dynamically | Decorator | Extending functionality |
| Notify multiple objects | Observer | Event systems, state changes |
| Swap algorithms | Strategy | Different processing methods |
| Control object access | Proxy | Validation, logging, lazy loading |
| Build complex objects | Builder | Step-by-step object creation |

---

**Related Rules**:
- Basic patterns → `@basics.md`
- Async patterns → `@async.md`
- Performance → `@optimization.md`
