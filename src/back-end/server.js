import express from 'express';
import { WebSocketServer } from 'ws';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createServer } from 'http';
import cors from 'cors';

// Express server setup - moved to the top
const app = express();

// CORS middleware - now app is defined before we use it
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Initialize SQLite database
const initDb = async () => {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS displays (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

  return db;
};

const setupWebSocketServer = (server, db) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let displayId = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'register-display':
            try {
              displayId = data.id;
              await db.run(
                `INSERT OR REPLACE INTO displays (id, name) VALUES (?, ?)`,
                [displayId, data.name]
              );

              ws.send(JSON.stringify({
                type: 'registration-complete',
                display: {
                  id: displayId,
                  name: data.name
                }
              }));

              // Broadcast updated display list
              broadcastDisplayList(wss, db);
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'registration-error',
                message: 'Registration failed'
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Message processing error:', error);
      }
    });
  });

  return wss;
};

const broadcastDisplayList = async (wss, db) => {
  const displays = await db.all(`SELECT * FROM displays`);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'display-list',
        displays
      }));
    }
  });
};

const server = createServer(app);

// Initialize database and WebSocket server
let db;
(async () => {
  db = await initDb();
  const wss = setupWebSocketServer(server, db);
})();

// REST endpoints
app.get('/api/displays', async (req, res) => {
  const displays = await db.all(`SELECT * FROM displays`);
  res.json(displays);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;