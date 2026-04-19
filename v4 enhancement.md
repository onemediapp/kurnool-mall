# KURNOOL MALL — Enhancement Prompt v4.0
# ════════════════════════════════════════════════════════════════════════════
# CATEGORY ARCHITECTURE + SERVICES VERTICAL + ADMIN CONTROLS + UI/UX OVERHAUL
# ═══════════════════


You are enhancing an existing **Kurnool Mall** Next.js 14 + Supabase codebase.
The MVP is already built. Do NOT rebuild from scratch.
Read the existing files first, then implement ONLY the changes described here.
Follow every instruction precisely. Do not skip any section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. OVERVIEW OF CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This enhancement adds:

1. **Two-Section Architecture** — SHOPPING and SERVICES as top-level sections
2. **Three-Tier Taxonomy** — Section → Category → Subcategory (new middle tier)
3. **Expanded Category Set** — 15 shopping categories + 8 service categories
4. **Services Vertical** — Booking-based flow (not cart-based) for all services
5. **Admin Category Manager** — On/off toggles for sections, categories, subcategories
6. **Admin Vendor/Provider Assignment** — Assign categories and subcategories to vendors
7. **UI/UX Overhaul** — New home screen with section tabs, redesigned navigation
8. **Kurnool-specific Seed Data** — Real local business names, Telugu labels, realistic pricing
9. **Database Migrations** — New tables for sections, subcategories, service bookings,
   service providers, time slots, event rentals, function halls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. NEW TAXONOMY — COMPLETE REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### SECTION 1: SHOPPING (సెక్షన్: షాపింగ్)

#### CAT-S01: Grocery & Essentials (కిరాణా సరుకులు)
- Staples & Pulses (పప్పులు & ధాన్యాలు)
- Cooking Oil & Ghee (నూనె & నెయ్యి)
- Spices & Masalas (మసాలాలు)
- Rice & Wheat Flour (బియ్యం & పిండి)
- Sugar & Salt (చక్కెర & ఉప్పు)
- Tea & Coffee (టీ & కాఫీ)
- Packaged Foods (ప్యాకేజ్డ్ ఆహారం)
- Breakfast Cereals (అల్పాహారం)
- Snacks & Namkeen (స్నాక్స్ & నమ్కీన్)
- Beverages & Soft Drinks (పానీయాలు)
- Personal Care (వ్యక్తిగత సంరక్షణ)
- Household Cleaning (గృహ శుభ్రత)
- Detergents & Fabric Care (డిటర్జెంట్లు)
- Pooja Items (పూజా సామగ్రి)

#### CAT-S02: Electronics & Accessories (ఎలక్ట్రానిక్స్)
- Mobile Phones (మొబైల్ ఫోన్లు)
- Mobile Accessories (మొబైల్ యాక్సెసరీస్)
- Headphones & Earphones (హెడ్‌ఫోన్లు)
- Power Banks & Chargers (పవర్ బ్యాంక్లు)
- Cables & Adapters (కేబుల్స్)
- Laptop Accessories (లాప్టాప్ యాక్సెసరీస్)
- Storage Devices (స్టోరేజ్ డివైసెస్)
- Smart Watches (స్మార్ట్ వాచ్లు)
- Computer Peripherals (కంప్యూటర్ పెరిఫెరల్స్)
- Camera Accessories (కెమెరా యాక్సెసరీస్)

#### CAT-S03: Fashion & Apparel (దుస్తులు)
- Men's Clothing (పురుషుల దుస్తులు)
- Women's Clothing (మహిళల దుస్తులు)
- Kids' Clothing (పిల్లల దుస్తులు)
- Ethnic Wear - Men (సంప్రదాయ దుస్తులు - పురుషులు)
- Ethnic Wear - Women (సంప్రదాయ దుస్తులు - మహిళలు)
- Western Wear (వెస్టర్న్ దుస్తులు)
- Footwear - Men (పాదరక్షలు - పురుషులు)
- Footwear - Women (పాదరక్షలు - మహిళలు)
- Footwear - Kids (పాదరక్షలు - పిల్లలు)
- Bags & Wallets (బ్యాగులు)
- Watches (గడియారాలు)
- Jewellery & Accessories (నగలు)
- Sunglasses (సన్ గ్లాసెస్)
- Belts (బెల్ట్లు)

#### CAT-S04: Electricals (ఎలక్ట్రికల్స్)
- Switches & Sockets (స్విచ్లు & సాకెట్లు)
- Wires & Cables (వైర్లు)
- LED Bulbs & Tube Lights (బల్బులు)
- Ceiling Fans (సీలింగ్ ఫ్యాన్లు)
- Table & Pedestal Fans (టేబుల్ ఫ్యాన్లు)
- Exhaust Fans (ఎగ్జాస్ట్ ఫ్యాన్లు)
- MCBs & Distribution Boards (MCB బోర్డులు)
- Extension Boards (ఎక్స్‌టెన్షన్ బోర్డులు)
- Inverters & Batteries (ఇన్వర్టర్లు)
- Electrical Tools (ఎలక్ట్రికల్ పనిముట్లు)
- Stabilizers (స్టెబిలైజర్లు)
- Geysers (గీజర్లు)
- Immersion Rods (ఇమ్మర్షన్ రాడ్లు)

#### CAT-S05: Plumbing (ప్లంబింగ్)
- PVC Pipes & Fittings (PVC పైపులు)
- CPVC Pipes & Fittings (CPVC పైపులు)
- Taps & Faucets (కుళాయిలు)
- Bathroom Fittings (బాత్రూమ్ ఫిట్టింగ్స్)
- Kitchen Sink & Faucets (కిచెన్ సింక్)
- Water Tanks (నీటి ట్యాంకులు)
- Flush Tanks & Seats (ఫ్లష్ ట్యాంకులు)
- Showers & Accessories (షవర్లు)
- Plumbing Tools (ప్లంబింగ్ పనిముట్లు)
- Drain Cleaners (డ్రెయిన్ క్లీనర్లు)
- Water Filters & Purifier Parts (ఫిల్టర్ పార్ట్స్)
- Bathroom Accessories (బాత్రూమ్ యాక్సెసరీస్)

#### CAT-S06: Building Materials (నిర్మాణ సామగ్రి)
- Cement (సిమెంట్)
- Steel & TMT Bars (స్టీల్ & TMT బార్లు)
- Bricks & Blocks (ఇటుకలు)
- Sand & Aggregates (ఇసుక & అగ్రిగేట్లు)
- Floor Tiles (ఫ్లోర్ టైల్స్)
- Wall Tiles (వాల్ టైల్స్)
- Marble & Granite (మార్బుల్ & గ్రానైట్)
- Interior Paint (ఇంటీరియర్ పెయింట్)
- Exterior Paint (ఎక్స్టీరియర్ పెయింట్)
- Putty & Primers (పుట్టీ & ప్రైమర్)
- Adhesives & Sealants (అడిసివ్స్)
- Plywood & Laminates (ప్లైవుడ్)
- Doors & Frames (తలుపులు)
- Windows & Grills (కిటికీలు)
- Roofing Materials (పైకప్పు సామగ్రి)

#### CAT-S07: Office Stationery (స్టేషనరీ)
- Notebooks & Registers (నోట్‌బుక్లు)
- Pens & Pencils (పెన్నులు)
- Markers & Highlighters (మార్కర్లు)
- Staplers & Punches (స్టేపుల్లు)
- Paper & Envelopes (కాగితాలు)
- Files & Folders (ఫైల్లు)
- Desk Organizers (డెస్క్ ఆర్గనైజర్లు)
- Calculators (కాలిక్యులేటర్లు)
- Printing Paper (ప్రింటింగ్ పేపర్)
- Toners & Cartridges (కార్ట్రిడ్జెస్)
- Sticky Notes (స్టికీ నోట్స్)
- Correction Supplies (కరెక్షన్ సప్లైస్)
- Art Supplies (ఆర్ట్ సప్లైస్)
- Geometry Boxes (జ్యామితి పెట్టెలు)

#### CAT-S08: Sweets & Snacks (స్వీట్లు & స్నాక్స్)
- Traditional Sweets / Mithai (సంప్రదాయ మిఠాయిలు)
- Dry Fruits & Nuts (డ్రైఫ్రూట్స్)
- Namkeen & Mixtures (నమ్కీన్ & మిక్స్చర్)
- Bakery Items (బేకరీ ఐటమ్లు)
- Cookies & Biscuits (కుకీస్)
- Chocolates (చాక్లెట్లు)
- Savory Snacks (సేవరీ స్నాక్స్)
- Festival Special Sweets (పండుగ స్వీట్లు)
- Sugar-Free Sweets (షుగర్ ఫ్రీ స్వీట్లు)
- Packaged Sweets (ప్యాకేజ్డ్ స్వీట్లు)

#### CAT-S09: Pharmacy & Health (ఫార్మసీ & ఆరోగ్యం)
- Prescription Medicines (ప్రిస్క్రిప్షన్ మందులు)
- OTC Medicines (OTC మందులు)
- Ayurvedic & Herbal (ఆయుర్వేదిక్)
- Health Supplements (హెల్త్ సప్లిమెంట్లు)
- Vitamins & Minerals (విటమిన్లు)
- First Aid Supplies (ఫస్ట్ ఎయిడ్)
- Baby Care Products (బేబీ కేర్)
- Diabetic Care (డయాబెటిక్ కేర్)
- Mobility Aids (మొబిలిటీ ఎయిడ్స్)
- Health Devices (హెల్త్ డివైసెస్)
- Adult Diapers (అడల్ట్ డైపర్స్)
- Feminine Hygiene (ఫెమినైన్ హైజీన్)

#### CAT-S10: Books & Magazines (పుస్తకాలు)
- School Textbooks (స్కూల్ పుస్తకాలు)
- College Textbooks (కాలేజ్ పుస్తకాలు)
- Competitive Exam Books (పోటీ పరీక్షల పుస్తకాలు)
- UPSC & Civil Services (UPSC పుస్తకాలు)
- Telugu Literature (తెలుగు సాహిత్యం)
- Novels & Fiction (నవలలు)
- Self-Help & Motivational (స్వయం సహాయం)
- Children's Books (పిల్లల పుస్తకాలు)
- Magazines (మేగజైన్లు)
- Newspapers (వార్తాపత్రికలు)
- Reference Books (రిఫరెన్స్ పుస్తకాలు)

#### CAT-S11: Pet Supplies (పెంపుడు జంతువుల సామగ్రి)
- Dog Food (కుక్క ఆహారం)
- Cat Food (పిల్లి ఆహారం)
- Pet Treats (పెట్ ట్రీట్స్)
- Pet Toys (పెట్ బొమ్మలు)
- Grooming Supplies (గ్రూమింగ్ సప్లైస్)
- Pet Accessories (పెట్ యాక్సెసరీస్)
- Pet Hygiene Products (పెట్ హైజీన్)
- Aquarium Supplies (అక్వేరియమ్)
- Bird Food & Accessories (పక్షుల ఆహారం)
- Pet Healthcare (పెట్ హెల్త్‌కేర్)

#### CAT-S12: Sports & Fitness (స్పోర్ట్స్ & ఫిట్నెస్)
- Cricket Equipment (క్రికెట్ సామగ్రి)
- Badminton Equipment (బ్యాడ్మింటన్ సామగ్రి)
- Football & Accessories (ఫుట్‌బాల్)
- Gym Equipment (జిమ్ సామగ్రి)
- Yoga Mats & Accessories (యోగా మ్యాట్లు)
- Sports Shoes (స్పోర్ట్స్ షూస్)
- Fitness Trackers (ఫిట్నెస్ ట్రాకర్స్)
- Cycling Accessories (సైక్లింగ్ యాక్సెసరీస్)
- Swimming Accessories (స్విమ్మింగ్ యాక్సెసరీస్)
- Sports Bags (స్పోర్ట్స్ బ్యాగులు)
- Outdoor Games (ఆట పరికరాలు)

#### CAT-S13: Toys & Baby Products (బొమ్మలు & శిశు సామగ్రి)
- Infant Toys 0-12m (శిశు బొమ్మలు)
- Toddler Toys 1-3y (చిన్నారి బొమ్మలు)
- Kids Toys 3-12y (పిల్లల బొమ్మలు)
- Educational Toys (విద్యా బొమ్మలు)
- Baby Food (శిశు ఆహారం)
- Diapers & Wipes (డైపర్లు)
- Feeding Bottles (ఫీడింగ్ బాటిళ్లు)
- Baby Care Products (శిశు సంరక్షణ)
- Prams & Strollers (ప్రామ్లు)
- Baby Clothing (శిశు దుస్తులు)
- Maternity Products (మాతృత్వ ఉత్పత్తులు)

#### CAT-S14: Automotive Accessories (ఆటో యాక్సెసరీస్)
- Car Accessories (కార్ యాక్సెసరీస్)
- Bike Accessories (బైక్ యాక్సెసరీస్)
- Engine Oil & Lubricants (ఇంజిన్ ఆయిల్)
- Cleaning Products (క్లీనింగ్ ప్రొడక్ట్స్)
- Air Fresheners (ఎయిర్ ఫ్రెష్‌నర్లు)
- Mobile Holders (మొబైల్ హోల్డర్లు)
- Spare Parts (స్పేర్ పార్ట్స్)
- Tyre Accessories (టైర్ యాక్సెసరీస్)
- Helmets & Riding Gear (హెల్మెట్లు)
- Car Electronics (కార్ ఎలక్ట్రానిక్స్)
- Tools & Equipment (పనిముట్లు)

#### CAT-S15: Home Decor (హోమ్ డెకోర్)
- Wall Art & Paintings (వాల్ ఆర్ట్)
- Photo Frames (ఫోటో ఫ్రేమ్లు)
- Curtains & Blinds (తెరలు)
- Cushions & Covers (కుషన్లు)
- Table Lamps (టేబుల్ లైట్లు)
- Floor Lamps (ఫ్లోర్ లైట్లు)
- Wall Clocks (గోడ గడియారాలు)
- Showpieces & Figurines (షోపీసులు)
- Artificial Plants (కృత్రిమ మొక్కలు)
- Rugs & Carpets (తివాచీలు)
- Candles & Holders (కొవ్వొత్తులు)
- Vases (పువ్వుల కుండలు)
- Mirrors (అద్దాలు)

---

### SECTION 2: SERVICES (సెక్షన్: సేవలు)

#### CAT-SV01: Home Services (గృహ సేవలు)
- Electrician (ఎలక్ట్రీషియన్)
- Plumber (ప్లంబర్)
- AC Repair & Service (AC రిపేర్)
- Refrigerator Repair (ఫ్రిజ్ రిపేర్)
- Washing Machine Repair (వాషింగ్ మెషిన్ రిపేర్)
- Carpenter (వడ్రంగి)
- Home Cleaning (గృహ శుభ్రత)
- Deep Cleaning (డీప్ క్లీనింగ్)
- Kitchen Cleaning (కిచెన్ క్లీనింగ్)
- Sofa Cleaning (సోఫా క్లీనింగ్)
- Pest Control (తెగుళ్ల నివారణ)
- Painting (పెయింటింగ్)
- Waterproofing (వాటర్‌ప్రూఫింగ్)
- CCTV Installation (CCTV ఇన్స్టాలేషన్)
- RO Service & Repair (RO సర్వీస్)

#### CAT-SV02: Automotive Services (వాహన సేవలు)
- Bike Mechanic (బైక్ మెకానిక్)
- Car Mechanic (కార్ మెకానిక్)
- Car Wash & Detailing (కార్ వాష్)
- Tyre Replacement (టైర్ మార్పు)
- Oil Change (ఆయిల్ చేంజ్)
- Battery Replacement (బ్యాటరీ మార్పు)
- Denting & Painting (డెంటింగ్)
- Vehicle Inspection (వాహన తనిఖీ)

#### CAT-SV03: Beauty & Salon (అందం & సెలూన్)
- Women's Haircut (మహిళల హెయిర్‌కట్)
- Men's Haircut (పురుషుల హెయిర్‌కట్)
- Hair Coloring (హెయిర్ కలరింగ్)
- Facial (ఫేషియల్)
- Manicure (మానిక్యూర్)
- Pedicure (పెడిక్యూర్)
- Waxing (వాక్సింగ్)
- Bridal Makeup (బ్రైడల్ మేకప్)
- Party Makeup (పార్టీ మేకప్)
- Threading (థ్రెడింగ్)
- Hair Spa (హెయిర్ స్పా)
- Bleach (బ్లీచ్)

#### CAT-SV04: Photography & Videography (ఫోటోగ్రఫీ)
- Wedding Photography (పెళ్ళి ఫోటోగ్రఫీ)
- Birthday Photography (పుట్టినరోజు ఫోటోగ్రఫీ)
- Pre-Wedding Shoot (ప్రీ-వెడ్డింగ్ షూట్)
- Videography (వీడియోగ్రఫీ)
- Drone Photography (డ్రోన్ ఫోటోగ్రఫీ)
- Photo Editing (ఫోటో ఎడిటింగ్)
- Album Design (ఆల్బమ్ డిజైన్)
- Event Coverage (ఈవెంట్ కవరేజ్)

#### CAT-SV05: Event Suppliers & Rentals (ఈవెంట్ సామగ్రి)
- Shamiana / Tent Rental (శామియానా అద్దె)
- Sound System Rental (సౌండ్ సిస్టమ్ అద్దె)
- DJ Services (DJ సేవలు)
- Lighting & Decoration (లైటింగ్ & డెకొరేషన్)
- Stage Decoration (స్టేజ్ డెకొరేషన్)
- Chairs & Tables Rental (కుర్చీలు & టేబుళ్ళు అద్దె)
- Crockery & Cutlery Rental (గిన్నెలు & కత్తులు అద్దె)
- Generator Rental (జనరేటర్ అద్దె)
- Catering Services (క్యాటరింగ్ సేవలు)
- Mehendi Artists (మెహందీ ఆర్టిస్ట్)
- Rangoli Artists (ముగ్గు ఆర్టిస్ట్)
- Balloon Decoration (బెలూన్ డెకొరేషన్)

#### CAT-SV06: Function Hall Bookings (ఫంక్షన్ హాల్ బుకింగ్స్)
- Wedding Halls (పెళ్ళి హాళ్ళు)
- Birthday Party Halls (పుట్టినరోజు హాళ్ళు)
- Conference Halls (కాన్ఫరెన్స్ హాళ్ళు)
- Banquet Halls (బ్యాంక్వెట్ హాళ్ళు)
- Outdoor Venues (బహిరంగ వేదికలు)
- Community Halls (కమ్యూనిటీ హాళ్ళు)

#### CAT-SV07: Moving & Logistics (వస్తువుల తరలింపు)
- Packers & Movers Local (స్థానిక ప్యాకర్స్)
- Packers & Movers Intercity (నగరాల మధ్య ప్యాకర్స్)
- Vehicle Transportation (వాహన రవాణా)
- Storage Services (నిల్వ సేవలు)
- Loading & Unloading (లోడింగ్ & అన్‌లోడింగ్)

#### CAT-SV08: Education & Learning (విద్య & నేర్చుకోవడం)
- Home Tuition K-12 (గృహ ట్యూషన్)
- Competitive Exam Coaching (పోటీ పరీక్షల కోచింగ్)
- English Classes (ఇంగ్లీష్ తరగతులు)
- Telugu Classes (తెలుగు తరగతులు)
- Music Classes (సంగీత తరగతులు)
- Dance Classes (నృత్య తరగతులు)
- Art & Craft Classes (కళ తరగతులు)
- Yoga Classes (యోగా తరగతులు)
- Computer Training (కంప్యూటర్ శిక్షణ)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. NEW TYPESCRIPT TYPES — ADD TO src/lib/types/index.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these types to the existing types file. Do NOT remove existing types.

```typescript
// ─── SECTION / TAXONOMY TYPES ───────────────────────────────────────────────

export type SectionType = 'shopping' | 'services'

export interface Section {
  id: string
  name_en: string
  name_te: string
  slug: string              // 'shopping' | 'services'
  icon: string              // emoji or lucide icon name
  sort_order: number
  is_active: boolean
}

export interface Subcategory {
  id: string
  category_id: string
  name_en: string
  name_te: string
  slug: string
  icon_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  category?: Category
}

// Extended Category to include section + subcategories
export interface CategoryExtended extends Category {
  section_id: string
  section?: Section
  subcategories?: Subcategory[]
}

// ─── VENDOR ASSIGNMENT TYPES ─────────────────────────────────────────────────

export interface VendorCategoryAssignment {
  id: string
  vendor_id: string
  category_id: string
  subcategory_ids: string[]     // specific subcategories vendor covers
  is_primary: boolean           // primary category for vendor profile
  created_at: string
}

// ─── SERVICE PROVIDER TYPES ──────────────────────────────────────────────────

export type ServiceProviderStatus = 'pending' | 'approved' | 'suspended'
export type BookingStatus =
  | 'pending' | 'confirmed' | 'in_progress'
  | 'completed' | 'cancelled' | 'rescheduled'

export interface ServiceProvider {
  id: string
  user_id: string
  vendor_id: string | null       // null if standalone service provider
  name: string
  phone: string
  profile_photo_url: string | null
  service_category_ids: string[]
  service_subcategory_ids: string[]
  rating: number
  rating_count: number
  experience_years: number | null
  base_price: number | null       // starting price (display only)
  price_unit: string | null       // 'per hour' | 'per visit' | 'per event' | 'per day'
  description_en: string | null
  description_te: string | null
  is_available: boolean
  police_verified: boolean
  status: ServiceProviderStatus
  portfolio_images: string[]
  created_at: string
  updated_at: string
  service_category?: CategoryExtended
}

export interface TimeSlot {
  id: string
  provider_id: string
  date: string                  // YYYY-MM-DD
  start_time: string            // HH:MM (24hr)
  end_time: string
  is_booked: boolean
  is_blocked: boolean           // provider manually blocked this slot
}

export interface ServiceBooking {
  id: string
  booking_number: string        // KM-SVC-YYYY-XXXXXX
  customer_id: string
  provider_id: string
  service_category_id: string
  service_subcategory_id: string | null
  scheduled_date: string
  time_slot_id: string | null
  start_time: string
  duration_hours: number | null
  status: BookingStatus
  address_id: string
  address_snapshot: Address
  base_amount: number
  final_amount: number
  discount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  notes: string | null
  cancellation_reason: string | null
  completion_photo_urls: string[]
  rating: number | null
  review: string | null
  created_at: string
  updated_at: string
  customer?: User
  provider?: ServiceProvider
  service_category?: CategoryExtended
}

// ─── FUNCTION HALL TYPES ─────────────────────────────────────────────────────

export type HallAvailabilityStatus = 'available' | 'booked' | 'blocked'

export interface FunctionHall {
  id: string
  vendor_id: string
  name: string
  name_te: string
  description_en: string | null
  description_te: string | null
  address_line: string
  lat: number | null
  lng: number | null
  capacity_min: number
  capacity_max: number
  price_per_day: number
  price_per_half_day: number | null
  amenities: string[]           // e.g. ['AC', 'Parking', 'Catering', 'Stage']
  amenities_te: string[]
  images: string[]
  is_ac: boolean
  has_parking: boolean
  has_catering: boolean
  has_decoration: boolean
  rating: number
  rating_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  vendor?: Vendor
}

export interface HallBooking {
  id: string
  booking_number: string
  hall_id: string
  customer_id: string
  event_date: string
  slot: 'full_day' | 'morning' | 'evening'
  event_type: string
  guest_count: number
  amount: number
  advance_paid: number
  balance_due: number
  status: BookingStatus
  payment_status: PaymentStatus
  notes: string | null
  created_at: string
  hall?: FunctionHall
  customer?: User
}

// ─── EVENT RENTAL TYPES ──────────────────────────────────────────────────────

export interface RentalItem {
  id: string
  vendor_id: string
  subcategory_id: string
  name_en: string
  name_te: string
  description_en: string | null
  description_te: string | null
  images: string[]
  price_per_day: number
  price_per_event: number | null
  deposit_amount: number
  min_quantity: number
  max_quantity: number
  available_quantity: number
  unit: string                   // 'piece' | 'set' | 'system'
  is_available: boolean
  is_deleted: boolean
  created_at: string
  vendor?: Vendor
}

// ─── ADMIN CONTROLS ──────────────────────────────────────────────────────────

export interface CategoryTogglePayload {
  entity_type: 'section' | 'category' | 'subcategory'
  entity_id: string
  is_active: boolean
}

export interface VendorAssignmentPayload {
  vendor_id: string
  category_ids: string[]
  subcategory_ids: string[]
}

// ─── UI / NAVIGATION ─────────────────────────────────────────────────────────

export interface HomeSection {
  section: Section
  featured_categories: CategoryExtended[]
  featured_items: (Product | ServiceProvider | FunctionHall | RentalItem)[]
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. DATABASE MIGRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create file: `supabase/migrations/003_sections_subcategories.sql`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION 003: SECTIONS, SUBCATEGORIES, TAXONOMY ENHANCEMENTS
-- ════════════════════════════════════════════════════════════════════════════

-- ── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE section_type AS ENUM ('shopping', 'services');
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'
);
CREATE TYPE service_provider_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE hall_slot AS ENUM ('full_day', 'morning', 'evening');

-- ── TABLE: sections ───────────────────────────────────────────────────────────

CREATE TABLE public.sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT NOT NULL,
  name_te     TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '🛒',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active sections"
  ON public.sections FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin manages sections"
  ON public.sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ALTER TABLE: categories — add section_id ──────────────────────────────────

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id),
  ADD COLUMN IF NOT EXISTS section_type section_type NOT NULL DEFAULT 'shopping';

-- ── TABLE: subcategories ──────────────────────────────────────────────────────

CREATE TABLE public.subcategories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name_en      TEXT NOT NULL,
  name_te      TEXT NOT NULL,
  slug         TEXT NOT NULL,
  icon_url     TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_subcategories_category ON public.subcategories(category_id);
CREATE INDEX idx_subcategories_active ON public.subcategories(category_id, is_active);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active subcategories"
  ON public.subcategories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin manages subcategories"
  ON public.subcategories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── TABLE: vendor_category_assignments ───────────────────────────────────────

CREATE TABLE public.vendor_category_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES public.categories(id),
  subcategory_ids  UUID[] NOT NULL DEFAULT '{}',
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, category_id)
);

CREATE INDEX idx_vca_vendor ON public.vendor_category_assignments(vendor_id);
CREATE INDEX idx_vca_category ON public.vendor_category_assignments(category_id);

ALTER TABLE public.vendor_category_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor reads own assignments"
  ON public.vendor_category_assignments FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin manages assignments"
  ON public.vendor_category_assignments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── TABLE: service_providers ──────────────────────────────────────────────────

CREATE TABLE public.service_providers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id),
  vendor_id               UUID REFERENCES public.vendors(id),
  name                    TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  profile_photo_url       TEXT,
  service_category_ids    UUID[] NOT NULL DEFAULT '{}',
  service_subcategory_ids UUID[] NOT NULL DEFAULT '{}',
  rating                  DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count            INTEGER NOT NULL DEFAULT 0,
  experience_years        INTEGER,
  base_price              DECIMAL(10,2),
  price_unit              TEXT DEFAULT 'per visit',
  description_en          TEXT,
  description_te          TEXT,
  is_available            BOOLEAN NOT NULL DEFAULT TRUE,
  police_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  status                  service_provider_status NOT NULL DEFAULT 'pending',
  portfolio_images        TEXT[] NOT NULL DEFAULT '{}',
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_user ON public.service_providers(user_id);
CREATE INDEX idx_sp_status ON public.service_providers(status, is_available);
CREATE INDEX idx_sp_categories ON public.service_providers USING GIN(service_category_ids);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved providers"
  ON public.service_providers FOR SELECT
  USING (status = 'approved' AND is_deleted = FALSE);

CREATE POLICY "Provider reads own record"
  ON public.service_providers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin manages providers"
  ON public.service_providers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── TABLE: time_slots ─────────────────────────────────────────────────────────

CREATE TABLE public.time_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_booked   BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, date, start_time)
);

CREATE INDEX idx_slots_provider_date ON public.time_slots(provider_id, date);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read available slots"
  ON public.time_slots FOR SELECT
  USING (is_blocked = FALSE);

CREATE POLICY "Provider manages own slots"
  ON public.time_slots FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- ── TABLE: service_bookings ───────────────────────────────────────────────────

CREATE SEQUENCE service_booking_number_seq START 1000;

CREATE TABLE public.service_bookings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number           TEXT NOT NULL UNIQUE DEFAULT (
                             'KM-SVC-' || TO_CHAR(NOW(),'YYYY') || '-' ||
                             LPAD(NEXTVAL('service_booking_number_seq')::TEXT, 6, '0')
                           ),
  customer_id              UUID NOT NULL REFERENCES public.users(id),
  provider_id              UUID NOT NULL REFERENCES public.service_providers(id),
  service_category_id      UUID NOT NULL REFERENCES public.categories(id),
  service_subcategory_id   UUID REFERENCES public.subcategories(id),
  scheduled_date           DATE NOT NULL,
  time_slot_id             UUID REFERENCES public.time_slots(id),
  start_time               TIME,
  duration_hours           DECIMAL(4,2),
  status                   booking_status NOT NULL DEFAULT 'pending',
  address_id               UUID REFERENCES public.addresses(id),
  address_snapshot         JSONB NOT NULL DEFAULT '{}',
  base_amount              DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount             DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method           payment_method NOT NULL,
  payment_status           payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id        TEXT,
  razorpay_payment_id      TEXT,
  notes                    TEXT,
  cancellation_reason      TEXT,
  completion_photo_urls    TEXT[] NOT NULL DEFAULT '{}',
  rating                   SMALLINT CHECK (rating BETWEEN 1 AND 5),
  review                   TEXT,
  is_deleted               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sb_customer ON public.service_bookings(customer_id);
CREATE INDEX idx_sb_provider ON public.service_bookings(provider_id);
CREATE INDEX idx_sb_status ON public.service_bookings(status);
CREATE INDEX idx_sb_date ON public.service_bookings(scheduled_date);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer reads own bookings"
  ON public.service_bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Provider reads their bookings"
  ON public.service_bookings FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin reads all bookings"
  ON public.service_bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;

-- ── TABLE: function_halls ─────────────────────────────────────────────────────

CREATE TABLE public.function_halls (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  name_te              TEXT NOT NULL,
  description_en       TEXT,
  description_te       TEXT,
  address_line         TEXT NOT NULL,
  lat                  DECIMAL(10,8),
  lng                  DECIMAL(11,8),
  capacity_min         INTEGER NOT NULL DEFAULT 50,
  capacity_max         INTEGER NOT NULL DEFAULT 500,
  price_per_day        DECIMAL(10,2) NOT NULL,
  price_per_half_day   DECIMAL(10,2),
  amenities            TEXT[] NOT NULL DEFAULT '{}',
  amenities_te         TEXT[] NOT NULL DEFAULT '{}',
  images               TEXT[] NOT NULL DEFAULT '{}',
  is_ac                BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking          BOOLEAN NOT NULL DEFAULT FALSE,
  has_catering         BOOLEAN NOT NULL DEFAULT FALSE,
  has_decoration       BOOLEAN NOT NULL DEFAULT FALSE,
  rating               DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count         INTEGER NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_halls_vendor ON public.function_halls(vendor_id);
CREATE INDEX idx_halls_active ON public.function_halls(is_active, is_deleted);

ALTER TABLE public.function_halls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active halls"
  ON public.function_halls FOR SELECT
  USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "Vendor manages own halls"
  ON public.function_halls FOR ALL
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin manages all halls"
  ON public.function_halls FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── TABLE: hall_bookings ──────────────────────────────────────────────────────

CREATE SEQUENCE hall_booking_number_seq START 1000;

CREATE TABLE public.hall_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number  TEXT NOT NULL UNIQUE DEFAULT (
                    'KM-HALL-' || TO_CHAR(NOW(),'YYYY') || '-' ||
                    LPAD(NEXTVAL('hall_booking_number_seq')::TEXT, 6, '0')
                  ),
  hall_id         UUID NOT NULL REFERENCES public.function_halls(id),
  customer_id     UUID NOT NULL REFERENCES public.users(id),
  event_date      DATE NOT NULL,
  slot            hall_slot NOT NULL DEFAULT 'full_day',
  event_type      TEXT NOT NULL,
  guest_count     INTEGER NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  advance_paid    DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          booking_status NOT NULL DEFAULT 'pending',
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  notes           TEXT,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hall_id, event_date, slot)
);

CREATE INDEX idx_hb_hall ON public.hall_bookings(hall_id);
CREATE INDEX idx_hb_customer ON public.hall_bookings(customer_id);
CREATE INDEX idx_hb_date ON public.hall_bookings(event_date);

ALTER TABLE public.hall_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer reads own hall bookings"
  ON public.hall_bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Vendor reads own hall bookings"
  ON public.hall_bookings FOR SELECT
  USING (
    hall_id IN (
      SELECT fh.id FROM public.function_halls fh
      JOIN public.vendors v ON v.id = fh.vendor_id
      WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manages hall bookings"
  ON public.hall_bookings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── TABLE: rental_items ───────────────────────────────────────────────────────

CREATE TABLE public.rental_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id          UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  subcategory_id     UUID NOT NULL REFERENCES public.subcategories(id),
  name_en            TEXT NOT NULL,
  name_te            TEXT NOT NULL,
  description_en     TEXT,
  description_te     TEXT,
  images             TEXT[] NOT NULL DEFAULT '{}',
  price_per_day      DECIMAL(10,2) NOT NULL,
  price_per_event    DECIMAL(10,2),
  deposit_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_quantity       INTEGER NOT NULL DEFAULT 1,
  max_quantity       INTEGER NOT NULL DEFAULT 100,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  unit               TEXT NOT NULL DEFAULT 'piece',
  is_available       BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rental_vendor ON public.rental_items(vendor_id);
CREATE INDEX idx_rental_subcategory ON public.rental_items(subcategory_id);

ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads available rental items"
  ON public.rental_items FOR SELECT
  USING (is_available = TRUE AND is_deleted = FALSE);

CREATE POLICY "Vendor manages own rental items"
  ON public.rental_items FOR ALL
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin manages rental items"
  ON public.rental_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── RPC: toggle_category_active ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_category_active(
  p_entity_type TEXT,  -- 'section' | 'category' | 'subcategory'
  p_entity_id   UUID,
  p_is_active   BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_entity_type = 'section' THEN
    UPDATE public.sections SET is_active = p_is_active WHERE id = p_entity_id;
  ELSIF p_entity_type = 'category' THEN
    UPDATE public.categories SET is_active = p_is_active WHERE id = p_entity_id;
  ELSIF p_entity_type = 'subcategory' THEN
    UPDATE public.subcategories SET is_active = p_is_active WHERE id = p_entity_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION toggle_category_active FROM PUBLIC;
GRANT EXECUTE ON FUNCTION toggle_category_active TO service_role;

-- ── RPC: get_service_provider_stats ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_service_provider_stats(p_provider_id UUID)
RETURNS TABLE (
  total_bookings    BIGINT,
  pending_bookings  BIGINT,
  completed_bookings BIGINT,
  total_revenue     DECIMAL,
  avg_rating        DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(final_amount) FILTER (WHERE status = 'completed'), 0),
    COALESCE(AVG(rating) FILTER (WHERE rating IS NOT NULL), 0)
  FROM public.service_bookings
  WHERE provider_id = p_provider_id AND is_deleted = FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION get_service_provider_stats TO authenticated;
```

---

Create file: `supabase/migrations/004_products_subcategory.sql`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION 004: ADD SUBCATEGORY_ID TO PRODUCTS
-- ════════════════════════════════════════════════════════════════════════════

-- Allow products to be tagged to a subcategory (optional, nullable)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id);

CREATE INDEX IF NOT EXISTS idx_products_subcategory
  ON public.products(subcategory_id)
  WHERE subcategory_id IS NOT NULL;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 5. SEED DATA — supabase/seed/002_taxonomy.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create file: `supabase/seed/002_taxonomy.ts`
Run with: `npx tsx supabase/seed/002_taxonomy.ts`

This file seeds all sections, updates existing categories with section_id,
and inserts all subcategories from Section 2 of this prompt.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── SECTION IDs ───────────────────────────────────────────────────────────────
const SHOPPING_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const SERVICES_ID = 'aaaaaaaa-0000-0000-0000-000000000002'

// ── CATEGORY IDs (existing from migration 002) ────────────────────────────────
const CAT = {
  GROCERY:    '11111111-0000-0000-0000-000000000001',
  ELECTRONICS:'11111111-0000-0000-0000-000000000002',
  FASHION:    '11111111-0000-0000-0000-000000000003',
  ELECTRICALS:'11111111-0000-0000-0000-000000000004',
  PLUMBING:   '11111111-0000-0000-0000-000000000005',
  BUILDING:   '11111111-0000-0000-0000-000000000006',
  STATIONERY: '11111111-0000-0000-0000-000000000007',
  SWEETS:     '11111111-0000-0000-0000-000000000008',
  // New shopping categories
  PHARMACY:   '11111111-0000-0000-0000-000000000009',
  BOOKS:      '11111111-0000-0000-0000-000000000010',
  PETS:       '11111111-0000-0000-0000-000000000011',
  SPORTS:     '11111111-0000-0000-0000-000000000012',
  TOYS:       '11111111-0000-0000-0000-000000000013',
  AUTOMOTIVE: '11111111-0000-0000-0000-000000000014',
  HOME_DECOR: '11111111-0000-0000-0000-000000000015',
  // Service categories
  SV_HOME:    '22222222-0000-0000-0000-000000000001',
  SV_AUTO:    '22222222-0000-0000-0000-000000000002',
  SV_BEAUTY:  '22222222-0000-0000-0000-000000000003',
  SV_PHOTO:   '22222222-0000-0000-0000-000000000004',
  SV_EVENTS:  '22222222-0000-0000-0000-000000000005',
  SV_HALLS:   '22222222-0000-0000-0000-000000000006',
  SV_MOVING:  '22222222-0000-0000-0000-000000000007',
  SV_EDUCATION:'22222222-0000-0000-0000-000000000008',
}

async function seed() {
  console.log('🌱 Seeding sections...')

  // ── SECTIONS ────────────────────────────────────────────────────────────────
  await supabase.from('sections').upsert([
    { id: SHOPPING_ID, name_en: 'Shopping', name_te: 'షాపింగ్',
      slug: 'shopping', icon: '🛒', sort_order: 1, is_active: true },
    { id: SERVICES_ID, name_en: 'Services', name_te: 'సేవలు',
      slug: 'services', icon: '🔧', sort_order: 2, is_active: true },
  ], { onConflict: 'id' })

  console.log('✅ Sections seeded')

  // ── NEW SHOPPING CATEGORIES ────────────────────────────────────────────────
  await supabase.from('categories').upsert([
    { id: CAT.PHARMACY, name_en: 'Pharmacy & Health', name_te: 'ఫార్మసీ & ఆరోగ్యం',
      slug: 'pharmacy-health', sort_order: 9, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.BOOKS, name_en: 'Books & Magazines', name_te: 'పుస్తకాలు',
      slug: 'books-magazines', sort_order: 10, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.PETS, name_en: 'Pet Supplies', name_te: 'పెంపుడు జంతువుల సామగ్రి',
      slug: 'pet-supplies', sort_order: 11, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.SPORTS, name_en: 'Sports & Fitness', name_te: 'స్పోర్ట్స్ & ఫిట్నెస్',
      slug: 'sports-fitness', sort_order: 12, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.TOYS, name_en: 'Toys & Baby Products', name_te: 'బొమ్మలు & శిశు సామగ్రి',
      slug: 'toys-baby', sort_order: 13, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.AUTOMOTIVE, name_en: 'Automotive Accessories', name_te: 'ఆటో యాక్సెసరీస్',
      slug: 'automotive', sort_order: 14, is_active: true, section_id: SHOPPING_ID },
    { id: CAT.HOME_DECOR, name_en: 'Home Decor', name_te: 'హోమ్ డెకోర్',
      slug: 'home-decor', sort_order: 15, is_active: true, section_id: SHOPPING_ID },
  ], { onConflict: 'id' })

  // ── SERVICE CATEGORIES ─────────────────────────────────────────────────────
  await supabase.from('categories').upsert([
    { id: CAT.SV_HOME, name_en: 'Home Services', name_te: 'గృహ సేవలు',
      slug: 'home-services', sort_order: 1, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_AUTO, name_en: 'Automotive Services', name_te: 'వాహన సేవలు',
      slug: 'automotive-services', sort_order: 2, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_BEAUTY, name_en: 'Beauty & Salon', name_te: 'అందం & సెలూన్',
      slug: 'beauty-salon', sort_order: 3, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_PHOTO, name_en: 'Photography & Videography', name_te: 'ఫోటోగ్రఫీ',
      slug: 'photography', sort_order: 4, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_EVENTS, name_en: 'Event Suppliers & Rentals', name_te: 'ఈవెంట్ సామగ్రి',
      slug: 'event-rentals', sort_order: 5, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_HALLS, name_en: 'Function Hall Bookings', name_te: 'ఫంక్షన్ హాల్ బుకింగ్స్',
      slug: 'function-halls', sort_order: 6, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_MOVING, name_en: 'Moving & Logistics', name_te: 'వస్తువుల తరలింపు',
      slug: 'moving-logistics', sort_order: 7, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
    { id: CAT.SV_EDUCATION, name_en: 'Education & Learning', name_te: 'విద్య & నేర్చుకోవడం',
      slug: 'education', sort_order: 8, is_active: true,
      section_id: SERVICES_ID, section_type: 'services' },
  ], { onConflict: 'id' })

  // Update existing categories with section_id
  await supabase.from('categories').update({ section_id: SHOPPING_ID, section_type: 'shopping' })
    .in('id', [CAT.GROCERY, CAT.ELECTRONICS, CAT.FASHION, CAT.ELECTRICALS,
               CAT.PLUMBING, CAT.BUILDING, CAT.STATIONERY, CAT.SWEETS])

  console.log('✅ Categories updated')

  // ── SUBCATEGORIES ──────────────────────────────────────────────────────────
  // Grocery subcategories
  const grocerySubcats = [
    { name_en:'Staples & Pulses', name_te:'పప్పులు & ధాన్యాలు', slug:'staples-pulses', sort_order:1 },
    { name_en:'Cooking Oil & Ghee', name_te:'నూనె & నెయ్యి', slug:'oil-ghee', sort_order:2 },
    { name_en:'Spices & Masalas', name_te:'మసాలాలు', slug:'spices-masalas', sort_order:3 },
    { name_en:'Rice & Wheat Flour', name_te:'బియ్యం & పిండి', slug:'rice-flour', sort_order:4 },
    { name_en:'Sugar & Salt', name_te:'చక్కెర & ఉప్పు', slug:'sugar-salt', sort_order:5 },
    { name_en:'Tea & Coffee', name_te:'టీ & కాఫీ', slug:'tea-coffee', sort_order:6 },
    { name_en:'Packaged Foods', name_te:'ప్యాకేజ్డ్ ఆహారం', slug:'packaged-foods', sort_order:7 },
    { name_en:'Breakfast Cereals', name_te:'అల్పాహారం', slug:'breakfast-cereals', sort_order:8 },
    { name_en:'Snacks & Namkeen', name_te:'స్నాక్స్ & నమ్కీన్', slug:'snacks-namkeen', sort_order:9 },
    { name_en:'Beverages & Soft Drinks', name_te:'పానీయాలు', slug:'beverages', sort_order:10 },
    { name_en:'Personal Care', name_te:'వ్యక్తిగత సంరక్షణ', slug:'personal-care', sort_order:11 },
    { name_en:'Household Cleaning', name_te:'గృహ శుభ్రత', slug:'household-cleaning', sort_order:12 },
    { name_en:'Detergents & Fabric Care', name_te:'డిటర్జెంట్లు', slug:'detergents', sort_order:13 },
    { name_en:'Pooja Items', name_te:'పూజా సామగ్రి', slug:'pooja-items', sort_order:14 },
  ].map(s => ({ ...s, category_id: CAT.GROCERY, is_active: true }))

  // Home Services subcategories
  const homeServicesSubcats = [
    { name_en:'Electrician', name_te:'ఎలక్ట్రీషియన్', slug:'electrician', sort_order:1 },
    { name_en:'Plumber', name_te:'ప్లంబర్', slug:'plumber', sort_order:2 },
    { name_en:'AC Repair & Service', name_te:'AC రిపేర్', slug:'ac-repair', sort_order:3 },
    { name_en:'Refrigerator Repair', name_te:'ఫ్రిజ్ రిపేర్', slug:'fridge-repair', sort_order:4 },
    { name_en:'Washing Machine Repair', name_te:'వాషింగ్ మెషిన్ రిపేర్', slug:'washing-machine-repair', sort_order:5 },
    { name_en:'Carpenter', name_te:'వడ్రంగి', slug:'carpenter', sort_order:6 },
    { name_en:'Home Cleaning', name_te:'గృహ శుభ్రత', slug:'home-cleaning', sort_order:7 },
    { name_en:'Deep Cleaning', name_te:'డీప్ క్లీనింగ్', slug:'deep-cleaning', sort_order:8 },
    { name_en:'Kitchen Cleaning', name_te:'కిచెన్ క్లీనింగ్', slug:'kitchen-cleaning', sort_order:9 },
    { name_en:'Sofa Cleaning', name_te:'సోఫా క్లీనింగ్', slug:'sofa-cleaning', sort_order:10 },
    { name_en:'Pest Control', name_te:'తెగుళ్ల నివారణ', slug:'pest-control', sort_order:11 },
    { name_en:'Painting', name_te:'పెయింటింగ్', slug:'painting', sort_order:12 },
    { name_en:'Waterproofing', name_te:'వాటర్‌ప్రూఫింగ్', slug:'waterproofing', sort_order:13 },
    { name_en:'CCTV Installation', name_te:'CCTV ఇన్స్టాలేషన్', slug:'cctv-installation', sort_order:14 },
    { name_en:'RO Service & Repair', name_te:'RO సర్వీస్', slug:'ro-service', sort_order:15 },
  ].map(s => ({ ...s, category_id: CAT.SV_HOME, is_active: true }))

  // Event Suppliers subcategories
  const eventSubcats = [
    { name_en:'Shamiana / Tent Rental', name_te:'శామియానా అద్దె', slug:'shamiana-tent', sort_order:1 },
    { name_en:'Sound System Rental', name_te:'సౌండ్ సిస్టమ్ అద్దె', slug:'sound-system', sort_order:2 },
    { name_en:'DJ Services', name_te:'DJ సేవలు', slug:'dj-services', sort_order:3 },
    { name_en:'Lighting & Decoration', name_te:'లైటింగ్ & డెకొరేషన్', slug:'lighting-decoration', sort_order:4 },
    { name_en:'Stage Decoration', name_te:'స్టేజ్ డెకొరేషన్', slug:'stage-decoration', sort_order:5 },
    { name_en:'Chairs & Tables Rental', name_te:'కుర్చీలు & టేబుళ్ళు అద్దె', slug:'chairs-tables', sort_order:6 },
    { name_en:'Crockery & Cutlery Rental', name_te:'గిన్నెలు & కత్తులు అద్దె', slug:'crockery-cutlery', sort_order:7 },
    { name_en:'Generator Rental', name_te:'జనరేటర్ అద్దె', slug:'generator-rental', sort_order:8 },
    { name_en:'Catering Services', name_te:'క్యాటరింగ్ సేవలు', slug:'catering', sort_order:9 },
    { name_en:'Mehendi Artists', name_te:'మెహందీ ఆర్టిస్ట్', slug:'mehendi', sort_order:10 },
    { name_en:'Rangoli Artists', name_te:'ముగ్గు ఆర్టిస్ట్', slug:'rangoli', sort_order:11 },
    { name_en:'Balloon Decoration', name_te:'బెలూన్ డెకొరేషన్', slug:'balloon-decoration', sort_order:12 },
  ].map(s => ({ ...s, category_id: CAT.SV_EVENTS, is_active: true }))

  // Beauty subcategories
  const beautySubcats = [
    { name_en:"Women's Haircut", name_te:'మహిళల హెయిర్‌కట్', slug:'womens-haircut', sort_order:1 },
    { name_en:"Men's Haircut", name_te:'పురుషుల హెయిర్‌కట్', slug:'mens-haircut', sort_order:2 },
    { name_en:'Hair Coloring', name_te:'హెయిర్ కలరింగ్', slug:'hair-coloring', sort_order:3 },
    { name_en:'Facial', name_te:'ఫేషియల్', slug:'facial', sort_order:4 },
    { name_en:'Manicure', name_te:'మానిక్యూర్', slug:'manicure', sort_order:5 },
    { name_en:'Pedicure', name_te:'పెడిక్యూర్', slug:'pedicure', sort_order:6 },
    { name_en:'Waxing', name_te:'వాక్సింగ్', slug:'waxing', sort_order:7 },
    { name_en:'Bridal Makeup', name_te:'బ్రైడల్ మేకప్', slug:'bridal-makeup', sort_order:8 },
    { name_en:'Party Makeup', name_te:'పార్టీ మేకప్', slug:'party-makeup', sort_order:9 },
    { name_en:'Threading', name_te:'థ్రెడింగ్', slug:'threading', sort_order:10 },
    { name_en:'Hair Spa', name_te:'హెయిర్ స్పా', slug:'hair-spa', sort_order:11 },
    { name_en:'Bleach', name_te:'బ్లీచ్', slug:'bleach', sort_order:12 },
  ].map(s => ({ ...s, category_id: CAT.SV_BEAUTY, is_active: true }))

  // Photography subcategories
  const photoSubcats = [
    { name_en:'Wedding Photography', name_te:'పెళ్ళి ఫోటోగ్రఫీ', slug:'wedding-photography', sort_order:1 },
    { name_en:'Birthday Photography', name_te:'పుట్టినరోజు ఫోటోగ్రఫీ', slug:'birthday-photography', sort_order:2 },
    { name_en:'Pre-Wedding Shoot', name_te:'ప్రీ-వెడ్డింగ్ షూట్', slug:'pre-wedding', sort_order:3 },
    { name_en:'Videography', name_te:'వీడియోగ్రఫీ', slug:'videography', sort_order:4 },
    { name_en:'Drone Photography', name_te:'డ్రోన్ ఫోటోగ్రఫీ', slug:'drone-photography', sort_order:5 },
    { name_en:'Photo Editing', name_te:'ఫోటో ఎడిటింగ్', slug:'photo-editing', sort_order:6 },
    { name_en:'Album Design', name_te:'ఆల్బమ్ డిజైన్', slug:'album-design', sort_order:7 },
    { name_en:'Event Coverage', name_te:'ఈవెంట్ కవరేజ్', slug:'event-coverage', sort_order:8 },
  ].map(s => ({ ...s, category_id: CAT.SV_PHOTO, is_active: true }))

  // Function Halls subcategories
  const hallSubcats = [
    { name_en:'Wedding Halls', name_te:'పెళ్ళి హాళ్ళు', slug:'wedding-halls', sort_order:1 },
    { name_en:'Birthday Party Halls', name_te:'పుట్టినరోజు హాళ్ళు', slug:'birthday-halls', sort_order:2 },
    { name_en:'Conference Halls', name_te:'కాన్ఫరెన్స్ హాళ్ళు', slug:'conference-halls', sort_order:3 },
    { name_en:'Banquet Halls', name_te:'బ్యాంక్వెట్ హాళ్ళు', slug:'banquet-halls', sort_order:4 },
    { name_en:'Outdoor Venues', name_te:'బహిరంగ వేదికలు', slug:'outdoor-venues', sort_order:5 },
    { name_en:'Community Halls', name_te:'కమ్యూనిటీ హాళ్ళు', slug:'community-halls', sort_order:6 },
  ].map(s => ({ ...s, category_id: CAT.SV_HALLS, is_active: true }))

  // Moving subcategories
  const movingSubcats = [
    { name_en:'Packers & Movers Local', name_te:'స్థానిక ప్యాకర్స్', slug:'local-movers', sort_order:1 },
    { name_en:'Packers & Movers Intercity', name_te:'నగరాల మధ్య ప్యాకర్స్', slug:'intercity-movers', sort_order:2 },
    { name_en:'Vehicle Transportation', name_te:'వాహన రవాణా', slug:'vehicle-transport', sort_order:3 },
    { name_en:'Storage Services', name_te:'నిల్వ సేవలు', slug:'storage', sort_order:4 },
    { name_en:'Loading & Unloading', name_te:'లోడింగ్ & అన్‌లోడింగ్', slug:'loading-unloading', sort_order:5 },
  ].map(s => ({ ...s, category_id: CAT.SV_MOVING, is_active: true }))

  // Automotive Services subcategories
  const autoServicesSubcats = [
    { name_en:'Bike Mechanic', name_te:'బైక్ మెకానిక్', slug:'bike-mechanic', sort_order:1 },
    { name_en:'Car Mechanic', name_te:'కార్ మెకానిక్', slug:'car-mechanic', sort_order:2 },
    { name_en:'Car Wash & Detailing', name_te:'కార్ వాష్', slug:'car-wash', sort_order:3 },
    { name_en:'Tyre Replacement', name_te:'టైర్ మార్పు', slug:'tyre-replacement', sort_order:4 },
    { name_en:'Oil Change', name_te:'ఆయిల్ చేంజ్', slug:'oil-change', sort_order:5 },
    { name_en:'Battery Replacement', name_te:'బ్యాటరీ మార్పు', slug:'battery-replacement', sort_order:6 },
    { name_en:'Denting & Painting', name_te:'డెంటింగ్', slug:'denting-painting', sort_order:7 },
    { name_en:'Vehicle Inspection', name_te:'వాహన తనిఖీ', slug:'vehicle-inspection', sort_order:8 },
  ].map(s => ({ ...s, category_id: CAT.SV_AUTO, is_active: true }))

  // Education subcategories
  const educationSubcats = [
    { name_en:'Home Tuition K-12', name_te:'గృహ ట్యూషన్', slug:'home-tuition', sort_order:1 },
    { name_en:'Competitive Exam Coaching', name_te:'పోటీ పరీక్షల కోచింగ్', slug:'competitive-coaching', sort_order:2 },
    { name_en:'English Classes', name_te:'ఇంగ్లీష్ తరగతులు', slug:'english-classes', sort_order:3 },
    { name_en:'Telugu Classes', name_te:'తెలుగు తరగతులు', slug:'telugu-classes', sort_order:4 },
    { name_en:'Music Classes', name_te:'సంగీత తరగతులు', slug:'music-classes', sort_order:5 },
    { name_en:'Dance Classes', name_te:'నృత్య తరగతులు', slug:'dance-classes', sort_order:6 },
    { name_en:'Art & Craft Classes', name_te:'కళ తరగతులు', slug:'art-craft', sort_order:7 },
    { name_en:'Yoga Classes', name_te:'యోగా తరగతులు', slug:'yoga-classes', sort_order:8 },
    { name_en:'Computer Training', name_te:'కంప్యూటర్ శిక్షణ', slug:'computer-training', sort_order:9 },
  ].map(s => ({ ...s, category_id: CAT.SV_EDUCATION, is_active: true }))

  const allSubcats = [
    ...grocerySubcats, ...homeServicesSubcats, ...eventSubcats,
    ...beautySubcats, ...photoSubcats, ...hallSubcats,
    ...movingSubcats, ...autoServicesSubcats, ...educationSubcats,
  ]

  for (let i = 0; i < allSubcats.length; i += 50) {
    const batch = allSubcats.slice(i, i + 50)
    const { error } = await supabase.from('subcategories').upsert(batch, { onConflict: 'category_id,slug' })
    if (error) console.error('Subcategory batch error:', error)
  }

  console.log(`✅ ${allSubcats.length} subcategories seeded`)

  // ── KURNOOL-SPECIFIC SERVICE PROVIDERS SEED ────────────────────────────────
  console.log('🌱 Seeding Kurnool service providers...')

  // Note: In production, create auth users first then service_providers
  // For seed, we assume user accounts already exist with these IDs
  // Run this after the main user seed (001_users.ts)

  const kurnoolProviders = [
    {
      name: 'Raju Electricals - Home Services',
      description_en: 'Expert electrician with 12 years experience in Kurnool. All wiring, switchboard, and fan installation work.',
      description_te: '12 సంవత్సరాల అనుభవం గల నిపుణుడైన ఎలక్ట్రీషియన్. అన్ని రకాల వైరింగ్, స్విచ్‌బోర్డ్, ఫ్యాన్ ఇన్స్టాలేషన్ పని.',
      base_price: 299,
      price_unit: 'per visit',
      experience_years: 12,
      is_available: true,
    },
    {
      name: 'Venkatesh Plumbing Services',
      description_en: 'All plumbing work - pipe fitting, tap replacement, bathroom fitting in Kurnool and surrounding areas.',
      description_te: 'అన్ని ప్లంబింగ్ పనులు - పైపు ఫిట్టింగ్, కుళాయి మార్పు, బాత్రూమ్ ఫిట్టింగ్.',
      base_price: 249,
      price_unit: 'per visit',
      experience_years: 8,
      is_available: true,
    },
    {
      name: 'Sri Lakshmi Beauty Parlour - At Home',
      description_en: 'Professional at-home beauty services. Bridal packages, facial, manicure, pedicure in Kurnool.',
      description_te: 'ఇంట్లో వృత్తిపరమైన అందం సేవలు. బ్రైడల్ ప్యాకేజీలు, ఫేషియల్, మానిక్యూర్, పెడిక్యూర్.',
      base_price: 399,
      price_unit: 'per session',
      experience_years: 6,
      is_available: true,
    },
    {
      name: 'Kurnool Events & Photography',
      description_en: 'Professional wedding and event photography. Serving Kurnool and Nandyal. Drone photography available.',
      description_te: 'వివాహం మరియు ఈవెంట్ ఫోటోగ్రఫీ. డ్రోన్ ఫోటోగ్రఫీ అందుబాటులో ఉంది.',
      base_price: 15000,
      price_unit: 'per event',
      experience_years: 9,
      is_available: true,
    },
    {
      name: 'Srinivas Tent & Shamiana Works',
      description_en: 'Shamiana, tent, sound system and decoration rental for all events in Kurnool. 20+ years serving Kurnool.',
      description_te: 'శామియానా, టెంట్, సౌండ్ సిస్టమ్ మరియు డెకొరేషన్ అద్దె. 20+ సంవత్సరాలుగా కర్నూలులో సేవలు.',
      base_price: 5000,
      price_unit: 'per event',
      experience_years: 20,
      is_available: true,
    },
    {
      name: 'Priya Mehendi Art',
      description_en: 'Traditional and modern Mehendi designs. Bridal mehendi specialist. Home service available in Kurnool.',
      description_te: 'సంప్రదాయ మరియు ఆధునిక మెహందీ డిజైన్లు. బ్రైడల్ మెహందీ నిపుణురాలు.',
      base_price: 1500,
      price_unit: 'per function',
      experience_years: 7,
      is_available: true,
    },
    {
      name: 'Kurnool AC & Refrigeration Services',
      description_en: 'AC installation, service and repair. All brands. Refrigerator and washing machine repair in Kurnool.',
      description_te: 'AC ఇన్స్టాలేషన్, సర్వీస్ మరియు రిపేర్. అన్ని బ్రాండ్లు. ఫ్రిజ్ మరియు వాషింగ్ మెషిన్ రిపేర్.',
      base_price: 499,
      price_unit: 'per service',
      experience_years: 10,
      is_available: true,
    },
    {
      name: 'Swift Packers & Movers Kurnool',
      description_en: 'Reliable packing and moving service in Kurnool. Local and intercity moving with full insurance coverage.',
      description_te: 'కర్నూలులో విశ్వసనీయ ప్యాకింగ్ మరియు మూవింగ్ సేవ. పూర్తి భీమా కవరేజ్.',
      base_price: 3000,
      price_unit: 'per move',
      experience_years: 5,
      is_available: true,
    },
  ]

  console.log(`📋 ${kurnoolProviders.length} providers ready for seeding`)
  console.log('ℹ️  Create auth users first, then run provider insert with user_ids')

  // ── KURNOOL FUNCTION HALLS SEED ────────────────────────────────────────────
  console.log('🌱 Seeding Kurnool function halls...')

  // Function hall data (seed after vendors are created with vendor_ids)
  const kurnoolHalls = [
    {
      name: 'Sri Venkateswara Kalyana Mandapam',
      name_te: 'శ్రీ వేంకటేశ్వర కళ్యాణ మండపం',
      description_en: 'A premier wedding hall in the heart of Kurnool. AC hall with 500 guest capacity. Catering and decoration available.',
      description_te: 'కర్నూలు మధ్యలో ఒక ప్రీమియర్ వివాహ హాలు. AC హాలు, 500 అతిథి సామర్థ్యం. క్యాటరింగ్ మరియు డెకొరేషన్ అందుబాటులో.',
      address_line: 'Railway Station Road, Kurnool',
      lat: 15.8281, lng: 78.0373,
      capacity_min: 100, capacity_max: 500,
      price_per_day: 50000, price_per_half_day: 30000,
      amenities: ['AC', 'Parking', 'Catering', 'Stage', 'Generator', 'Bridal Room'],
      amenities_te: ['AC', 'పార్కింగ్', 'క్యాటరింగ్', 'స్టేజ్', 'జనరేటర్', 'బ్రైడల్ రూమ్'],
      is_ac: true, has_parking: true, has_catering: true, has_decoration: true,
    },
    {
      name: 'Rayalaseema Convention Centre',
      name_te: 'రాయలసీమ కన్వెన్షన్ సెంటర్',
      description_en: 'Modern convention centre for weddings, corporate events, and conferences. 800 guest capacity.',
      description_te: 'పెళ్ళిళ్ళు, కార్పొరేట్ ఈవెంట్లు మరియు సమావేశాల కోసం ఆధునిక కన్వెన్షన్ సెంటర్. 800 అతిథి సామర్థ్యం.',
      address_line: 'Bellary Road, Kurnool',
      lat: 15.8355, lng: 78.0525,
      capacity_min: 200, capacity_max: 800,
      price_per_day: 80000, price_per_half_day: 50000,
      amenities: ['AC', 'Parking', 'Catering', 'Stage', 'LED Wall', 'Generator', '2 Bridal Rooms'],
      amenities_te: ['AC', 'పార్కింగ్', 'క్యాటరింగ్', 'స్టేజ్', 'LED వాల్', 'జనరేటర్'],
      is_ac: true, has_parking: true, has_catering: true, has_decoration: true,
    },
    {
      name: 'Kurnool Community Hall',
      name_te: 'కర్నూలు కమ్యూనిటీ హాలు',
      description_en: 'Affordable community hall for local events, birthday parties, and small functions.',
      description_te: 'స్థానిక ఈవెంట్లు, పుట్టినరోజు పార్టీలు మరియు చిన్న కార్యక్రమాల కోసం పరిసరాల హాలు.',
      address_line: 'Budhawarpet, Kurnool',
      lat: 15.8297, lng: 78.0392,
      capacity_min: 50, capacity_max: 200,
      price_per_day: 15000, price_per_half_day: 9000,
      amenities: ['Parking', 'Stage', 'Generator'],
      amenities_te: ['పార్కింగ్', 'స్టేజ్', 'జనరేటర్'],
      is_ac: false, has_parking: true, has_catering: false, has_decoration: false,
    },
    {
      name: 'Nandyal Gardens & Open Venue',
      name_te: 'నంద్యాల గార్డెన్స్ & ఓపెన్ వేదిక',
      description_en: 'Beautiful outdoor venue for open-air weddings and events. 1000+ guest capacity. 2 hours from Kurnool.',
      description_te: 'బహిరంగ పెళ్ళిళ్ళు మరియు ఈవెంట్ల కోసం అందమైన బహిరంగ వేదిక. 1000+ అతిథి సామర్థ్యం.',
      address_line: 'Nandyal Highway, Near Kurnool',
      lat: 15.4785, lng: 78.4879,
      capacity_min: 200, capacity_max: 1500,
      price_per_day: 40000, price_per_half_day: 25000,
      amenities: ['Parking', 'Catering', 'Stage', 'Generator', 'Lawn'],
      amenities_te: ['పార్కింగ్', 'క్యాటరింగ్', 'స్టేజ్', 'జనరేటర్', 'లాన్'],
      is_ac: false, has_parking: true, has_catering: true, has_decoration: false,
    },
  ]

  console.log(`🏛️  ${kurnoolHalls.length} function halls ready for seeding`)
  console.log('ℹ️  Attach vendor_ids after vendor seed is complete')
  console.log('✅ Taxonomy seed complete!')
}

seed().catch(console.error)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 6. NEW EDGE FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### supabase/functions/create-service-booking/index.ts

Steps in order:
1. Auth check — get user from JWT
2. Parse body: `{ provider_id, service_category_id, service_subcategory_id?, scheduled_date, time_slot_id?, start_time, payment_method, address_id, notes? }`
3. Validate address belongs to user
4. Fetch service provider — confirm approved and is_available
5. If time_slot_id provided: verify slot is not already booked
6. Fetch provider's base_price as base_amount; set final_amount = base_amount
7. INSERT into service_bookings (adminClient)
8. If time_slot_id provided: UPDATE time_slots SET is_booked = TRUE
9. If payment_method !== 'cod': create Razorpay order in paise
10. Return `{ booking, razorpay_order_id?, razorpay_key_id? }`

### supabase/functions/create-hall-booking/index.ts

Steps in order:
1. Auth check
2. Parse body: `{ hall_id, event_date, slot, event_type, guest_count, payment_method, notes? }`
3. Validate hall exists and is_active
4. Check no existing booking for same hall_id + event_date + slot (UNIQUE constraint)
5. Fetch hall price: slot = 'full_day' → price_per_day, else price_per_half_day
6. Set advance_paid = amount * 0.25 (25% advance), balance_due = amount * 0.75
7. INSERT into hall_bookings (adminClient)
8. If payment_method !== 'cod': create Razorpay order for advance_paid amount
9. Return `{ booking, razorpay_order_id?, razorpay_key_id? }`

### supabase/functions/update-service-booking/index.ts

Valid transitions:
```
pending     → confirmed, cancelled
confirmed   → in_progress, cancelled, rescheduled
in_progress → completed
completed   → (terminal)
cancelled   → (terminal)
rescheduled → confirmed
```
Steps:
1. Auth check
2. Parse body: `{ booking_id, status, cancellation_reason?, completion_photo_urls? }`
3. Fetch current booking — verify caller is provider or admin
4. Validate transition
5. If status = 'completed': require at least 1 completion_photo_url
6. UPDATE service_bookings (adminClient)
7. Return updated booking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 7. CUSTOMER APP — NEW & MODIFIED PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 7.1 HOME PAGE REDESIGN  (src/app/(customer)/page.tsx)

Replace the existing home page with a two-section architecture:

**Top bar:** Same as before — location, bell, title

**Section Tabs** (just below top bar, full width, sticky):
- Two large pill tabs: 🛒 Shopping | 🔧 Services
- Active tab has brand blue background, white text
- Switching tabs instantly filters all content below
- Persist selected tab to localStorage key `km-active-section`

**SHOPPING TAB content:**
- Search bar → links to /search?section=shopping
- Category grid: 4-column icon grid, all 15 shopping categories
  - Each category card: emoji/icon + name_te (if Telugu selected) or name_en
  - Inactive categories (is_active=false) are hidden
- "Popular Products" horizontal scroll (last 8 products)
- "Kurnool Favourites" section — sweets & snacks + local grocery

**SERVICES TAB content:**
- Search bar → links to /search?section=services
- Service category grid: 4-column, all 8 service categories with distinct icons
  - Home Services 🔧, Automotive 🚗, Beauty 💄, Photography 📷,
    Events 🎪, Function Halls 🏛️, Moving 📦, Education 📚
- "Quick Book" — horizontal scroll of top-rated service providers
- "Function Halls" — 2 hall cards with image, name, capacity, price/day
- "Featured Events" — event rental providers (shamiana, sound system)

### 7.2 NEW ROUTES REQUIRED

```
src/app/(customer)/
├── services/
│   ├── page.tsx                         ← services home (redirect to /)
│   ├── [categorySlug]/
│   │   ├── page.tsx                     ← service category listing
│   │   └── [subcategorySlug]/
│   │       └── page.tsx                 ← subcategory providers list
├── providers/
│   └── [id]/
│       ├── page.tsx                     ← provider profile + booking form
│       └── book/page.tsx                ← booking confirmation
├── halls/
│   ├── page.tsx                         ← function halls listing
│   └── [id]/
│       ├── page.tsx                     ← hall detail + availability calendar
│       └── book/page.tsx                ← hall booking confirmation
├── rentals/
│   └── [subcategorySlug]/
│       └── page.tsx                     ← rental items listing
├── bookings/
│   ├── page.tsx                         ← all bookings (orders + service + hall)
│   └── [id]/page.tsx                    ← booking detail with Realtime status
└── categories/
    └── [slug]/page.tsx                  ← EXISTING: add subcategory filter tabs
```

### 7.3 SERVICE CATEGORY LISTING PAGE
`src/app/(customer)/services/[categorySlug]/page.tsx`

- Server Component, fetch category by slug
- Show subcategory filter chips (horizontal scroll)
- Grid of service provider cards:
  - Profile photo, name, rating stars, review count
  - "Starts at ₹XXX per visit" tag
  - Experience badge "X years"
  - "Book Now" button → /providers/[id]

### 7.4 SERVICE PROVIDER PROFILE PAGE
`src/app/(customer)/providers/[id]/page.tsx`

- Provider name, photo, rating, reviews
- Portfolio image gallery (horizontal scroll)
- About section (description_en or description_te based on lang pref)
- Subcategories offered (as chips)
- Price breakdown
- "Available Slots" calendar — show next 7 days
  - Each day shows available time slots as buttons
  - Booked slots are greyed out
- Sticky bottom: "Book This Service" button

### 7.5 FUNCTION HALLS LISTING PAGE
`src/app/(customer)/halls/page.tsx`

- Filter chips: All | Wedding | Birthday | Conference | Outdoor
- Hall cards: image, name, capacity (min–max guests), price/day, amenity icons
  - Amenity icons: ❄️ AC | 🅿️ Parking | 🍽️ Catering | 🎨 Decoration
- "Check Availability" button → hall detail page

### 7.6 FUNCTION HALL DETAIL PAGE
`src/app/(customer)/halls/[id]/page.tsx`

- Image carousel (all hall images)
- Name (bilingual), address, capacity info
- Amenities grid with icons
- Pricing table: Full Day | Morning | Evening slots with prices
- Availability calendar: dates with green (available) / red (booked) / grey (blocked) indicators
- "Book Now" CTA → hall booking form

### 7.7 MODIFIED CATEGORY PAGE
Update `src/app/(customer)/categories/[slug]/page.tsx`:

- Add subcategory filter tabs below PageHeader
  - Fetch subcategories for this category
  - "All" tab + one tab per active subcategory
  - Active tab = bold, brand underline
  - Selecting a tab filters products by subcategory_id
- Product grid remains the same

### 7.8 UNIFIED BOOKINGS PAGE
`src/app/(customer)/bookings/page.tsx`

Replace existing orders page OR add a tab system:

Tab 1: **Orders** (existing product orders)
Tab 2: **Service Bookings** (service_bookings)
Tab 3: **Hall Bookings** (hall_bookings)

Each service booking card:
- Booking number (monospace), provider name, subcategory, date, status badge, amount
- Link to /bookings/[id]

### 7.9 BOTTOM NAV UPDATE
Update `src/components/customer/bottom-nav.tsx`:

Replace current 5 tabs with:
- 🏠 Home (/)
- 🔍 Search (/search)
- 🛒 Cart (/cart)
- 📋 Bookings (/bookings) ← replaces Orders, covers all booking types
- 👤 Account (/account)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 8. ADMIN PANEL — FULL CATEGORY MANAGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 8.1 ADMIN SIDEBAR UPDATE

Add these new links to the admin sidebar nav:

- All Orders (existing)
- Service Bookings (NEW)
- Hall Bookings (NEW)
- Vendors (existing)
- Service Providers (NEW)
- Category Manager (NEW)
- Function Halls (NEW)

### 8.2 CATEGORY MANAGER PAGE
`src/app/(admin)/categories/page.tsx` — Client Component

This is the most important new admin page.

**Layout:** Three-column panel (desktop), stack on tablet.

**Column 1 — Sections:**
- Two section cards: Shopping | Services
- Each has a green/red toggle switch (`is_active`)
- Selecting a section highlights it and loads its categories in Column 2

**Column 2 — Categories:**
- List of all categories belonging to selected section
- Each category row:
  - Category name (EN + TE)
  - Toggle switch (`is_active`) — disabled if parent section is off
  - Category count badge (number of active subcategories)
  - Clicking selects it and loads subcategories in Column 3
- "+ Add Category" button at bottom (opens modal with EN name, TE name, slug, sort_order)

**Column 3 — Subcategories:**
- List of all subcategories for selected category
- Each subcategory row:
  - Name (EN + TE)
  - Toggle switch (`is_active`) — disabled if parent category is off
  - Drag handle for reordering (updates sort_order via PATCH)
- "+ Add Subcategory" button (opens modal with EN name, TE name, slug)

**Toggle behaviour:**
- Toggling a section OFF → shows warning modal: "This will hide X categories and Y products/services. Continue?"
- Toggling a category OFF → shows warning: "This will hide X subcategories and Y products. Continue?"
- Toggling a subcategory OFF → hides it from customer app immediately
- All toggles call `toggle_category_active` RPC via service_role Edge Function

**Implementation detail:**
```typescript
// Admin category toggle action
async function toggleEntity(
  entityType: 'section' | 'category' | 'subcategory',
  entityId: string,
  newValue: boolean
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-toggle-category`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        is_active: newValue,
      }),
    }
  )
  return res.json()
}
```

### 8.3 VENDOR CATEGORY ASSIGNMENT PAGE
`src/app/(admin)/vendors/[id]/assignments/page.tsx` — Client Component

Accessible via "Manage Categories" button on the vendor detail modal.

**Layout:**
- Left: vendor info card (name, KYC status, phone)
- Right: category assignment panel

**Assignment panel:**
- All active shopping categories listed as accordion items
- Each category:
  - Checkbox to include/exclude this category for this vendor
  - When checked: expand to show subcategory checkboxes
  - "Set as Primary Category" radio (one per vendor)
- "Save Assignments" button → upsert into `vendor_category_assignments`

**Effect of assignment:**
- Products added by this vendor are automatically tagged to their assigned categories
- Vendor profile shows their assigned categories as chip badges
- Products from a vendor only appear in categories they're assigned to

### 8.4 SERVICE PROVIDERS PAGE
`src/app/(admin)/service-providers/page.tsx` — Client Component

- Filter tabs: All | Pending | Approved | Suspended
- Provider cards: photo, name, phone, service categories (chips), rating, police verified badge
- Actions:
  - `pending` → Approve (sets status='approved') + Reject
  - `approved` → Suspend + View Bookings
  - `suspended` → Reinstate
- "Add Provider" button → opens form modal with all ServiceProvider fields

### 8.5 SERVICE BOOKINGS PAGE
`src/app/(admin)/service-bookings/page.tsx` — Client Component

- Status filter tabs: All | Pending | Confirmed | In Progress | Completed | Cancelled
- Table: Booking #, Customer, Provider, Service, Date, Amount, Status, Actions
- Actions: Confirm, Cancel (with reason), View Details

### 8.6 FUNCTION HALLS ADMIN PAGE
`src/app/(admin)/halls/page.tsx` — Client Component

- List all function halls with vendor name, name, capacity, price, status
- Toggle active/inactive per hall
- "View Bookings" → shows hall_bookings for that hall

### 8.7 ADMIN EDGE FUNCTION: admin-toggle-category

Create: `supabase/functions/admin-toggle-category/index.ts`

Steps:
1. Auth check — require role = 'admin'
2. Parse body: `{ entity_type, entity_id, is_active }`
3. Call `toggle_category_active` RPC via adminClient
4. Return `{ success: true, entity_type, entity_id, is_active }`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9. VENDOR PORTAL — UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 9.1 VENDOR PRODUCTS UPDATE
Update `src/app/(vendor)/products/product-form-modal.tsx`:

- Add **Subcategory** select dropdown (fetched dynamically when Category is selected)
- Subcategory is optional but recommended
- When category changes: clear subcategory selection and refetch subcategories

### 9.2 VENDOR REGISTRATION UPDATE
Update vendor registration form:

- Add "Select Your Categories" multi-select (checkboxes for all shopping categories)
- Add "Subcategories you stock" multi-select (loads when categories are selected)
- These map to `vendor_category_assignments` on approval

### 9.3 SERVICE PROVIDER PORTAL (NEW)
For service providers (not product vendors), create a lightweight portal:

`src/app/(vendor)/services/page.tsx` — Service bookings list
`src/app/(vendor)/services/slots/page.tsx` — Manage available time slots

**Services bookings list:**
- Incoming booking cards: customer name, service, date, time, amount
- Accept / Decline buttons for pending bookings
- "Mark In Progress" and "Mark Complete" (with photo upload) for confirmed bookings
- Realtime subscription on service_bookings for their provider_id

**Time slot manager:**
- Week calendar view (Mon–Sun)
- Click any time block to add availability (start + end time)
- Toggle "Blocked" on existing slots
- "Repeat this schedule for next 4 weeks" convenience button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 10. DESIGN TOKENS & UI UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 10.1 Color Additions
Add to tailwind.config.ts:
```javascript
theme: {
  extend: {
    colors: {
      // existing brand colors...
      services: {
        DEFAULT: '#7C3AED',       // purple for services section
        light:   '#EDE9FE',
        dark:    '#4C1D95',
      },
      shopping: {
        DEFAULT: '#1A56DB',       // existing brand blue
        light:   '#DBEAFE',
        dark:    '#1E3A5F',
      },
      booking: {
        pending:    '#F59E0B',
        confirmed:  '#3B82F6',
        in_progress:'#8B5CF6',
        completed:  '#10B981',
        cancelled:  '#EF4444',
        rescheduled:'#F97316',
      }
    }
  }
}
```

### 10.2 New Shared Components
Add to `src/components/shared/index.tsx`:

**SectionTab** — pill-style toggle for Shopping / Services
```typescript
interface SectionTabProps {
  active: SectionType
  onChange: (section: SectionType) => void
}
// Renders two large pill tabs with brand-appropriate colors
// Shopping = blue, Services = purple
```

**ServiceProviderCard** — card for provider listings
```typescript
interface ServiceProviderCardProps {
  provider: ServiceProvider
  subcategory?: Subcategory
}
// Shows: profile photo (60px circle), name, rating stars, review count,
// "Starts at ₹X per Y" tag, experience badge, Book Now button
```

**BookingStatusBadge** — mirrors OrderStatusBadge for service bookings
```typescript
// Maps BookingStatus to color and label (EN + TE)
const BOOKING_STATUS_LABELS_EN = {
  pending:     'Pending',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  rescheduled: 'Rescheduled',
}
const BOOKING_STATUS_LABELS_TE = {
  pending:     'పెండింగ్',
  confirmed:   'నిర్ధారించబడింది',
  in_progress: 'జరుగుతోంది',
  completed:   'పూర్తయింది',
  cancelled:   'రద్దు చేయబడింది',
  rescheduled: 'పునర్నిర్ణయించబడింది',
}
```

**HallCard** — function hall card for listings
```typescript
// Shows: hall image (16:9 aspect), name, capacity range, price/day,
// amenity icon pills, "Check Dates" button
```

**SubcategoryChips** — horizontal scroll of chips for filtering
```typescript
interface SubcategoryChipsProps {
  subcategories: Subcategory[]
  selected: string | null
  onSelect: (id: string | null) => void
  lang: 'en' | 'te'
}
```

**CategoryIcon** — maps category slug to emoji icon
```typescript
const CATEGORY_ICONS: Record<string, string> = {
  'grocery': '🛒',
  'electronics': '📱',
  'fashion': '👗',
  'electricals': '⚡',
  'plumbing': '🔧',
  'building-materials': '🧱',
  'stationery': '📝',
  'sweets-snacks': '🍮',
  'pharmacy-health': '💊',
  'books-magazines': '📚',
  'pet-supplies': '🐾',
  'sports-fitness': '⚽',
  'toys-baby': '🧸',
  'automotive': '🚗',
  'home-decor': '🏠',
  'home-services': '🔨',
  'automotive-services': '🔩',
  'beauty-salon': '💄',
  'photography': '📷',
  'event-rentals': '🎪',
  'function-halls': '🏛️',
  'moving-logistics': '📦',
  'education': '🎓',
}
```

**AdminToggleRow** — reusable row for admin category manager
```typescript
interface AdminToggleRowProps {
  id: string
  nameEn: string
  nameTe: string
  isActive: boolean
  isDisabled?: boolean     // greyed out when parent is off
  onToggle: (id: string, newVal: boolean) => void
  badge?: string           // e.g., "14 items"
  isSelected?: boolean     // highlighted when selected
  onClick?: () => void
}
```

### 10.3 Category Grid Component
Create `src/components/customer/category-grid.tsx`:

```typescript
// Props: categories[], section, lang, columns (2|4)
// Renders grid of category cards
// 4-column layout for home screen
// 2-column layout for search/browse
// Each card: icon (emoji, 32px), name (12px), brand bg on hover
// Inactive categories filtered out (never rendered)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 11. UTILS ADDITIONS  (src/lib/utils/index.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these utilities (do not remove existing ones):

```typescript
// Booking status labels (EN + TE)
BOOKING_STATUS_LABELS: Record<BookingStatus, { en: string; te: string }>
BOOKING_STATUS_COLORS: Record<BookingStatus, string>

// Format booking duration
formatDuration(hours: number): string  // "2 hours" | "2.5 hours"

// Format date for display (Indian format)
formatDateShort(date: string): string  // "12 Apr" 
formatDateFull(date: string): string   // "12 April 2026, Tuesday"

// Format time slot
formatTimeSlot(start: string, end: string): string  // "10:00 AM - 12:00 PM"

// Check if a date is in the past
isPastDate(date: string): boolean

// Get next N available dates (excluding Sundays optionally)
getNextAvailableDates(n: number, excludeSundays?: boolean): string[]

// Category icon from slug
getCategoryIcon(slug: string): string

// Section color classes
getSectionColors(section: SectionType): { bg: string; text: string; border: string }
// Shopping → brand blue classes
// Services → purple classes
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 12. BUILD ORDER FOR THIS ENHANCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute changes in this exact order to avoid import/dependency errors:

### Phase A — Types & Database
1. Add all new types to `src/lib/types/index.ts`
2. Run `supabase/migrations/003_sections_subcategories.sql`
3. Run `supabase/migrations/004_products_subcategory.sql`
4. Run `npx tsx supabase/seed/002_taxonomy.ts`

### Phase B — Utilities & Shared Components
5. Add utils to `src/lib/utils/index.ts`
6. Add new shared components to `src/components/shared/index.tsx`
7. Create `src/components/customer/category-grid.tsx`
8. Update `tailwind.config.ts` with new colors

### Phase C — Edge Functions
9. Create `supabase/functions/admin-toggle-category/index.ts`
10. Create `supabase/functions/create-service-booking/index.ts`
11. Create `supabase/functions/create-hall-booking/index.ts`
12. Create `supabase/functions/update-service-booking/index.ts`

### Phase D — Admin Panel
13. Create `src/app/(admin)/categories/page.tsx`
14. Create `src/app/(admin)/vendors/[id]/assignments/page.tsx`
15. Create `src/app/(admin)/service-providers/page.tsx`
16. Create `src/app/(admin)/service-bookings/page.tsx`
17. Create `src/app/(admin)/halls/page.tsx`
18. Update admin sidebar layout to include new nav items

### Phase E — Customer App New Pages
19. Create `src/app/(customer)/services/[categorySlug]/page.tsx`
20. Create `src/app/(customer)/services/[categorySlug]/[subcategorySlug]/page.tsx`
21. Create `src/app/(customer)/providers/[id]/page.tsx`
22. Create `src/app/(customer)/providers/[id]/book/page.tsx`
23. Create `src/app/(customer)/halls/page.tsx`
24. Create `src/app/(customer)/halls/[id]/page.tsx`
25. Create `src/app/(customer)/halls/[id]/book/page.tsx`
26. Create `src/app/(customer)/rentals/[subcategorySlug]/page.tsx`
27. Create `src/app/(customer)/bookings/page.tsx`
28. Create `src/app/(customer)/bookings/[id]/page.tsx`

### Phase F — Modify Existing Pages
29. Rewrite `src/app/(customer)/page.tsx` — new home with section tabs
30. Update `src/app/(customer)/categories/[slug]/page.tsx` — add subcategory chips
31. Update `src/components/customer/bottom-nav.tsx` — Bookings tab
32. Update `src/app/(vendor)/products/product-form-modal.tsx` — subcategory select
33. Update vendor registration form — category/subcategory multi-select

### Phase G — Vendor Service Portal
34. Create `src/app/(vendor)/services/page.tsx`
35. Create `src/app/(vendor)/services/slots/page.tsx`

### Phase H — Verification
36. Run `npx tsc --noEmit` — zero TypeScript errors
37. Run `npx next build` — successful build
38. Deploy edge functions: `supabase functions deploy --all`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 13. CODING RULES — ADDITIONS TO EXISTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All original coding rules from the MVP prompt still apply. Add:

15. **Section awareness:** Every data fetch involving categories MUST filter by
    `is_active = TRUE` on section, category, AND subcategory. Never show
    inactive taxonomy nodes to customers.

16. **Service vs Product routing:** Pages under `/services/` and `/providers/`
    and `/halls/` MUST use the services purple color theme
    (`services` Tailwind color tokens). Product pages use the brand blue.

17. **Booking flow mirrors order flow:** Service and hall bookings follow the
    same Edge Function pattern as product orders — never write directly to
    booking tables from client components.

18. **Subcategory fetch pattern:** When a page needs subcategories for a
    category, use a single query:
    ```typescript
    supabase.from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order')
    ```
    Never fetch all subcategories and filter client-side.

19. **Admin toggle safety:** The toggle_category_active RPC is REVOKE'd from
    PUBLIC. It MUST only be called from the `admin-toggle-category` Edge
    Function using service_role. Never call it directly from client code.

20. **Telugu labels for all new entities:** Every new page showing category,
    subcategory, service, or hall names MUST respect the user's `language_pref`
    (en or te) from their user profile and show the appropriate field.

21. **Realtime for service bookings:** The `service_bookings` table is already
    added to supabase_realtime. Subscribe in booking detail pages the same way
    order detail pages subscribe — always clean up in useEffect return.

22. **Hall booking conflict prevention:** The UNIQUE constraint on
    (hall_id, event_date, slot) is the source of truth. Always catch
    Supabase unique violation errors (code '23505') and show a user-friendly
    "This slot is already booked. Please choose another date." message.

23. **Mobile-first for all new pages:** Service category listings, provider
    profiles, and hall listings MUST all render perfectly on 375px. Use the
    same `max-w-md mx-auto` container as existing customer pages.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 14. VERIFY AFTER BUILDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After implementing all changes, verify:

1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx next build` — clean build, no errors
3. Home page renders both Shopping and Services tabs
4. Toggling tabs switches category grid instantly (no page reload)
5. Admin /categories page loads 3-column panel with toggles
6. Toggling a section OFF in admin hides its categories from customer home
7. Toggling a category OFF hides its subcategory chips from category page
8. Subcategory chips appear on /categories/[slug] and filter products
9. Service booking flow reaches confirmation page without errors
10. Hall booking shows UNIQUE constraint error if same date/slot is booked twice
11. Vendor assignment page shows all categories with checkboxes
12. Service provider portal shows incoming bookings in real time
13. All Telugu labels render correctly in Noto Sans Telugu font
14. All new admin sidebar items are visible and route correctly
15. Bottom nav "Bookings" tab shows combined list of orders + service + hall bookings
16. `supabase functions deploy --all` succeeds for all 7 edge functions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now begin. Read existing project files first.
Implement all changes from the build order in Section 12.
Do not truncate any file. Do not add placeholder TODO comments.
Every function must be fully implemented.

