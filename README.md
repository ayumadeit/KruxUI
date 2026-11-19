<p align="center">
  <img src="./assets/kruxui-logo.jpg" alt="KRUXUI Logo" width="100%" style="max-width: 720px; border-radius: 12px;" />
</p>

<h1 align="center">KRUXUI — Break the ordinary.</h1>

<p align="center">
  <b>Interfaces with an edge.</b> An experimental React component library for developers who refuse to ship boring interfaces.<br/>
  Expressive motion, tactile physics, unconventional aesthetics, built to be memorable.
</p>

<p align="center">
  <a href="https://kruxui.embarko.app/"><img src="https://img.shields.io/badge/Live%20Demo-kruxui.embarko.app-FF4FA3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-C7FF4D?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/Tests-15%20Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Node-22+-informational?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 🌐 Live Website & Demo

Experience KRUXUI live in your browser:
👉 **[https://kruxui.embarko.app](https://kruxui.embarko.app)**

<p align="center">
  <img src="./assets/hero-showcase.jpg" alt="KRUXUI Hero Showcase" width="100%" style="border-radius: 10px; border: 1px solid #292929;" />
</p>

---

## ✨ Features

- **33 Expressive Components:** From glowing fluid backgrounds (`Aurora`) to cursor-tracking pupils (`Goldeneye`), retro terminal typewriter dialogue (`QuestText`), interactive node graphs, and tactile widgets.
- **Interactive Component Playground:** Tweak live component props (colors, speeds, ranges, text labels) in real-time, instantly previewing responsive behavior and copying ready-to-use React code.
- **Full Backend API Service:** Built with Node 22, TypeScript, Hono, SQLite (`better-sqlite3`), and Zod validation.
- **Preset Saving & Sharing:** Save custom component configurations with generated 10-character shareable IDs.
- **Production Guardrails:**
  - Rate-limited writes: 10 writes per minute per IP.
  - Strict 32 KB payload size caps.
  - Parameterized SQLite queries & zero email logging.
  - CORS origin security.
  - Normalized error envelopes `{ error, status }` with no stack traces leaked.
- **Dark & Light Modes:** Built-in theme switching with accessible high-contrast palettes.

---

## 🎛️ Interactive Playground

Test props, fine-tune speeds, adjust palettes, and get clean, copyable React snippets:

<p align="center">
  <img src="./assets/playground.jpg" alt="KRUXUI Playground" width="100%" style="border-radius: 10px; border: 1px solid #292929;" />
</p>

```tsx
import { Aurora } from 'kruxui'

export default function Demo() {
  return (
    <Aurora
      color="#FF4FA3"
      speed={6}
    />
  )
}
```

---

## 🧩 Component Showcase

KRUXUI features **33 unique components** designed to stand out from generic component kits:

<p align="center">
  <img src="./assets/components-grid.png" alt="KRUXUI Components Grid" width="100%" style="border-radius: 10px; border: 1px solid #292929;" />
</p>

<p align="center">
  <img src="./assets/interactive-specimens.png" alt="KRUXUI Interactive Specimens" width="100%" style="border-radius: 10px; border: 1px solid #292929;" />
</p>

### Complete Catalog (33 Components)

| Category | Components |
|---|---|
| **Atom** | `StatusDot`, `GradientText`, `EyebrowPill`, `WibblingSpinner`, `Button`, `Sparkle`, `BigBack` |
| **Text & Motion** | `WordRoll`, `TokenStream`, `SlippyWords`, `QuestText` |
| **Background** | `Aurora`, `FloatingSparkles`, `NodeGraphBackground` |
| **Surface** | `GlassCard`, `StickyBanner`, `MockIDE` |
| **Data & Meter** | `StatCounter`, `Temperature` |
| **Conversation** | `ChatBubble`, `ChatFAB`, `Prompt` |
| **Social Proof** | `LogoRow`, `CommunityBadge`, `LogoMarquee` |
| **Experimental** | `BeforeAfter`, `Goldeneye`, `Rotator` |
| **Commerce & Hero** | `PricingCard`, `ASCIIHero`, `PromptHero` |
| **Overlay & Forms** | `Popover`, `WaitlistForm` |

---

## 🛠️ Stack & Architecture

- **Backend:** [Hono](https://hono.dev/) with `@hono/node-server`
- **Database:** SQLite via `better-sqlite3` (`data.db`, automatically uses `DATA_DIR` on cloud environments)
- **Validation:** [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/) (15 test suites)
- **Deployment:** [Embarko](https://embarko.ai) (Serverless container deployment without Docker)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/ayumadeit/KruxUI.git
cd KruxUI
npm install
```

### 2. Seed Database

Populates all 33 components and their exact props (idempotent):

```bash
npm run seed
```

### 3. Run Development Server

```bash
npm run dev
```

Server boots on `http://localhost:3000`.

### 4. Build & Run Production

```bash
npm run build
npm start
```

### 5. Run Test Suite

```bash
npm test
```

```text
 ✓ tests/api.test.ts (15 tests)
   ✓ GET /healthz and /api/healthz return 200 with ok status
   ✓ GET /api/components returns all 33 seeded components
   ✓ GET /api/components with category filter and search query
   ✓ GET /api/components/:slug returns single component and its props
   ✓ POST /api/presets creates a preset with valid props
   ✓ POST /api/presets rejects unknown props
   ✓ POST /api/presets rejects invalid hex color
   ✓ POST /api/presets rejects range value out of bounds
   ✓ POST /api/waitlist validates email & handles duplicates
   ✓ POST /api/feedback limits message length to 1000 chars
   ✓ Rate limit: blocks writes after 10 requests / min / IP (429)
   ✓ Body size limit: rejects payloads > 32 KB (413)

Test Files  1 passed (1)
     Tests  15 passed (15)
```

---

## 📡 API Reference (Base: `/api`)

All endpoints return JSON and format errors as `{ error: string, status: number }`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Health check endpoint |
| `GET` | `/api/components` | List components (supports `?category=` and `?q=`) |
| `GET` | `/api/components/:slug` | Retrieve component metadata + configured props |
| `POST` | `/api/presets` | Validate and store custom playground preset (`{ componentSlug, props, theme }`) |
| `GET` | `/api/presets/:id` | Fetch saved preset configuration |
| `POST` | `/api/waitlist` | Register email (idempotent `202`, never logged) |
| `POST` | `/api/feedback` | Store user feedback message (max 1,000 chars) |
| `GET` | `/` | Serves the interactive static KRUXUI showcase |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATA_DIR` | `./` | Directory for persistent SQLite storage |
| `DB_PATH` | `data.db` | Custom SQLite database file path |
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of allowed CORS domains |
| `RESEND_API_KEY` | _none_ | If provided, marks waitlist confirmation email as sent |

---

## 👨‍💻 Creator & Community

- **Creator:** [Ayush](https://www.linkedin.com/in/ayush-linked)
- **Tagline:** *Break the ordinary. Interfaces with an edge.*
- **License:** [MIT](./LICENSE)
