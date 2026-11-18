import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { app, clearRateLimitHistory } from '../src/app.js';
import { initDatabase, getDb } from '../src/db.js';
import { seed } from '../src/seed.js';

describe('KRUXUI API Suite', () => {
  beforeAll(() => {
    // Initialize in-memory test database
    initDatabase(':memory:');
    seed(getDb());
  });

  beforeEach(() => {
    clearRateLimitHistory();
  });

  // 1. Health check
  it('GET /healthz and /api/healthz return 200 with ok status', async () => {
    const res1 = await app.request('/healthz');
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.status).toBe('ok');

    const res2 = await app.request('/api/healthz');
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.status).toBe('ok');
  });

  // 2. List components
  it('GET /api/components returns all 33 seeded components', async () => {
    const res = await app.request('/api/components');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(33);
    expect(data[0]).toHaveProperty('slug');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('category');
    expect(data[0]).toHaveProperty('status', 'beta');
    expect(data[0]).toHaveProperty('version', '0.1.0');
  });

  // 3. Search and filter components
  it('GET /api/components with category filter and search query', async () => {
    const resCat = await app.request('/api/components?category=Atom');
    expect(resCat.status).toBe(200);
    const atoms = await resCat.json();
    expect(atoms.length).toBeGreaterThan(0);
    for (const item of atoms) {
      expect(item.category.toLowerCase()).toBe('atom');
    }

    const resSearch = await app.request('/api/components?q=Aurora');
    expect(resSearch.status).toBe(200);
    const searchResults = await resSearch.json();
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].slug).toBe('aurora');
  });

  // 4. Get one component with its props
  it('GET /api/components/:slug returns single component and its props', async () => {
    const res = await app.request('/api/components/aurora');
    expect(res.status).toBe(200);
    const comp = await res.json();
    expect(comp.slug).toBe('aurora');
    expect(comp.name).toBe('Aurora');
    expect(Array.isArray(comp.props)).toBe(true);
    expect(comp.props.length).toBe(2);

    const colorProp = comp.props.find((p: any) => p.name === 'color');
    expect(colorProp).toBeDefined();
    expect(colorProp.type).toBe('color');

    const speedProp = comp.props.find((p: any) => p.name === 'speed');
    expect(speedProp).toBeDefined();
    expect(speedProp.type).toBe('range');
    expect(speedProp.min).toBe(2);
    expect(speedProp.max).toBe(14);
  });

  // 5. Get non-existent component returns 404
  it('GET /api/components/:slug returns 404 for unknown component', async () => {
    const res = await app.request('/api/components/non-existent-component');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Component not found', status: 404 });
  });

  // 6. Valid preset creation
  it('POST /api/presets creates a preset with valid props and returns 10-char nanoid', async () => {
    const res = await app.request('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentSlug: 'aurora',
        props: {
          color: '#FF4FA3',
          speed: 8
        },
        theme: 'dark'
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBe(10);

    // Retrieve preset
    const getRes = await app.request(`/api/presets/${body.id}`);
    expect(getRes.status).toBe(200);
    const preset = await getRes.json();
    expect(preset.id).toBe(body.id);
    expect(preset.componentSlug).toBe('aurora');
    expect(preset.props).toEqual({ color: '#FF4FA3', speed: 8 });
    expect(preset.theme).toBe('dark');
  });

  // 7. Preset invalid: unknown prop rejected
  it('POST /api/presets rejects unknown props', async () => {
    const res = await app.request('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentSlug: 'aurora',
        props: {
          color: '#FF4FA3',
          speed: 8,
          unknownSetting: 'hacked'
        },
        theme: 'dark'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unknown prop: unknownSetting');
    expect(body.status).toBe(400);
  });

  // 8. Preset invalid: invalid hex color
  it('POST /api/presets rejects invalid hex color', async () => {
    const res = await app.request('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentSlug: 'aurora',
        props: {
          color: 'not-a-color',
          speed: 6
        },
        theme: 'dark'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("must be a valid hex color");
    expect(body.status).toBe(400);
  });

  // 9. Preset invalid: range out of min/max bounds
  it('POST /api/presets rejects range value out of min/max bounds', async () => {
    // Aurora speed: min 2, max 14
    const resTooLow = await app.request('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentSlug: 'aurora',
        props: {
          color: '#FF4FA3',
          speed: 1 // below min 2
        },
        theme: 'dark'
      })
    });
    expect(resTooLow.status).toBe(400);
    const bodyTooLow = await resTooLow.json();
    expect(bodyTooLow.error).toContain('>= 2');

    const resTooHigh = await app.request('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentSlug: 'aurora',
        props: {
          color: '#FF4FA3',
          speed: 25 // above max 14
        },
        theme: 'dark'
      })
    });
    expect(resTooHigh.status).toBe(400);
    const bodyTooHigh = await resTooHigh.json();
    expect(bodyTooHigh.error).toContain('<= 14');
  });

  // 10. Waitlist duplicate handling: always return 202 with same body
  it('POST /api/waitlist validates email and returns 202 identically for duplicates', async () => {
    const email = 'developer@kruxui.dev';

    // First request
    const res1 = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    expect(res1.status).toBe(202);
    const body1 = await res1.json();
    expect(body1.status).toBe(202);
    expect(body1).toHaveProperty('message');

    // Duplicate request
    const res2 = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'DEVELOPER@kruxui.dev' })
    });
    expect(res2.status).toBe(202);
    const body2 = await res2.json();
    expect(body2).toEqual(body1);
  });

  // 11. Waitlist invalid email
  it('POST /api/waitlist rejects invalid email format with 400', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid email address', status: 400 });
  });

  // 12. Feedback validation: max 1000 characters
  it('POST /api/feedback rejects messages longer than 1000 characters', async () => {
    const longMessage = 'A'.repeat(1001);
    const res = await app.request('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: longMessage,
        componentSlug: 'aurora'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('1000 characters');
    expect(body.status).toBe(400);
  });

  // 13. Feedback success
  it('POST /api/feedback accepts valid message under 1000 characters', async () => {
    const res = await app.request('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'The Aurora glow is incredible!',
        componentSlug: 'aurora'
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.status).toBe(201);
  });

  // 14. Rate limiting: 10 writes per minute per IP
  it('Rate limit: blocks writes after 10 requests in a minute per IP with 429', async () => {
    const testIp = '192.168.1.100';

    // 10 writes should succeed
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp
        },
        body: JSON.stringify({ message: `Feedback attempt ${i}` })
      });
      expect(res.status).toBe(201);
    }

    // 11th write from same IP should receive 429
    const blockedRes = await app.request('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ message: '11th attempt' })
    });
    expect(blockedRes.status).toBe(429);
    const body = await blockedRes.json();
    expect(body).toEqual({ error: 'Too many requests', status: 429 });

    // Different IP should still be allowed
    const otherIpRes = await app.request('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.101'
      },
      body: JSON.stringify({ message: 'Other IP attempt' })
    });
    expect(otherIpRes.status).toBe(201);
  });

  // 15. Body size limit: 32 KB
  it('Body size limit: rejects requests larger than 32 KB with 413', async () => {
    // 33 KB payload
    const largeString = 'X'.repeat(33 * 1024);
    const res = await app.request('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'content-length': String(33 * 1024)
      },
      body: JSON.stringify({ message: largeString })
    });

    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toEqual({ error: 'Payload too large', status: 413 });
  });
});
