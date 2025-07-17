# Render.com Environment Variables Setup

Set these environment variables in your Render.com service dashboard:

## Required Database Variables

```
DATABASE_URL=postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
```

Or if you prefer to use SUPABASE_DB_URL:

```
SUPABASE_DB_URL=postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
```

## Additional Supabase Variables (if using Supabase features)

You'll need to get these from your Supabase project dashboard:

```
SUPABASE_URL=https://jqqfjfoigtwdpnlicjmh.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Other Required Variables

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
```

## How to Set in Render.com

1. Go to your Render.com dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add each environment variable
5. Click "Save Changes"
6. The service will automatically redeploy

## Testing the Connection

After setting the environment variables, you can test the connection by:

1. SSH into your Render service (if available)
2. Run: `node test-render-db.js`

Or check the logs after deployment to see if the database connection is successful.