# Dual UI Architecture - Visual Diagrams

## 1. USER FLOW COMPARISON

### BEFORE (Current - Mixed UI)
```
┌─────────────────────────────────────────┐
│          Kurnool Mall Home              │
│     (Everything in one interface)       │
├─────────────────────────────────────────┤
│ 🏠 | Services | 🛒 | 📦 | 👤           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Browse all products (confusing)     │ │
│ │ + Services mixed in somehow         │ │
│ │ No clear separation                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Problem: Users don't know whether to shop or book services
```

### AFTER (Proposed - Dual UI)
```
┌─────────────────────────────────────────┐
│      Kurnool Mall Home                  │
│  [🛍️ Shopping] [🔧 Services]           │
├─────────────────────────────────────────┤
│ Clear separation between modes          │
│                                         │
│ SHOPPING MODE          or    SERVICES   │
│ ┌──────────────────┐       ┌─────────┐ │
│ │ Browse Products  │       │ Browse  │ │
│ │ Add to Cart      │       │ Services│ │
│ │ Checkout        │       │ Book    │ │
│ └──────────────────┘       │ Service │ │
│                             └─────────┘ │
├─────────────────────────────────────────┤
│ 🏠 | Browse | 🛒/📅 | 📦 | 👤          │
│    (Dynamic based on mode)              │
└─────────────────────────────────────────┘
```

---

## 2. COMPONENT HIERARCHY

```
App (Root)
│
├── UIContextProvider (NEW)
│   └── User mode preference stored & managed
│
├── (customer) Layout
│   │
│   ├── ModeToggleHeader (NEW)
│   │   ├── Shopping Tab
│   │   ├── Services Tab
│   │   └── Mode-specific Search
│   │
│   ├── Page Content
│   │   ├── (Mode: Shopping)
│   │   │   ├── Categories Carousel
│   │   │   ├── Flash Sales
│   │   │   ├── Products Grid
│   │   │   └── Vendor Cards
│   │   │
│   │   └── (Mode: Services)
│   │       ├── Service Categories
│   │       ├── Featured Providers
│   │       ├── Service Packages
│   │       └── Event Halls
│   │
│   ├── ContextAwareBotNav (MODIFIED)
│   │   ├── (Shopping Mode)
│   │   │   ├── Home
│   │   │   ├── Shop
│   │   │   ├── Cart
│   │   │   ├── Orders
│   │   │   └── Account
│   │   │
│   │   └── (Services Mode)
│   │       ├── Home
│   │       ├── Services
│   │       ├── Bookings
│   │       ├── Orders
│   │       └── Account
│   │
│   ├── FloatingCartPill (MODIFIED)
│   │   ├── Shows when mode = 'shopping'
│   │   └── Shows booking summary when mode = 'services'
│   │
│   └── Toaster & Notifications

ProductCart (Existing - for shopping)
│
├── CartStore
│   ├── addToCart()
│   ├── removeFromCart()
│   └── getCartTotal()

ServiceBookings (Existing - for services)
│
├── BookingStore
│   ├── addBooking()
│   ├── cancelBooking()
│   └── getBookingTotal()
```

---

## 3. STATE MANAGEMENT FLOW

```
┌────────────────────────────────────────────────────┐
│          UIMode Context Provider                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  State:                                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ mode: 'shopping' | 'services'                │ │
│  │ preferences: {                               │ │
│  │   lastMode: string                           │ │
│  │   defaultMode: string                        │ │
│  │   rememberMode: boolean                      │ │
│  │ }                                            │ │
│  │ isLoading: boolean                           │ │
│  │ error: string | null                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Methods:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ setMode(mode)                                │ │
│  │ toggleMode()                                 │ │
│  │ savePreferences()                            │ │
│  │ loadPreferencesFromStorage()                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Storage:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ localStorage.setItem('uiMode', mode)         │ │
│  │ localStorage.setItem('uiPreferences', prefs) │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
         │
         ├── Consumed by ModeToggleHeader
         │   └── Displays active tab
         │
         ├── Consumed by ContextAwareBottomNav
         │   └── Shows mode-specific nav items
         │
         ├── Consumed by Home Page
         │   └── Renders mode-specific content
         │
         ├── Consumed by Search Component
         │   └── Filters results by mode
         │
         └── Consumed by Cart/Booking Components
             └── Shows mode-appropriate checkout
```

---

## 4. PAGE ROUTING STRUCTURE

```
/
├── (customer)
│   ├── layout.tsx (MODIFIED - Add UIContextProvider)
│   ├── page.tsx (MODIFIED - Add mode toggle)
│   │
│   ├── /shopping (NEW - Shopping Hub)
│   │   ├── page.tsx (All shopping products)
│   │   ├── [id] (Individual product detail)
│   │   └── ... other shopping routes
│   │
│   ├── /products/[id] (Existing - Product Detail)
│   ├── /categories/[slug] (Existing - Category Page)
│   │
│   ├── /services (Existing - Services Hub)
│   │   ├── page.tsx (Services listing)
│   │   ├── [category] (Service category)
│   │   ├── /book/[packageId] (Booking page)
│   │   ├── /halls (Event halls)
│   │   └── /bookings (User bookings)
│   │
│   ├── /cart (Existing - Shopping Cart)
│   ├── /search (Existing - Search - MODIFIED)
│   ├── /orders (Existing - Order History)
│   ├── /account (Existing - User Account)
│   │
│   ├── /vendor (Existing - Vendor Profile)
│   └── /wishlist (Existing - Wishlist)
│
├── /login (Existing)
├── /(vendor) (Existing)
├── /(provider) (Existing)
├── /(admin) (Existing)
└── ... other routes
```

---

## 5. HEADER TRANSFORMATION

### Shopping Mode Header
```
┌────────────────────────────────────────────┐
│ Kurnool Mall  📍 Kurnool, AP    🔔  👤   │
├────────────────────────────────────────────┤
│ [🛍️ Shopping (active)] [🔧 Services]     │
│  ══════════════════════                    │ (active indicator)
├────────────────────────────────────────────┤
│ 🔍 Search products, shops...   📋         │
├────────────────────────────────────────────┤
│ 🏷️ Offers | 🌟 New | ⭐ Best Sellers    │ (filters)
└────────────────────────────────────────────┘

Features:
- Mode tabs with active indicator
- Shopping-focused search placeholder
- Shopping-relevant filter buttons
- Express delivery promise
```

### Services Mode Header
```
┌────────────────────────────────────────────┐
│ Kurnool Mall  📍 Kurnool, AP    🔔  👤   │
├────────────────────────────────────────────┤
│ [🛍️ Shopping] [🔧 Services (active)]    │
│                  ════════════════          │ (active indicator)
├────────────────────────────────────────────┤
│ 🔍 Search services, providers...          │
├────────────────────────────────────────────┤
│ 🏠 Home | 💍 Events | 🔌 Electrical     │ (filters)
└────────────────────────────────────────────┘

Features:
- Mode tabs with active indicator
- Services-focused search placeholder
- Services-relevant filter buttons
- Delivery/availability information
```

---

## 6. BOTTOM NAVIGATION TRANSFORMATION

### Shopping Mode
```
┌─────────────────────────────────┐
│ 🏠 | 🏪 | 🛒 | 📦 | 👤          │
│    │  │  │  │  │                │
│    │  │  │  │  └─ Account       │
│    │  │  │  └──── Orders        │
│    │  │  └─────── Cart (2)      │ (item count badge)
│    │  └────────── Shop/Browse   │
│    └────────────── Home         │
│                                  │
│ 🏠 Home | 🏪 Shop | 🛒 Cart    │
│         | 📦 Orders | 👤 Account│
└─────────────────────────────────┘

Cart Badge Active: Shows item count
Floating Cart Pill: Visible
Navigation: Optimized for shopping flow
```

### Services Mode
```
┌─────────────────────────────────┐
│ 🏠 | 🔧 | 📅 | 📦 | 👤          │
│    │  │  │  │  │                │
│    │  │  │  │  └─ Account       │
│    │  │  │  └──── Orders        │
│    │  │  └─────── Bookings (1)  │ (booking count badge)
│    │  └────────── Services      │
│    └────────────── Home         │
│                                  │
│ 🏠 Home | 🔧 Serv | 📅 Bookings│
│         | 📦 Orders | 👤 Account│
└─────────────────────────────────┘

Bookings Badge Active: Shows booking count
Floating Cart Pill: Hidden
Navigation: Optimized for services flow
```

---

## 7. HOME PAGE LAYOUT COMPARISON

### Shopping Mode Home
```
┌───────────────────────────────────────┐
│ [🛍️ Shopping] [🔧 Services]        │ ← Mode toggle
├───────────────────────────────────────┤
│ ⚡ Express 2hr | 📦 Same Day | 🎁    │ ← Promise
├───────────────────────────────────────┤
│        [Carousel Banner 1]            │
│        [Carousel Banner 2]            │
│        [Carousel Banner 3]            │
├───────────────────────────────────────┤
│ SHOP BY CATEGORY                      │
│ [🛒] [🍕] [💻] [👕] [⚡] [📚] [🧪] [🍬]
├───────────────────────────────────────┤
│ FLASH SALES 🔥 (Ends in 02:45)       │
│ [Product] [Product] [Product]        │
├───────────────────────────────────────┤
│ LATEST PRODUCTS                       │
│ [Product] [Product]                  │
│ [Product] [Product]                  │
├───────────────────────────────────────┤
│ TOP VENDORS ⭐                        │
│ [Vendor] [Vendor] [Vendor]           │
└───────────────────────────────────────┘
```

### Services Mode Home
```
┌───────────────────────────────────────┐
│ [🛍️ Shopping] [🔧 Services]        │ ← Mode toggle
├───────────────────────────────────────┤
│ 📅 Book Services | 🚗 Quick Service   │ ← Promise
├───────────────────────────────────────┤
│     [Service Banner 1]                │
│     [Service Banner 2]                │
│     [Service Banner 3]                │
├───────────────────────────────────────┤
│ SERVICE CATEGORIES                    │
│ [🔧] [⚡] [🏠] [💍] [🚗] [📱] [🏥] [🍽️]
├───────────────────────────────────────┤
│ FEATURED PROVIDERS ⭐⭐⭐⭐⭐        │
│ [Provider] [Provider] [Provider]     │
├───────────────────────────────────────┤
│ POPULAR PACKAGES 🎁                   │
│ [Package] [Package]                  │
│ [Package] [Package]                  │
├───────────────────────────────────────┤
│ EVENT HALLS & VENUES                 │
│ [Hall] [Hall] [Hall] [Hall]          │
└───────────────────────────────────────┘
```

---

## 8. DATA FLOW DIAGRAM

```
User Opens App
     │
     ▼
┌────────────────────────────┐
│ UIContextProvider Loads    │
│ localStorage for mode      │
└────────────────────────────┘
     │
     ├─── Mode: 'shopping' ────┐
     │                         │
     │                         ▼
     │               ┌──────────────────────┐
     │               │ Load Shopping Home   │
     │               │ - Categories         │
     │               │ - Products           │
     │               │ - Flash Sales        │
     │               │ - Vendors            │
     │               └──────────────────────┘
     │
     └─── Mode: 'services' ────┐
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Load Services Home   │
                    │ - Service Categories │
                    │ - Providers          │
                    │ - Packages           │
                    │ - Event Halls        │
                    └──────────────────────┘

User Switches Mode
     │
     ▼
┌────────────────────────────┐
│ setMode() called           │
│ - Update Context           │
│ - Save to localStorage     │
│ - Trigger re-render        │
└────────────────────────────┘
     │
     ▼
New page content loads (< 200ms)

User Adds to Cart/Bookings
     │
     ├─── Mode: 'shopping' ────┐
     │                         │
     │                         ▼
     │               ┌──────────────────────┐
     │               │ CartStore.addToCart()│
     │               │ Show Floating Pill   │
     │               └──────────────────────┘
     │
     └─── Mode: 'services' ────┐
                               │
                               ▼
                    ┌──────────────────────┐
                    │ BookingStore.add()   │
                    │ Show Summary         │
                    └──────────────────────┘
```

---

## 9. MIGRATION PATH

### Week 1: Foundation
```
Day 1-2: Create UIMode Context & Hook
Day 3: Create ModeToggleHeader Component
Day 4: Create ContextAwareBottomNav
Day 5: Integration Testing
```

### Week 2: Implementation
```
Day 1: Refactor Home Page
Day 2: Create Mode-specific Layouts
Day 3: Update Cart/Booking Logic
Day 4: Update Search Component
Day 5: Full Integration Testing
```

### Week 3: Polish & Deploy
```
Day 1-2: Performance Optimization
Day 3-4: Mobile Testing & Fixes
Day 5: Final QA & Deployment
```

---

## 10. EXAMPLE: MODE TOGGLE IMPLEMENTATION

```typescript
// components/shared/mode-toggle-header.tsx
import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { motion } from 'framer-motion'

export function ModeToggleHeader() {
  const { mode, setMode } = useUIMode()
  
  return (
    <div className="sticky top-0 z-40 bg-white border-b">
      {/* Header content */}
      
      {/* Mode Toggle Tabs */}
      <div className="flex gap-0 relative">
        {['shopping', 'services'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMode(tab as UIMode)}
            className={cn(
              'flex-1 py-3 px-4 font-medium transition-colors',
              mode === tab ? 'text-blue-600' : 'text-gray-600'
            )}
          >
            {tab === 'shopping' ? '🛍️ Shopping' : '🔧 Services'}
          </button>
        ))}
        
        {/* Active indicator */}
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 h-1 bg-blue-600"
          animate={{
            width: mode === 'shopping' ? '50%' : '50%',
            x: mode === 'shopping' ? 0 : '100%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  )
}
```

---

## 11. ERROR HANDLING STRATEGY

```
Scenario 1: localStorage not available
├── Fallback to default mode ('shopping')
├── Log warning
└── Don't crash app

Scenario 2: Mode switch fails
├── Show toast notification
├── Revert to previous mode
└── Log error for debugging

Scenario 3: Content fails to load in new mode
├── Show loading skeleton
├── Display retry button
├── Fall back to home
└── Show error message

Scenario 4: User has items in both carts
├── Keep both carts intact
├── Show notification about items in other mode
├── Allow checkout for current mode
└── Remember other mode's cart
```

---

## 12. PERFORMANCE CONSIDERATIONS

```
Optimization Strategy:
1. Code Splitting
   - Load shopping components only when needed
   - Load services components only when needed
   
2. Image Optimization
   - Different images for shopping vs services
   - Lazy load carousel images
   
3. State Management
   - Minimize re-renders with context optimization
   - Memoize expensive computations
   
4. Caching
   - Cache user preference
   - Cache mode-specific data
   - Implement service worker
   
5. Network
   - Defer non-critical API calls
   - Batch API requests when switching modes
```

---

**This diagram document provides visual understanding of the architecture changes needed for Dual UI implementation.**

For detailed implementation steps, refer to DUAL_UI_IMPLEMENTATION_PLAN.md
