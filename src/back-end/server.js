import express from 'express';
import { WebSocketServer } from 'ws';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express server setup
const app = express();

// CORS middleware with more flexible configuration
app.use(cors({
  origin: ['https://reactdesignapp.onrender.com', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Initialize SQLite database
const initDb = async () => {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/database.sqlite' 
    : './database.sqlite';
    
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS displays (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TRIGGER IF NOT EXISTS update_display_timestamp 
    AFTER UPDATE ON displays
    BEGIN
      UPDATE displays SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
  
  return db;
};

const setupWebSocketServer = (server, db) => {
  const wss = new WebSocketServer({ server });
  const clients = new Map();

  wss.on('connection', (ws) => {
    console.log('New client connected');
    let displayId = null;

    const heartbeat = setInterval(() => {
      if (ws.isAlive === false) {
        clearInterval(heartbeat);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data);

        switch (data.type) {
          case 'register-display':
            try {
              displayId = data.id;
              await db.run(
                `INSERT OR REPLACE INTO displays (id, name) VALUES (?, ?)`,
                [displayId, data.name]
              );
              
              clients.set(displayId, ws);
              
              ws.send(JSON.stringify({
                type: 'registration-complete',
                display: {
                  id: displayId,
                  name: data.name
                }
              }));
              
              await broadcastDisplayList(wss, db);
            } catch (error) {
              console.error('Registration error:', error);
              ws.send(JSON.stringify({
                type: 'registration-error',
                message: 'Registration failed: ' + error.message
              }));
            }
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Message processing error:', error);
      }
    });

    ws.on('close', async () => {
      console.log('Client disconnected:', displayId);
      clearInterval(heartbeat);
      if (displayId) {
        clients.delete(displayId);
        await broadcastDisplayList(wss, db);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
};

const broadcastDisplayList = async (wss, db) => {
  try {
    const displays = await db.all(`
      SELECT id, name, created_at, updated_at 
      FROM displays 
      ORDER BY created_at DESC
    `);
    
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'display-list',
          displays
        }));
      }
    });
  } catch (error) {
    console.error('Error broadcasting display list:', error);
  }
};

// REST endpoints
app.get('/api/displays', async (req, res) => {
  try {
    const displays = await db.all(`
      SELECT id, name, created_at, updated_at 
      FROM displays 
      ORDER BY created_at DESC
    `);
    res.json(displays);
  } catch (error) {
    console.error('Error fetching displays:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Catch-all route for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize database and WebSocket server
let db;
(async () => {
  try {
    db = await initDb();
    const wss = setupWebSocketServer(server, db);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
})();

export default app;