# Uptime Monitoring API

A RESTful API for monitoring the uptime and downtime of user-defined URLs, with SMS alerts when a monitored service changes state.

## Overview

This project is a **raw Node.js** (no frameworks) API server that lets users:

- Register accounts and authenticate via tokens
- Create and manage uptime checks for HTTP/HTTPS URLs
- Receive SMS alerts (via [SMS.BD](https://sms.net.bd)) when a monitored URL goes up or down

All data is stored as JSON files on disk (no database required).

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │              CLIENT                  │
                    │   (curl / browser / API client)      │
                    └──────────────┬───────────────────────┘
                                   │  HTTP Request
                                   ▼
                    ┌──────────────────────────────────────┐
                    │          HTTP SERVER (node:http)     │
                    │         Port: 3000 / 5000            │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │      REQUEST HANDLER (handleReqRes)  │
                    │  - Parse URL, query, headers, body   │
                    │  - Match route → delegate to handler │
                    │  - Return JSON response              │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │         ROUTE TABLE (routes.js)      │
                    ├──────────┬───────────────────────────┤
                    │ /user    │  userHandler              │
                    │ /token   │  tokenHandler             │
                    │ /check   │  checkHandler             │
                    │ /*       │  notFoundHandler (404)    │
                    └──────────┴──────────┬────────────────┘
                                          │
                    ┌─────────────────────▼─────────────────┐
                    │      DATA LAYER (data.js)             │
                    │   CRUD operations on JSON files       │
                    │          .data/                       │
                    │      ├── users/                       │
                    │      ├── tokens/                      │
                    │      └── checks/                      │
                    └─────────────────────┬─────────────────┘
                                          │
                    ┌─────────────────────▼─────────────────┐
                    │      BACKGROUND WORKER (worker.js)    │
                    │   Runs every 1 minute (60 seconds):   │
                    │   1. Gather all checks                │
                    │   2. Validate check data              │
                    │   3. Perform HTTP request to URL      │
                    │   4. Compare response → up / down     │
                    │   5. Alert user via SMS if changed    │
                    └───────────────────────────────────────┘
```

## Features

- Zero-dependency Node.js (no Express, no frameworks)
- Token-based authentication (6-hour tokens, extensible)
- File-based storage (no database setup needed)
- Background worker for periodic uptime checks
- SMS alerts via SMS.BD on state changes
- Configurable checks: protocol, URL, method, success codes, timeout
- Staging and production environment configs
- ESLint + Prettier for code quality

## Project Structure

```
.
├── src/
│   ├── index.js                      # Entry point — starts server + worker
│   ├── server.js                     # HTTP server creation
│   ├── routes.js                     # Route table mapping paths → handlers
│   ├── lib/
│   │   ├── data.js                   # File-based CRUD (read/write JSON in .data/)
│   │   └── worker.js                 # Background worker — checks URLs, sends alerts
│   ├── helpers/
│   │   ├── handleReqRes.js           # Request parsing, routing, response handling
│   │   ├── utilities.js              # Hash, token generation, JSON parsing
│   │   ├── notification.js           # SMS.BD integration
│   │   └── environments.js           # Environment config (staging / production)
│   ├── handler/routesHandlers/
│   │   ├── userHandler.js            # User registration, auth, CRUD
│   │   ├── tokenHandler.js           # Token create, extend, delete, verify
│   │   ├── checkHandler.js           # Uptime check create, read, update, delete
│   │   ├── sampleHandler.js          # Sample/test route
│   │   └── notFoundHandler.js        # 404 fallback
│   └── .data/                        # File storage (JSON files)
│       ├── users/
│       ├── tokens/
│       └── checks/
├── package.json
├── eslint.config.js
└── .env                              # Environment variables (git-ignored)
```

## API Endpoints

### User Routes (`/user`)

| Method | Auth | Description | Body / Query |
|--------|------|-------------|--------------|
| `POST` | No | Register a new user | `{ firstName, lastName, phone, password, tosAgreement: true }` |
| `GET` | Yes | Get user profile | Query: `?phone=017XXXXXXXX` |
| `PUT` | Yes | Update user | `{ phone, firstName?, lastName?, password? }` |
| `DELETE` | Yes | Delete user | Query: `?phone=017XXXXXXXX` |

### Token Routes (`/token`)

| Method | Auth | Description | Body / Query |
|--------|------|-------------|--------------|
| `POST` | No | Create token (login) | `{ phone, password }` |
| `GET` | No | Get token info | Query: `?id=<32-char-hex>` |
| `PUT` | No | Extend token (+6 hrs) | `{ id, extend: true }` |
| `DELETE` | No | Delete token (logout) | Query: `?id=<32-char-hex>` |

### Check Routes (`/check`)

| Method | Auth | Description | Body / Query |
|--------|------|-------------|--------------|
| `POST` | Yes | Create uptime check | `{ protocol, url, method, successCode, timeoutSec }` |
| `GET` | Yes | Get check by ID | Query: `?id=<16-char-hex>` |
| `PUT` | Yes | Update check | `{ id, protocol?, url?, method?, successCode?, timeoutSec? }` |
| `DELETE` | Yes | Delete check | Query: `?id=<16-char-hex>` |

### Authentication

All authenticated routes require a `token` header:

```
token: <32-character-hex-string>
```

Tokens are created via `POST /token` with phone and password. They expire after **6 hours** and can be extended via `PUT /token`.

### Check Configuration

| Field | Type | Constraints | Example |
|-------|------|-------------|---------|
| `protocol` | string | `http` or `https` | `"https"` |
| `url` | string | non-empty | `"example.com/api"` |
| `method` | string | `GET`, `POST`, `PUT`, `DELETE` | `"GET"` |
| `successCode` | array | HTTP status codes | `[200, 201, 204]` |
| `timeoutSec` | number | integer, 1–5 | `3` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `staging` or `production` |
| `SMS_BD_API_KEY` | Yes | Your [SMS.BD](https://sms.net.bd) API key |
| `SECRET_KEY` | Yes | Secret string used for password hashing |

Set these in a `.env` file (for local dev) or in your hosting platform dashboard (for production).

### Staging vs Production

| Setting | Staging | Production |
|---------|---------|------------|
| Port | `3000` | `5000` (or `PORT` env) |
| Max checks per user | 5 | 5 |
| SMS provider | SMS.BD | SMS.BD |

## Getting Started

### Prerequisites

- **Node.js >= 24** (uses `--env-file` flag and ESM features)
- **npm**
- An [SMS.BD](https://sms.net.bd) account (for alerts)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/git-rubayedFoysal/nodejs-uptime-monitor.git
cd nodejs-uptime-monitor

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env <<EOF
SMS_BD_API_KEY=your_smsbd_api_key_here
SECRET_KEY=your_secret_key_here
EOF

# 4. Start in development mode (with file watching)
npm run dev

# Server starts at http://localhost:3000
```

### Production

```bash
# Set environment and start
NODE_ENV=production SMS_BD_API_KEY=xxx SECRET_KEY=yyy PORT=5000 node --env-file=.env src/index.js
```

Or simply:

```bash
npm start
```

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rubayed",
    "lastName": "Foysal",
    "phone": "01712345678",
    "password": "mypassword",
    "tosAgreement": true
  }'
```

### Login (Get Token)

```bash
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "password": "mypassword"
  }'
```

### Create a Check

```bash
curl -X POST http://localhost:3000/check \
  -H "Content-Type: application/json" \
  -H "token: <your-32-char-token>" \
  -d '{
    "protocol": "https",
    "url": "example.com",
    "method": "GET",
    "successCode": [200],
    "timeoutSec": 3
  }'
```

### Get Check Status

```bash
curl -X GET "http://localhost:3000/check?id=<check-id>" \
  -H "token: <your-32-char-token>"
```

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | Staging + file watch | Development with auto-restart |
| `npm start` | Production mode | Production server |
| `npm run lint` | ESLint | Check code style |
| `npm run lint:fix` | ESLint --fix | Auto-fix code style |
| `npm run format` | Prettier | Format all files |

## How the Worker Works

The background worker runs in the same process as the HTTP server and performs these steps every **1 minute (60 seconds)**:

1. **Gather** — Lists all check files in `.data/checks/`
2. **Validate** — Normalizes each check's state and timestamps
3. **Perform** — Sends an HTTP/HTTPS request to the monitored URL
4. **Decide** — Compares the response status code against `successCode`
5. **Alert** — If the state changed (up → down or down → up), sends an SMS via SMS.BD

```
Worker Loop (every 1 minute / 60 seconds)
─────────────────────────────────────────
  getherChecks()
    │
    ├──► readData("checks", each_file)
    │      │
    │      ▼
    │    validateCheckData()
    │      │
    │      ▼
    │    performCheck()  ──►  HTTP request to target URL
    │      │
    │      ├── on response end ──► processCheckOutcome()
    │      ├── on error ─────────► processCheckOutcome()
    │      └── on timeout ───────► processCheckOutcome()
    │                                  │
    │                                  ▼
    │                            state changed?
    │                            ├── YES ──► alertUser() → SMS
    │                            └── NO  ──► log "no alert needed"
```

## Storage

All data is stored as JSON files in the `src/.data/` directory:

```
.data/
├── users/
│   └── 01712345678.json
├── tokens/
│   └── a1b2c3d4e5f6...json
└── checks/
    └── 5e28fc6a0be499a0.json
```

**Important for deployment:** This directory must be on a persistent volume or disk, otherwise data is lost on every deploy/restart.

## Deployment

### Free Options

| Platform | Persistent Storage | Free Tier | Notes |
|----------|-------------------|-----------|-------|
| **Fly.io** | Free volume (1GB) | Yes — no sleep | Recommended |
| **Render** | Paid disk ($0.25/GB) | Free service (sleeps) | Simplest GitHub integration |
| **Railway** | Free (limited) | Yes | Requires credit card |

### Deploy with Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch (auto-detects Node.js)
fly launch

# Create persistent volume for .data/
fly volumes create data --size 1

# Deploy
fly deploy
```

### Deploy with Render

1. Push code to GitHub
2. Render Dashboard → New Web Service → Connect GitHub repo
3. Build: `npm ci` | Start: `npm start`
4. Add env vars: `NODE_ENV=production`, `SMS_BD_API_KEY`, `SECRET_KEY`
5. Add Persistent Disk mounted at `/opt/render/project/src/.data`

## Tech Stack

- **Runtime:** Node.js >= 24
- **HTTP:** Node.js built-in `http` / `https` modules
- **Storage:** File system (JSON files via `node:fs/promises`)
- **Auth:** Token-based with SHA-256 password hashing
- **SMS:** [SMS.BD](https://sms.net.bd) REST API
- **Code Quality:** ESLint + Prettier
- **Module System:** ES Modules (`"type": "module"`)

## License

ISC

## Author

**Rubayed Ahmed Foysal**

- GitHub: [@git-rubayedFoysal](https://github.com/git-rubayedFoysal)
- Repository: [nodejs-uptime-monitor](https://github.com/git-rubayedFoysal/nodejs-uptime-monitor)
