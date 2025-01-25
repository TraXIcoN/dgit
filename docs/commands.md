---
layout: default
title: dgit Commands
nav_order: 4
has_children: true
has_toc: true
---

## Core Commands

### Initialize Repository

```bash
dgit init
```

Creates a new dgit repository in the current directory.

### Stage Files

```bash
dgit add <files>
```

Stages files for commit. Supports:

- Single file: `dgit add file.txt`
- Multiple files: `dgit add file1.txt file2.txt`
- All files: `dgit add .`
- Patterns: `dgit add *.js`

### Create Commit

```bash
dgit add -m "commit message"
```

Creates a new commit with staged changes.

- Includes author information
- Timestamp
- Parent commit reference
- List of changed files

### View History

```bash
dgit history
```

Shows commit history with:

- Commit hash
- Author
- Date
- Commit message
- Files included in commit

## Network Commands

### Start Listening

```bash
dgit listen [--port <port>]
```

Starts a node listening for peer connections.

- Optional port specification
- Shows listening address
- Maintains consistent PeerID across restarts

### Connect to Peer

```bash
dgit connect <address>
```

Connects to a remote peer.

- Address format: `/ip4/127.0.0.1/tcp/8000/p2p/[PEER_ID]`
- Stores connection information
- Tracks connection frequency

### List Peers

```bash
dgit peers
```

Shows peer connection information:

- Connected peers
- Connection frequency
- Last seen timestamp
- Peer addresses

## Configuration

### Environment Variables

```bash
DGIT_USER_NAME="Your Name"        # Set author name
DGIT_USER_EMAIL="your@email.com"  # Set author email
```

## File Structure

```
.dgit/
├── HEAD              # Points to current branch
├── refs/
│   └── heads/
│       └── main     # Points to latest commit
├── objects/         # Stores file contents
├── db/             # LevelDB database
│   ├── commits     # Commit data
│   ├── index       # Staging area
│   └── peers       # Peer connection data
└── index           # Staging area
```

## Storage

- Uses LevelDB for persistent storage
- Maintains commit history
- Tracks peer connections
- Stores staged files

## Network Features

- Persistent PeerID across restarts
- Connection tracking
- Peer discovery
- Connection statistics
