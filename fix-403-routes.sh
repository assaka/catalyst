#!/bin/bash

# Script to fix 403 errors by adding authorize middleware to admin routes

# Colors for output
GREEN='\033[0[32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting comprehensive 403 fix...${NC}"

# Navigate to backend routes directory
cd "C:/Users/info/PhpstormProjects/catalyst/backend/src/routes" || exit 1

# Function to add authorize import and middleware to a file
fix_file() {
    local file=$1
    local routes=$2  # Space-separated list: "POST PUT DELETE"

    echo -e "${BLUE}Fixing $file...${NC}"

    # Check if file already has authorize import
    if ! grep -q "const { authorize } = require('../middleware/auth');" "$file"; then
        # Add authorize import after authMiddleware import
        sed -i "/const { authMiddleware } = require('..\/middleware\/authMiddleware');/a const { authorize } = require('../middleware/auth');" "$file"
        echo -e "${GREEN}  ✓ Added authorize import${NC}"
    fi

    # Add authorize middleware to specified routes
    for method in $routes; do
        case $method in
            POST)
                sed -i "s/router\.post('\/'[, ]*authMiddleware[, ]*/router.post('\/', authMiddleware, authorize(['admin', 'store_owner']), /g" "$file"
                echo -e "${GREEN}  ✓ Added authorize to POST routes${NC}"
                ;;
            PUT)
                sed -i "s/router\.put('\/\:id'[, ]*authMiddleware[, ]*/router.put('\/:id', authMiddleware, authorize(['admin', 'store_owner']), /g" "$file"
                echo -e "${GREEN}  ✓ Added authorize to PUT routes${NC}"
                ;;
            DELETE)
                sed -i "s/router\.delete('\/\:id'[, ]*authMiddleware[, ]*/router.delete('\/:id', authMiddleware, authorize(['admin', 'store_owner']), /g" "$file"
                echo -e "${GREEN}  ✓ Added authorize to DELETE routes${NC}"
                ;;
            GET)
                sed -i "s/router\.get('\/'[, ]*authMiddleware[, ]*/router.get('\/', authMiddleware, authorize(['admin', 'store_owner']), /g" "$file"
                echo -e "${GREEN}  ✓ Added authorize to GET routes${NC}"
                ;;
        esac
    done
}

# Fix attribute-sets.js
fix_file "attribute-sets.js" "POST PUT DELETE"

# Fix canonical-urls.js
fix_file "canonical-urls.js" "GET POST PUT DELETE"

# Fix consent-logs.js
fix_file "consent-logs.js" "GET"

# Fix cookie-consent-settings.js
fix_file "cookie-consent-settings.js" "GET POST PUT DELETE"

# Fix custom-option-rules.js
fix_file "custom-option-rules.js" "POST PUT DELETE"

# Fix delivery.js
fix_file "delivery.js" "GET POST PUT DELETE"

# Fix payment-methods.js
fix_file "payment-methods.js" "GET POST PUT DELETE"

# Fix product-labels.js
fix_file "product-labels.js" "GET POST PUT DELETE"

# Fix product-tabs.js
fix_file "product-tabs.js" "GET POST PUT DELETE"

# Fix redirects.js
fix_file "redirects.js" "GET POST PUT DELETE"

# Fix seo-settings.js
fix_file "seo-settings.js" "POST PUT DELETE"

echo -e "${GREEN}✓ All files fixed!${NC}"
