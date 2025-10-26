# Render.com Log Analysis Checklist

## Deployment Events Tab
- [ ] Latest deployment shows commit: `44ceab90`
- [ ] Deployment status: Success/Failed/In Progress
- [ ] Build duration (note if unusually long)

## Error Patterns to Search in Logs

### Critical Errors (Search for these keywords):
- [ ] `FATAL`
- [ ] `CRITICAL`
- [ ] `ERROR`
- [ ] `Failed to`
- [ ] `Cannot`
- [ ] `Unable to`

### Storage & Supabase Related:
- [ ] `storage` (especially timeout or connection errors)
- [ ] `supabase`
- [ ] `timeout`
- [ ] `ECONNREFUSED`
- [ ] `ETIMEDOUT`
- [ ] `NetworkError`
- [ ] `bucket`
- [ ] `upload`
- [ ] `download`

### API & Endpoint Issues:
- [ ] `404` (Not Found)
- [ ] `500` (Server Error)
- [ ] `502` (Bad Gateway)
- [ ] `503` (Service Unavailable)
- [ ] `/api/` (API endpoint errors)
- [ ] `CORS`

### Database & Connection:
- [ ] `database`
- [ ] `connection`
- [ ] `pool`
- [ ] `PostgreSQL`
- [ ] `query failed`

### Memory & Resources:
- [ ] `out of memory`
- [ ] `heap`
- [ ] `OOM`
- [ ] `memory limit`
- [ ] `CPU`

### Environment & Configuration:
- [ ] `env`
- [ ] `undefined`
- [ ] `missing`
- [ ] `configuration`
- [ ] `PORT`

## Specific MediaBrowser Fix Validation
Look for these new log entries from the timeout protection fix:
- [ ] `MediaBrowser: Checking storage with timeout protection`
- [ ] `MediaBrowser: Storage check timed out`
- [ ] `MediaBrowser: Storage check completed`
- [ ] `MediaBrowser: Failed to check storage`

## Service Health Indicators
- [ ] Service is marked as "Live" in Render
- [ ] Recent health check responses (should be 200 OK)
- [ ] Request response times (note if slow)
- [ ] Number of restarts in last hour

## Time Windows to Check:
1. Last 15 minutes (immediate issues)
2. Last hour (recent patterns)
3. Since last deployment (post-deployment issues)

## How to Export Logs:
If you need to share logs for analysis:
1. Click "Download Logs" button in Render
2. Or copy relevant error sections
3. Focus on timestamps around deployment and errors