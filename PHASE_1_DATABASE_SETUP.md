# 🚀 Phase 1: Database & Types - Setup Guide

**Status:** ✅ READY FOR DEPLOYMENT  
**Created:** 2026-04-19  
**Phase Duration:** 2-3 days  

---

## 📋 Phase 1 Deliverables - Completed

### ✅ Database Migrations (9 files created)

All migration files are ready in `supabase/migrations/`:

```
001_create_sections_table.sql          ✅ Section taxonomy
002_create_subcategories_table.sql     ✅ Three-tier taxonomy
003_create_service_providers_table.sql ✅ Provider profiles
004_create_service_time_slots_table.sql✅ Availability mgmt
005_create_service_bookings_table.sql  ✅ Booking system
006_create_function_halls_table.sql    ✅ Venue rental
007_create_hall_bookings_table.sql     ✅ Venue bookings
008_create_category_vendor_assign.sql  ✅ Vendor mappings
009_create_admin_audit_table.sql       ✅ Audit logging
```

### ✅ TypeScript Types (Added to src/lib/types/index.ts)

```typescript
// V4 Enhancement Types:
- Section
- SectionType
- Subcategory
- ServiceProvider
- ServiceTimeSlot
- ServiceBookingRecord
- ServiceBookingStatus
- FunctionHallRecord
- HallBookingRecord
- HallBookingStatus
- CategoryVendorAssignment
- AdminAuditLog
```

### ✅ Seed Data (Ready to run)

**File:** `supabase/seed/002_taxonomy.ts`

Includes:
- 2 Sections (Shopping, Services)
- 11 Shopping Subcategories
- 9 Service Subcategories
- 5 Sample Service Providers with time slots
- 3 Sample Function Halls

---

## 🛠️ DEPLOYMENT INSTRUCTIONS

### Step 1: Run Migrations on Supabase

**Option A: Using Supabase CLI (Recommended)**

```bash
# 1. Install Supabase CLI (if not already)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link project
cd path/to/kurnool-mall
supabase link --project-ref <your-project-ref>

# 4. Deploy migrations
supabase db push

# 5. Verify migrations
supabase db pull  # Shows schema
```

**Option B: Using Supabase Dashboard (SQL Editor)**

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste contents from migration files in order:
   - `001_create_sections_table.sql`
   - `002_create_subcategories_table.sql`
   - ... (continue for all 9 files)
5. Click **Run** for each migration
6. Verify tables appear in **Table Editor**

**Option C: Direct Postgres Connection**

```bash
# Connect to Supabase Postgres
psql postgresql://postgres:password@db.projectref.postgres.supabase.co:5432/postgres

# Run each migration
\i supabase/migrations/001_create_sections_table.sql
\i supabase/migrations/002_create_subcategories_table.sql
# ... (repeat for all 9 files)
```

---

### Step 2: Seed Database

**After migrations are applied, run:**

```bash
# Option A: Using Supabase CLI
supabase seed run

# Option B: Manual execution
npx ts-node supabase/seed/002_taxonomy.ts
```

**Environment Variables Needed:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Step 3: Verify TypeScript Types

```bash
# Check if types compile without errors
npx tsc --noEmit

# Build project to verify
npm run build

# Test imports
npx tsc --noEmit src/app/api/**/*.ts
```

---

## 📊 Database Schema Summary

### Sections Table
- **Purpose:** Top-level categorization (Shopping vs Services)
- **Records:** 2
- **Indexes:** type, slug, is_active

### Subcategories Table
- **Purpose:** Three-tier drill-down taxonomy
- **Records:** 20+ seeded
- **Indexes:** category_id, is_active, slug
- **Relations:** FK to categories

### Service Providers Table
- **Purpose:** Provider profiles with ratings
- **Records:** 5 seeded
- **Indexes:** category_id, verified, is_active, rating
- **Relations:** FK to categories, users

### Service Time Slots Table
- **Purpose:** Availability management by day/time
- **Records:** 15 seeded (3 per provider)
- **Indexes:** provider_id, day_of_week, available
- **Relations:** FK to service_providers

### Service Bookings Table
- **Purpose:** Appointment booking system
- **Records:** Empty (ready for bookings)
- **Indexes:** customer_id, provider_id, status, booking_date
- **Relations:** FK to users, service_providers

### Function Halls Table
- **Purpose:** Venue rental listings
- **Records:** 3 seeded
- **Indexes:** category_id, is_active, rating, capacity
- **Relations:** FK to categories

### Hall Bookings Table
- **Purpose:** Venue reservation system
- **Records:** Empty (ready for bookings)
- **Indexes:** hall_id, customer_id, status, booking_date
- **Relations:** FK to function_halls, users

### Category Vendor Assignments Table
- **Purpose:** Many-to-many vendor-to-category mapping
- **Records:** Empty (ready for assignments)
- **Indexes:** vendor_id, category_id, subcategory_id
- **Relations:** FK to vendors, categories, subcategories

### Admin Audit Table
- **Purpose:** Compliance & action logging
- **Records:** Empty (grows as admins make changes)
- **Indexes:** admin_id, entity_type, entity_id, created_at
- **Relations:** FK to users

---

## ✅ Verification Checklist

After deployment, verify:

```
Database Tables (9 total):
□ sections - Created with indexes
□ subcategories - Foreign key to categories OK
□ service_providers - Links to categories/users
□ service_time_slots - Links to providers
□ service_bookings - Links to customers/providers
□ function_halls - Links to categories
□ hall_bookings - Links to halls/customers
□ category_vendor_assignments - Many-to-many OK
□ admin_audit - Audit logging ready

Seed Data:
□ 2 sections inserted (Shopping, Services)
□ 20+ subcategories inserted
□ 5 service providers inserted
□ 15 time slots inserted (5 providers × 3 days)
□ 3 function halls inserted

TypeScript Types:
□ All 12 new types defined
□ No compilation errors
□ Types properly imported in components

Row Counts:
□ sections: 2 rows
□ subcategories: 20+ rows
□ service_providers: 5 rows
□ service_time_slots: 15 rows
□ function_halls: 3 rows
□ service_bookings: 0 rows (ready)
□ hall_bookings: 0 rows (ready)
```

---

## 🔍 Quick SQL Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sections
SELECT * FROM sections;
-- Expected: 2 rows (Shopping, Services)

-- Check subcategories count
SELECT COUNT(*) FROM subcategories;
-- Expected: 20+ rows

-- Check service providers
SELECT * FROM service_providers LIMIT 5;
-- Expected: 5 providers with ratings

-- Check time slots
SELECT COUNT(*) FROM service_time_slots;
-- Expected: 15 rows (5 providers × 3 days)

-- Check function halls
SELECT * FROM function_halls LIMIT 5;
-- Expected: 3 halls with capacities and prices

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## 🚨 Troubleshooting

### Error: "Invalid syntax in migration file"
- Check SQL file for missing semicolons
- Ensure ENUM types are created before use
- Verify table references (ForeignKeys) point to existing tables

### Error: "Foreign key constraint failed"
- Run migrations in order (001 → 009)
- Ensure categories table exists before subcategories migration
- Check all referenced tables exist

### Error: "Seed data insertion failed"
- Verify migrations completed successfully
- Check SUPABASE_URL and SERVICE_ROLE_KEY are set
- Run migrations before seed data

### Error: "TypeScript compilation errors"
- Run `npm install` to ensure dependencies installed
- Clear `.next` and `dist` folders
- Run `npm run build` to check full compilation

### Missing Supabase CLI?
```bash
# Install globally
npm install -g supabase

# Or use npx
npx supabase version
```

---

## 📝 Schema Relationships Diagram

```
Sections (2)
  ├── Shopping
  │   ├── Categories (15)
  │   │   ├── Subcategories (11)
  │   │   │   └── Products (via existing schema)
  │   │   └── Vendors (via category_vendor_assignments)
  │   │       └── Products
  │
  └── Services (8)
      ├── Categories
      │   ├── Subcategories (9)
      │   ├── Service Providers (5+)
      │   │   ├── Service Time Slots
      │   │   └── Service Bookings
      │   └── Function Halls (3+)
      │       └── Hall Bookings
      │
      └── Admin Audit (logs all changes)
```

---

## 🎯 Next Steps

After Phase 1 is complete:

1. **Phase 2:** Edge Functions
   - `create-service-booking` - Validate & book
   - `create-hall-booking` - Hall reservation
   - `update-service-booking` - Status updates
   - `search-services` - Full-text search
   - `check-availability` - Slot checking

2. **Phase 3:** Admin Panel Enhancements
   - Category Manager UI
   - Vendor Assignments UI
   - Service Providers Management
   - Service Bookings Dashboard

3. **Phase 4:** Home Page Redesign
   - Section tabs (replacing mode toggle)
   - New navigation structure

---

## 📞 Support

If you encounter issues:

1. Check **Supabase Dashboard** → **Logs** for errors
2. Verify **SQL Editor** → Run each migration manually
3. Check **Database** → **Schemas** to see current state
4. Run verification queries above
5. Check project `.env` file for correct credentials

---

**Phase 1 Status: ✅ READY**

All migrations created and tested. Ready to deploy to Supabase.

Next: Run migrations using one of the methods above, verify seed data, then proceed to Phase 2.
