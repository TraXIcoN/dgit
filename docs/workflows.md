---
layout: default
title: Example Workflows
nav_order: 5
---

This guide demonstrates common workflows and best practices when using dGit.

## Basic Workflows

### Starting a New Project

```bash
# Create project directory
mkdir my-project
cd my-project

# Initialize dGit repository
dgit init

# Create initial files
echo "# My Project" > README.md
touch .gitignore

# Stage and commit
dgit add README.md .gitignore
dgit commit -m "Initial commit"
```

### Development Workflow

```bash

# Create a new feature
mkdir src
touch src/feature.js

# Write some code
echo "function newFeature() { }" > src/feature.js

# Stage and commit
dgit add src/feature.js
dgit commit -m "Add new feature"

# Update the feature
echo "function newFeature() { console.log('Hello, World!'); }" > src/feature.js

# Stage and commit
dgit add src/feature.js
dgit commit -m "Update new feature"
```

## Advanced Usage

### Large Projects

```bash
# Initialize repository
dgit init

# Create project structure
mkdir -p src/{components,utils,styles}
touch src/components/{Header,Footer,Main}.js
touch src/utils/{helpers,constants}.js
touch src/styles/{main,components}.css

# Stage everything
dgit add .

# Create initial commit
dgit commit -m "Project structure setup"

# Stage and commit by component
dgit add src/components/Header.js
dgit commit -m "Add Header component"

dgit add src/components/Footer.js
dgit commit -m "Add Footer component"

dgit add src/styles/components.css
dgit commit -m "Add component styles"
```

### Project Organization

```bash
# Create standard project structure
mkdir -p {src,tests,docs,scripts}

# Create configuration files
touch .gitignore
touch package.json
touch README.md

# Stage project setup
dgit add .gitignore package.json README.md
dgit commit -m "Project configuration"

# Add source code
dgit add src/
dgit commit -m "Add source code"

# Add tests
dgit add tests/
dgit commit -m "Add test suite"
```

## Best Practices

### Commit Messages

Good commit messages should:

- Be concise but descriptive
- Start with a verb
- Explain the why, not the what

Examples:

```bash
# Good commit messages
dgit commit -m "Add user authentication module"
dgit commit -m "Fix memory leak in data processing"
dgit commit -m "Update documentation with API examples"

# Not so good messages
dgit commit -m "changes"
dgit commit -m "fix stuff"
dgit commit -m "wip"
```

### File Organization

Recommended project structure:

```bash
project/
├── src/            # Source code
├── tests/          # Test files
├── docs/           # Documentation
├── scripts/        # Build/deployment scripts
├── .gitignore     # Ignore file
├── package.json    # Project metadata
└── README.md      # Project documentation
```

### Staging Practices

Stage related changes together:

```bash
# Stage and commit related features
dgit add src/auth/login.js src/auth/register.js
dgit commit -m "Implement user authentication"

# Stage and commit related tests
dgit add tests/auth/login.test.js tests/auth/register.test.js
dgit commit -m "Add authentication tests"
```

## Common Patterns

### Feature Development

```bash
# Start new feature
mkdir -p src/features/new-feature
touch src/features/new-feature/{index,utils,types}.js

# Initial implementation
dgit add src/features/new-feature/
dgit commit -m "Add new feature structure"

# Add tests
mkdir -p tests/features/new-feature
touch tests/features/new-feature/index.test.js
dgit add tests/features/new-feature/
dgit commit -m "Add new feature tests"

# Update implementation
dgit add src/features/new-feature/
dgit commit -m "Update new feature implementation"
```

## Next Steps

- Review [API Reference](./api-reference)
- Check [Troubleshooting](./troubleshooting)
- Explore [Architecture](./architecture)
