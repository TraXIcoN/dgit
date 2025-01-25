---
layout: home
title: Home
nav_order: 1
---

{: .fs-9 }

A modern, decentralized version control system built with JavaScript.
{: .fs-6 .fw-300 }

[Get Started](./getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/yourusername/dgit){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## What is dGit?

dGit is a distributed version control system that combines Git's proven concepts with modern JavaScript implementation. It features:

- 📦 **Decentralized Storage**: Built for distributed systems
- 🔐 **Cryptographic Verification**: Secure commit signing
- 💻 **Local-First**: Operates without network dependency
- 🚀 **Modern Architecture**: Built with current JavaScript practices

## Quick Start

```bash

# Install dGit
npm install -g dgit

# Initialize a repository
dgit init

# Add files
dgit add .

# Create a commit
dgit commit -m "Initial commit"
```

## Features

- **File Tracking**: Track changes to your files with efficient storage
- **Commit History**: Maintain a complete history of your project
- **Cryptographic Signing**: Every commit is cryptographically signed
- **Local Storage**: Uses LevelDB for efficient local storage
- **Modern CLI**: Intuitive command-line interface

## Project Status

dGit is currently in active development. Core features implemented:

- ✅ Repository initialization
- ✅ File staging
- ✅ Commit creation
- ✅ Cryptographic verification
- ✅ Local storage with LevelDB

## Documentation Sections

- [Getting Started](./getting-started) - Quick setup guide
- [Architecture](./architecture) - System design and components
- [API Reference](./api-reference) - Detailed API documentation
- [Troubleshooting](./troubleshooting) - Common issues and solutions
