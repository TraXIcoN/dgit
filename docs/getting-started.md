---
layout: default
title: Getting Started with dGit
nav_order: 2
---

This guide will help you install dGit and start using its basic features.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Install from npm

```bash
npm install -g dgit
```

```bash

# Clone a repository
git clone https://github.com/yourusername/dgit.git

# Navigate to directory
cd dgit

# Install dependencies
npm install

# Link globally
npm link
```

## Basic Usage

### Initialize a Repository

Create a new dGit repository in your project directory:

```bash

# Create a new directory
mkdir my-project

# Navigate to the directory
cd my-project

# Initialize the repository
dgit init
```

This creates a `.dgit` directory with the necessary repository structure.

### Adding Files

Stage files for commit:

```bash

# Add specific files
dgit add file.txt

# Add multiple files
dgit add file1.txt file2.txt

# Add all files
dgit add .

# Add using patterns
dgit add '*.js'
```

### Creating Commits

Create a new commit with your staged changes:

```bash

# Create a commit with a message
dgit commit -m "Initial commit"

# Create a commit with a message and author
dgit commit -m "Initial commit" -a "John Doe <john@example.com>"
```

## Repository Structure

After initialization, your `.dgit` directory contains:

```bash
.dgit/
├── objects/     # Stores all content
├── refs/       # Branch references
├── HEAD        # Points to current branch
├── index       # Staging area
├── keys/       # Cryptographic keys
└── db/         # LevelDB database
```

## Next Steps

- Learn about the [Architecture](./architecture)
- Explore the [API Reference](./api-reference)
- Check [Troubleshooting](./troubleshooting) for common issues

## Common Issues

### Command Not Found

If the `dgit` command isn't found after installation:

```bash
# Reinstall globally
npm uninstall -g dgit
npm install -g dgit

# Or update PATH if installed from source
export PATH="$PATH:$(npm bin -g)"
```

### Permission Issues

If you encounter permission errors:

```bash
# Install with sudo
sudo npm install -g dgit

# Or fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```
