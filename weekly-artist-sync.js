// Weekly artist metadata sync
// IMPORTANT: Make sure dev server is running first (npm run dev)
// Then run: node weekly-artist-sync.js

const API_URL = 'http://localhost:3000/api/sync-artists';

async function syncArtists() {
  try {
    console.log(`[${new Date().toLocaleString()}] Starting weekly artist sync...`);
    console.log('Checking if dev server is running...\n');
    
    const res = await fetch(API_URL, { method: 'POST' });
    
    if (!res.ok && res.status === 0) {
      console.error('❌ Dev server not running!');
      console.log('\nPlease start the dev server first:');
      console.log('  npm run dev');
      console.log('\nThen run this script again.');
      return;
    }
    
    const data = await res.json();
    
    if (res.ok) {
      console.log('\n✅ Sync complete!');
      console.log(`   New: ${data.synced} (${data.fromSnapshot} snapshot + ${data.searched} searched)`);
      console.log(`   Updated: ${data.updated} (stale data refreshed)`);
      console.log(`   Skipped: ${data.skipped} (already fresh)`);
      console.log(`   Total artists: ${data.totalArtists}`);
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      console.error('❌ Cannot connect to dev server!');
      console.log('\nPlease start the dev server first:');
      console.log('  npm run dev');
      console.log('\nThen run this script again.');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

syncArtists();
