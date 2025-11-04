// Quick debug script to test blacklist authentication
// Run with: node debug-blacklist-auth.js

const jwt = require('jsonwebtoken');

// Test 1: Check if JWT_SECRET is set
console.log('1. Checking JWT_SECRET...');
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in environment variables!');
    console.log('   Add JWT_SECRET to your .env file');
} else {
    console.log('✅ JWT_SECRET is set');
}

// Test 2: Try to decode a token
console.log('\n2. Token Validation Test');
console.log('   Paste your token from browser localStorage here:');
console.log('   (Open browser console and run: localStorage.getItem("token"))');
console.log('\n   Then modify this script to test it.\n');

// Example test - replace YOUR_TOKEN with actual token
const testToken = 'YOUR_TOKEN_HERE';

if (testToken !== 'YOUR_TOKEN_HERE') {
    try {
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
        console.log('✅ Token is valid!');
        console.log('   User ID:', decoded.id);
        console.log('   Role:', decoded.role);
        console.log('   Expires:', new Date(decoded.exp * 1000).toLocaleString());
    } catch (error) {
        console.error('❌ Token validation failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            console.log('   Token has expired. Log in again to get a new token.');
        }
    }
}

console.log('\n3. Quick Fix Steps:');
console.log('   a) Check your token: localStorage.getItem("token")');
console.log('   b) If null or expired: Log out and log in again');
console.log('   c) If valid: Restart your backend server');
console.log('   d) Clear browser cache: localStorage.clear()');
