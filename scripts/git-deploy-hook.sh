#!/bin/bash

# Git Deploy Hook for Baseline Population
# This script runs after a git deployment to update file baselines
# Usage: ./scripts/git-deploy-hook.sh [store-id] [version]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_STORE_ID="157d4590-49bf-4b0b-bd77-abe131909528"
DEFAULT_VERSION="latest"
DEFAULT_DATABASE_URL="postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"

# Parse arguments
STORE_ID=${1:-$DEFAULT_STORE_ID}
VERSION=${2:-$DEFAULT_VERSION}
FORCE_UPDATE=${3:-false}
DATABASE_URL=${DATABASE_URL:-$DEFAULT_DATABASE_URL}

echo -e "${BLUE}🚀 Git Deploy Hook - Baseline Update${NC}"
echo -e "   Store ID: ${STORE_ID}"
echo -e "   Version: ${VERSION}"
echo -e "   Force Update: ${FORCE_UPDATE}"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi
}

# Function to get current git information
get_git_info() {
    GIT_COMMIT=$(git rev-parse HEAD)
    GIT_BRANCH=$(git branch --show-current)
    GIT_SHORT_COMMIT=$(git rev-parse --short HEAD)
    
    log "${BLUE}📋 Git Information:${NC}"
    log "   Commit: ${GIT_SHORT_COMMIT} (${GIT_COMMIT})"
    log "   Branch: ${GIT_BRANCH}"
}

# Function to check if source files have changed
check_source_changes() {
    # Get list of changed files in last commit
    CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null || echo "")
    
    if [ -z "$CHANGED_FILES" ]; then
        log "${YELLOW}⚠️  No changed files detected in last commit${NC}"
        return 1
    fi

    # Check if any source files were changed
    SOURCE_CHANGED=$(echo "$CHANGED_FILES" | grep -E '\.(jsx?|tsx?|vue|s?css|less)$' | head -5)
    
    if [ -z "$SOURCE_CHANGED" ]; then
        log "${YELLOW}📝 No source files changed, skipping baseline update${NC}"
        if [ "$FORCE_UPDATE" != "true" ]; then
            return 1
        else
            log "${YELLOW}🔄 Force update enabled, proceeding anyway${NC}"
        fi
    else
        log "${GREEN}📝 Source files changed:${NC}"
        echo "$SOURCE_CHANGED" | while read -r file; do
            log "   - $file"
        done
    fi
    
    return 0
}

# Function to backup current baselines
backup_baselines() {
    log "${BLUE}💾 Creating baseline backup...${NC}"
    
    BACKUP_VERSION="${VERSION}-backup-$(date +%s)"
    
    # Create backup using SQL with proper environment
    NODE_ENV=production DATABASE_URL="$DATABASE_URL" node -e "
    const { sequelize } = require('./backend/src/database/connection');
    (async () => {
        try {
            const [result] = await sequelize.query(\`
                INSERT INTO file_baselines (store_id, file_path, baseline_code, code_hash, version, file_type, file_size, last_modified)
                SELECT store_id, file_path, baseline_code, code_hash, :backupVersion, file_type, file_size, CURRENT_TIMESTAMP
                FROM file_baselines 
                WHERE store_id = :storeId AND version = :version
            \`, {
                replacements: { storeId: '$STORE_ID', version: '$VERSION', backupVersion: '$BACKUP_VERSION' }
            });
            console.log('✅ Baseline backup created: $BACKUP_VERSION');
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            process.exit(1);
        } finally {
            await sequelize.close();
        }
    })();
    " || {
        log "${RED}❌ Baseline backup failed${NC}"
        exit 1
    }
}

# Function to update baselines
update_baselines() {
    log "${BLUE}📦 Updating baselines with new source files...${NC}"
    
    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        log "${RED}❌ Node.js not found. Please install Node.js${NC}"
        exit 1
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "${YELLOW}📥 Installing dependencies...${NC}"
        npm install --production --silent
    fi

    # Run baseline population script with proper environment
    if [ "$FORCE_UPDATE" = "true" ]; then
        NODE_ENV=production DATABASE_URL="$DATABASE_URL" node scripts/populate-baselines.cjs --store-id="$STORE_ID" --version="$VERSION" --cleanup
    else
        NODE_ENV=production DATABASE_URL="$DATABASE_URL" node scripts/populate-baselines.cjs --store-id="$STORE_ID" --version="$VERSION"
    fi
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ Baselines updated successfully${NC}"
    else
        log "${RED}❌ Baseline update failed${NC}"
        exit 1
    fi
}

# Function to verify baselines
verify_baselines() {
    log "${BLUE}🔍 Verifying baseline integrity...${NC}"
    
    NODE_ENV=production DATABASE_URL="$DATABASE_URL" node -e "
    const { sequelize } = require('./backend/src/database/connection');
    (async () => {
        try {
            const result = await sequelize.query(\`
                SELECT 
                    COUNT(*) as total_baselines,
                    COUNT(DISTINCT file_path) as unique_files,
                    SUM(file_size) as total_size_bytes
                FROM file_baselines 
                WHERE store_id = :storeId AND version = :version
            \`, {
                replacements: { storeId: '$STORE_ID', version: '$VERSION' },
                type: sequelize.QueryTypes.SELECT
            });
            
            const stats = result[0];
            console.log('✅ Verification complete:');
            console.log('   Total baselines:', stats.total_baselines);
            console.log('   Unique files:', stats.unique_files);
            console.log('   Total size:', Math.round(stats.total_size_bytes / 1024), 'KB');
            
            if (parseInt(stats.total_baselines) === 0) {
                console.error('❌ No baselines found after update');
                process.exit(1);
            }
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            process.exit(1);
        } finally {
            await sequelize.close();
        }
    })();
    " || {
        log "${RED}❌ Baseline verification failed${NC}"
        exit 1
    }
}

# Function to send notification (optional)
send_notification() {
    log "${BLUE}📢 Baseline update completed${NC}"
    
    # Could integrate with Slack, Discord, email, etc.
    # For now, just log the completion
    log "${GREEN}🎉 Git deploy hook completed successfully${NC}"
    log "   Commit: ${GIT_SHORT_COMMIT}"
    log "   Store: ${STORE_ID}"
    log "   Version: ${VERSION}"
}

# Main execution
main() {
    log "${BLUE}🚀 Starting git deploy hook...${NC}"
    
    # Step 1: Check git repository
    check_git_repo
    get_git_info
    
    # Step 2: Check if source files changed (skip if force update)
    if ! check_source_changes; then
        log "${GREEN}✅ No baseline update needed${NC}"
        exit 0
    fi
    
    # Step 3: Backup current baselines
    backup_baselines
    
    # Step 4: Update baselines
    update_baselines
    
    # Step 5: Verify baselines
    verify_baselines
    
    # Step 6: Send notification
    send_notification
    
    log "${GREEN}✅ Git deploy hook completed successfully${NC}"
}

# Error handling
trap 'log "${RED}❌ Deploy hook failed at line $LINENO${NC}"; exit 1' ERR

# Run main function
main "$@"