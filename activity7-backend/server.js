require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const recordsRouter = require('./routes/records');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Permit tools such as Postman/curl (which send no Origin header).
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the CORS policy.'));
  }
}));

app.use(express.json({ limit: '20kb' }));

app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrekDesk API Guide</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;line-height:1.6;color:#202938;background:#f5f7fa}
    header,section{background:#fff;padding:22px;margin:16px 0;border:1px solid #e2e8f0;border-radius:10px}
    h1,h2{color:#12345a}code,pre{background:#eef2f7;padding:3px 6px;border-radius:4px}
    pre{padding:14px;overflow:auto}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:9px;border-bottom:1px solid #e2e8f0}
    .badge{display:inline-block;padding:4px 9px;background:#e2f5e9;border-radius:20px;color:#176534}
  </style>
</head>
<body>
<header>
  <h1>TrekDesk — IT Support Management System</h1>
  <p><strong>ICT251 | BSc Computer Science | Mulungushi University</strong></p>
  <p><strong>Student:</strong> MULILIMA TRESFORD</p>
  <p><strong>Student Number:</strong> 202505153</p>
  <p><span class="badge">REST API guide</span></p>
  <p><strong>API Base URL:</strong> <code>${baseUrl}</code></p>
  <p><strong>Health check:</strong> <a href="/health">${baseUrl}/health</a></p>
  <p><strong>All records:</strong> <a href="/api/records">${baseUrl}/api/records</a></p>
</header>
<section>
  <h2>Available endpoints</h2>
  <table>
    <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
    <tr><td>GET</td><td>/</td><td>API documentation</td></tr>
    <tr><td>GET</td><td>/health</td><td>API and database health</td></tr>
    <tr><td>GET</td><td>/api/records</td><td>List all records</td></tr>
    <tr><td>GET</td><td>/api/records/:id</td><td>Get one record</td></tr>
    <tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
    <tr><td>PUT</td><td>/api/records/:id</td><td>Update a record</td></tr>
    <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
  </table>
</section>
<section>
  <h2>Record input fields</h2>
  <ul>
    <li><code>title</code>: string, 3–80 characters</li>
    <li><code>category</code>: string, 2–40 characters</li>
    <li><code>description</code>: string, 5–300 characters</li>
    <li><code>status</code>: exactly <code>Pending</code>, <code>In progress</code>, or <code>Completed</code></li>
  </ul>
  <p>The database generates <code>id</code>. Do not supply it when creating or updating records.</p>
  <h3>Example POST or PUT JSON body</h3>
  <pre>{
  "title": "Cannot connect to Wi-Fi",
  "category": "Network",
  "description": "The workstation cannot connect to the campus wireless network.",
  "status": "Pending"
}</pre>
</section>
<section>
  <h2>HTTP status codes</h2>
  <ul>
    <li><code>200</code> — request successful</li>
    <li><code>201</code> — record created</li>
    <li><code>400</code> — invalid input or malformed JSON</li>
    <li><code>404</code> — record or route not found</li>
    <li><code>500</code> — unexpected server error</li>
    <li><code>503</code> — database unavailable during health check</li>
  </ul>
</section>
<section>
  <h2>Deployment note</h2>
  <p>On free hosting plans, the service may sleep after inactivity. The first request after an idle period can take longer while the service starts.</p>
</section>
</body>
</html>`);
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/records', recordsRouter);

// Unknown paths return the required JSON 404 response.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Malformed JSON and unexpected errors.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Malformed JSON request body.' });
  }
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({ message: 'Origin not allowed.' });
  }
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`TrekDesk API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not start TrekDesk API:', error.message);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});