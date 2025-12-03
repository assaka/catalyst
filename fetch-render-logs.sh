#!/bin/bash

# Fetch Render.com logs for daino-backend service
# Make sure you have the Render CLI installed and authenticated

echo "Fetching Render.com logs for daino-backend..."
echo "Looking for /api/cart errors and 500 status codes..."
echo "================================================"

# Replace 'daino-backend' with your exact service name if different
# Fetch last 1000 lines and filter for cart-related errors
render logs daino-backend --tail 1000 | grep -E "(500|/api/cart|merge|Error|Exception)" > render-cart-errors.log

echo "Logs saved to render-cart-errors.log"
echo ""
echo "Filtering for 500 errors specifically..."
grep -A 10 -B 2 "500" render-cart-errors.log

echo ""
echo "Filtering for cart merge errors..."
grep -A 10 -B 2 -i "merge" render-cart-errors.log