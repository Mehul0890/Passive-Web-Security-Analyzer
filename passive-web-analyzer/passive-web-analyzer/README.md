# Passive Web Security Analyzer Pro

A free, non-intrusive website security intelligence tool that generates passive security reports using only publicly accessible data.

**Live demo**: Deploy to Netlify (see instructions below)

---

## What It Does

- **SSL/TLS Analysis** — Certificate validity, expiry, issuer, subject alternative names
- **Security Headers** — Checks 9 critical HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
- **Cookie Inspection** — Secure, HttpOnly, SameSite attribute analysis
- **DNS Records** — A, AAAA, MX, NS, TXT with SPF and DMARC detection
- **Redirect Chain** — Full redirect trace with HTTP→HTTPS upgrade detection
- **Metadata** — Page title, description, generator, robots.txt, sitemap.xml
- **Risk Scoring** — Deterministic weighted scoring based only on real findings
- **Recommendations** — Actionable fixes prioritized by severity
- **Scan History** — Browser localStorage, no server required
- **Compare Scans** — Diff two scans side-by-side
- **Export** — JSON, TXT, and HTML client-side exports

### Modes
- **Learner Mode** — Plain-language explanations of each finding
- **Analyst Mode** — Raw values, technical evidence, detailed notes

---

## Ethics & Safety

This tool is **strictly passive**. It does NOT:
- Port scan
- Brute-force anything
- Attempt logins
- Fuzz or inject payloads
- Exploit vulnerabilities
- Perform intrusive fingerprinting

It only uses:
- Standard HTTP/HTTPS requests
- Public DNS lookups
- SSL certificate metadata
- Passive HTML parsing
- Public header/cookie inspection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend | Netlify Functions (serverless) |
| History | Browser localStorage |
| Exports | Client-side (no server required) |
| Hosting | Netlify (free tier) |

---

## Local Development

### Prerequisites
- Node.js 18+
- npm
- Netlify CLI

### Setup

```bash
# Clone and install
git clone <your-repo>
cd passive-web-analyzer
npm install

# Install Netlify CLI globally if needed
npm install -g netlify-cli

# Start local development (runs frontend + functions together)
netlify dev
```

The app runs at `http://localhost:8888`.

The Netlify dev server proxies:
- Frontend (Vite) on port 5173
- Netlify Functions on port 8888

API calls go through `/api/analyze` → `/.netlify/functions/analyze`.

---

## Netlify Deployment

### Method 1: Netlify CLI (Recommended)

```bash
# Login to Netlify
netlify login

# Initialize the site (first time)
netlify init

# Deploy to production
netlify deploy --prod
```

### Method 2: Netlify UI (GitHub)

1. Push your code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project"
3. Connect your GitHub repo
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Click "Deploy site"

### netlify.toml is pre-configured

The included `netlify.toml` handles:
- Build command and publish directory
- Functions directory
- SPA redirect (all routes → `index.html`)
- API route redirect (`/api/*` → `/.netlify/functions/*`)

---

## Environment Variables

No environment variables are required for the base version.

If you later add:
- **Supabase** for persistent history → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Rate limiting** → `NETLIFY_FUNCTION_TIMEOUT` in site settings

Set environment variables in Netlify UI: Site Settings → Environment Variables

---

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── sections/        # Page-level sections
│   │   │   ├── Header.tsx
│   │   │   ├── HeroInput.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   └── AnalyzerDashboard.tsx
│   │   ├── tabs/            # Dashboard tab content
│   │   │   ├── FindingsTab.tsx
│   │   │   ├── HeadersTab.tsx
│   │   │   ├── SslTab.tsx
│   │   │   ├── CookiesTab.tsx
│   │   │   ├── DnsTab.tsx
│   │   │   ├── MetadataTab.tsx
│   │   │   ├── RedirectsTab.tsx
│   │   │   ├── RecommendationsTab.tsx
│   │   │   ├── HistoryTab.tsx
│   │   │   ├── CompareTab.tsx
│   │   │   └── ExportTab.tsx
│   │   └── ui/              # Reusable UI primitives
│   ├── hooks/
│   │   └── useAnalyzer.ts   # Core scan state & progress
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── history.ts       # localStorage scan history
│   │   ├── export.ts        # Client-side exports
│   │   └── utils.ts         # Color/style helpers
│   ├── pages/
│   │   └── AnalyzerPage.tsx
│   ├── types/
│   │   └── index.ts         # All TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── netlify/
│   └── functions/
│       └── analyze.ts       # Main backend function
├── public/
│   └── favicon.svg
├── netlify.toml
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Architecture

```
Browser (React SPA)
       │
       │  POST /api/analyze  (proxied by netlify.toml)
       ▼
Netlify Function (analyze.ts)
  ├── Normalize & validate URL
  ├── Parallel fetch:
  │   ├── HTTP/HTTPS request (with redirect following)
  │   ├── TLS certificate (direct TCP/TLS handshake)
  │   └── DNS lookups (Node.js dns module)
  ├── Parse headers, cookies, metadata
  ├── Build findings engine
  ├── Calculate risk score
  └── Return JSON report
       │
       ▼
React Frontend
  ├── Renders report in tabbed dashboard
  ├── Stores to localStorage
  ├── Client-side exports (JSON/TXT/HTML)
  └── Compare scans from history
```

---

## Free Tier Limitations

| Limitation | Impact |
|---|---|
| 125k function invocations/month | ~4k scans/day on free tier |
| 10s function timeout | Long scans may time out for slow targets |
| No persistent storage | History is browser-local only |
| No WHOIS | Parsed WHOIS is omitted (rate limited, varied formats) |
| No subdomain enumeration | Passive only by design |

### Graceful Fallbacks
- Timeouts: Reports `timed_out` status, shows partial data
- DNS failure: Shows `unavailable` per record type
- SSL failure: Shows `error` with specific error message
- Blocked targets: Reports partial data with truthful status labels

---

## Future Improvements

- [ ] Supabase or Firebase for persistent multi-device history
- [ ] Batch analysis UI (scan multiple domains)
- [ ] WHOIS data via third-party API (e.g., whoisjsonapi.com)
- [ ] PDF export using browser print API
- [ ] Email report delivery
- [ ] Scheduled re-scans with change detection
- [ ] API key for higher rate limits
- [ ] Vulnerability database cross-reference (passive only)

---

## Legal Notice

This tool is intended for legitimate security research, education, and authorized analysis of websites you own or have permission to assess. Use responsibly.
