# Render.com Log Analysis Checklist for Akeneo Schedules Error

## 1. Database/Migration Issues
Look for these patterns:
```
- "relation does not exist"
- "table 'akeneo_schedules' doesn't exist"
- "column not found"
- "migration failed"
- "database connection failed"
- "ECONNREFUSED" (database connection refused)
```

## 2. Model Registration Issues
Search for:
```
- "Model not found: AkeneoSchedule"
- "Cannot find module"
- "require(...) failed"
- "sequelize.import"
- "Unknown model"
```

## 3. API Route Registration
Check for:
```
- "Cannot POST /api/integrations/akeneo/schedules"
- "Route not found"
- "404" on the schedules endpoint
- "router.post" errors
```

## 4. Startup/Initialization Errors
Look for:
```
- "npm ERR!"
- "node_modules" errors
- "Cannot find module"
- "SyntaxError"
- "TypeError" during startup
```

## 5. Environment Variables
Check for:
```
- "undefined" environment variables
- "DATABASE_URL not set"
- "Missing required config"
- "process.env" errors
```

## 6. Memory/Resource Issues
Search for:
```
- "JavaScript heap out of memory"
- "ENOMEM"
- "Process exited with code 137"
- "OOMKilled"
```

## 7. Specific Endpoint Errors
When you find the 500 error, look for:
```
- Stack trace after "POST /api/integrations/akeneo/schedules"
- "UnhandledPromiseRejection"
- "TypeError" or "ReferenceError" in the handler
- Sequelize validation errors
```

## Log Sections to Copy

Please copy and share:
1. **Last successful deployment logs** (if any)
2. **Current deployment startup logs**
3. **Error logs around the time of the 500 error**
4. **Any database migration output**

## Quick Commands to Run (if you have shell access)

```bash
# Check if table exists
psql $DATABASE_URL -c "\dt akeneo_schedules"

# Check recent errors
tail -n 100 /var/log/app.log | grep -i error

# Check process memory
ps aux | grep node
```