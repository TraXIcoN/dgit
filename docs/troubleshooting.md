---
layout: default
title: Troubleshooting Guide
nav_order: 6
---

Common issues and their solutions when working with dGit.

## Installation Issues

### Command Not Found

**Problem:**

```bash
-bash: dgit: command not found
```

**Solution:**

1. Reinstall globally

```bash
npm uninstall -g dgit
npm install -g dgit

# Or update PATH if installed from source
export PATH="$PATH:$(npm bin -g)"
```

2. Check npm global path:

```bash
npm config get prefix
# Add to PATH if needed
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Permission Errors

**Problem:**

```bash
npm ERR! Error: EACCES: permission denied
```

**Solutions:**

1. Use sudo (not recommended):

```bash
sudo npm install -g dgit
```

2. Fix npm permissions (recommended):

```bash
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

## Repository Issues

### Invalid Repository

**Problem:**

```bash
Error: not a dgit repository
```

**Solutions:**

1. Check current directory:

```bash
ls -la .dgit
```

2. Initialize repository if needed:

```bash
dgit init
```

3. Verify repository structure:

```bash
tree .dgit
```

### Corrupt Repository

**Problem:**

```bash
Error: corrupt repository structure
```

**Solutions:**

1. Check repository integrity:

```bash
# Verify database
ls -la .dgit/db

# Check objects
ls -la .dgit/objects
```

2. Reinitialize if necessary:

```bash
mv .dgit .dgit_backup
dgit init
```

## Storage Issues

### Database Errors

**Problem:**

```bash
Error: Failed to access LevelDB database
```

**Solutions:**

1. Check database lock:

```bash
rm .dgit/db/LOCK
```

2. Verify permissions:

```bash
ls -la .dgit/db
chmod -R 755 .dgit/db
```

3. Rebuild database:

```bash
# Backup first
cp -r .dgit/db .dgit/db_backup
rm -rf .dgit/db/*
dgit init
```

### Disk Space Issues

**Problem:**

```bash
Error: no space left on device
```

**Solutions:**

1. Check available space:

```bash
df -h .
```

2. Clean unnecessary objects:

```bash
# Coming in future version
dgit gc
```

## Commit Issues

### Staging Failures

**Problem:**

```bash
Error: Failed to stage files
```

**Solutions:**

1. Check file existence:

```bash
ls -la <file>
```

2. Verify file permissions:

```bash
chmod 644 <file>
```

3. Check index state:

```bash
cat .dgit/index
```

### Commit Failures

**Problem:**

```bash
Error: Failed to create commit
```

**Solutions:**

1. Verify staged changes:

```bash
# Future version
dgit status
```

2. Check signing keys:

```bash
ls -la .dgit/keys
```

3. Regenerate keys if needed:

```bash
rm .dgit/keys/*
dgit init
```

## Performance Issues

### Slow Operations

**Problem:** Commands taking too long to execute

**Solutions:**

1. Check repository size:

```bash
du -sh .dgit
```

2. Monitor system resources:

```bash
top
df -h
```

3. Optimize storage:

```bash
# Coming in future version
dgit optimize
```

## Debugging

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=dgit:*

# Run command with debug output
dgit <command>
```

### Check System Information

```bash
# Node.js version
node --version

# npm version
npm --version

# dGit version
dgit --version
```

### Generate Debug Report

```bash
# Coming in future version
dgit debug-report
```

## Common Error Messages

| Error Code | Message               | Solution             |
| ---------- | --------------------- | -------------------- |
| E001       | Repository not found  | Run `dgit init`      |
| E002       | Invalid object hash   | Check file integrity |
| E003       | Database access error | Check permissions    |
| E004       | Commit signing failed | Verify keys          |
| E005       | Storage full          | Free disk space      |

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/yourusername/dgit/issues)
2. Search existing problems
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - System information
   - Debug logs

## Next Steps

- Review [Architecture](./architecture)
- Check [API Reference](./api-reference)
- See [Example Workflows](./workflows)
