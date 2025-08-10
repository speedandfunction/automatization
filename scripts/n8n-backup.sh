#!/bin/sh

echo "Backing up n8n workflows..."

# Create workflows directory if not exists
mkdir -p /home/node/.n8n/workflows
cd /home/node/.n8n/workflows

# Export workflows to this directory
n8n export:workflow --backup --output=./

# Initialize git repo if not exists
if [ ! -d ".git" ]; then
    git init
    git config user.name "n8n-bot"
    git config user.email "n8n@example.com"
    echo "# n8n Workflows Backup" > README.md
    git add README.md
    git commit -m "Initial commit"
    echo "Git repository initialized"
fi

# Add and commit changes
git add .
if git diff --staged --quiet; then
    echo "No changes to commit"
else
    git commit -m "Auto-backup workflows $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Changes committed"
    
    # Push to remote if configured
    if git remote get-url origin >/dev/null 2>&1; then
        git push origin main
        echo "Pushed to remote repository"
    else
        echo "No remote repository configured"
        echo "To add remote: git remote add origin <your-repo-url>"
    fi
fi

echo "Backup completed"
