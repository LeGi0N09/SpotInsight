const http = require('http');
const open = require('open');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'your_client_secret';
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';

const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ');

const params = new URLSearchParams({
  client_id: CLIENT_ID,
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  scope: scopes,
});

const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

console.log('\n🎵 Spotify Token Generator with Real-Time Playback Support\n');
console.log('Opening browser for authorization...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:8888`);
  
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: No code received</h1>');
      return;
    }

    try {
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokens = await tokenRes.json();

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: monospace; padding: 40px; background: #000; color: #0f0;">
            <h1>✅ Success!</h1>
            <p>Copy these tokens to your .env.local file:</p>
            <pre style="background: #111; padding: 20px; border: 1px solid #0f0;">
SPOTIFY_ACCESS_TOKEN=${tokens.access_token}
SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}
            </pre>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);

      console.log('\n✅ SUCCESS! Copy these to .env.local:\n');
      console.log(`SPOTIFY_ACCESS_TOKEN=${tokens.access_token}`);
      console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}\n`);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error.message}</h1>`);
    }
  }
});

server.listen(8888, () => {
  console.log('Server running on http://127.0.0.1:8888\n');
  open(authUrl);
});
