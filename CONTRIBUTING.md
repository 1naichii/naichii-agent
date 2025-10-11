# Contributing to AI Agent Framework

Thank you for your interest in contributing! This document provides guidelines for contributing to the AI Agent Framework.

## How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists in the [Issues](https://github.com/1naichii/naichii-agent/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Your environment (OS, Node version, etc.)

### Suggesting Enhancements

We welcome suggestions for:
- New language support (TypeScript, Python, etc.)
- Additional rules and guidelines
- Framework improvements
- Documentation enhancements

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes locally
5. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### Commit Message Format

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

### Adding New Rules

When adding new coding rules:

1. Create the rule file in `context/rules/{language}/`
2. Follow the existing format:
   - Clear section headers
   - Code examples (✅ Correct / ❌ Wrong)
   - Explanations and rationale
   - Related rules references
3. Update the language's README.md
4. Update the installer if needed
5. Add tests/examples if applicable

### Testing

Before submitting:

1. Test the installer:
   ```bash
   npm link
   cd /tmp/test-project
   npx naichii-agent install
   ```

2. Verify all components install correctly
3. Check that README and documentation are generated
4. Test update functionality on existing installations

### Documentation

- Keep README.md up to date
- Document new features in CHANGELOG.md
- Add inline comments for complex code
- Update instruction files if rules change

## Code Style

- Use ES6+ JavaScript features
- Follow the JavaScript rules in this framework
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in pull request comments
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
