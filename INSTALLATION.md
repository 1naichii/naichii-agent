# AI Agent Framework - Installation Instructions

This document provides step-by-step instructions for publishing and using the AI Agent Framework.

## For Users

### Installing the Framework

Simply run in your project directory:

```bash
npx @1naichii/naichii-agent install
```

This will:
1. Download the latest version from npm
2. Let you select components to install
3. Copy files to `.naichii-agent/` in your project
4. Set up the framework structure

### Updating

Run the same command to update:

```bash
npx @1naichii/naichii-agent install
```

The installer will detect the existing installation and offer to update it.

## For Maintainers

### Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **GitHub Repository**: Create a repository for this project
3. **NPM Token**: Generate an automation token in your npm account settings

### Initial Setup

1. **Update package.json**:
   ```bash
   # Update the repository URL
   # Replace 1naichii with your GitHub username
   ```

2. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of AI Agent Framework"
   git branch -M main
   git remote add origin https://github.com/1naichii/naichii-agent.git
   git push -u origin main
   ```

3. **Add NPM Token to GitHub**:
   - Go to your GitHub repository settings
   - Navigate to Secrets and variables > Actions
   - Add a new repository secret:
     - Name: `NPM_TOKEN`
     - Value: Your npm automation token

### Publishing to NPM

#### Option 1: Manual Publishing

```bash
# Login to npm
npm login

# Publish the package
npm publish --access public
```

#### Option 2: Automated Publishing (Recommended)

1. **Create a Git Tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub Release**:
   - Go to your repository on GitHub
   - Click "Releases" > "Create a new release"
   - Select the tag you just created
   - Add release notes
   - Click "Publish release"

3. **Automatic Publishing**:
   - The GitHub Action will automatically publish to npm
   - Check the Actions tab to monitor progress

### Versioning

Follow Semantic Versioning (semver):

- **Major (1.0.0)**: Breaking changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

To create a new version:

```bash
# Patch release (1.0.0 -> 1.0.1)
npm version patch

# Minor release (1.0.0 -> 1.1.0)
npm version minor

# Major release (1.0.0 -> 2.0.0)
npm version major

# Push tags
git push origin main --tags
```

### Testing Before Publishing

```bash
# Test locally with npm link
npm link

# In another project
cd /path/to/test-project
npm link naichii-agent
naichii-agent install

# Test the installation
ls -la .naichii-agent/

# Unlink when done
npm unlink naichii-agent
cd /path/to/naichii-agent
npm unlink
```

### Continuous Integration

The project includes GitHub Actions for:

1. **CI (Continuous Integration)**:
   - Runs on every push and PR
   - Tests on multiple OS (Linux, Windows, macOS)
   - Tests on multiple Node versions (14, 16, 18, 20)
   - Validates package structure

2. **Publish**:
   - Runs on new releases
   - Publishes to npm automatically
   - Verifies publication

### Updating the Framework

When making changes:

1. **Update Code**: Make your changes
2. **Update CHANGELOG.md**: Document changes
3. **Update Version**: Run `npm version patch/minor/major`
4. **Commit and Tag**: 
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main --tags
   ```
5. **Create Release**: Create a GitHub release for the new tag
6. **Automatic Publish**: GitHub Actions will publish to npm

### Monitoring

After publishing:

```bash
# Check npm package
npm view naichii-agent

# Check latest version
npm view naichii-agent version

# Check package details
npm view naichii-agent versions
```

## Troubleshooting

### Publishing Fails

1. **Check NPM Token**: Ensure the token is valid and has automation permissions
2. **Check Package Name**: Ensure `naichii-agent` is not already taken (you may need to scope it: `@1naichii/naichii-agent`)
3. **Check GitHub Secrets**: Verify `NPM_TOKEN` is correctly set

### Installation Fails for Users

1. **Check Node Version**: Requires Node.js 14+
2. **Check npm Registry**: Ensure the package is published: `npm view naichii-agent`
3. **Clear npm Cache**: `npm cache clean --force`

### Version Conflicts

If the version in package.json doesn't match npm:

```bash
# Sync with npm
npm version $(npm view naichii-agent version) --no-git-tag-version
git add package.json
git commit -m "chore: sync version with npm"
git push
```

## Best Practices

1. **Test Thoroughly**: Always test with `npm link` before publishing
2. **Document Changes**: Update CHANGELOG.md for every release
3. **Follow semver**: Use appropriate version bumps
4. **Use Git Tags**: Tag releases for traceability
5. **Monitor Issues**: Respond to user issues on GitHub
6. **Keep Updated**: Regularly update dependencies

## Getting Help

- 📖 [NPM Documentation](https://docs.npmjs.com/)
- 🐛 [Report Issues](https://github.com/1naichii/naichii-agent/issues)
- 💬 [Discussions](https://github.com/1naichii/naichii-agent/discussions)
