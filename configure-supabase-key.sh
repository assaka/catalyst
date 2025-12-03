#!/bin/bash

# Configuration
API_URL="https://backend.dainostore.com"
STORE_ID="157d4590-49bf-4b0b-bd77-abe131909528"

# You need to provide these:
echo "Enter your JWT token (from login):"
read -s JWT_TOKEN

echo "Enter your Supabase anon key (from Supabase Dashboard > Settings > API):"
read -s ANON_KEY

# Make the API call to save the key
curl -X POST "$API_URL/api/supabase/update-config" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-store-id: $STORE_ID" \
  -d "{
    \"anonKey\": \"$ANON_KEY\"
  }"

echo ""
echo "✅ Anon key configured! You can now upload images to Supabase."