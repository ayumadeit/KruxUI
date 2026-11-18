import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initDatabase, getDb } from './db.js';
import { seed } from './seed.js';

// Boot database & create tables
initDatabase();

// If components table is empty on first boot, auto-seed
const db = getDb();
const row = db.prepare('SELECT COUNT(*) AS count FROM components').get() as { count: number };
if (row.count === 0) {
  seed(db);
}

const port = Number(process.env.PORT) || 3000;

console.log(`KRUXUI API server started at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});
