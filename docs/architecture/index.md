---
layout: default
title: dGit Architecture
nav_order: 3
has_children: true
---

## System Overview

dGit is built with a layered architecture that separates concerns and promotes modularity.

```mermaid
graph TD
    A[CLI Layer] --> B[Core Layer]
    B --> C[Storage Layer]
    C --> D[LevelDB]
    C --> E[File System]
    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
    style C fill:#dfd,stroke:#333
```

## Core Components

### 1. CLI Layer

- **Purpose**: Handles user interaction and command parsing
- **Location**: `src/cli/`
- **Key Components**:
  - Command parser
  - User input validation
  - Output formatting

### 2. Core Layer

- **Purpose**: Implements core version control logic
- **Location**: `src/core/`
- **Key Components**:
  - Repository initialization (`init.js`)
  - File staging (`add.js`)
  - Commit creation (`commit.js`)
  - Object model implementation

### 3. Storage Layer

- **Purpose**: Manages data persistence
- **Location**: `src/storage/`
- **Key Components**:
  - LevelDB integration
  - Object storage
  - Index management

## Data Model

### Objects

dGit uses three types of objects:

1. **Blobs**

   - Store file contents
   - Content-addressable by SHA-1 hash

   ```javascript
   {
     type: 'blob',
     content: Buffer
   }
   ```

2. **Trees**

   - Represent directories
   - Contains references to blobs and other trees

   ```javascript
   {
     type: 'tree',
     entries: {
       'filename': { type: 'blob', hash: 'sha1' },
       'dirname': { type: 'tree', hash: 'sha1' }
     }
   }
   ```

3. **Commits**
   - Represent snapshots
   - Include metadata and cryptographic signatures
   ```javascript
   {
     type: 'commit',
     tree: 'sha1',
     parent: 'sha1',
     author: 'string',
     message: 'string',
     timestamp: 'ISO string',
     signature: 'string'
   }
   ```

## Data Flow

### Adding Files

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Core
    participant Storage

    User->>CLI: dgit add file.txt
    CLI->>Core: addFiles(['file.txt'])
    Core->>Storage: createBlob(content)
    Storage-->>Core: blobHash
    Core->>Storage: updateIndex(fileInfo)
    Storage-->>Core: success
    Core-->>CLI: success
    CLI-->>User: "Added file.txt"
```

### Creating Commits

```mermaid
sequenceDiagram
    participant User
    participant Core
    participant Storage
    participant Crypto

    User->>Core: createCommit(message)
    Core->>Storage: getIndex()
    Storage-->>Core: stagedFiles
    Core->>Core: buildTree()
    Core->>Crypto: signCommit()
    Core->>Storage: saveCommit()
    Storage-->>Core: commitHash
    Core-->>User: "Created commit [hash]"
```

## Security

### Cryptographic Verification

- RSA key pair generation on init
- Commit signing with private key
- Verification with public key
- SHA-1 hashing for content addressing

## Performance Considerations

### Storage Optimization

- Content-addressable storage prevents duplication
- LevelDB for efficient key-value operations
- Lazy loading of objects
- Batch operations for better performance

## Next Steps

- Learn about the [Storage Implementation](./storage)
- View the [API Reference](../api-reference)
- Check [Example Workflows](../workflows)
