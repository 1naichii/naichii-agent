# JavaScript Async Programming - Promises, Async/Await, and Concurrency

**Purpose**: Best practices for asynchronous programming, error handling, and managing concurrent operations.

---

## Table of Contents
1. [Async/Await Fundamentals](#asyncawait-fundamentals)
2. [Error Handling](#error-handling)
3. [Parallel vs Sequential Execution](#parallel-vs-sequential-execution)
4. [Advanced Async Patterns](#advanced-async-patterns)
5. [Timeouts and Cancellation](#timeouts-and-cancellation)
6. [Event Loop and Microtasks](#event-loop-and-microtasks)

---

## Async/Await Fundamentals

### Rule 1: Always Use Async/Await Over Promise Chains

```javascript
// ✅ CORRECT - Async/await (readable, easier to debug)
async function getUserData(userId) {
  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(user.id);
  const comments = await fetchPostComments(posts);
  
  return {
    user,
    posts,
    comments
  };
}

// ❌ WRONG - Promise chains (harder to follow)
function getUserData(userId) {
  return fetchUser(userId)
    .then(user => fetchUserPosts(user.id))
    .then(posts => fetchPostComments(posts))
    .then(comments => ({ user, posts, comments }));
}
```

### Rule 2: Always Add Try-Catch to Async Functions

```javascript
// ✅ CORRECT - Proper error handling
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw new Error(`User data fetch failed: ${error.message}`);
  }
}

// ❌ WRONG - No error handling (silent failures)
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();  // Can fail silently!
  return data;
}
```

### Rule 3: Return Values Directly in Async Functions

```javascript
// ✅ CORRECT - Direct return
async function getUser(id) {
  const user = await fetchUser(id);
  return user;
}

// ✅ CORRECT - Even simpler
async function getUser(id) {
  return await fetchUser(id);
}

// ✅ BEST - No need for await if just returning
async function getUser(id) {
  return fetchUser(id);  // Returns promise directly
}

// ❌ WRONG - Unnecessary complexity
async function getUser(id) {
  return new Promise((resolve, reject) => {
    fetchUser(id)
      .then(user => resolve(user))
      .catch(err => reject(err));
  });
}
```

---

## Error Handling

### Rule 4: Wrap Async Operations Properly

```javascript
// ✅ CORRECT - Try-catch with specific error handling
async function processOrder(orderId) {
  try {
    const order = await fetchOrder(orderId);
    const payment = await processPayment(order);
    const shipment = await createShipment(order);
    
    return {
      success: true,
      order,
      payment,
      shipment
    };
    
  } catch (error) {
    if (error.name === 'PaymentError') {
      await rollbackOrder(orderId);
      return { success: false, error: 'Payment failed' };
    }
    
    if (error.name === 'NetworkError') {
      await queueForRetry(orderId);
      return { success: false, error: 'Network issue, will retry' };
    }
    
    // Rethrow unexpected errors
    throw error;
  }
}

// ❌ WRONG - Swallowing all errors
async function processOrder(orderId) {
  try {
    const order = await fetchOrder(orderId);
    const payment = await processPayment(order);
    return { success: true };
  } catch (error) {
    return { success: false };  // Lost error information!
  }
}
```

### Rule 5: Use Promise.allSettled for Multiple Operations

```javascript
// ✅ CORRECT - Handle both successes and failures
async function loadDashboardData() {
  const results = await Promise.allSettled([
    fetchUsers(),
    fetchPosts(),
    fetchAnalytics()
  ]);
  
  const [usersResult, postsResult, analyticsResult] = results;
  
  return {
    users: usersResult.status === 'fulfilled' ? usersResult.value : [],
    posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
    analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
    errors: results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason)
  };
}

// ❌ WRONG - Promise.all fails if any promise rejects
async function loadDashboardData() {
  const [users, posts, analytics] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchAnalytics()  // If this fails, all data is lost!
  ]);
  
  return { users, posts, analytics };
}
```

### Rule 6: Create Custom Error Classes

```javascript
// ✅ CORRECT - Custom error classes for specific scenarios
class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

async function fetchUserData(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid user ID', 'userId');
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new NetworkError(
        `Failed to fetch user: ${response.statusText}`,
        response.status
      );
    }
    
    return await response.json();
    
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error(`Network error (${error.statusCode}):`, error.message);
    } else if (error instanceof ValidationError) {
      console.error(`Validation error on ${error.field}:`, error.message);
    }
    throw error;
  }
}
```

---

## Parallel vs Sequential Execution

### Rule 7: Use Promise.all for Parallel Operations

```javascript
// ✅ CORRECT - Parallel execution (fast)
async function loadUserProfile(userId) {
  const [user, posts, followers] = await Promise.all([
    fetchUser(userId),
    fetchUserPosts(userId),
    fetchUserFollowers(userId)
  ]);
  
  return { user, posts, followers };
}
// Total time: max(fetch times), e.g., 300ms

// ❌ WRONG - Sequential execution (slow)
async function loadUserProfile(userId) {
  const user = await fetchUser(userId);        // 100ms
  const posts = await fetchUserPosts(userId);  // 150ms
  const followers = await fetchUserFollowers(userId); // 200ms
  
  return { user, posts, followers };
}
// Total time: sum of all times = 450ms!
```

### Rule 8: Sequential When Operations Depend on Each Other

```javascript
// ✅ CORRECT - Sequential when dependent
async function createUserAccount(userData) {
  // Must be sequential - each step depends on previous
  const user = await createUser(userData);
  const profile = await createProfile(user.id);
  const settings = await initializeSettings(user.id);
  
  return { user, profile, settings };
}

// ✅ CORRECT - Mix of parallel and sequential
async function setupAccount(userData) {
  // Step 1: Create user (must be first)
  const user = await createUser(userData);
  
  // Step 2: These can run in parallel (both depend only on user)
  const [profile, settings, subscription] = await Promise.all([
    createProfile(user.id),
    initializeSettings(user.id),
    createSubscription(user.id)
  ]);
  
  // Step 3: Send welcome email (depends on all above)
  await sendWelcomeEmail(user.email, { profile, settings });
  
  return { user, profile, settings, subscription };
}
```

### Rule 9: Limit Concurrent Operations

```javascript
// ✅ CORRECT - Process in batches to avoid overwhelming system
async function processUsers(users, processor, concurrency = 5) {
  const results = [];
  
  for (let i = 0; i < users.length; i += concurrency) {
    const batch = users.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(user => processor(user))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Usage
await processUsers(allUsers, async (user) => {
  return await updateUserData(user);
}, 10); // Process 10 users at a time

// ❌ WRONG - All at once (can crash or timeout)
async function processUsers(users, processor) {
  return await Promise.all(users.map(user => processor(user)));
  // If 10,000 users, tries to process all simultaneously!
}
```

---

## Advanced Async Patterns

### Rule 10: Implement Retry Logic

```javascript
// ✅ CORRECT - Retry with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

// Usage
const data = await fetchWithRetry('https://api.example.com/data');
```

### Rule 11: Implement Queue for Sequential Processing

```javascript
// ✅ CORRECT - Promise queue for ordered execution
class AsyncQueue {
  #queue = [];
  #processing = false;
  
  async add(task) {
    return new Promise((resolve, reject) => {
      this.#queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.#process();
    });
  }
  
  async #process() {
    if (this.#processing || this.#queue.length === 0) {
      return;
    }
    
    this.#processing = true;
    
    while (this.#queue.length > 0) {
      const task = this.#queue.shift();
      await task();
    }
    
    this.#processing = false;
  }
}

// Usage
const queue = new AsyncQueue();

queue.add(() => processItem(1));
queue.add(() => processItem(2));
queue.add(() => processItem(3));
// Items processed in order, one at a time
```

### Rule 12: Cache Async Results

```javascript
// ✅ CORRECT - Cache with promise to avoid duplicate calls
class AsyncCache {
  #cache = new Map();
  #pending = new Map();
  
  async get(key, fetcher, ttl = 60000) {
    // Return cached value if valid
    if (this.#cache.has(key)) {
      const { value, timestamp } = this.#cache.get(key);
      
      if (Date.now() - timestamp < ttl) {
        return value;
      }
      
      this.#cache.delete(key);
    }
    
    // Return pending promise if already fetching
    if (this.#pending.has(key)) {
      return this.#pending.get(key);
    }
    
    // Fetch and cache
    const promise = fetcher().then(value => {
      this.#cache.set(key, { value, timestamp: Date.now() });
      this.#pending.delete(key);
      return value;
    }).catch(error => {
      this.#pending.delete(key);
      throw error;
    });
    
    this.#pending.set(key, promise);
    return promise;
  }
}

// Usage
const cache = new AsyncCache();

// Multiple calls return same promise
const user1 = cache.get('user:123', () => fetchUser(123));
const user2 = cache.get('user:123', () => fetchUser(123));
// Only one actual fetch happens
```

---

## Timeouts and Cancellation

### Rule 13: Implement Timeouts with AbortController

```javascript
// ✅ CORRECT - Timeout with AbortController
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
    
  } finally {
    clearTimeout(timeoutId);
  }
}

// ✅ CORRECT - Cancellable operations
class CancellableOperation {
  #controller = new AbortController();
  
  async execute(task) {
    const { signal } = this.#controller;
    
    return await task(signal);
  }
  
  cancel() {
    this.#controller.abort();
  }
}

// Usage
const operation = new CancellableOperation();

operation.execute(async (signal) => {
  const response = await fetch('/api/data', { signal });
  return await response.json();
});

// Cancel if needed
setTimeout(() => operation.cancel(), 3000);
```

### Rule 14: Race Conditions and Timeout Patterns

```javascript
// ✅ CORRECT - Promise.race for timeout
async function fetchWithRaceTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url).then(r => r.json());
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
  
  return Promise.race([fetchPromise, timeoutPromise]);
}

// ✅ CORRECT - Fallback on timeout
async function fetchWithFallback(primaryUrl, fallbackUrl, timeout = 3000) {
  try {
    return await fetchWithTimeout(primaryUrl, timeout);
  } catch (error) {
    console.warn('Primary failed, using fallback:', error);
    return await fetchWithTimeout(fallbackUrl, timeout);
  }
}

// ✅ CORRECT - Fastest response wins
async function fetchFastest(urls) {
  const promises = urls.map(url => fetch(url).then(r => r.json()));
  return Promise.race(promises);
}
```

---

## Event Loop and Microtasks

### Rule 15: Understand Microtask vs Macrotask

```javascript
// Understanding execution order
console.log('1: Sync');

setTimeout(() => console.log('2: Macrotask (setTimeout)'), 0);

Promise.resolve().then(() => console.log('3: Microtask (Promise)'));

queueMicrotask(() => console.log('4: Microtask (queueMicrotask)'));

console.log('5: Sync');

// Output order:
// 1: Sync
// 5: Sync
// 3: Microtask (Promise)
// 4: Microtask (queueMicrotask)
// 2: Macrotask (setTimeout)

// ✅ CORRECT - Use microtasks for immediate async work
function scheduleImmediateWork(callback) {
  queueMicrotask(callback);  // Runs before next macrotask
}

// ⚠️ CAUTION - Long microtasks block rendering
function badMicrotask() {
  queueMicrotask(() => {
    // Heavy computation - blocks UI!
    for (let i = 0; i < 1000000; i++) {
      compute();
    }
  });
}

// ✅ CORRECT - Break into chunks with setTimeout
async function goodAsyncWork() {
  const CHUNK_SIZE = 1000;
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    processChunk(data.slice(i, i + CHUNK_SIZE));
    
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Rule 16: Avoid Blocking the Event Loop

```javascript
// ❌ WRONG - Blocks event loop
function heavyComputation(data) {
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    result += expensiveOperation(data[i]);
  }
  return result;
}

// ✅ CORRECT - Break into chunks
async function heavyComputationAsync(data, chunkSize = 1000) {
  let result = 0;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      result += expensiveOperation(item);
    }
    
    // Yield control
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return result;
}

// ✅ CORRECT - Use Web Worker for heavy computation
// main.js
const worker = new Worker('worker.js');

function heavyComputationWorker(data) {
  return new Promise((resolve, reject) => {
    worker.postMessage(data);
    
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = reject;
  });
}

// worker.js
self.onmessage = (e) => {
  const result = expensiveComputation(e.data);
  self.postMessage(result);
};
```

---

## Async Best Practices Checklist

Before committing async code, verify:

- [ ] All async functions have try-catch error handling
- [ ] Used Promise.all for independent parallel operations
- [ ] Used sequential await only when operations depend on each other
- [ ] Implemented timeouts for network requests
- [ ] Added retry logic for unreliable operations
- [ ] Limited concurrent operations (batching)
- [ ] Used AbortController for cancellable operations
- [ ] Cleaned up timers and intervals
- [ ] Avoided blocking the event loop with long synchronous operations
- [ ] Used appropriate error classes for different failure modes
- [ ] Logged errors with sufficient context
- [ ] Tested error scenarios and edge cases

---

**Common Async Patterns Summary**:

| Pattern | Use Case | Example |
|---------|----------|---------|
| `await` | Sequential dependent operations | `const user = await getUser(); const posts = await getPosts(user.id);` |
| `Promise.all` | Parallel independent operations | `const [users, posts] = await Promise.all([getUsers(), getPosts()])` |
| `Promise.allSettled` | Parallel with partial failure handling | `const results = await Promise.allSettled([...])` |
| `Promise.race` | First result wins (timeout, fastest) | `await Promise.race([fetch(), timeout()])` |
| `Promise.any` | First successful result | `await Promise.any([primary(), fallback()])` |

---

**Related Rules**:
- Error handling → `@security.md`
- Performance → `@optimization.md`
- Basic patterns → `@basics.md`
