# AI Agent Framework

A comprehensive framework for managing AI agent context, rules, and memory for JavaScript and SQL development.

## 🚀 Quick Start

### One Command Installation

Install the framework in any project with:

```bash
npx @1naichii/naichii-agent install
```

**What happens:**
- ✅ Interactive component selection
- ✅ Installs coding guidelines and best practices
- ✅ Sets up context management for AI agents
- ✅ Configures memory systems for consistent behavior
- ✅ Creates project documentation
- ✅ Updates .gitignore automatically

**Example:**
```bash
$ npx @1naichii/naichii-agent install

╔═══════════════════════════════════════╗
║     AI AGENT FRAMEWORK INSTALLER      ║
╚═══════════════════════════════════════╝

✨ Installer v1.0.0

📂 Installation directory: /your/project

? Select components to install: (Press <space> to select)
❯◉ JavaScript Rules & Guidelines
 ◉ SQL Rules & Guidelines
 ◉ JavaScript Memory Context
 ◉ SQL Memory Context

📦 Installing selected components...
✓ Installed JavaScript Rules
✓ Installed SQL Rules
✓ Installed JavaScript Memory
✓ Installed SQL Memory
✓ Created README.md
✓ Updated .gitignore

✅ Installation complete!
```

### What You Get

The framework provides:

- **JavaScript Rules & Guidelines**: Best practices, security, testing, async patterns, and optimization
- **SQL Rules & Guidelines**: Query optimization, security, stored procedures, and advanced features
- **Memory Context**: Persistent context that helps AI agents maintain consistency
- **Structured Organization**: Clear separation between rules, context, and memory

## 📦 Installation Options

### Interactive Installation (Recommended)

```bash
npx @1naichii/naichii-agent install
```

Select the components you need:
- JavaScript Rules & Guidelines
- SQL Rules & Guidelines  
- JavaScript Memory Context
- SQL Memory Context

### List Available Components

```bash
npx @1naichii/naichii-agent list
```

## 📁 Framework Structure

After installation, your project will have:

```
your-project/
└── .naichii-agent/
    ├── README.md
    ├── rules/
    │   ├── javascript/
    │   │   ├── README.md
    │   │   ├── basics.md
    │   │   ├── async.md
    │   │   ├── security.md
    │   │   ├── testing.md
    │   │   ├── optimization.md
    │   │   └── advanced.md
    │   └── sql/
    │       ├── README.md
    │       ├── basics.md
    │       ├── security.md
    │       ├── optimization.md
    │       ├── advanced.md
    │       └── stored-procedures.md
    └── memory/
        ├── javascript/
        │   └── js-memory.md
        └── sql/
            └── sql-memory.md
```

## 🔄 Updating

Keep your framework up-to-date:

```bash
npx @1naichii/naichii-agent install
```

The installer will update existing installations and preserve your customizations.

## 📚 Documentation

### JavaScript Rules

- **basics.md** - Core JavaScript syntax, variables, functions, and patterns
- **async.md** - Promises, async/await, error handling
- **security.md** - Input validation, XSS prevention, authentication
- **testing.md** - Unit tests, integration tests, best practices
- **optimization.md** - Performance tuning, memory management
- **advanced.md** - Design patterns, advanced techniques

### SQL Rules

- **basics.md** - SQL fundamentals, queries, joins
- **security.md** - SQL injection prevention, access control
- **optimization.md** - Query optimization, indexing strategies
- **advanced.md** - Window functions, CTEs, advanced queries
- **stored-procedures.md** - Stored procedure best practices

### Memory Context

- **js-memory.md** - JavaScript patterns, common issues, solutions
- **sql-memory.md** - SQL patterns, query templates, optimization notes

## 🎯 Use Cases

### For Development Teams
- Maintain consistent coding standards across the team
- Onboard new developers with clear guidelines
- Reduce code review time with automated best practices

### For AI Agents
- Provide context for better code generation
- Maintain consistency across sessions
- Reference best practices automatically

### For Projects
- Document coding standards in a structured way
- Keep guidelines version-controlled
- Share knowledge across team members

## 🤝 Contributing

Contributions are welcome! This framework is designed to be:
- **Extensible** - Add new languages and domains
- **Customizable** - Adapt rules to your needs
- **Collaborative** - Share improvements with the community

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **GitHub**: [https://github.com/1naichii/naichii-agent](https://github.com/1naichii/naichii-agent)
- **NPM**: [https://www.npmjs.com/package/naichii-agent](https://www.npmjs.com/package/naichii-agent)
- **Issues**: [https://github.com/1naichii/naichii-agent/issues](https://github.com/1naichii/naichii-agent/issues)
- **Discussions**: [https://github.com/1naichii/naichii-agent/discussions](https://github.com/1naichii/naichii-agent/discussions)

## 📋 Available Commands

```bash
# Install/update framework
npx @1naichii/naichii-agent install

# List available components
npx @1naichii/naichii-agent list

# Show help
npx @1naichii/naichii-agent --help

# Show version
npx @1naichii/naichii-agent --version
```

## 🧪 Testing

Before publishing or contributing, test the installer:

```bash
# Install dependencies
npm install

# Test locally with npm link
npm link

# Test in another project
cd /path/to/test-project
npx @1naichii/naichii-agent install

# Run tests
npm test
```

See [INSTALLATION.md](INSTALLATION.md) for detailed publishing instructions.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

Built with ❤️ for better AI-assisted development
