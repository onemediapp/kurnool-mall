// Seed data for V4 Enhancement - Taxonomy, Service Providers, and Function Halls
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ══════════════════════════════════════════════════════════════════
// SECTIONS DATA
// ══════════════════════════════════════════════════════════════════

const sectionsData = [
  {
    name_en: 'Shopping',
    name_te: 'కొనుగోలు',
    slug: 'shopping',
    type: 'shopping',
    icon: '🛍️',
    description: 'Buy products from local vendors',
    sort_order: 1,
  },
  {
    name_en: 'Services',
    name_te: 'సేవలు',
    slug: 'services',
    type: 'services',
    icon: '🔧',
    description: 'Book services from verified providers',
    sort_order: 2,
  },
];

// ══════════════════════════════════════════════════════════════════
// SHOPPING CATEGORIES (15) - Already exist in DB, just map IDs
// ══════════════════════════════════════════════════════════════════

const shoppingSubcategoriesData = [
  // S01: Grocery & Essentials
  {
    name_en: 'Rice & Grains',
    name_te: 'అన్న మరియు ధాన్యాలు',
    slug: 'rice-grains',
  },
  {
    name_en: 'Vegetables',
    name_te: 'కూరగాయలు',
    slug: 'vegetables',
  },
  {
    name_en: 'Fruits',
    name_te: 'పండ్లు',
    slug: 'fruits',
  },
  {
    name_en: 'Spices',
    name_te: 'మసాలాలు',
    slug: 'spices',
  },
  {
    name_en: 'Oil & Ghee',
    name_te: 'నూనె మరియు నెయ్యి',
    slug: 'oil-ghee',
  },
  {
    name_en: 'Dry Fruits',
    name_te: 'ఎండిన పండ్లు',
    slug: 'dry-fruits',
  },
  // S02: Electronics
  {
    name_en: 'Mobile Phones',
    name_te: 'మొబైల్ ఫోన్లు',
    slug: 'mobile-phones',
  },
  {
    name_en: 'Laptops',
    name_te: 'ల్యాప్‌టాప్‌లు',
    slug: 'laptops',
  },
  {
    name_en: 'Chargers & Cables',
    name_te: 'చార్జర్‌లు మరియు కేబుల్‌లు',
    slug: 'chargers-cables',
  },
  // S03: Fashion
  {
    name_en: 'Men Shirts',
    name_te: 'పురుష చొక్కాలు',
    slug: 'men-shirts',
  },
  {
    name_en: 'Women Sarees',
    name_te: 'మహిళ చేతులవెన్న',
    slug: 'women-sarees',
  },
];

// ══════════════════════════════════════════════════════════════════
// SERVICE CATEGORIES (8) - Already exist, create subcategories
// ══════════════════════════════════════════════════════════════════

const serviceSubcategoriesData = [
  // SV01: Home Services
  {
    name_en: 'Electrician',
    name_te: 'విద్యుత్ సాంకేతిక',
    slug: 'electrician',
  },
  {
    name_en: 'Plumber',
    name_te: 'నీటి కాలువ',
    slug: 'plumber',
  },
  {
    name_en: 'AC Repair',
    name_te: 'AC మరమ్మతు',
    slug: 'ac-repair',
  },
  {
    name_en: 'Home Cleaning',
    name_te: 'ఇంటి శుభ్రతకు',
    slug: 'home-cleaning',
  },
  {
    name_en: 'Pest Control',
    name_te: 'పీడ నియంత్రణ',
    slug: 'pest-control',
  },
  // SV03: Beauty & Salon
  {
    name_en: 'Haircut & Styling',
    name_te: 'హెయిర్‌కట్‌ మరియు శైలీకరణ',
    slug: 'haircut-styling',
  },
  {
    name_en: 'Facial & Skin Care',
    name_te: 'ముఖ మరియు చర్మ సంరక్షణ',
    slug: 'facial-skincare',
  },
  {
    name_en: 'Manicure & Pedicure',
    name_te: 'మానిక్యూర్ మరియు పెడిక్యూర్',
    slug: 'manicure-pedicure',
  },
  // SV05: Event Suppliers
  {
    name_en: 'Tent & Decoration',
    name_te: 'గుడారం మరియు అలంకరణ',
    slug: 'tent-decoration',
  },
  {
    name_en: 'Catering',
    name_te: 'ఆహారం సరఫరా',
    slug: 'catering',
  },
];

// ══════════════════════════════════════════════════════════════════
// SERVICE PROVIDERS (Sample data for testing)
// ══════════════════════════════════════════════════════════════════

const serviceProvidersData = [
  {
    name: 'Raj Electrician Services',
    service_type: 'electrician',
    description:
      'Professional electrical services in Kurnool. 10+ years experience.',
    phone: '9876543210',
    address: 'Kurnool City, AP',
    rating: 4.8,
    verified: true,
  },
  {
    name: 'Sri Plumbing Solutions',
    service_type: 'plumber',
    description:
      'Expert plumbing repairs and installations. Quick response time.',
    phone: '9876543211',
    address: 'Kurnool City, AP',
    rating: 4.6,
    verified: true,
  },
  {
    name: 'Cool AC Repair Center',
    service_type: 'ac-repair',
    description:
      'All AC brands repair and maintenance. Trained technicians.',
    phone: '9876543212',
    address: 'Kurnool City, AP',
    rating: 4.7,
    verified: true,
  },
  {
    name: 'Shine Beauty Salon',
    service_type: 'haircut-styling',
    description:
      'Modern salon with experienced stylists. All hair types welcome.',
    phone: '9876543213',
    address: 'Kurnool City, AP',
    rating: 4.9,
    verified: true,
  },
  {
    name: 'Glow Facial Studio',
    service_type: 'facial-skincare',
    description:
      'Premium facial treatments with organic products. Dermatologist recommended.',
    phone: '9876543214',
    address: 'Kurnool City, AP',
    rating: 4.8,
    verified: true,
  },
];

// ══════════════════════════════════════════════════════════════════
// FUNCTION HALLS (Sample data)
// ══════════════════════════════════════════════════════════════════

const functionHallsData = [
  {
    name: 'Kurnool Grand Hall',
    description:
      'Spacious wedding hall with modern facilities. Capacity: 500-800 guests.',
    capacity: 600,
    location: 'Kurnool City Center, AP',
    price_per_hour: 5000,
    amenities: [
      'AC',
      'Sound System',
      'Stage',
      'Kitchen',
      'Parking',
      'LED Screen',
    ],
    images: ['https://images.unsplash.com/photo-1519671482677-a5535c12cb13'],
    rating: 4.7,
  },
  {
    name: 'Golden Palace Banquet',
    description:
      'Premium wedding venue with decorated halls. Perfect for large events.',
    capacity: 800,
    location: 'Kurnool Suburb, AP',
    price_per_hour: 8000,
    amenities: [
      'AC',
      'Decorated',
      'In-house Catering',
      'Parking',
      'Stage',
      'Garden',
    ],
    images: ['https://images.unsplash.com/photo-1519167758481-dc80ca7fbcf5'],
    rating: 4.9,
  },
  {
    name: 'City Comfort Hall',
    description:
      'Affordable hall suitable for birthdays, corporate events, and small weddings.',
    capacity: 200,
    location: 'Kurnool Locality, AP',
    price_per_hour: 2000,
    amenities: ['AC', 'Sound System', 'Parking', 'Dressing Room'],
    images: ['https://images.unsplash.com/photo-1507920591330-955bacca3ce6'],
    rating: 4.5,
  },
];

// ══════════════════════════════════════════════════════════════════
// SEED EXECUTION
// ══════════════════════════════════════════════════════════════════

async function seedTaxonomy() {
  console.log('🌱 Starting taxonomy seed...');

  try {
    // 1. Insert Sections
    console.log('📦 Inserting sections...');
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .insert(sectionsData)
      .select();

    if (sectionsError) throw new Error(`Sections error: ${sectionsError.message}`);
    console.log(`✅ ${sections?.length || 0} sections inserted`);

    // 2. Get existing categories
    console.log('📂 Fetching existing categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, slug')
      .limit(23); // 15 shopping + 8 services

    if (categoriesError) throw new Error(`Categories error: ${categoriesError.message}`);
    console.log(`✅ Found ${categories?.length || 0} existing categories`);

    // 3. Insert Subcategories
    if (categories && categories.length > 0) {
      console.log('🏷️  Inserting subcategories...');
      const allSubcategoriesData = [
        ...shoppingSubcategoriesData.slice(0, 6).map((sub) => ({
          ...sub,
          category_id: categories[0]?.id,
          sort_order: shoppingSubcategoriesData.indexOf(sub) + 1,
        })),
        ...shoppingSubcategoriesData.slice(6, 9).map((sub) => ({
          ...sub,
          category_id: categories[1]?.id,
          sort_order: shoppingSubcategoriesData.slice(6).indexOf(sub) + 1,
        })),
        ...shoppingSubcategoriesData.slice(9).map((sub) => ({
          ...sub,
          category_id: categories[2]?.id,
          sort_order: shoppingSubcategoriesData.slice(9).indexOf(sub) + 1,
        })),
        ...serviceSubcategoriesData.slice(0, 5).map((sub) => ({
          ...sub,
          category_id: categories[15]?.id,
          sort_order: serviceSubcategoriesData.slice(0, 5).indexOf(sub) + 1,
        })),
        ...serviceSubcategoriesData.slice(5, 8).map((sub) => ({
          ...sub,
          category_id: categories[17]?.id,
          sort_order: serviceSubcategoriesData.slice(5, 8).indexOf(sub) + 1,
        })),
        ...serviceSubcategoriesData.slice(8).map((sub) => ({
          ...sub,
          category_id: categories[19]?.id,
          sort_order: serviceSubcategoriesData.slice(8).indexOf(sub) + 1,
        })),
      ];

      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('subcategories')
        .insert(
          allSubcategoriesData.filter(
            (sub) => sub.category_id && sub.name_en
          )
        )
        .select();

      if (subcategoriesError) throw new Error(`Subcategories error: ${subcategoriesError.message}`);
      console.log(`✅ ${subcategories?.length || 0} subcategories inserted`);
    }

    // 4. Insert Service Providers
    console.log('👨‍💼 Inserting service providers...');
    const providersWithCategories = serviceProvidersData.map((provider) => ({
      ...provider,
      category_id: categories ? categories[15]?.id : null,
    }));

    const { data: providers, error: providersError } = await supabase
      .from('service_providers')
      .insert(providersWithCategories.filter((p) => p.category_id))
      .select();

    if (providersError) throw new Error(`Providers error: ${providersError.message}`);
    console.log(`✅ ${providers?.length || 0} service providers inserted`);

    // 5. Insert Service Time Slots
    if (providers && providers.length > 0) {
      console.log('⏰ Inserting service time slots...');
      const timeSlots = providers.flatMap((provider) => [
        {
          provider_id: provider.id,
          day_of_week: 0,
          start_time: '09:00',
          end_time: '18:00',
          available: true,
        },
        {
          provider_id: provider.id,
          day_of_week: 1,
          start_time: '09:00',
          end_time: '18:00',
          available: true,
        },
        {
          provider_id: provider.id,
          day_of_week: 2,
          start_time: '09:00',
          end_time: '18:00',
          available: true,
        },
      ]);

      const { data: slots, error: slotsError } = await supabase
        .from('service_time_slots')
        .insert(timeSlots)
        .select();

      if (slotsError) throw new Error(`Time slots error: ${slotsError.message}`);
      console.log(`✅ ${slots?.length || 0} time slots inserted`);
    }

    // 6. Insert Function Halls
    console.log('🏛️  Inserting function halls...');
    const hallsWithCategories = functionHallsData.map((hall) => ({
      ...hall,
      category_id: categories
        ? categories.find((c) => c.slug?.includes('hall'))?.id
        : null,
    }));

    const { data: halls, error: hallsError } = await supabase
      .from('function_halls')
      .insert(hallsWithCategories.filter((h) => h.category_id))
      .select();

    if (hallsError) throw new Error(`Halls error: ${hallsError.message}`);
    console.log(`✅ ${halls?.length || 0} function halls inserted`);

    console.log('\n✨ Taxonomy seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Execute seed
seedTaxonomy();
