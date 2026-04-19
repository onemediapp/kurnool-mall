# Kurnool Mall 🛒

> **Hyperlocal multi-vendor e-commerce platform for Kurnool, Andhra Pradesh, India.**
> Shop local groceries, electronics, fashion, electricals, plumbing, building materials,
> stationery, and sweets from local vendors — delivered fast.

---

## Tech Stack

| Layer       | Technology                        | Version   |
|-------------|-----------------------------------|-----------|
| Frontend    | Next.js (App Router)              | 14.1.0    |
| Styling     | Tailwind CSS                      | ^3.4.1    |
| Language    | TypeScript                        | ^5        |
| Backend     | Supabase (Postgres + Edge Fns)    | ^2.39.0   |
| Auth        | Supabase Phone OTP                | —         |
| Payments    | Razorpay                          | Test mode |
| State       | Zustand (persist)                 | ^4.5.1    |
| UI          | Radix UI + Lucide React           | —         |

---

## Project Structure

```
kurnool-mall/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── middleware.ts                   ← Route protection (vendor/admin/checkout/orders)
│   │
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout, Noto Sans Telugu
│   │   ├── login/page.tsx              ← Phone OTP login (2-step)
│   │   │
│   │   ├── (customer)/                 ← Mobile-first, max-w-md, BottomNav
│   │   │   ├── page.tsx                ← Home (ISR 60s)
│   │   │   ├── search/page.tsx         ← Debounced full-text search
│   │   │   ├── categories/[slug]/
│   │   │   ├── products/[id]/
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx       ← Razorpay integrated
│   │   │   ├── orders/[id]/page.tsx    ← Realtime tracker
│   │   │   └── account/               ← Language toggle, addresses
│   │   │
│   │   ├── (vendor)/                   ← Full-width, dark sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── products/page.tsx       ← Product CRUD + image upload
│   │   │   └── orders/page.tsx         ← Realtime order management
│   │   │
│   │   ├── (admin)/                    ← Full-width, dark sidebar
│   │   │   ├── orders/page.tsx         ← Rider assignment
│   │   │   └── vendors/page.tsx        ← KYC approval
│   │   │
│   │   └── api/
│   │       ├── auth/logout/route.ts
│   │       └── webhooks/razorpay/route.ts
│   │
│   ├── components/
│   │   ├── customer/
│   │   │   ├── bottom-nav.tsx
│   │   │   └── product-card.tsx
│   │   └── shared/index.tsx
│   │
│   └── lib/
│       ├── supabase/{client,server}.ts
│       ├── hooks/{use-cart,use-auth}.ts
│       ├── types/index.ts
│       └── utils/index.ts
│
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   └── 002_helpers.sql
    ├── functions/
    │   ├── create-order/index.ts
    │   ├── update-order-status/index.ts
    │   └── verify-payment/index.ts
    └── seed/index.ts
```

---

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (`npm install -g supabase`)
- Supabase account (free tier works)
- Razorpay account (test mode)

---

## Setup Guide

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd kurnool-mall
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings > API
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings > API (keep secret!)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — from Razorpay dashboard
- `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- `RAZORPAY_WEBHOOK_SECRET` — from Razorpay webhook settings

### 3. Link Supabase project and push migrations

```bash
supabase login
supabase link --project-ref <your-project-id>
supabase db push
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy create-order
supabase functions deploy update-order-status
supabase functions deploy verify-payment
```

### 5. Set Edge Function secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxx
supabase secrets set RAZORPAY_KEY_SECRET=your-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Configure Supabase Auth — Phone OTP

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Phone** provider
3. For development, you can use the built-in **Twilio** test credentials
4. For production, set up Twilio or MessageBird with your credentials

### 7. Seed the database

```bash
npm run db:seed
```

This creates:
- 1 admin user: `+919000000001`
- 3 approved vendors with products
- 24 total products with realistic Kurnool items

### 8. Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## User Roles

| Role     | Phone           | Access                                         |
|----------|-----------------|------------------------------------------------|
| Admin    | +919000000001   | `/admin/*` — all orders, vendor KYC, rider assignment |
| Vendor 1 | +919000000002   | `/vendor/*` — own products and orders          |
| Vendor 2 | +919000000003   | `/vendor/*` — own products and orders          |
| Vendor 3 | +919000000004   | `/vendor/*` — own products and orders          |
| Customer | any number      | `/` — browse, cart, checkout, order tracking   |

> In Supabase test mode, OTP is always `123456` or check the logs.

---

## Order Flow

```
Customer places order
        │
        ▼
[PENDING] ── Vendor accepts ──► [ACCEPTED]
   │                                │
   └── Vendor rejects ──► [REJECTED]  │
   └── Customer cancels ──► [CANCELLED]
                               │
                          Vendor prepares ──► [PREPARING]
                                                  │
                                           Vendor marks ready ──► [READY]
                                                                      │
                                                         Admin assigns rider ──► [OUT_FOR_DELIVERY]
                                                                                         │
                                                                                Admin marks delivered ──► [DELIVERED]
```

### Delivery in MVP (Manual Rider Assignment)

- No rider mobile app in MVP
- Admin manually assigns a rider (name + phone) via the admin panel
- Customer sees rider name and phone number on their order detail page
- Admin marks order as "Delivered" when confirmed

---

## Razorpay Webhook Setup

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `refund.processed`
4. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET` env var

---

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard or:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all other env vars
```

### Edge Functions (already deployed via Supabase CLI)

```bash
# Re-deploy all functions after changes
supabase functions deploy --no-verify-jwt create-order
supabase functions deploy --no-verify-jwt update-order-status
supabase functions deploy --no-verify-jwt verify-payment
```

---

## Bilingual Support (Telugu + English)

- All product/category names stored as `name_en` + `name_te` in the database
- User language preference stored in `users.language_pref` ('en' | 'te')
- Toggle available in `/account` page
- Telugu font: **Noto Sans Telugu** (Google Fonts, preloaded in root layout)

---

## NestJS Migration Path

This MVP uses Supabase Edge Functions as the backend. When scaling to NestJS:

1. All Edge Functions → NestJS controllers/services (same business logic)
2. Change `NEXT_PUBLIC_SUPABASE_URL` to `NEXT_PUBLIC_API_URL` pointing to your NestJS server
3. Update fetch calls in `checkout/page.tsx` and `vendor/orders/page.tsx` to use `NEXT_PUBLIC_API_URL`
4. Keep Supabase for Postgres, Auth, Storage, and Realtime
5. NestJS uses `service_role` key for DB operations (same as Edge Functions)

The API response shape `{ data: T, error: null }` is already NestJS-compatible.

---

## Phase 2 Roadmap

- [ ] Rider mobile app (React Native / Flutter)
- [ ] Real-time rider location tracking on map
- [ ] Push notifications (FCM)
- [ ] Product reviews and ratings
- [ ] Vendor analytics dashboard with charts
- [ ] Coupon/discount system
- [ ] Multiple images per product (carousel)
- [ ] NestJS backend migration
- [ ] WhatsApp order notifications
- [ ] Cash on Delivery confirmation photos
- [ ] Hyperlocal area-based delivery zones
- [ ] Automated commission settlement reports

---

## Architecture Notes

- **Customer app**: Mobile-first, `max-w-md mx-auto` — simulates a phone frame on desktop
- **Vendor/Admin panels**: Full-width with sidebar navigation
- **Cart**: Single-vendor enforced (Zustand + localStorage persistence)
- **RLS**: Every Supabase table has Row Level Security enabled
- **Writes**: All order writes use `service_role` via Edge Functions (bypasses RLS safely)
- **Realtime**: `orders` table subscribed via Supabase Realtime channels

---

*Built with ❤️ for Kurnool, Andhra Pradesh — Made in India 🇮🇳*
