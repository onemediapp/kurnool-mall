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
  ]

  for (const product of vendor3Products) {
    await supabase.from('products').upsert(
      { ...product, vendor_id: vendor3.id, is_available: true, description_en: null, description_te: null, images: [] },
      { onConflict: 'id', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Added ${vendor3Products.length} products`)

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
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})

// Prevent unused import warning
void dotenv
