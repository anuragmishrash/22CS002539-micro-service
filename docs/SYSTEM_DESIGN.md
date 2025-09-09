## URL Shortener Microservice - System Design

### 1) Goals
- Provide globally unique, time-bound short links with optional custom shortcodes.
- Record click analytics (timestamp, referrer, coarse location).
- Simple dev UX with mandatory custom logging middleware.
- Production-ready API/UX patterns: validation, error handling, observability, CORS, separation of concerns.

### 2) High-level Architecture
- Backend: Single stateless HTTP microservice (Express) exposing:
  - POST `/shorturls` – create short URL
  - GET `/shorturls/:shortcode` – stats for a short URL
  - GET `/:shortcode` – redirect and record click
- Persistence: MongoDB (document store) for URLs and embedded click events.
- Frontend: React SPA for creating links and viewing stats; communicates with backend via REST.
- Logging: Custom `logger.js` with file-based structured JSON logs; integrated as Express middleware.
- Local dev: React dev server proxies API requests to backend.

```
[React SPA]  <——HTTP——>  [Express Microservice]  <——TCP——>  [MongoDB]
      |                           |                     
  Users (create, stats)       Logging, CORS         Data persistence
```

### 3) Data Model
`Url` (MongoDB collection)
- `originalUrl: string` – validated absolute URL
- `shortCode: string (unique)` – 6-char nanoid or user-supplied custom code
- `createdAt: Date` – default now
- `expiresAt: Date` – default now + 30 minutes (or user-specified minutes)
- `clicks: Click[]` – embedded array for basic analytics

`Click`
- `timestamp: Date`
- `referrer: string` – `req.get('Referrer') || 'Direct'`
- `location: string` – coarse source (e.g., `req.ip`)

Notes:
- Embedding click events is acceptable for basic analytics and simplifies reads per shortcode. For high traffic, a separate `clicks` collection or event stream would be preferred to avoid unbounded document growth.

### 4) Core Flows
- Create:
  1) Validate URL format; parse `validity` minutes; default to 30.
  2) If `shortcode` provided: check uniqueness; else generate with `nanoid(6)`.
  3) Persist `Url` with `expiresAt`.
  4) Respond with `{ shortLink, expiry }`.
- Redirect:
  1) Lookup by `:shortcode`; 404 if missing.
  2) 410 if expired.
  3) Append a `Click` with timestamp/referrer/ip; save.
  4) HTTP 302 redirect to `originalUrl`.
- Stats:
  1) Lookup; 404 if missing; 410 if expired.
  2) Return `{ originalUrl, shortCode, createdAt, expiresAt, totalClicks, clickDetails }`.

### 5) API Design & Error Handling
- Request/response are JSON for API endpoints; redirects are standard HTTP.
- Status codes:
  - 201 Created (create)
  - 200 OK (stats)
  - 302 Found (redirect)
  - 400 Bad Request (validation)
  - 404 Not Found (unknown shortcode)
  - 409 Conflict (shortcode already in use)
  - 410 Gone (expired)
  - 500 Internal Server Error (unexpected)
- Error bodies: `{ error: string }` with clear, client-facing messages.

### 6) Security & Validation
- Assumption: API access is pre-authorized; no auth required per spec.
- Input validation: URL parsing via `new URL(url)`; `validity` coerced to integer minutes; optional `shortcode` restricted to alphanumeric and reasonable length (can be extended with regex and central validator).
- CORS enabled for SPA; can be restricted via origin allowlist in production.
- No PII in logs; request body logged by middleware for observability (can be redacted if needed).

### 7) Logging & Observability
- Custom `Logger` with levels (ERROR/WARN/INFO/DEBUG), JSON lines to daily file in `logs/`.
- Express `loggerMiddleware` logs request metadata and response time/size.
- Module-level loggers in controllers for business events and errors.
- Ready for log shipping (e.g., to ELK) by tailing JSON files.

### 8) Technology Choices & Rationale
- Express.js: Minimal, well-known HTTP microservice framework; easy middleware.
- MongoDB & Mongoose: Flexible schema for URL + embedded click events; rapid development; unique index ensures global shortcode uniqueness.
- Nanoid: Collision-resistant, URL-safe IDs for auto-generated shortcodes.
- React: Responsive SPA; clean separation from backend; simple form-based UX.
- dotenv: Environment configuration convention.
- CORS: Frontend-backend separation in dev and prod.

### 9) Scalability Considerations
- Stateless service horizontally scalable behind a load balancer.
- MongoDB: Ensure index on `shortCode`; shard by `shortCode` if needed.
- Hot path performance:
  - Reads on redirect; ensure shortCode index and avoid heavyweight operations.
  - Writes for click logging: consider async fire-and-forget to queue/event bus for very high traffic.
- Click Storage Growth:
  - For high volume, move `clicks` to a separate collection or analytics pipeline (Kafka -> Clickhouse/BigQuery), keeping `Url` doc small.
- Caching: Add in-memory/Redis cache for shortCode -> originalUrl to reduce DB hits.
- Rate limiting & abuse protection: Add per-IP rate limits and URL safety checks.

### 10) Deployment & Configuration
- Ports: Backend `4000`; React dev server proxies to `4000`.
- Env vars:
  - `MONGODB_URI`, `PORT`, `LOG_LEVEL`, `NODE_ENV`.
- Containerization: Dockerfile can be added; run `node server.js`. Compose with MongoDB for local dev.
- Health check: Add `/healthz` (200) for orchestrators.

### 11) Testing Strategy (future work)
- Unit tests: Controllers (URL validation, code generation, expiry).
- Integration tests: In-memory MongoDB; endpoints via supertest.
- E2E: Redirect workflow and stats retrieval.

### 12) Assumptions
- Users are pre-authorized; no auth required (per spec).
- Validity input is integer minutes; missing implies 30 minutes.
- Custom shortcode must be unique and alphanumeric; length kept modest (e.g., 3–32) for usability.
- Basic analytics are sufficient; not a full analytics platform.

### 13) Alternatives Considered
- RDBMS with normalized `urls` and `clicks` tables – stronger consistency, but slower iteration for embedded analytics.
- Hash-based shortcode from URL – simple but collisions and custom code support make random IDs preferable.
- Server-side rendering – unnecessary for the simple SPA; CSR is sufficient.

### 14) Maintenance & Extensibility
- Clear layering: `routes` -> `controllers` -> `models`.
- Centralized logging and error responses.
- Easy to add features: QR code generation, custom domains, user accounts, rate limiting, or admin dashboards.
