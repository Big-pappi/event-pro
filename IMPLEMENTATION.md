# InvitePro — Implementation Specification (Iteration 1)

> A SaaS invitation design & messaging platform combining a Canva-style template
> editor, an Eventbrite-style event/invitee manager, and a Twilio-style sending
> flow, with a super-admin console. This document describes **exactly** what is
> built in Iteration 1.

---

## 1. Tech Stack & Architecture

| Layer | Technology |
|-------|----------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind v4, shadcn/ui, Recharts |
| Backend | Python + FastAPI (on Vercel via `experimentalServices`) |
| Data | In-memory mock store (Python dicts), modeled to mirror future DB schema |
| Messaging | Simulated SMS/WhatsApp delivery (queued → sent → delivered) |
| QR | `qrcode[pil]` generated server-side as PNG |

### Multi-service layout
```
/
├── vercel.json            # experimentalServices: frontend + backend
├── backend/
│   ├── main.py            # FastAPI app, CORS, all routes
│   ├── store.py           # in-memory seeded mock data + helpers
│   └── pyproject.toml     # fastapi[standard], qrcode[pil]
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    └── app/ ...            # all screens
```

- Frontend calls `/api/...`; Vercel strips `/api` before forwarding.
- Backend routes are defined **without** the `/api` prefix (e.g. `@app.get(\"/events\")`)
- Only `vercel.json` lives at the repo root. Each service owns its own deps.

---

## 2. Data Models (mock, mirrors future DB)

- **User** — id, name, email, phone, role (`agent` | `admin`), avatar, status, createdAt, smsCredits, whatsappCredits, subscriptionId.
- **Event** — id, agentId, name, type, date, time, location, organizer, description, bannerUrl, status (`draft|active|completed`), templateId, createdAt.
- **Invitee** — id, eventId, name, phone, email, group/tag, slots, status (`pending|invited|confirmed|declined`), invitationId, checkedIn.
- **Template** — id, ownerId, name, category, thumbnail, width, height, background, layers[], isPublic.
- **Layer** — id, type (`text|image|shape|qr|variable`), x, y, w, h, rotation, zIndex, props (text/font/color/src/shape/variableKey…).
- **Invitation** — id, eventId, inviteeId, code, qrToken, personalizedData, status.
- **Package** — id, name, price, interval, smsCredits, whatsappCredits, features[], eventLimit.
- **Subscription** — id, userId, packageId, status (`pending|active|expired`), startDate, endDate.
- **Payment** — id, userId, packageId, amount, method, proofUrl, status (`pending|approved|rejected`), createdAt.
- **MessageLog** — id, invitationId, channel (`sms|whatsapp|email`), to, status, sentAt.
- **Setting** — key/value (general, api, security groups).

---

## 3. Backend API (FastAPI) — routes under `/api`

### Auth (mock, no real security)
- `POST /auth/login` → `{ token, user }` with role
- `POST /auth/signup` → creates agent, returns OTP step
- `POST /auth/verify-otp` → confirms account
- `POST /auth/forgot-password` → mock reset

### Events
- `GET /events` · `GET /events/{id}` · `POST /events` · `PUT /events/{id}` · `DELETE /events/{id}`

### Invitees
- `GET /events/{id}/invitees` · `POST /invitees` · `POST /invitees/bulk` · `PUT /invitees/{id}` · `DELETE /invitees/{id}`

### Templates
- `GET /templates` · `GET /templates/{id}` · `POST /templates` · `PUT /templates/{id}` · `DELETE /templates/{id}`

### Invitations & Sending
- `POST /invitations/generate` (per event → all invitees: code + qrToken)
- `POST /invitations/send` (simulate delivery, write message logs)
- `GET /qr/{token}` → PNG QR image

### Subscriptions / Payments
- `GET /packages` · `POST /subscriptions` · `POST /payments/proof`
- Admin: `GET /admin/payments`, `POST /admin/payments/{id}/approve`, `POST /admin/payments/{id}/reject`

### Admin & Stats
- `GET /admin/stats` · `GET /admin/users` · `PUT /admin/users/{id}`
- `GET /admin/settings` · `PUT /admin/settings`
- `GET /admin/logs`
- `GET /stats/agent` (agent dashboard summary)

---

## 4. Frontend Screens

### Marketing
- `/` — Landing page: hero, feature highlights, pricing (from `/packages`), CTA → signup.

### Auth — `(auth)`
- `/login` — email + password, role-based redirect.
- `/signup` — multi-step (details → OTP verify).
- `/forgot-password` — request reset.

### Agent — `(agent)` (sidebar + topbar shell)
- `/dashboard` — stat cards (events, invitees, sent, delivery %, RSVP, credits) + charts.
- `/events` — list; `/events/new` & `/events/[id]` create/edit (name, type, date, time, location, organizer, banner).
- `/invitees` — table per event; manual add; **CSV/Excel bulk upload** (parsed client-side); edit/delete.
- `/templates` — gallery + assign to event.
- `/templates/[id]/edit` — **Canva-style editor**:
  - Drag/drop canvas, absolute-positioned layers.
  - Layer types: text, image, shape, QR, **dynamic variable** (`{{name}}`, `{{event}}`…).
  - Select / move / resize, layer panel (reorder, lock, delete), properties panel.
  - Undo / redo, zoom, save design.
- `/send` — wizard: select event → template → invitees → preview personalized cards → send → live status table (simulated).

### Admin — `(admin)` (sidebar + topbar shell)
- `/admin` — dashboard: total users, revenue, SMS/WhatsApp usage, pending approvals, charts.
- `/admin/users` — user management table.
- `/admin/subscriptions` — plans & active subscriptions.
- `/admin/payments` — manual payment approvals (approve/reject + proof preview).
- `/admin/templates` — platform template management.
- `/admin/settings` — tabs: General (name/logo/theme/maintenance), API (SMS/WhatsApp/SMTP/storage forms), Security.
- `/admin/logs` — system/audit log list.

---

## 5. Frontend Infrastructure
- `lib/api.ts` — typed fetch wrapper to `/api/...`.
- `lib/auth.tsx` — mock session context (role, user) via localStorage.
- `lib/types.ts` — shared TS types matching backend models.
- shadcn/ui: button, card, table, dialog, form, input, select, tabs, sidebar, badge, chart, dropdown, sonner (toasts).
- Theme tokens in `app/globals.css` — trustworthy SaaS base with a creative/celebratory accent.

---

## 6. Out of Scope (deferred to later iterations)
- Real Postgres/Prisma DB (currently in-memory; wiped on backend restart).
- Real Twilio SMS/WhatsApp, real SMTP email, real S3/Cloudinary uploads.
- Redis/BullMQ background queue (delivery simulated synchronously).
- Real JWT/refresh tokens, real OTP delivery, password hashing, RBAC enforcement.

---

## 7. Build Order
1. Cleanup stray Angular file + root `vercel.json`.
2. Backend: `pyproject.toml`, `store.py`, `main.py`.
3. Frontend scaffold: configs, `globals.css`, layout, lib utils.
4. Marketing + auth screens.
5. Agent shell + dashboard + events + invitees.
6. Template gallery + Canva-style editor.
7. Send-invitation wizard.
8. Admin shell + all admin screens.
9. Browser verification pass.
