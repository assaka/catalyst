# How to Enable Supabase Image Uploads

## Quick Fix Steps:

1. **Get your Supabase API Key:**
   - Go to your Supabase Dashboard
   - Select your project
   - Navigate to Settings → API
   - Copy the "anon" public key (starts with "eyJ...")

2. **Add the key via API:**
   ```bash
   curl -X POST https://catalyst-backend-fzhu.onrender.com/api/supabase/update-config \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -H "x-store-id: YOUR_STORE_ID" \
     -d '{
       "anonKey": "YOUR_ANON_KEY_HERE"
     }'
   ```

3. **Or update directly in the database:**
   - Find your `supabase_oauth_tokens` record
   - Update the `anon_key` field with your key

## Why This Happens:

- Supabase Storage API requires JWT keys (anon/service role keys)
- OAuth tokens can't be used directly with Storage API
- The Supabase Management API doesn't expose these keys via OAuth
- Manual configuration is the only current solution

## After Configuration:

Once the anon key is configured, image uploads will work automatically through the Catalyst admin panel.