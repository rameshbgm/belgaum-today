#!/bin/bash

# =============================================================================
# Belgaum Today - Git Push Script
# =============================================================================
# This script initializes Git and pushes code to remote repository
# Usage: ./scripts/push-to-git.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Belgaum Today - Git Push Script                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Error: Git is not installed${NC}"
    echo "   Install git from: https://git-scm.com/downloads"
    exit 1
fi

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "   Please run this script from the project root"
    exit 1
fi

# Initialize Git if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
fi

# Check for .gitignore
if [ ! -f ".gitignore" ]; then
    echo -e "${RED}⚠️  Warning: .gitignore not found${NC}"
    read -p "Continue anyway? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        exit 1
    fi
fi

# Check current status
echo ""
echo -e "${YELLOW}📊 Current Git status:${NC}"
git status --short

# Check if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${GREEN}✅ No changes to commit${NC}"
else
    echo ""
    echo -e "${YELLOW}📝 Files to commit:${NC}"
    git status --short
    
    echo ""
    read -p "Review changes? (y/n): " review_changes
    if [ "$review_changes" = "y" ]; then
        git status
        echo ""
        read -p "Continue with commit? (y/n): " continue_commit
        if [ "$continue_commit" != "y" ]; then
            echo -e "${YELLOW}⏸️  Aborted${NC}"
            exit 0
        fi
    fi
    
    # Add all files
    echo ""
    echo -e "${BLUE}📦 Adding files to Git...${NC}"
    git add .
    
    # Commit
    echo ""
    read -p "Enter commit message (or press Enter for default): " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Production deployment - $(date +%Y-%m-%d)"
    fi
    
    git commit -m "$commit_message"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Check for remote
echo ""
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✅ Remote 'origin' already configured${NC}"
    REMOTE_URL=$(git remote get-url origin)
    echo "   URL: $REMOTE_URL"
    echo ""
    read -p "Push to this remote? (y/n): " push_existing
    
    if [ "$push_existing" = "y" ]; then
        echo -e "${BLUE}🚀 Pushing to remote...${NC}"
        
        # Get current branch
        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        
        # Push
        if git push origin "$BRANCH"; then
            echo -e "${GREEN}✅ Successfully pushed to origin/$BRANCH${NC}"
        else
            echo -e "${YELLOW}⚠️  First time push detected${NC}"
            echo -e "${BLUE}🚀 Setting upstream and pushing...${NC}"
            git push --set-upstream origin "$BRANCH"
            echo -e "${GREEN}✅ Successfully pushed to origin/$BRANCH${NC}"
        fi
    else
        echo -e "${YELLOW}⏸️  Push aborted${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No remote repository configured${NC}"
    echo ""
    echo -e "${YELLOW}📋 Configure remote repository:${NC}"
    echo "   1. GitHub"
    echo "   2. GitLab"
    echo "   3. Bitbucket"
    echo "   4. Custom URL"
    echo "   5. Skip for now"
    echo ""
    read -p "Select option (1-5): " remote_option
    
    case $remote_option in
        1)
            echo ""
            echo -e "${BLUE}GitHub Setup:${NC}"
            echo "   1. Create repository at: https://github.com/new"
            echo "   2. Repository name: belgaum-today"
            echo "   3. Keep it private or public as needed"
            echo "   4. Do NOT initialize with README"
            echo ""
            read -p "Enter your GitHub username: " github_user
            
            REMOTE_URL="https://github.com/${github_user}/belgaum-today.git"
            ;;
        2)
            echo ""
            read -p "Enter your GitLab username: " gitlab_user
            REMOTE_URL="https://gitlab.com/${gitlab_user}/belgaum-today.git"
            ;;
        3)
            echo ""
            read -p "Enter your Bitbucket username: " bitbucket_user
            REMOTE_URL="https://bitbucket.org/${bitbucket_user}/belgaum-today.git"
            ;;
        4)
            echo ""
            read -p "Enter custom Git URL: " custom_url
            REMOTE_URL="$custom_url"
            ;;
        5)
            echo -e "${YELLOW}⏸️  Skipping remote setup${NC}"
            echo ""
            echo -e "${GREEN}✅ Local repository ready${NC}"
            echo -e "${YELLOW}📋 To add remote later:${NC}"
            echo "   git remote add origin <your-repo-url>"
            echo "   git push -u origin main"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option${NC}"
            exit 1
            ;;
    esac
    
    # Add remote
    echo ""
    echo -e "${BLUE}🔗 Adding remote: $REMOTE_URL${NC}"
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}✅ Remote added${NC}"
    
    # Rename branch to main if needed
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "${BLUE}🔄 Renaming branch to 'main'...${NC}"
        git branch -M main
    fi
    
    # Push
    echo ""
    echo -e "${BLUE}🚀 Pushing to remote...${NC}"
    echo -e "${YELLOW}⚠️  You may be prompted for credentials${NC}"
    
    if git push -u origin main; then
        echo -e "${GREEN}✅ Successfully pushed to remote${NC}"
    else
        echo -e "${RED}❌ Push failed${NC}"
        echo ""
        echo -e "${YELLOW}📋 Common issues:${NC}"
        echo "   • Repository doesn't exist at $REMOTE_URL"
        echo "   • Authentication failed (wrong username/password)"
        echo "   • Repository already has content"
        echo ""
        echo -e "${YELLOW}📋 Solutions:${NC}"
        echo "   • Create the repository first"
        echo "   • Use SSH key or GitHub token for authentication"
        echo "   • Force push if needed: git push -u origin main --force"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Git Push Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show remote info
echo -e "${YELLOW}📋 Repository Information:${NC}"
git remote -v
echo ""

# Show commit info
echo -e "${YELLOW}📝 Latest Commit:${NC}"
git log -1 --oneline
echo ""

echo -e "${GREEN}✅ Your code is now in version control!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Verify repository on your Git hosting platform"
echo "   2. Clone repository on Hostinger: git clone <url>"
echo "   3. Follow deployment guide in docs/DEPLOYMENT.md"
echo ""
