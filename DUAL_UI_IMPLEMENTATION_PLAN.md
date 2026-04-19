# Kurnool Mall: Dual UI Implementation Plan
## Shopping vs Services Mode Architecture

**Date Created:** April 19, 2026  
**Status:** Planning Phase  
**Reference:** Swiggy/Instamart Dual Tab UI Pattern

---

## 📋 AUDIT SUMMARY

### Current State Analysis
```
✅ Existing Structure:
  - Customer layout: src/app/(customer)/layout.tsx
  - Shopping pages: /products, /categories, /cart, /checkout, /orders
  - Services pages: /services, /services/[category], /services/book, /services/bookings
  - Bottom navigation: 5 items (Home, Services, Cart, Orders, Account)
  - Header: Single header with search
  - Context: No mode-aware state management

⚠️ Issues to Address:
  - Mixed shopping and services in single interface
  - No visual separation between modes
  - Navigation items show both modes simultaneously
  - Cart logic doesn't distinguish between shopping/services
  - No preference persistence for user mode selection
  - Search doesn't differentiate between products and services
```

### Current Page Structure
```
Shopping Flow:
  / → Product Home
  /products/[id] → Product Details
  /categories/[slug] → Category Listing
  /search → Product Search
  /cart → Shopping Cart
  /checkout → Checkout
  /orders → Order History

Services Flow:
  /services → Services Home
  /services/[category] → Service Category
  /services/book/[packageId] → Booking Page
  /services/halls → Event Halls
  /services/halls/[id] → Hall Details
  /services/bookings → Booking History
```

---

## 🎯 PROPOSED DUAL UI ARCHITECTURE

### 1. **Mode Structure**
```
Two Primary Modes:
├── SHOPPING_MODE
│   ├── Browse Products by Category
│   ├── Search Products
│   ├── Add to Cart
│   ├── Checkout
│   └── Order Management
│
└── SERVICES_MODE
    ├── Browse Services (Plumbing, Electronics, Event Halls, etc.)
    ├── Search Services & Providers
    ├── Book Services
    ├── Manage Bookings
    └── Provider Ratings
```

### 2. **Header Design** (Inspired by Swiggy)
```
┌─────────────────────────────────────┐
│ 🏪 Kurnool Mall    Location    👤  │
├──────────────────────────────────────┤
│  [🛍️ Shopping] [🔧 Services]       │  ← Tab Toggle
├──────────────────────────────────────┤
│ 🔍 Search (mode-specific) ...  [🔔] │
├──────────────────────────────────────┤
│ Filter buttons (mode-specific)       │
└──────────────────────────────────────┘
```

### 3. **Navigation Context States**
```typescript
type UIMode = 'shopping' | 'services'

interface ModeContext {
  mode: UIMode
  setMode: (mode: UIMode) => void
  
  // Shopping-specific
  cartItems: CartItem[]
  totalItems: number
  
  // Services-specific
  bookingItems: BookingItem[]
  totalBookings: number
}
```

---

## 📁 FILE STRUCTURE CHANGES

### New Files to Create
```
src/
├── lib/
│   ├── context/
│   │   ├── UIContextProvider.tsx      (NEW)
│   │   └── useUIMode.ts               (NEW)
│   └── hooks/
│       └── use-ui-mode.ts             (NEW)
│
├── components/
│   ├── shared/
│   │   ├── mode-toggle-header.tsx     (NEW)
│   │   ├── mode-toggle-tabs.tsx       (NEW)
│   │   └── mode-based-search.tsx      (NEW)
│   │
│   └── customer/
│       ├── shopping/
│       │   ├── shopping-layout.tsx    (NEW)
│       │   ├── shopping-nav.tsx       (NEW)
│       │   └── product-filter.tsx     (NEW)
│       │
│       └── services/
│           ├── services-layout.tsx    (NEW)
│           ├── services-nav.tsx       (NEW)
│           └── service-filter.tsx     (NEW)
│
└── app/
    ├── lib/
    │   ├── ui-mode-provider.tsx       (NEW - Wrapper)
    │
    └── (customer)/
        ├── layout.tsx                 (MODIFY)
        ├── page.tsx                   (MODIFY - Add mode toggle)
        └── _components/
            └── mode-selector.tsx      (NEW)
```

### Modified Files
```
src/components/customer/bottom-nav.tsx
  - Hide/show items based on mode
  - Shopping mode: Home, Categories, Cart, Orders, Account
  - Services mode: Home, Services, Bookings, Orders, Account

src/app/(customer)/page.tsx
  - Add mode tabs at top
  - Switch between shopping and services home

src/app/(customer)/layout.tsx
  - Wrap with UI Mode Provider
  - Pass mode context to children
```

---

## 🔧 IMPLEMENTATION STRATEGY

### Step 1: Create UI Mode Context
```typescript
// lib/context/UIContextProvider.tsx
export interface UIModeContextType {
  mode: 'shopping' | 'services'
  setMode: (mode: 'shopping' | 'services') => void
  preferences: {
    lastMode: 'shopping' | 'services'
    defaultMode: 'shopping' | 'services'
    rememberMode: boolean
  }
}

export const UIContext = createContext<UIModeContextType | null>(null)
```

**Key Features:**
- Persist mode selection in localStorage
- Auto-load last used mode on app start
- Allow users to set default preference
- Context available throughout app

---

### Step 2: Create Mode-Toggle Header Component
```typescript
// components/shared/mode-toggle-header.tsx
Features:
- Animated tab switching (Shopping ↔ Services)
- Active indicator under selected tab
- Icon + Label for each mode
- Mode-specific search placeholder
- Location display
- Notification bell
```

**Design Reference:**
```
┌────────────────────────────────────────┐
│ Kurnool Mall  📍 Location    🔔  👤   │
├────────────────────────────────────────┤
│ [🛍️ Shopping (active)] [🔧 Services]  │
│ ──────                                  │ (underline indicator)
├────────────────────────────────────────┤
│ 🔍 Search for products & shops... 📋  │
└────────────────────────────────────────┘
```

---

### Step 3: Update Bottom Navigation (Context-Aware)
```
Shopping Mode Nav:
┌──────────────────────────────┐
│ 🏠 | 🏪* | 🛒** | 📦 | 👤   │
│    Home  Browse Cart Orders Account
└──────────────────────────────┘

Services Mode Nav:
┌──────────────────────────────┐
│ 🏠 | 🔧* | 📅 | 📦 | 👤     │
│    Home  Browse Bookings Orders Account
└──────────────────────────────┘
```

**Navigation Items:**
```typescript
const shoppingNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shopping', label: 'Shop', icon: ShoppingBag },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/account', label: 'Account', icon: User },
]

const servicesNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/services/bookings', label: 'Bookings', icon: Calendar },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/account', label: 'Account', icon: User },
]
```

---

### Step 4: Refactor Home Page
```typescript
// app/(customer)/page.tsx
Default Home Page Shows:
  ├── Mode Toggle Tabs (Shopping/Services)
  ├── Delivery Promise Strip
  ├── Mode-Specific Content:
  │   ├── SHOPPING: Categories, Flash Sales, Products, Vendors
  │   └── SERVICES: Service Categories, Providers, Packages, Halls
  └── User Preference-based Default View
```

**Home Page Structure:**
```
┌─────────────────────────┐
│  [🛍️ Shopping] [🔧 Svcs]│ (Toggle)
├─────────────────────────┤
│ Express 2hr | Same Day   │ (Promise)
├─────────────────────────┤
│                         │
│  SHOPPING MODE:        │
│  - 8 Categories        │
│  - Flash Sales         │
│  - 12 Latest Products  │
│  - 6 Top Vendors       │
│                         │
│  SERVICES MODE:        │
│  - 6 Service Categories│
│  - Featured Providers  │
│  - Popular Packages    │
│  - Event Halls         │
│                         │
└─────────────────────────┘
```

---

### Step 5: Mode-Aware Search
```typescript
// components/shared/mode-based-search.tsx
Features:
- Shopping Mode:
  ├── Search products by name
  ├── Filter by vendor
  ├── Filter by category
  └── Filter by price range

- Services Mode:
  ├── Search services by name
  ├── Filter by provider
  ├── Filter by service type
  └── Filter by location/rating
```

---

### Step 6: Cart & Bookings Separation
```typescript
// Update cart store logic
interface CartStore {
  // Shopping
  shoppingCart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  
  // Services (Bookings)
  serviceBookings: BookingItem[]
  addToBookings: (booking: BookingItem) => void
  removeFromBookings: (id: string) => void
  
  // Mode
  getCurrentCart: (mode: 'shopping' | 'services') => CartItem[] | BookingItem[]
}
```

---

## 🎨 UI/UX DESIGN GUIDELINES

### Color & Styling
```css
/* Shopping Mode */
--shopping-primary: #1A56DB (Current Blue)
--shopping-accent: #FF6B35 (Orange for CTAs)

/* Services Mode */
--services-primary: #1A56DB
--services-accent: #00A86B (Green for booking CTAs)

/* Shared */
--success: #00A86B
--error: #FF3B30
--warning: #FF9500
```

### Animation Transitions
```
Tab switching: 300ms ease-in-out
Navigation change: 200ms cubic-bezier
Mode change: Smooth fade + slide
```

### Typography
```
Header: Noto Sans Telugu + Inter
Body: Inter
Labels: Noto Sans Telugu (Indian languages)
```

---

## 📊 DATABASE CONSIDERATIONS

### No Changes Required (Existing Structure Supports):
- **products** table ✅
- **services** table (with vendors as providers) ✅
- **orders** table (handles both) ✅
- **bookings** table ✅
- **cart_items** table ✅

### Optional Enhancements:
```sql
-- Add mode preference to users
ALTER TABLE users ADD COLUMN 
  preferred_mode VARCHAR(20) DEFAULT 'shopping';

-- Add mode tracking to orders
ALTER TABLE orders ADD COLUMN 
  order_mode VARCHAR(20) DEFAULT 'shopping';

-- Analytics for mode usage
CREATE TABLE mode_analytics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  mode VARCHAR(20),
  timestamp TIMESTAMP DEFAULT now(),
  action VARCHAR(50)
);
```

---

## 🚀 IMPLEMENTATION TIMELINE

```
Phase 1: Context & Provider Setup
  ├── Create UIMode Context
  ├── Create useUIMode hook
  └── Create Provider wrapper
  Duration: 2 hours

Phase 2: Header Refactoring
  ├── Create mode toggle component
  ├── Integrate mode-aware search
  └── Update styling
  Duration: 3 hours

Phase 3: Navigation Updates
  ├── Update BottomNav component
  ├── Create mode-specific nav items
  └── Add animations
  Duration: 2.5 hours

Phase 4: Home Page Refactor
  ├── Add mode tabs
  ├── Separate content by mode
  ├── Add persistence logic
  └── Test mode switching
  Duration: 3 hours

Phase 5: Cart & Services Separation
  ├── Update cart store
  ├── Update checkout logic
  ├── Update bookings flow
  └── Test mode-specific flows
  Duration: 4 hours

Phase 6: Testing & Polish
  ├── Mobile responsiveness
  ├── Animation smoothness
  ├── Performance optimization
  ├── Cross-browser testing
  └── User preference persistence
  Duration: 3 hours

TOTAL: ~17.5 hours of development

```

---

## ✅ TESTING CHECKLIST

### Functional Testing
```
Shopping Mode:
☐ Browse products by category
☐ Search for products
☐ Add/remove items from cart
☐ Proceed to checkout
☐ View order history

Services Mode:
☐ Browse services by category
☐ Search for services
☐ Book a service/hall
☐ Manage bookings
☐ Cancel bookings

Mode Switching:
☐ Switch between modes smoothly
☐ Cart persists when switching modes
☐ Bookings persist when switching modes
☐ Last used mode is remembered
☐ Navigation updates correctly
```

### Mobile Responsiveness
```
☐ Header toggles display correctly on mobile
☐ Bottom nav items resize appropriately
☐ Touch targets are at least 44x44px
☐ No horizontal scroll issues
☐ Safe area insets respected
☐ Notch/punch-hole handling
```

### Performance
```
☐ Mode switching < 200ms
☐ Page load time unaffected
☐ No memory leaks on mode changes
☐ Context updates don't cause unnecessary re-renders
☐ localStorage access is non-blocking
```

---

## 🔄 DEPLOYMENT STRATEGY

### Pre-Deployment
```
1. Merge to develop branch
2. Run full test suite
3. Build optimization checks
4. Bundle size analysis
5. Performance profiling
```

### Deployment Steps
```
1. Create feature branch: feature/dual-ui-mode
2. Implement all phases
3. Create PR with detailed documentation
4. Merge to main after approval
5. Deploy to production via Vercel
6. Monitor analytics and user behavior
```

### Post-Deployment Monitoring
```
- Track mode usage patterns
- Monitor performance metrics
- Check for reported bugs
- Gather user feedback
- Iterate on UX based on analytics
```

---

## 📈 EXPECTED OUTCOMES

### User Experience Improvements
```
✨ Clearer Interface
  - Users immediately see shopping vs services
  - Reduced cognitive load
  - Cleaner navigation

✨ Better Organization
  - Dedicated flows for each mode
  - Context-aware search
  - Mode-specific filtering

✨ Increased Engagement
  - Users may explore services while shopping (or vice versa)
  - Easier mode switching reduces friction
  - Improved mobile UX
```

### Business Metrics
```
📊 Expected KPI Changes
  - Increased services browsing (if previously hidden)
  - Longer session duration
  - Improved conversion rates
  - Better mode preference insights
  - Clearer user behavior segmentation
```

---

## 🛠️ TECHNICAL DEBT & FUTURE ENHANCEMENTS

### Phase 2 Features (Post-Launch)
```
1. Personalized home feed based on mode
2. Smart mode suggestion based on user behavior
3. Combined cart (shopping + services together)
4. Cross-mode recommendations
5. Mode-specific promotions/offers
6. Voice search with mode awareness
7. AR product preview in shopping mode
8. Virtual consultations in services mode
```

---

## 📝 SUCCESS CRITERIA

```
✅ All phases completed on schedule
✅ Mobile-first responsive design achieved
✅ No regression in existing features
✅ Mode switching < 200ms latency
✅ User preference persistence working
✅ Analytics tracking implemented
✅ Zero errors in error tracking tools
✅ > 98% Lighthouse performance score
✅ Positive user feedback in analytics
✅ Successfully deployed to production
```

---

## 🤝 Team Coordination

### Required Approvals
```
- [ ] Product Manager (Feature scope)
- [ ] Design Lead (UI/UX review)
- [ ] Backend Lead (API changes, if any)
- [ ] QA Lead (Testing plan)
```

### Communication Plan
```
- Weekly standups on progress
- Daily Slack updates
- Weekly design review meetings
- Pre-launch testing coordination
```

---

**End of Document**

For questions or clarifications, refer to the implementation phases above.
