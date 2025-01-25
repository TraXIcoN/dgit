---
layout: default
title: API Reference
nav_order: 4
---

## Core API

### Repository Operations

#### `initRepo()`

Initializes a new dGit repository in the current directory.

```typescript
async function initRepo(): Promise<void>;
```

**Example:**

```javascript
import { initRepo } from "dgit/core";

await initRepo();
// Creates .dgit directory with initial structure
```

#### `addFiles(files: string[])`

Stages files for commit.

```typescript
async function addFiles(files: string[]): Promise<void>;
```

**Parameters:**

- `files`: Array of file paths to stage

**Example:**

```javascript
import { addFiles } from "dgit/core";

// Add single file
await addFiles(["file.txt"]);

// Add multiple files
await addFiles(["file1.txt", "file2.txt"]);

// Add with glob pattern
await addFiles(["src/*.js"]);
```

#### `createCommit(options)`

Creates a new commit with staged changes.

```typescript
interface CommitOptions {
  message: string;
}

async function createCommit(options: CommitOptions): Promise<string>;
```

**Parameters:**

- `options.message`: Commit message

**Returns:**

- Commit hash

**Example:**

```javascript
import { createCommit } from "dgit/core";

const hash = await createCommit({
  message: "Initial commit",
});
console.log(`Created commit: ${hash}`);
```

## Storage API

### Class: Storage

#### Constructor

```typescript
constructor(repoPath?: string)
```

**Parameters:**

- `repoPath`: Optional repository path (defaults to '.dgit')

#### Methods

##### `init()`

Initializes the storage database.

```typescript
async init(): Promise<void>
```

##### `saveCommit(hash, data)`

Stores a commit object.

```typescript
interface CommitData {
  tree: string;
  parent: string | null;
  author: string;
  timestamp: string;
  message: string;
  signature: string;
}

async saveCommit(hash: string, data: CommitData): Promise<void>
```

##### `getCommit(hash)`

Retrieves a commit object.

```typescript
async getCommit(hash: string): Promise<CommitData | null>
```

##### `getCommitHistory()`

Gets the ordered list of commit hashes.

```typescript
async getCommitHistory(): Promise<string[]>
```

##### `saveObject(hash, content)`

Stores a blob or tree object.

```typescript
async saveObject(hash: string, content: any): Promise<void>
```

##### `getObject(hash)`

Retrieves an object by hash.

```typescript
async getObject(hash: string): Promise<any | null>
```

##### `saveIndex(data)`

Updates the staging area.

```typescript
interface IndexData {
  files: {
    [path: string]: {
      hash: string;
      size: number;
      timestamp: number;
      type: string;
      mode: string;
    }
  }
}

async saveIndex(data: IndexData): Promise<void>
```

##### `getIndex()`

Gets the current staging area state.

```typescript
async getIndex(): Promise<IndexData>
```

## Usage Examples

### Basic Repository Operations

```javascript
import { initRepo, addFiles, createCommit } from "dgit/core";

// Initialize repository
await initRepo();

// Stage files
await addFiles(["README.md", "src/*.js"]);

// Create commit
const hash = await createCommit({
  message: "Initial commit",
});
```

### Working with Storage Directly

```javascript
import { getStorage } from "dgit/storage";

const storage = getStorage();
await storage.init();

// Save a blob
const content = "Hello, World!";
const hash = computeHash(content);
await storage.saveObject(hash, content);

// Retrieve commit history
const history = await storage.getCommitHistory();
for (const commitHash of history) {
  const commit = await storage.getCommit(commitHash);
  console.log(`${commitHash}: ${commit.message}`);
}
```

## Error Handling

All API methods may throw errors that should be handled:

```javascript
try {
  await addFiles(["nonexistent.txt"]);
} catch (error) {
  console.error("Failed to add files:", error.message);
}
```

Common error types:

- `RepositoryError`: Repository-related issues
- `StorageError`: Database or filesystem errors
- `ValidationError`: Invalid input parameters

## Type Definitions

For TypeScript users, type definitions are available:

```typescript
import { CommitOptions, CommitData, IndexData } from "dgit/types";
```

## Next Steps

- See [Example Workflows](./workflows)
- Check [Troubleshooting](./troubleshooting)
- Review [Architecture](./architecture)
