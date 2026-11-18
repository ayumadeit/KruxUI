# KRUXUI Backend

A small, lightweight Node 22 & TypeScript service for the KRUXUI component library website, built using Hono, SQLite (`better-sqlite3`), and Zod.

## Requirements & Stack

- **Runtime:** Node.js 22+
- **Language:** TypeScript
- **Framework:** [Hono](https://hono.dev/) with `@hono/node-server`
- **Database:** SQLite via `better-sqlite3` (`data.db`)
- **Validation:** Zod
- **Testing:** Vitest

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Seeds all 33 components with categories, descriptions, and exact props from the frontend registry (idempotent):
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Production Start
```bash
npm run build
npm start
```
Starts `node dist/server.js`. Automatically initializes tables and seeds the database if empty on boot.

### 5. Run Tests
Runs the 15 Vitest tests:
```bash
npm test
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port for the API server |
| `DB_PATH` | `data.db` | File path for SQLite database (supports `:memory:` for testing) |
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of allowed CORS browser origins |
| `RESEND_API_KEY` | _none_ | If set, waitlist endpoint marks confirmation email as sent |

---

## API Endpoints (Base: `/api`)

All endpoints return JSON and use `{ error, status }` for errors with no stack traces.

### 1. `GET /healthz` & `GET /api/healthz`
Health check.
- **Response:** `200 OK`
```json
{ "status": "ok", "timestamp": "2026-11-16T08:30:00.000Z" }
```

### 2. `GET /api/components?category=&q=`
Lists components with optional search and category filters.
- **Query Params:**
  - `category`: Filter by category (case-insensitive, e.g. `Atom`, `Text`, `Surface`)
  - `q`: Search query matching name, slug, or description
- **Response:** `200 OK`
```json
[
  {
    "slug": "aurora",
    "name": "Aurora",
    "category": "Background",
    "description": "Glowing ambient gradient mesh with shifting organic motion.",
    "status": "beta",
    "version": "0.1.0"
  }
]
```

### 3. `GET /api/components/:slug`
Retrieves a single component with all its configured props.
- **Response:** `200 OK` (or `404 Not Found`)
```json
{
  "slug": "aurora",
  "name": "Aurora",
  "category": "Background",
  "description": "Glowing ambient gradient mesh with shifting organic motion.",
  "status": "beta",
  "version": "0.1.0",
  "props": [
    {
      "name": "color",
      "type": "color",
      "defaultValue": "#FF4FA3",
      "min": null,
      "max": null,
      "step": null,
      "unit": null,
      "sortOrder": 0
    },
    {
      "name": "speed",
      "type": "range",
      "defaultValue": "6",
      "min": 2,
      "max": 14,
      "step": null,
      "unit": "s",
      "sortOrder": 1
    }
  ]
}
```

### 4. `POST /api/presets`
Stores a playground preset configuration. Rejects unknown props, invalid types, invalid hex colors, or out-of-range numerical values.
- **Request Body:**
```json
{
  "componentSlug": "aurora",
  "props": {
    "color": "#FF4FA3",
    "speed": 8
  },
  "theme": "dark"
}
```
- **Response:** `201 Created`
```json
{
  "id": "aB3_k9Xy1Z"
}
```

### 5. `GET /api/presets/:id`
Retrieves a saved preset by its 10-character ID.
- **Response:** `200 OK` (or `404 Not Found`)
```json
{
  "id": "aB3_k9Xy1Z",
  "componentSlug": "aurora",
  "props": { "color": "#FF4FA3", "speed": 8 },
  "theme": "dark",
  "createdAt": "2026-11-16T08:30:00.000Z"
}
```

### 6. `POST /api/waitlist`
Validates email, stores as `pending`. Always returns `202 Accepted` with the same body even if email exists. Never logs emails.
- **Request Body:**
```json
{
  "email": "developer@kruxui.dev"
}
```
- **Response:** `202 Accepted`
```json
{
  "message": "Email registered for waitlist",
  "status": 202
}
```

### 7. `POST /api/feedback`
Submits feedback message (maximum 1,000 characters).
- **Request Body:**
```json
{
  "message": "Love the unconventional animations!",
  "componentSlug": "aurora"
}
```
- **Response:** `201 Created`
```json
{
  "id": "cK9_xL2m1P",
  "message": "Feedback received",
  "status": 201
}
```

---

## Safety Rules & Guardrails

- **Rate Limiting:** Writes (`POST /api/presets`, `POST /api/waitlist`, `POST /api/feedback`) are restricted to 10 per minute per IP. Excess writes return `429 Too many requests`.
- **CORS:** Restricted to `ALLOWED_ORIGINS` when configured.
- **Body Size Limit:** Request bodies are capped at 32 KB. Payloads exceeding 32 KB return `413 Payload too large`.
- **Parameterized Queries:** All queries use SQLite parameter bindings to eliminate SQL injection risks.
- **Email Privacy:** Emails are normalized and never logged to stdout, stderr, or application logs.
- **Error Format:** All errors return `{ error: string, status: number }` without exposing stack traces.
