# Quick Start Guide

Get started with the AI Agent Framework in under 2 minutes!

## Installation

### Option 1: NPX (Recommended)

Run this command in any project directory:

```bash
npx @1naichii/naichii-agent install
```

This will:
1. Prompt you for what to install
2. Copy selected components to `.naichii-agent/`
3. Create documentation
4. Update your `.gitignore`

### Option 2: Global Installation

```bash
npm install -g naichii-agent
naichii-agent install
```

## First Steps

After installation, your project will have:

```
your-project/
└── .naichii-agent/
    ├── README.md          # Framework documentation
    ├── rules/             # Coding guidelines
    │   ├── javascript/
    │   └── sql/
    └── memory/            # AI context
        ├── javascript/
        └── sql/
```

## Using the Framework

### For Development

Reference rules when coding:
- Check `.naichii-agent/rules/javascript/` for JavaScript guidelines
- Check `.naichii-agent/rules/sql/` for SQL guidelines

### For AI Agents

AI assistants (GitHub Copilot, Cursor, etc.) will automatically reference these files to:
- Generate code following your standards
- Maintain consistency across sessions
- Apply best practices automatically

### Viewing Components

List all available components:

```bash
npx @1naichii/naichii-agent list
```

Output:
```
📚 Available Components:

JavaScript:
  Rules:
    - basics.md        - Core JavaScript syntax and patterns
    - async.md         - Asynchronous programming
    - security.md      - Security best practices
    ...

SQL:
  Rules:
    - basics.md        - SQL fundamentals
    - security.md      - SQL security practices
    ...
```

## Updating

Keep your framework up-to-date:

```bash
npx @1naichii/naichii-agent install
```

The installer will:
- Detect existing installation
- Update components
- Preserve your customizations

## Customization

### Modifying Rules

1. Edit files in `.naichii-agent/rules/`
2. Add project-specific guidelines
3. Remove rules that don't apply

### Adding Context

Update memory files to add project-specific context:
- `.naichii-agent/memory/javascript/js-memory.md`
- `.naichii-agent/memory/sql/sql-memory.md`

## Examples

### JavaScript Project

```bash
# Create new project
mkdir my-app
cd my-app
npm init -y

# Install framework
npx @1naichii/naichii-agent install

# Select JavaScript components
# ✓ JavaScript Rules & Guidelines
# ✓ JavaScript Memory Context

# Start coding with AI assistance!
```

### Full Stack Project

```bash
# Install all components
npx @1naichii/naichii-agent install

# Select all:
# ✓ JavaScript Rules & Guidelines
# ✓ SQL Rules & Guidelines
# ✓ JavaScript Memory Context
# ✓ SQL Memory Context

# AI agents now have full context
```

## Integration with IDEs

### VS Code / Cursor

The framework works automatically with:
- GitHub Copilot
- Cursor AI
- Other AI assistants

No additional configuration needed!

### GitHub Copilot

Copilot will reference `.naichii-agent/` files when:
- Suggesting code
- Answering questions
- Reviewing code

## Troubleshooting

### Installation Issues

If installation fails:

```bash
# Check Node version (requires 14+)
node --version

# Try with verbose output
npx @1naichii/naichii-agent install --verbose
```

### Permission Issues

On Unix systems, if you get permission errors:

```bash
# Don't use sudo with npx
npx --yes naichii-agent install
```

### Finding Installation

After installation, check:

```bash
# List directory
ls -la .naichii-agent/

# View README
cat .naichii-agent/README.md
```

## Next Steps

1. **Read the Rules**: Familiarize yourself with the guidelines in `.naichii-agent/rules/`
2. **Customize**: Adapt rules to your project's needs
3. **Share**: Commit `.naichii-agent/` to help your team
4. **Update**: Regularly update with `npx @1naichii/naichii-agent install`

## Getting Help

- 📖 Read the [full documentation](README.md)
- 🐛 [Report issues](https://github.com/1naichii/naichii-agent/issues)
- 💬 [Start a discussion](https://github.com/1naichii/naichii-agent/discussions)
- 🤝 [Contributing guide](CONTRIBUTING.md)

## Learn More

- [Complete README](README.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)

---

**Happy coding with AI! 🚀**
