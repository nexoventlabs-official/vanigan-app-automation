# Vanigan

WhatsApp-first directory for Tamil Nadu businesses, organizers and members,
plus a subscription plan picker — driven from a single Meta WhatsApp **Flow**
and managed from a React admin panel.

## Layout

```
Vanigan/
├── backend/      Express + MongoDB + Cloudinary + WhatsApp Cloud API
└── frontend/     React + Vite + Tailwind admin console
```

When a user sends **Hi** to the WhatsApp number, the bot replies with an
image-header + body + `Choose Service` CTA. Tapping it opens an encrypted
WhatsApp Flow that walks them through:

1. **Service**  — Business List / Organizer List / Members List / Subscription
2. **District** — dropdown of all 38 TN districts
3. **Assembly** — dropdown of constituencies in the chosen district
4. **List**     — businesses / organizers / members filtered by both
5. **Details**  — name, image, description, recent reviews
6. **Review**   — 1‑5 star rating + free-text review

For Subscription the flow jumps straight to a plan picker
(Free / Premium / Premium Plus). Every list image, plan icon and service
tile is uploaded from the admin panel.

## Quick start

```bash
# Backend
cd backend
cp .env.example .env       # then fill in your secrets
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

For the full WhatsApp setup (RSA keypair → upload key → create flow), see
[`backend/README.md`](./backend/README.md).
