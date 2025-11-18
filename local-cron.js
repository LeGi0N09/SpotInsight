// Local development cron job simulator
// Run this in a separate terminal: node local-cron.js

const CRON_SECRET = 'spotify_cron_secret_2024';
const API_URL = 'http://127.0.0.1:3000/api/cron';
const INTERVAL = 10 * 60 * 1000; // 10 minutes

async function runCron() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Running auto-sync...`);
    
    const res = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Success:', data);
    } else {
      console.error('✗ Error:', data);
    }
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
}

// Run immediately on start
runCron();

// Then run every 5 minutes
setInterval(runCron, INTERVAL);

console.log('🤖 Local cron job started');
console.log(`⏰ Running every ${INTERVAL / 60000} minutes`);
console.log('📍 Target: ' + API_URL);
console.log('Press Ctrl+C to stop\n');
