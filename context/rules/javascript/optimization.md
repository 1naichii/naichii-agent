# JavaScript Optimization - Performance Best Practices

**Purpose**: Performance optimization techniques, memory management, and efficient algorithms.

---

## Table of Contents
1. [Algorithm Optimization](#algorithm-optimization)
2. [Memory Management](#memory-management)
3. [DOM Optimization](#dom-optimization)
4. [Loop and Iteration Optimization](#loop-and-iteration-optimization)
5. [Function Optimization](#function-optimization)
6. [Data Structure Selection](#data-structure-selection)
7. [Bundle Size Optimization](#bundle-size-optimization)

---

## Algorithm Optimization

### Rule 1: Choose Efficient Data Structures

```javascript
// ✅ CORRECT - Use Set for uniqueness checking (O(1) lookup)
const uniqueIds = new Set();

function addUniqueId(id) {
  if (uniqueIds.has(id)) {  // O(1)
    return false;
  }
  uniqueIds.add(id);
  return true;
}

// ❌ WRONG - Array includes (O(n) lookup)
const uniqueIds = [];

function addUniqueId(id) {
  if (uniqueIds.includes(id)) {  // O(n) - slow for large arrays!
    return false;
  }
  uniqueIds.push(id);
  return true;
}

// ✅ CORRECT - Use Map for key-value pairs with frequent lookups
const userCache = new Map();

function getUser(id) {
  if (userCache.has(id)) {  // O(1)
    return userCache.get(id);
  }
  
  const user = fetchUserFromDB(id);
  userCache.set(id, user);
  return user;
}

// ❌ WRONG - Object lookup with Object.keys() (slower)
const userCache = {};

function getUser(id) {
  if (Object.keys(userCache).includes(id)) {  // O(n)
    return userCache[id];
  }
  
  const user = fetchUserFromDB(id);
  userCache[id] = user;
  return user;
}
```

### Rule 2: Avoid Unnecessary Computations

```javascript
// ✅ CORRECT - Memoization for expensive calculations
const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fibonacci = memoize((n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// ❌ WRONG - Recalculating every time
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);  // Exponential time!
}

// ✅ CORRECT - Cache computed values
class ShoppingCart {
  #items = [];
  #totalCache = null;
  
  addItem(item) {
    this.#items.push(item);
    this.#totalCache = null;  // Invalidate cache
  }
  
  getTotal() {
    if (this.#totalCache !== null) {
      return this.#totalCache;
    }
    
    this.#totalCache = this.#items.reduce((sum, item) => sum + item.price, 0);
    return this.#totalCache;
  }
}
```

### Rule 3: Use Early Exits to Avoid Unnecessary Work

```javascript
// ✅ CORRECT - Early exit
function findUser(users, predicate) {
  for (const user of users) {
    if (predicate(user)) {
      return user;  // Exit immediately when found
    }
  }
  return null;
}

// ❌ WRONG - Checks all items even after finding result
function findUser(users, predicate) {
  let found = null;
  users.forEach(user => {
    if (predicate(user)) {
      found = user;  // Still iterates through remaining items!
    }
  });
  return found;
}

// ✅ CORRECT - Short-circuit evaluation
function validateUser(user) {
  // Returns immediately on first failure
  return user &&
    user.email &&
    user.email.includes('@') &&
    user.password &&
    user.password.length >= 8;
}
```

---

## Memory Management

### Rule 4: Avoid Memory Leaks

```javascript
// ✅ CORRECT - Cleanup event listeners
class Component {
  #intervalId = null;
  #listener = null;
  
  mount() {
    this.#listener = () => this.handleClick();
    document.addEventListener('click', this.#listener);
    
    this.#intervalId = setInterval(() => {
      this.update();
    }, 1000);
  }
  
  unmount() {
    // Critical: Remove listeners to prevent memory leaks
    if (this.#listener) {
      document.removeEventListener('click', this.#listener);
      this.#listener = null;
    }
    
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }
}

// ❌ WRONG - Memory leak from uncleaned listeners
class Component {
  mount() {
    document.addEventListener('click', () => this.handleClick());
    setInterval(() => this.update(), 1000);
    // Listeners never removed - memory leak!
  }
}

// ✅ CORRECT - Use AbortController for multiple listeners
class Component {
  #controller = new AbortController();
  
  mount() {
    const { signal } = this.#controller;
    
    document.addEventListener('click', this.handleClick, { signal });
    window.addEventListener('resize', this.handleResize, { signal });
    document.addEventListener('scroll', this.handleScroll, { signal });
  }
  
  unmount() {
    // One call removes all listeners
    this.#controller.abort();
  }
}
```

### Rule 5: Release Large Objects

```javascript
// ✅ CORRECT - Release large data when done
async function processLargeFile(file) {
  let data = await file.arrayBuffer();
  
  try {
    const result = processData(data);
    return result;
  } finally {
    data = null;  // Allow GC to collect large buffer
  }
}

// ✅ CORRECT - Use WeakMap for cache that doesn't prevent GC
const cache = new WeakMap();

function cacheResult(obj, result) {
  cache.set(obj, result);
  // If obj is garbage collected, cache entry is automatically removed
}

// ❌ WRONG - Map prevents garbage collection
const cache = new Map();

function cacheResult(obj, result) {
  cache.set(obj, result);
  // obj is held in memory even if not used elsewhere
}
```

### Rule 6: Avoid Closures That Capture Large Scopes

```javascript
// ✅ CORRECT - Only capture what you need
function createHandler(userId, userName) {
  return function handler() {
    console.log(`User ${userId}: ${userName}`);
  };
}

// ❌ WRONG - Captures entire large object
function createHandler(largeUser) {
  return function handler() {
    console.log(`User ${largeUser.id}: ${largeUser.name}`);
    // Entire largeUser object (with MB of data) is captured!
  };
}

// ✅ CORRECT - Extract needed values
function createHandler(largeUser) {
  const { id, name } = largeUser;  // Only capture what's needed
  
  return function handler() {
    console.log(`User ${id}: ${name}`);
  };
}
```

---

## DOM Optimization

### Rule 7: Batch DOM Updates

```javascript
// ✅ CORRECT - Single DOM update with fragment
function renderItems(items) {
  const fragment = document.createDocumentFragment();
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    fragment.appendChild(li);
  });
  
  // Single DOM update
  document.getElementById('list').appendChild(fragment);
}

// ❌ WRONG - Multiple DOM updates (causes multiple reflows)
function renderItems(items) {
  const list = document.getElementById('list');
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    list.appendChild(li);  // Reflow on each iteration!
  });
}

// ✅ CORRECT - Use innerHTML for large lists (faster)
function renderItems(items) {
  const html = items
    .map(item => `<li>${escapeHtml(item.name)}</li>`)
    .join('');
  
  document.getElementById('list').innerHTML = html;
}
```

### Rule 8: Debounce and Throttle Events

```javascript
// ✅ CORRECT - Debounce for search input
function debounce(func, delay) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const searchInput = document.getElementById('search');
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// ✅ CORRECT - Throttle for scroll events
function throttle(func, limit) {
  let inThrottle;
  
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### Rule 9: Use Event Delegation

```javascript
// ✅ CORRECT - Single listener for all items
document.getElementById('list').addEventListener('click', (e) => {
  const target = e.target.closest('li');
  
  if (target) {
    handleItemClick(target.dataset.id);
  }
});

// ❌ WRONG - Individual listeners for each item
items.forEach(item => {
  const li = document.getElementById(item.id);
  li.addEventListener('click', () => handleItemClick(item.id));
  // Creates N listeners - memory intensive!
});
```

---

## Loop and Iteration Optimization

### Rule 10: Choose Right Loop for the Job

```javascript
// ✅ CORRECT - for...of for readability (modern, fast enough)
for (const item of items) {
  processItem(item);
}

// ✅ CORRECT - Traditional for loop for max performance
for (let i = 0, len = items.length; i < len; i++) {
  processItem(items[i]);
}

// ✅ CORRECT - forEach for immutability and clarity
items.forEach(item => processItem(item));

// ⚠️ SLOW - for...in for arrays (iterates prototype chain)
for (const index in items) {
  processItem(items[index]);  // Slower, avoid for arrays
}

// ✅ CORRECT - Use for...in only for objects
for (const key in object) {
  if (object.hasOwnProperty(key)) {
    processProperty(key, object[key]);
  }
}
```

### Rule 11: Avoid Expensive Operations in Loops

```javascript
// ✅ CORRECT - Cache length and DOM queries
const items = document.querySelectorAll('.item');
const length = items.length;

for (let i = 0; i < length; i++) {
  items[i].classList.add('processed');
}

// ❌ WRONG - Queries DOM on each iteration
for (let i = 0; i < document.querySelectorAll('.item').length; i++) {
  document.querySelectorAll('.item')[i].classList.add('processed');
}

// ✅ CORRECT - Move invariant calculations outside loop
const factor = calculateFactor();
const offset = getOffset();

for (const item of items) {
  item.value = item.base * factor + offset;
}

// ❌ WRONG - Recalculates on each iteration
for (const item of items) {
  item.value = item.base * calculateFactor() + getOffset();
}
```

### Rule 12: Break Large Loops for Better UX

```javascript
// ✅ CORRECT - Process in chunks to avoid blocking UI
async function processLargeArray(items, processor) {
  const CHUNK_SIZE = 100;
  
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    
    chunk.forEach(processor);
    
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// ❌ WRONG - Blocks UI for large arrays
function processLargeArray(items, processor) {
  items.forEach(processor);  // Can freeze browser!
}
```

---

## Function Optimization

### Rule 13: Avoid Creating Functions in Loops

```javascript
// ✅ CORRECT - Function defined once
function createHandler(id) {
  return () => handleClick(id);
}

items.forEach(item => {
  const handler = createHandler(item.id);
  item.element.addEventListener('click', handler);
});

// ❌ WRONG - Creates new function on each iteration
items.forEach(item => {
  item.element.addEventListener('click', () => {
    handleClick(item.id);  // New function created each time
  });
});

// ✅ CORRECT - Use bind for partial application
items.forEach(item => {
  item.element.addEventListener('click', handleClick.bind(null, item.id));
});
```

### Rule 14: Use Lazy Evaluation

```javascript
// ✅ CORRECT - Lazy loading with getter
class DataManager {
  #data = null;
  
  get data() {
    if (this.#data === null) {
      this.#data = this.#loadExpensiveData();
    }
    return this.#data;
  }
  
  #loadExpensiveData() {
    // Load only when first accessed
    return loadFromDatabase();
  }
}

// ✅ CORRECT - Lazy initialization with default parameter
function getConfig(config = null) {
  if (!config) {
    config = loadDefaultConfig();  // Only load if not provided
  }
  return config;
}
```

---

## Data Structure Selection

### Rule 15: Use Appropriate Data Structures

```javascript
// ✅ CORRECT - Set for uniqueness (O(1) operations)
const uniqueUsers = new Set();
uniqueUsers.add(user1);
uniqueUsers.add(user2);

if (uniqueUsers.has(user1)) {  // O(1)
  console.log('User exists');
}

// ✅ CORRECT - Map for key-value with objects as keys
const userPermissions = new Map();
userPermissions.set(userObj, ['read', 'write']);

// ✅ CORRECT - WeakMap for metadata without memory leaks
const elementMetadata = new WeakMap();
elementMetadata.set(domElement, { clicks: 0 });
// When domElement is removed, metadata is auto-collected

// ✅ CORRECT - Array for ordered collections
const items = [];
items.push(item);
items.sort((a, b) => a.priority - b.priority);

// Performance comparison:
// Array: Access O(1), Search O(n), Insert/Delete O(n)
// Set: Add O(1), Has O(1), Delete O(1)
// Map: Set O(1), Get O(1), Delete O(1)
// Object: Get O(1), Set O(1), but slower than Map
```

---

## Bundle Size Optimization

### Rule 16: Import Only What You Need

```javascript
// ✅ CORRECT - Named imports (tree-shakeable)
import { debounce, throttle } from 'lodash-es';

// ✅ CORRECT - Specific module import
import debounce from 'lodash-es/debounce';

// ❌ WRONG - Imports entire library
import _ from 'lodash';
_.debounce(func, 300);  // Bundles entire lodash!
```

### Rule 17: Lazy Load Heavy Components

```javascript
// ✅ CORRECT - Dynamic import (code splitting)
async function loadEditor() {
  const { default: Editor } = await import('./Editor.js');
  return new Editor();
}

// Usage
button.addEventListener('click', async () => {
  const editor = await loadEditor();  // Loaded only when needed
  editor.open();
});

// ✅ CORRECT - Conditional loading
async function loadAnalytics() {
  if (process.env.NODE_ENV === 'production') {
    const { initAnalytics } = await import('./analytics.js');
    initAnalytics();
  }
}
```

---

## Performance Measurement

### Rule 18: Measure Before Optimizing

```javascript
// ✅ CORRECT - Use Performance API
function measurePerformance(name, fn) {
  performance.mark(`${name}-start`);
  
  const result = fn();
  
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
  
  const measure = performance.getEntriesByName(name)[0];
  console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
  
  return result;
}

// Usage
const result = measurePerformance('data-processing', () => {
  return processLargeDataset(data);
});

// ✅ CORRECT - Console time for simple measurements
console.time('operation');
performOperation();
console.timeEnd('operation');
```

---

## Performance Checklist

Before deploying, verify:

- [ ] Used appropriate data structures (Set, Map, WeakMap)
- [ ] Implemented memoization for expensive calculations
- [ ] Cleaned up event listeners and intervals
- [ ] Batched DOM updates using fragments
- [ ] Debounced/throttled high-frequency events
- [ ] Used event delegation for dynamic lists
- [ ] Cached frequently accessed values
- [ ] Avoided creating functions in loops
- [ ] Used lazy loading for heavy components
- [ ] Measured performance of critical paths
- [ ] Tree-shaken dependencies (named imports)
- [ ] No memory leaks in long-running apps

---

**Time Complexity Quick Reference**:
- O(1): Direct access, hash lookups (Map, Set, Object)
- O(log n): Binary search, balanced trees
- O(n): Linear search, single loop
- O(n log n): Efficient sorting (Array.sort)
- O(n²): Nested loops, inefficient sorting
- O(2ⁿ): Recursive fibonacci without memoization

**Target Performance**:
- DOM manipulation: < 16ms (60 FPS)
- API calls: < 200ms
- Data processing: < 100ms
- Initial page load: < 3s
- Time to Interactive: < 5s

---

**Related Rules**:
- Basic patterns → `@basics.md`
- Async optimization → `@async.md`
- Advanced techniques → `@advanced.md`
