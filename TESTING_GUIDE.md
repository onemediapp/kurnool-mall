# Dual UI Testing Guide

## Quick Start

### 1. Run Development Server
```bash
cd "C:\Users\karth\OneDrive\Desktop\claude\kurnool mall"
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

---

## Testing Checklist

### Header & Navigation
- [ ] Open the app and see "Kurnool Mall" with location
- [ ] See two tabs: "🛍️ Shopping" and "🔧 Services"
- [ ] Shopping tab is highlighted by default (blue background)
- [ ] Sliding indicator shows active tab

### Shopping Mode
- [ ] Click "🛍️ Shopping" tab
- [ ] See shopping-specific content:
  - Delivery promise banner (Express 2hr, Same Day Delivery)
  - Banner carousel (if banners exist in DB)
  - "Shop by Category" section with emoji categories
  - "⚡ Flash Deals" section with countdown timer
  - "Popular Shops" section with vendor cards
  - "New Arrivals" section with products

### Services Mode  
- [ ] Click "🔧 Services" tab
- [ ] Page content switches instantly
- [ ] See services-specific content:
  - Booking promise banner
  - "Browse Services" grid with 6 service categories
  - Top providers carousel
  - "How It Works" step-by-step guide

### Bottom Navigation
- [ ] **Shopping Mode Navigation:**
  - Home icon → /
  - Shopping bag → /shopping (or shows selected)
  - Cart icon with badge → /cart
  - Orders → /orders
  - User icon → /account
  
- [ ] **Services Mode Navigation:**
  - Home icon → /
  - Wrench icon → /services
  - Calendar icon → /services/bookings
  - Orders → /orders
  - User icon → /account

### Cart Badge (Shopping Mode Only)
- [ ] Cart badge visible when items added
- [ ] Shows number (or "9+" if >9)
- [ ] Bounces when new item added
- [ ] Not visible in services mode

### Persistence
- [ ] Click Services tab
- [ ] Close tab and reopen `localhost:3000`
- [ ] Services mode should still be active
- [ ] Switch back to Shopping
- [ ] Reload page
- [ ] Shopping mode should be remembered

### Animations
- [ ] Tab indicator slides smoothly when switching
- [ ] Icon scales when tab is active
- [ ] Text color changes (gray → blue)
- [ ] No jank or stuttering

### Responsiveness
- [ ] Open DevTools (F12)
- [ ] Set to mobile view (375x812)
- [ ] Test all features work on mobile
- [ ] Scrolling is smooth
- [ ] Touch interactions work

---

## Troubleshooting

### Build Errors
```bash
# Clean build cache
rm -rf .next

# Rebuild
npm run build
```

### Port Already in Use
```bash
# Kill process on port 3000
# Windows: Use Task Manager to kill Node processes
# Or use a different port:
npm run dev -- -p 3001
```

### Data Not Loading
- Check .env.local has correct SUPABASE credentials
- Check browser console for API errors
- Verify Supabase tables exist (banners, categories, products, vendors)

### Mode Not Persisting
- Check browser localStorage (DevTools > Application > Local Storage)
- Should see: `uiMode` and `uiPreferences` keys
- Clear localStorage if corrupted: `localStorage.clear()`

---

## What to Expect

### Shopping Mode
- Real data from Supabase (products, vendors, categories)
- Flash sales with live countdown
- Interactive carousel
- Add to cart functionality

### Services Mode  
- Placeholder data (can be upgraded)
- Static service categories
- Sample provider cards
- Booking flow (UI ready, needs backend integration)

---

## Next Testing Phase

Once confirmed working locally:
1. Push to GitHub
2. Deploy to Vercel
3. Test in production
4. Monitor performance

---

## File Locations for Reference

**Core Files:**
- Layout with provider: `src/app/(customer)/layout.tsx`
- Home page: `src/app/(customer)/page.tsx`
- Context: `src/lib/context/UIContextProvider.tsx`
- Hook: `src/lib/hooks/use-ui-mode.ts`
- Header: `src/components/shared/mode-toggle-header.tsx`
- Navigation: `src/components/customer/bottom-nav-dual.tsx`

**Content Components:**
- Mode router: `src/app/(customer)/_components/home-content.tsx`
- Shopping: `src/app/(customer)/_components/shopping-home-content.tsx`
- Services: `src/app/(customer)/_components/services-home-content.tsx`

---

## Contact & Support

If you encounter any issues:
1. Check the console for error messages (F12 > Console)
2. Check Network tab for failed API requests
3. Review build output in terminal
4. Check that .env.local has all required variables
