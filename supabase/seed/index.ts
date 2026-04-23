import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'fs'

// Load env manually since we're running with tsx
const envContent = (() => {
  try {
    return require('fs').readFileSync('.env.local', 'utf-8')
  } catch {
    return ''
  }
})()

envContent.split('\n').forEach((line: string) => {
  const [key, ...valueParts] = line.split('=')
  const value = valueParts.join('=').trim()
  if (key && value && !key.startsWith('#')) {
    process.env[key.trim()] = value.replace(/^['"]|['"]$/g, '')
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── Category IDs (matching migration seeds) ──────────────

const CATEGORY_IDS = {
  grocery: '11111111-0000-0000-0000-000000000001',
  electronics: '11111111-0000-0000-0000-000000000002',
  fashion: '11111111-0000-0000-0000-000000000003',
  electricals: '11111111-0000-0000-0000-000000000004',
  plumbing: '11111111-0000-0000-0000-000000000005',
  buildingMaterials: '11111111-0000-0000-0000-000000000006',
  stationery: '11111111-0000-0000-0000-000000000007',
  sweetsSnacks: '11111111-0000-0000-0000-000000000008',
}

// ─── Seed users ───────────────────────────────────────────

async function createUser(phone: string, role: string, name: string) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    phone,
    phone_confirm: true,
    user_metadata: { name },
  })

  if (authError && !authError.message.includes('already registered')) {
    throw new Error(`Failed to create auth user ${phone}: ${authError.message}`)
  }

  // Get or fetch the user
  const userId = authData?.user?.id

  if (!userId) {
    // User may already exist — query by phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.phone === phone)
    if (!existingUser) {
      throw new Error(`Could not find or create user with phone ${phone}`)
    }

    // Update public.users record
    await supabase
      .from('users')
      .upsert({ id: existingUser.id, phone, name, role }, { onConflict: 'id' })

    return existingUser.id
  }

  // Upsert into public.users
  await supabase
    .from('users')
    .upsert({ id: userId, phone, name, role }, { onConflict: 'id' })

  return userId
}

// ─── Main seed function ───────────────────────────────────

async function seed() {
  console.log('🌱 Starting Kurnool Mall seed...\n')

  const createdUsers: Array<{ phone: string; name: string; role: string; id: string }> = []

  // ── 1. Admin user ─────────────────────────────────────────
  console.log('Creating admin user...')
  const adminId = await createUser('+919000000001', 'admin', 'Admin User')
  createdUsers.push({ phone: '+919000000001', name: 'Admin User', role: 'admin', id: adminId })
  console.log(`  ✓ Admin: ${adminId}`)

  // ── 2. Vendor 1: Ramaiah General Stores ───────────────────
  console.log('Creating vendor 1: Ramaiah General Stores...')
  const v1UserId = await createUser('+919000000002', 'vendor', 'Ramaiah Reddy')
  createdUsers.push({ phone: '+919000000002', name: 'Ramaiah Reddy', role: 'vendor', id: v1UserId })

  const { data: vendor1 } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: v1UserId,
        shop_name: 'Ramaiah General Stores',
        description: 'Fresh groceries and local sweets since 1985',
        category_ids: [CATEGORY_IDS.grocery, CATEGORY_IDS.sweetsSnacks],
        kyc_status: 'approved',
        is_active: true,
        commission_rate: 10,
        address_line: 'Main Bazar, Near Clock Tower, Kurnool',
        rating: 4.20,
        rating_count: 156,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (!vendor1) throw new Error('Failed to create vendor 1')
  console.log(`  ✓ Vendor 1: ${vendor1.id}`)

  // ── 3. Vendor 2: Priya Sweets & Bakery ────────────────────
  console.log('Creating vendor 2: Priya Sweets & Bakery...')
  const v2UserId = await createUser('+919000000003', 'vendor', 'Priya Lakshmi')
  createdUsers.push({ phone: '+919000000003', name: 'Priya Lakshmi', role: 'vendor', id: v2UserId })

  const { data: vendor2 } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: v2UserId,
        shop_name: 'Priya Sweets & Bakery',
        description: 'Traditional Kurnool sweets and fresh bakery items',
        category_ids: [CATEGORY_IDS.sweetsSnacks],
        kyc_status: 'approved',
        is_active: true,
        commission_rate: 8,
        address_line: 'Bellary Road, Kurnool - 518001',
        rating: 4.50,
        rating_count: 89,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (!vendor2) throw new Error('Failed to create vendor 2')
  console.log(`  ✓ Vendor 2: ${vendor2.id}`)

  // ── 4. Vendor 3: Sri Venkateshwara Electricals ────────────
  console.log('Creating vendor 3: Sri Venkateshwara Electricals...')
  const v3UserId = await createUser('+919000000004', 'vendor', 'Venkata Rao')
  createdUsers.push({ phone: '+919000000004', name: 'Venkata Rao', role: 'vendor', id: v3UserId })

  const { data: vendor3 } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: v3UserId,
        shop_name: 'Sri Venkateshwara Electricals',
        description: 'Electricals, plumbing and building materials — all your construction needs',
        category_ids: [CATEGORY_IDS.electricals, CATEGORY_IDS.plumbing, CATEGORY_IDS.buildingMaterials],
        kyc_status: 'approved',
        is_active: true,
        commission_rate: 7,
        address_line: 'Industrial Area, Near Bus Stand, Kurnool',
        rating: 4.10,
        rating_count: 203,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (!vendor3) throw new Error('Failed to create vendor 3')
  console.log(`  ✓ Vendor 3: ${vendor3.id}`)

  // ── 5. Products for Vendor 1 (Grocery + Sweets) ───────────
  console.log('\nAdding products for Ramaiah General Stores...')
  const vendor1Products = [
    { name_en: 'Sona Masoori Rice 5kg', name_te: 'సోనా మసూరి బియ్యం 5కి.గ్రా', category_id: CATEGORY_IDS.grocery, price_mrp: 280, price_selling: 250, unit: 'bag', stock_qty: 50 },
    { name_en: 'Toor Dal 1kg', name_te: 'కందిపప్పు 1కి.గ్రా', category_id: CATEGORY_IDS.grocery, price_mrp: 130, price_selling: 118, unit: 'kg', stock_qty: 80 },
    { name_en: 'Sunflower Oil 1L', name_te: 'పొద్దుతిరుగుడు నూనె 1లీ', category_id: CATEGORY_IDS.grocery, price_mrp: 160, price_selling: 148, unit: 'litre', stock_qty: 60 },
    { name_en: 'Aashirvaad Atta 5kg', name_te: 'ఆశీర్వాద్ గోధుమ పిండి 5కి.గ్రా', category_id: CATEGORY_IDS.grocery, price_mrp: 280, price_selling: 265, unit: 'bag', stock_qty: 40 },
    { name_en: 'Fresh Tomatoes 1kg', name_te: 'తాజా టమాటా 1కి.గ్రా', category_id: CATEGORY_IDS.grocery, price_mrp: 40, price_selling: 35, unit: 'kg', stock_qty: 100 },
    { name_en: 'Kurnool Groundnut Oil 1L', name_te: 'కర్నూలు వేరుశెనగ నూనె 1లీ', category_id: CATEGORY_IDS.grocery, price_mrp: 200, price_selling: 185, unit: 'litre', stock_qty: 50 },
    { name_en: 'Kaju Barfi 500g', name_te: 'కాజు బర్ఫీ 500గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 350, price_selling: 320, unit: 'pack', stock_qty: 30 },
    { name_en: 'Mixed Chakali 200g', name_te: 'మిక్స్ చకిలి 200గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 80, price_selling: 70, unit: 'pack', stock_qty: 50 },
    { name_en: 'Farm Fresh Eggs (Tray 30)', name_te: 'తాజా కోడిగుడ్లు (30 ట్రే)', category_id: CATEGORY_IDS.grocery, price_mrp: 240, price_selling: 215, unit: 'pack', stock_qty: 70 },
    { name_en: 'Chilli Powder 500g', name_te: 'కారం పొడి 500గ్రా', category_id: CATEGORY_IDS.grocery, price_mrp: 180, price_selling: 160, unit: 'pack', stock_qty: 45 },
  ]

  for (const product of vendor1Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor1.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor1Products.length} products`)

  // ── 6. Products for Vendor 2 (Sweets) ─────────────────────
  console.log('Adding products for Priya Sweets & Bakery...')
  const vendor2Products = [
    { name_en: 'Bobbattu (Puranpoli) 6pcs', name_te: 'బొబ్బట్టు 6 పీసెస్', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 120, price_selling: 110, unit: 'pack', stock_qty: 40 },
    { name_en: 'Laddu 500g', name_te: 'లడ్డు 500గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 200, price_selling: 180, unit: 'pack', stock_qty: 50 },
    { name_en: 'Mysore Pak 250g', name_te: 'మైసూర్ పాక్ 250గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 150, price_selling: 135, unit: 'pack', stock_qty: 35 },
    { name_en: 'Jilebi Fresh 250g', name_te: 'జిలేబీ తాజా 250గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 60, price_selling: 55, unit: 'pack', stock_qty: 60 },
    { name_en: 'Coconut Burfi 200g', name_te: 'కొబ్బరి బర్ఫీ 200గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 100, price_selling: 90, unit: 'pack', stock_qty: 40 },
    { name_en: 'Bread Loaf (400g)', name_te: 'బ్రెడ్ లోఫ్ (400గ్రా)', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 50, price_selling: 45, unit: 'piece', stock_qty: 80 },
    { name_en: 'Chocolate Pastry', name_te: 'చాకలేట్ పేస్ట్రీ', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 80, price_selling: 70, unit: 'piece', stock_qty: 30 },
    { name_en: 'Kurnool Special Halwa 500g', name_te: 'కర్నూలు స్పెషల్ హల్వా 500గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 180, price_selling: 160, unit: 'pack', stock_qty: 25 },
    { name_en: 'Veg Puff (4 pcs)', name_te: 'వెజ్ పఫ్ (4 పీసెస్)', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 80, price_selling: 72, unit: 'pack', stock_qty: 40 },
    { name_en: 'Hot Masala Mixture 250g', name_te: 'హాట్ మసాలా మిక్చర్ 250గ్రా', category_id: CATEGORY_IDS.sweetsSnacks, price_mrp: 90, price_selling: 80, unit: 'pack', stock_qty: 55 },
  ]

  for (const product of vendor2Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor2.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor2Products.length} products`)

  // ── 7. Products for Vendor 3 (Electricals/Plumbing/Building) ─────────
  console.log('Adding products for Sri Venkateshwara Electricals...')
  const vendor3Products = [
    { name_en: 'Anchor Modular Switch 1-Way', name_te: 'యాంకర్ మాడ్యులర్ స్విచ్ 1-వే', category_id: CATEGORY_IDS.electricals, price_mrp: 120, price_selling: 95, unit: 'piece', stock_qty: 100 },
    { name_en: 'Copper Wire 1.5mm 90m Roll', name_te: 'రాగి తీగ 1.5మి.మీ 90మీ రోల్', category_id: CATEGORY_IDS.electricals, price_mrp: 650, price_selling: 580, unit: 'roll', stock_qty: 30 },
    { name_en: 'Crompton Ceiling Fan 48"', name_te: 'క్రాంప్టన్ సీలింగ్ ఫ్యాన్ 48"', category_id: CATEGORY_IDS.electricals, price_mrp: 2200, price_selling: 1850, unit: 'piece', stock_qty: 15 },
    { name_en: 'PVC Pipe 1" - 6 metres', name_te: 'పివిసి పైపు 1" - 6 మీటర్లు', category_id: CATEGORY_IDS.plumbing, price_mrp: 220, price_selling: 195, unit: 'piece', stock_qty: 50 },
    { name_en: 'Brass Tap (Pillar Cock)', name_te: 'ఇత్తడి కుళాయి', category_id: CATEGORY_IDS.plumbing, price_mrp: 350, price_selling: 295, unit: 'piece', stock_qty: 40 },
    { name_en: 'CP Ball Valve 1/2"', name_te: 'సిపి బాల్ వాల్వ్ 1/2"', category_id: CATEGORY_IDS.plumbing, price_mrp: 180, price_selling: 150, unit: 'piece', stock_qty: 60 },
    { name_en: 'ACC Cement 50kg Bag', name_te: 'ఏసిసి సిమెంట్ 50కి.గ్రా బస్తా', category_id: CATEGORY_IDS.buildingMaterials, price_mrp: 390, price_selling: 360, unit: 'bag', stock_qty: 200 },
    { name_en: 'Red Bricks (per 100)', name_te: 'ఎర్ర ఇటుకలు (100కి)', category_id: CATEGORY_IDS.buildingMaterials, price_mrp: 800, price_selling: 700, unit: 'bundle', stock_qty: 50 },
    { name_en: 'LED Bulb 9W B22 (Pack 4)', name_te: 'ఎల్ఈడీ బల్బ్ 9W B22 (4 ప్యాక్)', category_id: CATEGORY_IDS.electricals, price_mrp: 600, price_selling: 480, unit: 'pack', stock_qty: 70 },
    { name_en: 'Teflon Tape 12mm', name_te: 'టెఫ్లాన్ టేప్ 12మి.మీ', category_id: CATEGORY_IDS.plumbing, price_mrp: 30, price_selling: 22, unit: 'piece', stock_qty: 120 },
  ]

  for (const product of vendor3Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor3.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor3Products.length} products`)

  // ── Vendor 4: Krishna Fashion House ───────────────────────
  console.log('Creating vendor 4: Krishna Fashion House...')
  const v4UserId = await createUser('+919000000005', 'vendor', 'Krishna Murthy')
  createdUsers.push({ phone: '+919000000005', name: 'Krishna Murthy', role: 'vendor', id: v4UserId })

  const { data: vendor4 } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: v4UserId,
        shop_name: 'Krishna Fashion House',
        description: 'Latest ethnic wear, sarees and menswear in Kurnool',
        category_ids: [CATEGORY_IDS.fashion],
        kyc_status: 'approved',
        is_active: true,
        commission_rate: 12,
        address_line: 'Park Road, Opp. SBI, Kurnool',
        rating: 4.30,
        rating_count: 112,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (!vendor4) throw new Error('Failed to create vendor 4')
  console.log(`  ✓ Vendor 4: ${vendor4.id}`)

  console.log('Adding products for Krishna Fashion House...')
  const vendor4Products = [
    { name_en: 'Cotton Saree (Handloom)', name_te: 'కాటన్ చీర (హ్యాండ్లూమ్)', category_id: CATEGORY_IDS.fashion, price_mrp: 1200, price_selling: 990, unit: 'piece', stock_qty: 25 },
    { name_en: "Men's Cotton Shirt", name_te: 'పురుషుల కాటన్ షర్ట్', category_id: CATEGORY_IDS.fashion, price_mrp: 800, price_selling: 650, unit: 'piece', stock_qty: 40 },
    { name_en: 'Kurti Set (Women)', name_te: 'కుర్తీ సెట్ (మహిళలు)', category_id: CATEGORY_IDS.fashion, price_mrp: 1500, price_selling: 1200, unit: 'piece', stock_qty: 30 },
    { name_en: 'Silk Saree (Festive)', name_te: 'సిల్క్ చీర (పండుగ)', category_id: CATEGORY_IDS.fashion, price_mrp: 3500, price_selling: 2800, unit: 'piece', stock_qty: 15 },
    { name_en: "Kids' T-Shirt", name_te: 'పిల్లల టీ-షర్ట్', category_id: CATEGORY_IDS.fashion, price_mrp: 400, price_selling: 320, unit: 'piece', stock_qty: 50 },
    { name_en: 'Dhoti (White)', name_te: 'ధోతి (తెల్లని)', category_id: CATEGORY_IDS.fashion, price_mrp: 600, price_selling: 520, unit: 'piece', stock_qty: 35 },
    { name_en: 'Jeans (Men) 32"', name_te: 'జీన్స్ (పురుషులు) 32"', category_id: CATEGORY_IDS.fashion, price_mrp: 1500, price_selling: 1150, unit: 'piece', stock_qty: 25 },
    { name_en: 'Leggings (Pack 2)', name_te: 'లెగ్గింగ్స్ (2 ప్యాక్)', category_id: CATEGORY_IDS.fashion, price_mrp: 700, price_selling: 550, unit: 'pack', stock_qty: 45 },
    { name_en: 'Dupatta (Embroidered)', name_te: 'దుపట్టా (ఎంబ్రాయిడరీ)', category_id: CATEGORY_IDS.fashion, price_mrp: 500, price_selling: 410, unit: 'piece', stock_qty: 40 },
    { name_en: "Boy's Ethnic Kurta Set", name_te: 'అబ్బాయి ఎత్నిక్ కుర్తా సెట్', category_id: CATEGORY_IDS.fashion, price_mrp: 1000, price_selling: 820, unit: 'piece', stock_qty: 20 },
  ]

  for (const product of vendor4Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor4.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor4Products.length} products`)

  // ── Vendor 5: Saraswati Stationery ────────────────────────
  console.log('Creating vendor 5: Saraswati Stationery...')
  const v5UserId = await createUser('+919000000006', 'vendor', 'Saraswati Devi')
  createdUsers.push({ phone: '+919000000006', name: 'Saraswati Devi', role: 'vendor', id: v5UserId })

  const { data: vendor5 } = await supabase
    .from('vendors')
    .upsert(
      {
        user_id: v5UserId,
        shop_name: 'Saraswati Stationery',
        description: 'School and office stationery, books, and gifting',
        category_ids: [CATEGORY_IDS.stationery],
        kyc_status: 'approved',
        is_active: true,
        commission_rate: 9,
        address_line: 'College Road, Near Silver Jubilee, Kurnool',
        rating: 4.40,
        rating_count: 67,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (!vendor5) throw new Error('Failed to create vendor 5')
  console.log(`  ✓ Vendor 5: ${vendor5.id}`)

  console.log('Adding products for Saraswati Stationery...')
  const vendor5Products = [
    { name_en: 'Classmate Notebook 200 pages', name_te: 'క్లాస్‌మేట్ నోట్‌బుక్ 200 పేజీలు', category_id: CATEGORY_IDS.stationery, price_mrp: 90, price_selling: 75, unit: 'piece', stock_qty: 200 },
    { name_en: 'Reynolds Ball Pen (Pack 10)', name_te: 'రెయినాల్డ్స్ బాల్ పెన్ (10 ప్యాక్)', category_id: CATEGORY_IDS.stationery, price_mrp: 100, price_selling: 85, unit: 'pack', stock_qty: 150 },
    { name_en: 'A4 Paper Ream 500 sheets', name_te: 'A4 పేపర్ రీమ్ 500 షీట్స్', category_id: CATEGORY_IDS.stationery, price_mrp: 340, price_selling: 295, unit: 'pack', stock_qty: 50 },
    { name_en: "Camlin Kokuyo Geometry Box", name_te: 'కామ్లిన్ జామెట్రీ బాక్స్', category_id: CATEGORY_IDS.stationery, price_mrp: 180, price_selling: 145, unit: 'piece', stock_qty: 80 },
    { name_en: 'Stapler (Kangaro 10)', name_te: 'స్టాప్లర్ (కాంగరూ 10)', category_id: CATEGORY_IDS.stationery, price_mrp: 120, price_selling: 95, unit: 'piece', stock_qty: 60 },
    { name_en: 'Pencil HB (Pack 10)', name_te: 'పెన్సిల్ HB (10 ప్యాక్)', category_id: CATEGORY_IDS.stationery, price_mrp: 50, price_selling: 42, unit: 'pack', stock_qty: 180 },
    { name_en: 'Sticky Notes (3 Pads)', name_te: 'స్టిక్కీ నోట్స్ (3 ప్యాడ్స్)', category_id: CATEGORY_IDS.stationery, price_mrp: 110, price_selling: 90, unit: 'pack', stock_qty: 90 },
    { name_en: 'File Folder (10 Pack)', name_te: 'ఫైల్ ఫోల్డర్ (10 ప్యాక్)', category_id: CATEGORY_IDS.stationery, price_mrp: 250, price_selling: 210, unit: 'pack', stock_qty: 70 },
    { name_en: 'Drawing Book A3', name_te: 'డ్రాయింగ్ బుక్ A3', category_id: CATEGORY_IDS.stationery, price_mrp: 140, price_selling: 115, unit: 'piece', stock_qty: 55 },
    { name_en: 'Permanent Marker (Pack 4)', name_te: 'పర్మనెంట్ మార్కర్ (4 ప్యాక్)', category_id: CATEGORY_IDS.stationery, price_mrp: 160, price_selling: 135, unit: 'pack', stock_qty: 75 },
  ]

  for (const product of vendor5Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor5.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor5Products.length} products`)

  // ── Banners ───────────────────────────────────────────────
  console.log('\nSeeding banners...')
  const BANNER_IDS = [
    '22222222-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000003',
  ]
  await supabase.from('banners').upsert([
    {
      id: BANNER_IDS[0],
      title_en: 'Free Delivery Above ₹299',
      title_te: '₹299 పైన ఫ్రీ డెలివరీ',
      subtitle_en: 'On all grocery orders — limited time',
      subtitle_te: 'అన్ని కిరాణా ఆర్డర్లపై',
      cta_text_en: 'Shop Now',
      cta_text_te: 'ఇప్పుడే షాప్',
      cta_url: '/categories/grocery',
      bg_color: '#FC8019',
      image_url: '',
      sort_order: 0,
      is_active: true,
    },
    {
      id: BANNER_IDS[1],
      title_en: 'New Vendor: Krishna Fashion',
      title_te: 'కొత్త విక్రేత: కృష్ణ ఫ్యాషన్',
      subtitle_en: 'Up to 30% off on ethnic wear',
      subtitle_te: 'ఎథ్నిక్ వేర్‌పై 30% వరకు తగ్గింపు',
      cta_text_en: 'Explore',
      cta_text_te: 'చూడండి',
      cta_url: '/categories/fashion',
      bg_color: '#7C3AED',
      image_url: '',
      sort_order: 1,
      is_active: true,
    },
    {
      id: BANNER_IDS[2],
      title_en: 'Home Services — Coming Soon',
      title_te: 'హోమ్ సర్వీసెస్ — త్వరలో వస్తుంది',
      subtitle_en: 'Plumbing, electrical, cleaning — book in 2 taps',
      subtitle_te: 'ప్లంబింగ్, ఎలక్ట్రికల్, క్లీనింగ్',
      cta_text_en: 'Notify Me',
      cta_text_te: 'నాకు తెలియజేయండి',
      cta_url: '/services',
      bg_color: '#1E3A5F',
      image_url: '',
      sort_order: 2,
      is_active: true,
    },
  ], { onConflict: 'id' })
  console.log('  ✓ 3 banners seeded')

  // ── Summary table ──────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('SEED COMPLETE — User Summary')
  console.log('═'.repeat(60))
  console.log('Phone'.padEnd(18) + 'Name'.padEnd(22) + 'Role'.padEnd(12) + 'Auth ID')
  console.log('─'.repeat(60))
  for (const u of createdUsers) {
    console.log(u.phone.padEnd(18) + u.name.padEnd(22) + u.role.padEnd(12) + u.id.slice(0, 8) + '...')
  }
  console.log('═'.repeat(60))
  console.log('\n✅ Seed completed successfully!')
  console.log('\nTest login credentials:')
  console.log('  Admin   : +919000000001 (any 6-digit OTP in test mode)')
  console.log('  Vendor 1: +919000000002')
  console.log('  Vendor 2: +919000000003')
  console.log('  Vendor 3: +919000000004')
  console.log('  Vendor 4: +919000000005')
  console.log('  Vendor 5: +919000000006')
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})

// Prevent unused import warning
void dotenv
