# Vanigan — Working Architecture

## What the System Does

Vanigan is a **Tamil Nadu directory platform** with two separate interaction surfaces:

1. **WhatsApp Chatbot** — End-users (public) interact via WhatsApp to browse businesses, organizers, and members by district/assembly, view listings, submit reviews, and choose subscription plans — all inside the WhatsApp app using encrypted interactive Flows.
2. **Admin Panel** — Admins manage the directory data (users, businesses, organizers, members, plans, reviews, flow images) via a React web dashboard.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLIC USER (WhatsApp)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │  sends message (text / button / flow reply)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       META CLOUD API                                │
│             (WhatsApp Business Platform — graph.facebook.com)       │
└──────────┬──────────────────────────────────────┬───────────────────┘
           │  POST /api/webhook/meta               │  POST /api/flow-endpoint
           │  (inbound messages)                   │  (encrypted flow data_exchange)
           ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     VANIGAN BACKEND  (Express / Node.js)            │
│                                                                     │
│  ┌──────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  webhook.js  │    │  flowEndpoint.js   │    │  REST API       │  │
│  │              │    │                    │    │  routes/        │  │
│  │ • Verify     │    │ • RSA decrypt req  │    │  auth, users,   │  │
│  │   signature  │    │ • Handle screens:  │    │  businesses,    │  │
│  │ • Route to   │    │   INIT → SERVICE   │    │  organizers,    │  │
│  │   chatbot    │    │   SELECT_DISTRICT  │    │  members,       │  │
│  └──────┬───────┘    │   SELECT_ASSEMBLY  │    │  plans,         │  │
│         │            │   ITEM_LIST        │    │  reviews,       │  │
│         ▼            │   ITEM_DETAILS     │    │  flow-images,   │  │
│  ┌──────────────┐    │   REVIEW           │    │  dashboard      │  │
│  │  chatbot.js  │    │   PLANS            │    └────────┬────────┘  │
│  │              │    │ • AES encrypt resp │             │           │
│  │ • Detect     │    └────────┬───────────┘             │           │
│  │   greeting   │             │                         │           │
│  │ • Track user │             │                         │ JWT auth  │
│  │ • Send Flow  │             │                         │ middleware│
│  │   message    │             │                         │           │
│  └──────┬───────┘             │                         │           │
│         │                     │                         │           │
│         └──────────┬──────────┘                         │           │
│                    │                                     │           │
│         ┌──────────▼──────────────────────────────────┐ │           │
│         │              SERVICES LAYER                  │ │           │
│         │  metaCloud.js  │  cloudinary.js  │           │ │           │
│         │  flowImages.js │  imageBase64.js │           │ │           │
│         │  districts.js  │  flowJson.js    │           │ │           │
│         └──────────┬─────────────────────────┬─────────┘ │           │
│                    │                         │           │           │
└────────────────────┼─────────────────────────┼───────────┘           │
                     │                         │                       │
          ┌──────────▼──────┐     ┌────────────▼──────────────┐        │
          │   MongoDB        │     │       Cloudinary           │        │
          │                  │     │  (images for flow screens, │        │
          │  Users           │     │   business/org/member      │        │
          │  Businesses      │     │   profile photos)          │        │
          │  Organizers      │     └───────────────────────────┘        │
          │  Members         │                                           │
          │  Plans           │                                           │
          │  Reviews         │                                           │
          │  FlowImages      │                                           │
          │  InboundMessages │                                           │
          │  Admins          │                                           │
          └──────────────────┘                                           │
                                                                         │
┌────────────────────────────────────────────────────────────────────────┘
│                      ADMIN PANEL (React + Vite)
│
│  App.jsx — checks localStorage for vn_token → calls /auth/verify
│  If valid → renders Layout (sidebar nav) + pages
│  If invalid → redirects to /login
│
│  Pages: Dashboard | Users | Businesses | Organizers |
│         Members | Plans | Reviews | FlowImages
│
│  All API calls go through api.js (Axios instance with JWT Bearer header)
└────────────────────────────────────────────────────────────────────────
```

---

## Two Core Data Flows

### 1. WhatsApp User Journey (Chatbot + Flow)

```
User sends "hi"
    │
    ▼
webhook.js receives POST from Meta
    │
    ▼
chatbot.handleInbound()
    ├── trackInbound()  →  upserts InboundMessage + User in MongoDB
    └── sendWelcomeFlow()  →  calls metaCloud.sendFlowMessage()
                                │
                                ▼
                         Meta delivers interactive Flow message to user
                                │
                         User taps "Choose Service" inside WhatsApp
                                │
                                ▼
                    flowEndpoint.js receives encrypted POST
                         │
                         ├── decryptRequest()  (RSA OAEP + AES-128-GCM)
                         ├── handleInit()  →  returns SERVICE_SELECT screen
                         │
                         │  User picks Business / Organizer / Member / Subscription
                         │
                         ├── handleDataExchange()
                         │    ├── screen=SERVICE_SELECT  → SELECT_DISTRICT
                         │    ├── screen=SELECT_DISTRICT → SELECT_ASSEMBLY
                         │    ├── screen=SELECT_ASSEMBLY → ITEM_LIST (queries MongoDB)
                         │    ├── screen=ITEM_LIST       → ITEM_DETAILS (fetches doc + reviews)
                         │    ├── screen=ITEM_DETAILS    → REVIEW screen
                         │    ├── screen=REVIEW          → saves Review to MongoDB → INFO
                         │    └── screen=PLANS           → shows plan info / upgrade prompt → INFO
                         │
                         └── encryptResponse()  (AES-128-GCM with flipped IV)
                                │
                                ▼
                         Meta renders next screen in WhatsApp
```

### 2. Admin Panel Flow

```
Admin opens browser
    │
    ▼
App.jsx checks localStorage["vn_token"]
    ├── No token → /login page
    └── Token found → GET /api/auth/verify
            ├── Invalid → remove token → /login
            └── Valid   → render Layout + protected routes
                                │
                                ▼
                    Admin interacts with any page
                    (e.g. Businesses, Plans, FlowImages)
                                │
                                ▼
                    api.js (Axios) sends request with
                    Authorization: Bearer <jwt>
                                │
                                ▼
                    middleware/auth.js verifies JWT
                                │
                                ▼
                    Route handler queries / mutates MongoDB
                    (image uploads go to Cloudinary via multer + cloudinary.js)
                                │
                                ▼
                    JSON response back to React page
```

---

## Encryption Architecture (WhatsApp Flows)

Meta requires all Flow data_exchange traffic to be end-to-end encrypted:

| Step | What happens |
|---|---|
| **Key setup** | `scripts/generate-flow-keys.js` creates an RSA-2048 key pair in `flow_keys/` |
| **Upload** | `scripts/upload-public-key.js` uploads the public key to Meta via Business Encryption API |
| **Inbound** | Meta encrypts the AES session key with the RSA public key (OAEP/SHA-256), encrypts payload with AES-128-GCM |
| **Decrypt** | `flowEndpoint.decryptRequest()` uses the private key (from `FLOW_PRIVATE_KEY` env) to decrypt the AES key, then decrypts the payload |
| **Encrypt response** | `flowEndpoint.encryptResponse()` re-encrypts the response with the same AES key but flips all IV bits |

---

## Authentication (Admin Panel)

| Step | Detail |
|---|---|
| Login | `POST /api/auth/login` — bcrypt compares password against `Admin.passwordHash`, returns signed JWT |
| Verify | `GET /api/auth/verify` — used on app load to rehydrate session from `localStorage` |
| Protected routes | `middleware/auth.js` — `jwt.verify()` on `Authorization: Bearer <token>` header |
| Token storage | Browser `localStorage` key `vn_token` |

---

## Image Pipeline

```
Admin uploads image via FlowImages page
    │
    ▼
multer (upload.js) buffers the file in memory
    │
    ▼
cloudinary.js uploads to Cloudinary, returns secure URL
    │
    ▼
URL saved to FlowImage document in MongoDB (keyed by slot name)
    │
    ▼
flowEndpoint.js reads URL → imageBase64.js fetches + resizes via
Cloudinary transformation URL → returns Base64 string
    │
    ▼
Base64 embedded in encrypted Flow response → displayed inside WhatsApp screen
```

Images are cached in-memory for 10 minutes (`imgCache` in `flowEndpoint.js`). The cache is cleared immediately when an admin uploads a new image via `clearImageCache()`.

---

## Startup Sequence (`server.js`)

1. Connect to MongoDB
2. Auto-seed default Admin if no admins exist
3. Ensure `FlowImage` slot documents exist for all named keys
4. Upsert 3 default Plans (`free`, `premium`, `premium_plus`) if missing
5. Start HTTP server on `PORT` (default `5050`)

---

## Key Design Decisions

- **`_listingFactory.js`** — Single factory function generates paginated list + CRUD routes for Business, Organizer, Member to avoid code duplication.
- **`ListingPage.jsx`** — Frontend mirror: one generic CRUD table component used by all entity pages.
- **Flow screens are stateless** — all state (district, assembly, kind, item_id) is passed forward in each `data_exchange` payload; nothing is stored in server-side session.
- **User records are auto-created** — `User` documents are upserted from WhatsApp phone numbers as users interact; admins can view/manage them in the panel.

