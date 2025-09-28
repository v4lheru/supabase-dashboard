#!/usr/bin/env node

/**
 * Railway Cron Service for Dashboard Cache Refresh
 * Runs every 10 minutes to keep dashboard data fresh
 */

const https = require('https');
const http = require('http');

const REFRESH_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/background-refresh?secret=${process.env.BACKGROUND_REFRESH_SECRET}`
  : `http://localhost:3000/api/background-refresh?secret=${process.env.BACKGROUND_REFRESH_SECRET || 'dashboard-refresh-2024'}`;

console.log('🔄 Starting Railway cron refresh...');
console.log('📍 Target URL:', REFRESH_URL.replace(/secret=[^&]+/, 'secret=***'));

const client = REFRESH_URL.startsWith('https') ? https : http;

const request = client.get(REFRESH_URL, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Cache refresh successful:', result.message);
        console.log('🕐 Timestamp:', result.timestamp);
        process.exit(0);
      } else {
        console.error('❌ Cache refresh failed:', result.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('💥 Failed to parse response:', error.message);
      console.error('📄 Raw response:', data);
      process.exit(1);
    }
  });
});

request.on('error', (error) => {
  console.error('💥 Request failed:', error.message);
  process.exit(1);
});

request.setTimeout(30000, () => {
  console.error('⏰ Request timeout after 30 seconds');
  request.destroy();
  process.exit(1);
});
