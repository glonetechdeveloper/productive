/**
 * Local Development Server for LUMEN Productivity OS
 * Runs both the frontend static files and the serverless /api routes locally
 * without requiring the Vercel CLI.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env or .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            process.env[key.trim()] = vals.join('=').trim();
          }
        }
      });
      console.log(`Loaded environment variables from ${file}`);
      break;
    }
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;

// Import serverless route handlers
const registerHandler = require('./api/auth/register');
const loginHandler = require('./api/auth/login');
const syncHandler = require('./api/goals/sync');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Helper response wrapper matching Vercel Serverless Function response interface
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse JSON body for POST / PUT
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch (err) {
      console.error('Error parsing JSON request body:', err);
    }
  }
  req.body = body;

  // API Routes
  try {
    if (pathname === '/api/auth/register') {
      return await registerHandler(req, res);
    }
    if (pathname === '/api/auth/login') {
      return await loginHandler(req, res);
    }
    if (pathname === '/api/goals/sync') {
      return await syncHandler(req, res);
    }
  } catch (err) {
    console.error(`API Error on ${pathname}:`, err);
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(__dirname, 'index.html');
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'text/html';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`⚡ LUMEN Productivity OS is running locally!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database:  ${process.env.DATABASE_URL ? 'Configured' : 'Missing DATABASE_URL (Running in offline demo)'}`);
  console.log(`==================================================\n`);
});
