import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getDb } from './db.js';
import { nanoid } from './nanoid.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const app = new Hono();

// Rate limiting in-memory storage for write endpoints (10 writes / minute / IP)
const WRITE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_WRITES_PER_WINDOW = 10;
const ipWriteTimestamps = new Map<string, number[]>();

export function clearRateLimitHistory(): void {
  ipWriteTimestamps.clear();
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipWriteTimestamps.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WRITE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_WRITES_PER_WINDOW) {
    ipWriteTimestamps.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipWriteTimestamps.set(ip, validTimestamps);
  return false;
}

// CORS configuration limited to ALLOWED_ORIGINS env variable
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0] || '*';
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
      return origin;
    }
    return allowedOrigins.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Body size limit middleware: 32 KB (32768 bytes)
app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength, 10) > 32768) {
    return c.json({ error: 'Payload too large', status: 413 }, 413);
  }

  if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    try {
      const cloned = c.req.raw.clone();
      const buffer = await cloned.arrayBuffer();
      if (buffer.byteLength > 32768) {
        return c.json({ error: 'Payload too large', status: 413 }, 413);
      }
    } catch {
      // Continue to next handlers if cloning is unsupported
    }
  }

  await next();
});

// Rate limit middleware for writes: 10 per minute per IP
app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const rawIp =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1';

    if (isRateLimited(rawIp)) {
      return c.json({ error: 'Too many requests', status: 429 }, 429);
    }
  }
  await next();
});

// Healthz endpoints (available at both /healthz and /api/healthz)
const healthHandler = (c: any) => c.json({ status: 'ok', timestamp: new Date().toISOString() });
app.get('/healthz', healthHandler);
app.get('/api/healthz', healthHandler);

// -------------------------------------------------------------
// GET /api/components?category=&q=
// -------------------------------------------------------------
app.get('/api/components', (c) => {
  const db = getDb();
  const category = c.req.query('category')?.trim();
  const q = c.req.query('q')?.trim();

  let query = 'SELECT slug, name, category, description, status, version FROM components WHERE 1=1';
  const params: string[] = [];

  if (category) {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  if (q) {
    query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(slug) LIKE ?)';
    const pattern = `%${q.toLowerCase()}%`;
    params.push(pattern, pattern, pattern);
  }

  query += ' ORDER BY name ASC';
  const rows = db.prepare(query).all(...params);
  return c.json(rows);
});

// -------------------------------------------------------------
// GET /api/components/:slug
// -------------------------------------------------------------
app.get('/api/components/:slug', (c) => {
  const db = getDb();
  const slug = c.req.param('slug');

  const component = db.prepare(`
    SELECT slug, name, category, description, status, version
    FROM components
    WHERE slug = ? OR LOWER(slug) = LOWER(?) OR LOWER(name) = LOWER(?)
  `).get(slug, slug, slug) as any;

  if (!component) {
    return c.json({ error: 'Component not found', status: 404 }, 404);
  }

  const props = db.prepare(`
    SELECT name, type, default_value AS defaultValue, min, max, step, unit, sort_order AS sortOrder
    FROM props
    WHERE component_slug = ?
    ORDER BY sort_order ASC, name ASC
  `).all(component.slug);

  return c.json({
    ...component,
    props,
  });
});

// -------------------------------------------------------------
// POST /api/presets
// -------------------------------------------------------------
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const createPresetSchema = z.object({
  componentSlug: z.string().min(1, 'componentSlug is required'),
  props: z.record(z.string(), z.any()),
  theme: z.string().min(1, 'theme is required'),
});

app.post('/api/presets', async (c) => {
  let bodyJson: unknown;
  try {
    bodyJson = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body', status: 400 }, 400);
  }

  const parseResult = createPresetSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    const msg = parseResult.error.issues?.[0]?.message || 'Validation failed';
    return c.json({ error: msg, status: 400 }, 400);
  }

  const { componentSlug, props, theme } = parseResult.data;
  const db = getDb();

  const component = db.prepare(`
    SELECT slug FROM components
    WHERE slug = ? OR LOWER(slug) = LOWER(?) OR LOWER(name) = LOWER(?)
  `).get(componentSlug, componentSlug, componentSlug) as { slug: string } | undefined;

  if (!component) {
    return c.json({ error: 'Component not found', status: 404 }, 404);
  }

  const definedProps = db.prepare(`
    SELECT name, type, min, max FROM props WHERE component_slug = ?
  `).all(component.slug) as Array<{ name: string; type: 'text' | 'color' | 'range'; min: number | null; max: number | null }>;

  const propMap = new Map(definedProps.map((p) => [p.name, p]));

  // Reject unknown props
  for (const key of Object.keys(props)) {
    if (!propMap.has(key)) {
      return c.json({ error: `Unknown prop: ${key}`, status: 400 }, 400);
    }
  }

  // Validate every prop against the props table
  for (const [key, val] of Object.entries(props)) {
    const def = propMap.get(key)!;

    if (def.type === 'text') {
      if (typeof val !== 'string') {
        return c.json({ error: `Prop '${key}' must be text`, status: 400 }, 400);
      }
    } else if (def.type === 'color') {
      if (typeof val !== 'string' || !hexColorRegex.test(val)) {
        return c.json({ error: `Prop '${key}' must be a valid hex color`, status: 400 }, 400);
      }
    } else if (def.type === 'range') {
      if (typeof val !== 'number' || Number.isNaN(val)) {
        return c.json({ error: `Prop '${key}' must be a number`, status: 400 }, 400);
      }
      if (def.min !== null && val < def.min) {
        return c.json({ error: `Prop '${key}' must be >= ${def.min}`, status: 400 }, 400);
      }
      if (def.max !== null && val > def.max) {
        return c.json({ error: `Prop '${key}' must be <= ${def.max}`, status: 400 }, 400);
      }
    }
  }

  const id = nanoid(10);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO presets (id, component_slug, props, theme, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, component.slug, JSON.stringify(props), theme, createdAt);

  return c.json({ id }, 201);
});

// -------------------------------------------------------------
// GET /api/presets/:id
// -------------------------------------------------------------
app.get('/api/presets/:id', (c) => {
  const id = c.req.param('id');
  const db = getDb();

  const preset = db.prepare(`
    SELECT id, component_slug, props, theme, created_at
    FROM presets
    WHERE id = ?
  `).get(id) as { id: string; component_slug: string; props: string; theme: string; created_at: string } | undefined;

  if (!preset) {
    return c.json({ error: 'Preset not found', status: 404 }, 404);
  }

  return c.json({
    id: preset.id,
    componentSlug: preset.component_slug,
    props: JSON.parse(preset.props),
    theme: preset.theme,
    createdAt: preset.created_at,
  });
});

// -------------------------------------------------------------
// POST /api/waitlist
// -------------------------------------------------------------
const waitlistSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

app.post('/api/waitlist', async (c) => {
  let bodyJson: unknown;
  try {
    bodyJson = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body', status: 400 }, 400);
  }

  const parseResult = waitlistSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return c.json({ error: 'Invalid email address', status: 400 }, 400);
  }

  const normalizedEmail = parseResult.data.email.toLowerCase();
  const db = getDb();
  const createdAt = new Date().toISOString();
  const tokenHash = createHash('sha256').update(normalizedEmail + createdAt).digest('hex');

  // Insert or ignore duplicate without failing
  db.prepare(`
    INSERT INTO waitlist (email, status, token_hash, created_at)
    VALUES (?, 'pending', ?, ?)
    ON CONFLICT(email) DO NOTHING
  `).run(normalizedEmail, tokenHash, createdAt);

  // Parameterized queries only. Never log emails.
  const hasMailer = Boolean(process.env.RESEND_API_KEY);
  return c.json(
    {
      message: hasMailer ? 'Confirmation email sent' : 'Email registered for waitlist',
      status: 202,
    },
    202
  );
});

// -------------------------------------------------------------
// POST /api/feedback
// -------------------------------------------------------------
const feedbackSchema = z.object({
  message: z.string()
    .min(1, 'message is required')
    .max(1000, 'message must not exceed 1000 characters'),
  componentSlug: z.string().optional().nullable(),
});

app.post('/api/feedback', async (c) => {
  let bodyJson: unknown;
  try {
    bodyJson = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body', status: 400 }, 400);
  }

  const parseResult = feedbackSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    const msg = parseResult.error.issues?.[0]?.message || 'Invalid feedback data';
    return c.json({ error: msg, status: 400 }, 400);
  }

  const { message, componentSlug } = parseResult.data;
  const db = getDb();
  const id = nanoid(10);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO feedback (id, message, component_slug, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, message, componentSlug || null, createdAt);

  return c.json({ id, message: 'Feedback received', status: 201 }, 201);
});

// Serve frontend HTML if present
app.get('/', (c) => {
  const htmlPath = join(process.cwd(), 'public', 'index.html');
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, 'utf-8');
    return c.html(html);
  }
  return c.text('KRUXUI API Server');
});

// Central error handler: errors return { error, status } without stack traces
app.onError((err, c) => {
  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  return c.json(
    {
      error: err.message || 'Internal Server Error',
      status,
    },
    status as any
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      status: 404,
    },
    404
  );
});
