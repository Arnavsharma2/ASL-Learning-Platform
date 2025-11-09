# Frontend Submodule Workflow Guide

This project uses a nested git repository structure where `frontend/` is a separate git repository tracked by the parent repository.

## ⚠️ Important: Preventing Commit Mismatches

To prevent commit mismatches, always follow this workflow:

### Standard Workflow

1. **Make changes in frontend:**
   ```bash
   cd frontend
   # Make your changes...
   git add -A
   git commit -m "Your commit message"
   ```

2. **Update parent repository:**
   ```bash
   cd ..
   git add frontend
   git commit -m "Update frontend submodule: Description"
   ```

### Quick Check Before Committing

Run the check script before committing in the parent repo:

```bash
./scripts/check-frontend-sync.sh
```

Or manually check:

```bash
cd frontend
git status
# Should show "nothing to commit, working tree clean"
cd ..
```

### Pre-commit Hook

A git pre-commit hook is installed that will automatically prevent commits if frontend has uncommitted changes. This hook runs automatically when you try to commit.

### If You Get a Mismatch Error

If you see "modified content, untracked content" in `git status`:

1. **Check frontend status:**
   ```bash
   cd frontend
   git status
   ```

2. **Commit frontend changes:**
   ```bash
   git add -A
   git commit -m "Your commit message"
   ```

3. **Update parent:**
   ```bash
   cd ..
   git add frontend
   git commit -m "Update frontend submodule"
   ```

### Alternative: Make Frontend a Regular Directory

If you don't need separate version control for frontend, you can:

1. Remove the nested git repository:
   ```bash
   rm -rf frontend/.git
   ```

2. Add frontend files to parent repository:
   ```bash
   git add frontend/
   git commit -m "Convert frontend to regular directory"
   ```

**Note:** This will lose the separate git history for frontend.

## Best Practices

- ✅ Always commit frontend changes before parent changes
- ✅ Use descriptive commit messages for both repos
- ✅ Run `./scripts/check-frontend-sync.sh` before committing
- ✅ Keep frontend and parent commits logically related

## Troubleshooting

**Problem:** "modified content, untracked content" error

**Solution:** Follow the "If You Get a Mismatch Error" steps above.

**Problem:** Pre-commit hook not running

**Solution:** Ensure the hook is executable:
```bash
chmod +x .git/hooks/pre-commit
```

**Problem:** Want to skip the hook temporarily

**Solution:** Use `--no-verify` flag (not recommended):
```bash
git commit --no-verify -m "message"
```

