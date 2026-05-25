# Vanigan — Backend

Express + MongoDB + Cloudinary + WhatsApp Cloud API.

## Setup

```bash
cp .env.example .env       # fill in the credentials
npm install
```

## Run

```bash
npm run dev                # nodemon on http://localhost:5050
```

Default admin (auto-seeded on first boot) → `ADMIN_USERNAME` / `ADMIN_PASSWORD`
from `.env` (default `admin` / `admin@123`).

## WhatsApp Flow setup (one-time)

1. Expose this backend over HTTPS (ngrok / Render / Fly / ...) and set
   `BACKEND_URL=https://...` in `.env`.
2. Run the orchestrated setup:

   ```bash
   npm run flow:setup
   ```

   This generates an RSA-2048 keypair, uploads the public key to Meta,
   creates a new flow named **Vanigan Welcome**, uploads the Flow JSON
   (built from `services/flowJson.js`) and publishes it. The resulting
   `WHATSAPP_FLOW_ID` is saved into `.env` automatically.
3. Configure the Meta webhook to:
   - Callback URL: `${BACKEND_URL}/api/webhook/meta`
   - Verify token: value of `META_VERIFY_TOKEN`
4. Subscribe your app to the WABA messages field:

   ```bash
   npm run waba:subscribe
   ```

To push flow-JSON edits later, run `npm run flow:sync`.

## Destructive resets

```bash
npm run reset:mongo           # drop every collection in the configured DB
npm run reset:cloudinary      # wipe every Cloudinary asset & folder
```

Run these once at project start to ensure a clean slate.

## Scripts

| Script                    | What it does                                 |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Start the API with nodemon                   |
| `npm start`               | Start in production                          |
| `npm run flow:keys`       | Generate RSA-2048 keypair only               |
| `npm run flow:upload-key` | Upload the existing public key to Meta       |
| `npm run flow:create`     | Create + publish a brand-new flow            |
| `npm run flow:sync`       | Push updated flow JSON to an existing flow   |
| `npm run flow:setup`      | All of the above in the right order          |
| `npm run waba:subscribe`  | Subscribe the app to WABA `messages`         |
| `npm run seed:admin`      | Re-seed the admin password                   |
| `npm run seed:plans`      | Re-seed the three default subscription plans |
| `npm run reset:mongo`     | Drop every collection in the configured DB   |
| `npm run reset:cloudinary`| Wipe every asset + folder in the cloud       |

## Public REST API surface (admin-token gated unless noted)

- `POST /api/auth/login`
- `GET  /api/auth/verify`
- `GET  /api/dashboard/stats`
- `GET/POST/PUT/DELETE  /api/businesses[/:id]`
- `GET/POST/PUT/DELETE  /api/organizers[/:id]`
- `GET/POST/PUT/DELETE  /api/members[/:id]`
- `GET/POST/PUT/DELETE  /api/plans[/:id]`
- `GET/DELETE           /api/reviews[?kind=&targetId=]`
- `GET                  /api/districts`
- `GET                  /api/districts/:district/assemblies`
- `GET/POST/DELETE      /api/flow-images[/:key]`
- `GET/PATCH/DELETE     /api/users[/:id]`
- `GET                  /api/users/contacts`
- `GET/POST             /api/webhook/meta`              *(public — used by Meta)*
- `POST                 /api/flow-endpoint`             *(public — used by Meta)*
