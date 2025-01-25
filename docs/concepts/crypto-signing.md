---
layout: default
title: Cryptographic Signing
parent: Core Concepts
nav_order: 4
has_toc: false
---

## Overview

Secure commit verification using GPG:

1. **Key Management**

   - Key generation
   - Key distribution
   - Trust models

2. **Commit Signing**
   - Author verification
   - Tamper detection
   - Signature validation

## Implementation

```mermaid
sequenceDiagram
    participant Author
    participant Commit
    participant Verifier

    Author->>Commit: Sign with private key
    Note over Commit: Hash + Signature
    Commit->>Verifier: Verify with public key
```

## Security Features

1. **Identity Verification**

   - Author authentication
   - Non-repudiation
   - Trust chains

2. **Data Integrity**
   - Commit protection
   - History verification
   - Tamper detection
