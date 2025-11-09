#!/bin/bash

# Script to check if frontend is in sync with parent repository
# Run this before committing to prevent submodule mismatch

set -e

FRONTEND_DIR="frontend"

if [ ! -d "$FRONTEND_DIR/.git" ]; then
    echo "ℹ️  Frontend is not a git repository, skipping check"
    exit 0
fi

cd "$FRONTEND_DIR"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Frontend has uncommitted changes!"
    echo ""
    git status --short
    echo ""
    echo "Please commit frontend changes first:"
    echo "  1. cd frontend"
    echo "  2. git add -A"
    echo "  3. git commit -m 'Your commit message'"
    echo "  4. cd .."
    echo "  5. git add frontend"
    echo "  6. git commit"
    echo ""
    exit 1
fi

# Check if there are untracked files that should be committed
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    echo "⚠️  Frontend has untracked files:"
    echo "$UNTRACKED"
    echo ""
    echo "Consider adding them if they're important:"
    echo "  cd frontend && git add <files> && git commit"
    echo ""
fi

cd ..

echo "✅ Frontend is in sync!"
exit 0

