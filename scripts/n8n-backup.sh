#!/bin/sh
# Strict mode; be POSIX-compatible. Enable pipefail only if supported.
set -eu
if (set -o 2>/dev/null | grep -q pipefail); then
  set -o pipefail
fi

echo "Backing up n8n workflows..."

# Create workflows directory if not exists
mkdir -p /home/node/.n8n/workflows
cd /home/node/.n8n/workflows || exit 1

# Export workflows to this directory
n8n export:workflow --backup --output=./

# Initialize git repo if not exists
if [ ! -d ".git" ]; then
    git init -b main
    git config --local user.name "n8n-bot"
    git config --local user.email "n8n@example.com"
    echo "# n8n Workflows Backup" > README.md
    git add README.md
    git commit -m "Initial commit"
    echo "Git repository initialized"
fi

# Add and commit changes
git add -A
if git diff --staged --quiet; then
    echo "No changes to commit"
else
    git commit -m "Auto-backup workflows $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Changes committed"
fi

# Push to remote if configured
if git remote get-url origin >/dev/null 2>&1; then
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    git push -u origin "$CURRENT_BRANCH"
    echo "Pushed to remote repository"
else
    echo "No remote repository configured"
    echo "To add remote: git remote add origin <your-repo-url>"
fi

echo "Backup completed"
