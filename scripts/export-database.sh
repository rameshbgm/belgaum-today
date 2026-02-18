#!/bin/bash

# =============================================================================
# Belgaum Today - Database Export Script
# =============================================================================
# This script exports the MySQL database for production deployment
# Usage: ./scripts/export-database.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/database/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Load environment variables from .env.local if it exists
if [ -f "${PROJECT_ROOT}/.env.local" ]; then
    export $(cat "${PROJECT_ROOT}/.env.local" | grep -v '^#' | xargs)
fi

# Database credentials (with defaults)
DB_HOST="${DATABASE_HOST:-127.0.0.1}"
DB_PORT="${DATABASE_PORT:-3307}"
DB_USER="${DATABASE_USER:-root}"
DB_PASSWORD="${DATABASE_PASSWORD:-root}"
DB_NAME="${DATABASE_NAME:-belgaum_today}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Belgaum Today - Database Export Script             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}📊 Database Configuration:${NC}"
echo "   Host: ${DB_HOST}"
echo "   Port: ${DB_PORT}"
echo "   User: ${DB_USER}"
echo "   Database: ${DB_NAME}"
echo ""

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}❌ Error: mysqldump command not found${NC}"
    echo "   Please install MySQL client tools"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME};" 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "   Please check your credentials and ensure the database is running"
    exit 1
fi

# Export options
echo ""
echo -e "${YELLOW}📁 Select export type:${NC}"
echo "   1) Full backup (structure + data) - Recommended"
echo "   2) Structure only (no data)"
echo "   3) Data only (no structure)"
echo "   4) Custom tables selection"
echo ""
read -p "Enter your choice (1-4): " EXPORT_TYPE

case $EXPORT_TYPE in
    1)
        EXPORT_NAME="full_backup_${TIMESTAMP}.sql"
        echo ""
        echo -e "${BLUE}🔄 Exporting full database...${NC}"
        mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            --set-gtid-purged=OFF \
            --column-statistics=0 \
            "${DB_NAME}" > "${BACKUP_DIR}/${EXPORT_NAME}" 2>/dev/null
        ;;
    2)
        EXPORT_NAME="structure_only_${TIMESTAMP}.sql"
        echo ""
        echo -e "${BLUE}🔄 Exporting database structure...${NC}"
        mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
            --no-data \
            --routines \
            --triggers \
            --set-gtid-purged=OFF \
            --column-statistics=0 \
            "${DB_NAME}" > "${BACKUP_DIR}/${EXPORT_NAME}" 2>/dev/null
        ;;
    3)
        EXPORT_NAME="data_only_${TIMESTAMP}.sql"
        echo ""
        echo -e "${BLUE}🔄 Exporting database data...${NC}"
        mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
            --no-create-info \
            --skip-triggers \
            --set-gtid-purged=OFF \
            --column-statistics=0 \
            "${DB_NAME}" > "${BACKUP_DIR}/${EXPORT_NAME}" 2>/dev/null
        ;;
    4)
        echo ""
        echo -e "${YELLOW}📋 Available tables:${NC}"
        mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
            -e "SHOW TABLES FROM ${DB_NAME};" 2>/dev/null | tail -n +2
        echo ""
        read -p "Enter table names (space-separated): " TABLES
        
        EXPORT_NAME="custom_tables_${TIMESTAMP}.sql"
        echo ""
        echo -e "${BLUE}🔄 Exporting selected tables...${NC}"
        mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
            --single-transaction \
            --set-gtid-purged=OFF \
            --column-statistics=0 \
            "${DB_NAME}" ${TABLES} > "${BACKUP_DIR}/${EXPORT_NAME}" 2>/dev/null
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Check if export was successful
if [ $? -eq 0 ] && [ -f "${BACKUP_DIR}/${EXPORT_NAME}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_DIR}/${EXPORT_NAME}" | cut -f1)
    echo -e "${GREEN}✅ Export successful!${NC}"
    echo ""
    echo -e "${YELLOW}📦 Export Details:${NC}"
    echo "   File: ${EXPORT_NAME}"
    echo "   Size: ${FILE_SIZE}"
    echo "   Location: ${BACKUP_DIR}/${EXPORT_NAME}"
    echo ""
    
    # Get table statistics
    echo -e "${YELLOW}📊 Database Statistics:${NC}"
    mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" <<EOF 2>/dev/null
SELECT 
    'Articles' as Table_Name, COUNT(*) as Row_Count FROM articles
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'RSS Feeds', COUNT(*) FROM rss_feed_config
UNION ALL
SELECT 'RSS Logs', COUNT(*) FROM rss_fetch_logs
UNION ALL
SELECT 'RSS Runs', COUNT(*) FROM rss_fetch_runs
UNION ALL
SELECT 'Article Views', COUNT(*) FROM article_views;
EOF
    
    echo ""
    echo -e "${GREEN}✅ Ready for production deployment!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "   1. Review the exported file: ${EXPORT_NAME}"
    echo "   2. Transfer file to production server via SFTP/SCP"
    echo "   3. Import on Hostinger via phpMyAdmin or SSH"
    echo "   4. Verify data integrity after import"
    echo ""
    echo -e "${BLUE}Import command for production:${NC}"
    echo "   mysql -h localhost -u your_user -p your_database < ${EXPORT_NAME}"
    echo ""
    
else
    echo -e "${RED}❌ Export failed!${NC}"
    echo "   Please check error messages above"
    exit 1
fi

# Compress backup (optional)
echo -e "${YELLOW}💾 Compress backup file? (y/n):${NC}"
read -p "" COMPRESS

if [ "$COMPRESS" = "y" ] || [ "$COMPRESS" = "Y" ]; then
    echo -e "${BLUE}🔄 Compressing backup...${NC}"
    gzip -9 "${BACKUP_DIR}/${EXPORT_NAME}"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${EXPORT_NAME}.gz" | cut -f1)
        echo -e "${GREEN}✅ Compression successful!${NC}"
        echo "   Compressed file: ${EXPORT_NAME}.gz"
        echo "   Compressed size: ${COMPRESSED_SIZE}"
        echo ""
        echo -e "${YELLOW}📋 To decompress on server:${NC}"
        echo "   gunzip ${EXPORT_NAME}.gz"
    else
        echo -e "${RED}❌ Compression failed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                Export Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
