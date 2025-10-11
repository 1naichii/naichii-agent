# JavaScript Rules - Complete Reference

This directory contains comprehensive JavaScript development guidelines following best practices for modern JavaScript development.

---

## 📚 File Structure

| File | Purpose | When to Reference |
|------|---------|-------------------|
| **basics.md** | Fundamental JavaScript patterns, naming conventions, and code structure | Writing any JavaScript code, creating functions, organizing modules |
| **optimization.md** | Performance optimization, memory management, and efficient algorithms | Addressing performance issues, optimizing slow code, reducing memory usage |
| **async.md** | Async/await patterns, promises, error handling, and concurrency | Working with APIs, handling async operations, managing parallel tasks |
| **security.md** | Input validation, XSS prevention, authentication, and secure coding | Handling user input, implementing authentication, preventing vulnerabilities |
| **advanced.md** | Design patterns, proxies, generators, and meta-programming | Complex architecture, implementing design patterns, advanced JavaScript features |
| **testing.md** | Unit testing, integration testing, TDD, and debugging techniques | Writing tests, debugging code, ensuring code quality |

---

## 🎯 Quick Reference by Task

### Creating New Code
1. Start with **basics.md** for structure and naming
2. Apply **security.md** for input handling
3. Reference **async.md** if dealing with asynchronous operations
4. Write tests following **testing.md**

### Fixing Performance Issues
1. Profile code first (measure before optimizing)
2. Reference **optimization.md** for specific techniques
3. Check **async.md** for async-related bottlenecks
4. Verify improvements with **testing.md** benchmarks

### Implementing Complex Features
1. Review **advanced.md** for design patterns
2. Ensure **security.md** compliance
3. Follow **async.md** for async complexity
4. Maintain test coverage per **testing.md**

### Code Review Checklist
1. ✅ Follows **basics.md** conventions
2. ✅ No **security.md** violations
3. ✅ **async.md** error handling present
4. ✅ **optimization.md** principles applied
5. ✅ **testing.md** coverage adequate
6. ✅ **advanced.md** patterns used appropriately

---

## 🔴 Critical Rules Summary

### From basics.md
- Use `const` by default, `let` when needed, never `var`
- Use `===` instead of `==`
- Follow naming conventions: camelCase, PascalCase, UPPER_SNAKE_CASE
- No parameter mutation (use pure functions)

### From optimization.md
- Choose efficient data structures (Map, Set vs Array)
- Implement memoization for expensive calculations
- Clean up event listeners and intervals
- Batch DOM updates

### From async.md
- Always use try-catch in async functions
- Use Promise.all for parallel operations
- Implement timeouts for network requests
- Handle errors with custom error classes

### From security.md
- Validate and sanitize all user input
- Never use eval() or innerHTML with user data
- Store tokens in httpOnly cookies
- Implement rate limiting
- Use environment variables for secrets

### From advanced.md
- Apply appropriate design patterns
- Use proxies for validation and reactivity
- Implement generators for lazy evaluation
- Create custom iterators for collections

### From testing.md
- Write tests following AAA pattern
- Mock external dependencies appropriately
- Test edge cases and error conditions
- Maintain 80%+ code coverage
- Use ESLint and Prettier

---

## 📊 Code Quality Standards

### Performance Targets
- DOM manipulation: < 16ms (60 FPS)
- API calls: < 200ms
- Data processing: < 100ms
- Page load: < 3s
- Time to Interactive: < 5s

### Test Coverage Targets
- Unit tests: 80%+ coverage
- Critical paths: 100% coverage
- Integration tests: Key user flows
- E2E tests: Happy paths

### Code Complexity Limits
- Max function lines: 50
- Max cyclomatic complexity: 10
- Max nesting depth: 3
- Max parameters: 4 (use objects for more)

---

## 🛠️ Recommended Tools

### Development
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety (optional but recommended)

### Testing
- **Vitest** / **Jest**: Unit and integration testing
- **Testing Library**: Component testing
- **Playwright** / **Cypress**: E2E testing

### Performance
- **Chrome DevTools**: Performance profiling
- **Lighthouse**: Performance audits
- **webpack-bundle-analyzer**: Bundle size analysis

### Security
- **npm audit**: Dependency vulnerability scanning
- **OWASP ZAP**: Security testing
- **Snyk**: Continuous security monitoring

---

## 🎓 Learning Path

### Beginner
1. Master **basics.md** (variables, functions, objects)
2. Understand **async.md** (promises, async/await)
3. Learn **testing.md** (writing basic tests)

### Intermediate
4. Apply **optimization.md** (performance tuning)
5. Follow **security.md** (secure coding)
6. Explore **advanced.md** (design patterns)

### Advanced
7. Deep dive into **advanced.md** (meta-programming)
8. Master **optimization.md** (advanced techniques)
9. Contribute to architecture decisions

---

## 📖 Usage Examples

### Example 1: Creating a New Feature
```javascript
// 1. Start with basics.md structure
const userService = {
  // 2. Add security.md validation
  async createUser(userData) {
    validateUserInput(userData); // security.md
    
    // 3. Use async.md patterns
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      // 4. Apply optimization.md (use efficient data structure)
      const user = {
        id: generateId(),
        ...userData,
        password: hashedPassword
      };
      
      return await database.save(user);
      
    } catch (error) {
      // 5. Error handling from async.md
      throw new ValidationError('User creation failed', error);
    }
  }
};

// 6. Write tests per testing.md
describe('userService.createUser', () => {
  it('should create user with hashed password', async () => {
    const user = await userService.createUser({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });
    
    expect(user.password).not.toBe('SecurePass123!');
  });
});
```

---

## 🔗 Cross-References

Rules often overlap - here's how they connect:

- **basics.md** ↔ **testing.md**: Write testable code
- **async.md** ↔ **optimization.md**: Optimize async operations
- **security.md** ↔ **basics.md**: Secure coding fundamentals
- **advanced.md** ↔ **optimization.md**: Advanced performance patterns
- **testing.md** ↔ **security.md**: Security testing

---

## 📝 Contributing

When adding or updating rules:

1. Follow existing format and structure
2. Include ✅ CORRECT and ❌ WRONG examples
3. Explain WHY, not just WHAT
4. Add practical use cases
5. Cross-reference related rules
6. Keep code examples realistic
7. Test all code snippets

---

## 🔄 Updates

**Last Updated**: 2025-10-12  
**Version**: 1.0  
**Maintainer**: 1naichii

**Recent Changes**:
- Initial comprehensive JavaScript guidelines
- Added 6 detailed rule files
- Included 100+ code examples
- Established quality standards

---

## 💡 Getting Help

**When stuck:**
1. Search this directory for relevant keywords
2. Check the appropriate file from the table above
3. Look at code examples in the rules
4. Reference the cross-references section
5. Review the learning path for your level

**For specific scenarios:**
- "How do I...?" → Check **basics.md** first
- "Why is this slow?" → See **optimization.md**
- "Is this secure?" → Review **security.md**
- "How to test this?" → Follow **testing.md**
- "What pattern fits?" → Explore **advanced.md**
- "Async not working?" → Debug with **async.md**

---

**Remember**: These are guidelines, not absolute rules. Use judgment and adapt to your project's specific needs while maintaining code quality and security.
