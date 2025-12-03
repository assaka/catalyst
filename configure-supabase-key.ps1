# PowerShell script to configure Supabase anon key

$API_URL = "https://backend.dainostore.com"
$STORE_ID = "157d4590-49bf-4b0b-bd77-abe131909528"

# Get JWT token
$JWT_TOKEN = Read-Host "Enter your JWT token (from login)" -AsSecureString
$JWT_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($JWT_TOKEN))

# Get anon key
$ANON_KEY = Read-Host "Enter your Supabase anon key" -AsSecureString
$ANON_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ANON_KEY))

# Create the JSON body
$body = @{
    anonKey = $ANON_KEY
} | ConvertTo-Json

# Make the API call
$headers = @{
    "Authorization" = "Bearer $JWT_TOKEN"
    "Content-Type" = "application/json"
    "x-store-id" = $STORE_ID
}

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/supabase/update-config" `
                                 -Method POST `
                                 -Headers $headers `
                                 -Body $body
    
    Write-Host "✅ Success! Anon key configured for Supabase storage." -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Error configuring key:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}