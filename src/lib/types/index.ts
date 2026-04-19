export type UserRole = 'customer' | 'vendor' | 'admin' | 'provider'
export type OrderStatus =
  | 'pending' | 'accepted' | 'rejected' | 'preparing'
  | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentMethod = 'upi' | 'card' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type KycStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: UserRole
  language_pref: 'en' | 'te'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string
  address_line: string
  city: string
  pincode: string
  lat: number | null
  lng: number | null
  is_default: boolean
  created_at: string
}

export interface Category {
  id: string
  name_en: string
  name_te: string
  slug: string
  icon_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
}

export interface Vendor {
  id: string
  user_id: string
  shop_name: string
  description: string | null
  category_ids: string[]
  logo_url: string | null
  gstin: string | null
  fssai_no: string | null
  kyc_status: KycStatus
  rating: number
  commission_rate: number
  is_active: boolean
  address_line: string
  lat: number | null
  lng: number | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id: string
  name_en: string
  name_te: string
  description_en: string | null
  description_te: string | null
  price_mrp: number
  price_selling: number
  images: string[]
  stock_qty: number
  unit: string
  is_available: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  vendor?: Vendor
  category?: Category
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  discount: number
  grand_total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  delivery_address_id: string
  delivery_address_snapshot: Address
  rider_id: string | null
  rider_name: string | null
  rider_phone: string | null
  notes: string | null
  rejection_reason: string | null
  coupon_id: string | null
  coupon_code: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  customer?: User
  vendor?: Vendor
}

export interface CartItem {
  product_id: string
  vendor_id: string
  name_en: string
  name_te: string
  price_selling: number
  image: string | null
  unit: string
  quantity: number
  max_qty: number
}

export interface Cart {
  items: CartItem[]
  vendor_id: string | null
}

// API response shape — keep identical when migrating to NestJS
export interface ApiSuccess<T> { data: T; error: null }
export interface ApiError { data: null; error: { message: string; code: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface CreateOrderPayload {
  vendor_id: string
  items: Array<{ product_id: string; quantity: number }>
  delivery_address_id: string
  payment_method: PaymentMethod
  notes?: string
}

export interface CreateOrderResponse {
  order: Order
  razorpay_order_id?: string
  razorpay_key_id?: string
}

export interface VendorStats {
  total_orders: number
  pending_orders: number
  delivered_orders: number
  cancelled_orders: number
  total_gmv: number
  total_commission: number
  net_earnings: number
  avg_rating: number
  total_products: number
  active_products: number
  low_stock_products: number
  acceptance_rate: number
  orders_today: number
  gmv_today: number
}

// ── Loyalty ──────────────────────────────────────────────────
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface LoyaltyAccount {
  id: string
  user_id: string
  points_balance: number
  points_lifetime: number
  tier: LoyaltyTier
  created_at: string
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  order_id: string | null
  type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjustment'
  points: number
  balance_after: number
  description: string
  created_at: string
}

// ── Coupons ──────────────────────────────────────────────────
export interface Coupon {
  id: string
  code: string
  // Normalized names matching the DB schema from migration 003
  discount_type: 'flat' | 'percent'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  used_count: number
  per_user_limit: number | null
  vendor_id: string | null
  category_id: string | null
  is_active: boolean
  new_users_only: boolean | null
  expires_at: string | null
  created_at: string
}

export interface CouponValidation {
  valid: boolean
  coupon_id?: string
  discount_amount: number
  message: string
}

// ── Flash Sales ───────────────────────────────────────────────
export interface FlashSale {
  id: string
  title_en: string
  title_te: string
  product_id: string
  vendor_id: string
  discount_percent: number
  original_price: number
  sale_price: number
  stock_qty: number
  sold_qty: number
  starts_at: string
  ends_at: string
  is_active: boolean
  product?: Product
}

// ── Banners ───────────────────────────────────────────────────
export interface Banner {
  id: string
  title_en: string
  title_te: string
  subtitle_en: string | null
  subtitle_te: string | null
  image_url: string
  cta_url: string | null
  cta_text_en: string | null
  cta_text_te: string | null
  bg_color: string
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

// ── Notifications ─────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'order' | 'promo' | 'system' | 'loyalty' | 'review'
  is_read: boolean
  data: Record<string, string> | null
  created_at: string
}

// ── Reviews ───────────────────────────────────────────────────
export interface Review {
  id: string
  order_id: string
  customer_id: string
  vendor_id: string
  product_id: string | null
  rating: number
  comment: string | null
  vendor_reply: string | null
  vendor_replied_at: string | null
  is_verified_purchase: boolean
  created_at: string
  customer?: Pick<User, 'id' | 'name'>
}

// ── Vendor Analytics ─────────────────────────────────────────
export interface RevenueDataPoint {
  date: string
  gmv: number
  orders: number
  commission: number
}

// ── Admin Analytics ───────────────────────────────────────────
export interface PlatformStats {
  gmv_today: number
  gmv_yesterday: number
  orders_today: number
  orders_pending: number
  pending_orders: number
  orders_in_progress: number
  orders_delivered_today: number
  active_vendors: number
  online_vendors: number
  active_riders: number
  new_customers_today: number
  payment_success_rate: number
  avg_delivery_time_minutes: number
  total_gmv: number
  total_customers: number
  total_products: number
  avg_vendor_rating: number
  gmv_last_7_days: { date: string; gmv: number }[]
}

// ── Rider ─────────────────────────────────────────────────────
export interface Rider {
  id: string
  user_id: string | null
  name: string
  phone: string
  vehicle_type: 'bike' | 'scooter' | 'bicycle' | 'cycle'
  is_online: boolean
  is_active: boolean
  current_lat: number | null
  current_lng: number | null
  rating: number
  total_deliveries: number
  total_earnings: number
  created_at: string
  updated_at: string
}

// ── Payout ────────────────────────────────────────────────────
export interface VendorPayout {
  id: string
  vendor_id: string
  period_start: string
  period_end: string
  total_gmv: number
  total_commission: number
  gst_on_commission: number
  tcs_deducted: number
  refunds_deducted: number
  net_payout: number
  status: 'pending' | 'approved' | 'paid' | 'on_hold'
  utr_number: string | null
  notes: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  vendor?: Vendor
}

// ── Wishlist ──────────────────────────────────────────────────
export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

// ═══════════════════════════════════════════════════════════════
// v3 — Services Vertical + Enterprise Admin Suite
// ═══════════════════════════════════════════════════════════════

// ── Services ──────────────────────────────────────────────────
export type ServiceCategorySlug =
  | 'electrician' | 'plumber' | 'carpenter' | 'ac_mechanic'
  | 'refrigerator_mechanic' | 'car_mechanic' | 'bike_mechanic'
  | 'house_cleaning' | 'packers_movers' | 'function_hall'
  | 'painter' | 'pest_control' | 'cctv_installation' | 'inverter_ups'

export type PricingModel = 'hourly' | 'flat' | 'per_sqft' | 'per_day'

export type BookingStatus =
  | 'pending' | 'confirmed' | 'en_route' | 'in_progress'
  | 'completed' | 'paid' | 'cancelled' | 'rejected'

export interface ServiceCategory {
  id: string
  slug: ServiceCategorySlug
  name_en: string
  name_te: string
  icon: string | null
  emoji: string
  description_en: string | null
  description_te: string | null
  base_price: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ServicePackage {
  id: string
  category_id: string
  name_en: string
  name_te: string
  description_en: string | null
  description_te: string | null
  pricing_model: PricingModel
  price: number
  duration_mins: number
  inclusions: string[]
  is_active: boolean
  created_at: string
  category?: ServiceCategory
}

export interface Provider {
  id: string
  user_id: string
  business_name: string
  bio: string | null
  photo_url: string | null
  kyc_status: KycStatus
  aadhaar_masked: string | null
  pan_masked: string | null
  service_areas: string[]
  category_ids: string[]
  rating: number
  total_jobs: number
  commission_pct: number
  is_available: boolean
  verified_at: string | null
  created_at: string
  updated_at: string
  user?: Pick<User, 'id' | 'name' | 'phone'>
}

export interface ProviderAvailability {
  id: string
  provider_id: string
  day_of_week: number // 0-6 Sun-Sat
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  is_active: boolean
}

export interface ServiceBooking {
  id: string
  booking_number: string
  customer_id: string
  provider_id: string | null
  category_id: string
  package_id: string
  status: BookingStatus
  scheduled_at: string
  address: {
    label?: string
    address_line: string
    city: string
    pincode: string
    lat?: number
    lng?: number
  }
  notes: string | null
  price: number
  commission: number
  otp_verified_at: string | null
  started_at: string | null
  completed_at: string | null
  cancel_reason: string | null
  cancelled_by: string | null
  created_at: string
  updated_at: string
  customer?: Pick<User, 'id' | 'name' | 'phone'>
  provider?: Provider
  category?: ServiceCategory
  package?: ServicePackage
}

export interface ServiceBookingEvent {
  id: string
  booking_id: string
  from_status: BookingStatus | null
  to_status: BookingStatus
  actor_id: string
  note: string | null
  created_at: string
}

export interface ServiceReview {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment: string | null
  provider_reply: string | null
  created_at: string
  customer?: Pick<User, 'id' | 'name'>
}

// ── Function Halls ────────────────────────────────────────────
export interface FunctionHall {
  id: string
  name: string
  description_en: string | null
  description_te: string | null
  capacity: number
  price_per_day: number
  amenities: string[]
  images: string[]
  address_line: string
  city: string
  owner_user_id: string | null
  is_active: boolean
  created_at: string
}

export interface HallBooking {
  id: string
  hall_id: string
  customer_id: string
  booking_date: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  price: number
  notes: string | null
  created_at: string
  hall?: FunctionHall
}

// ── Campaigns ─────────────────────────────────────────────────
export type CampaignType =
  | 'push' | 'whatsapp' | 'email' | 'in_app_banner' | 'promotional_banner'

export type CampaignStatus =
  | 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

export interface AudienceRule {
  field:
    | 'role' | 'loyalty_tier' | 'total_orders' | 'last_order_days'
    | 'city' | 'signup_days' | 'language_pref'
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: string | number | string[]
}

export interface AudienceSegment {
  match: 'all' | 'any'
  rules: AudienceRule[]
}

export interface CampaignContent {
  title_en: string
  title_te: string
  body_en: string
  body_te: string
  cta_label_en?: string
  cta_label_te?: string
  cta_url?: string
  image_url?: string
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  audience_segment: AudienceSegment
  content: CampaignContent
  schedule_at: string | null
  status: CampaignStatus
  created_by: string
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
  }
  created_at: string
  updated_at: string
}

// ── Upsell ────────────────────────────────────────────────────
export type UpsellTrigger =
  | 'product_view' | 'cart_contains' | 'order_completed' | 'category_view'

export interface UpsellRule {
  id: string
  name: string
  trigger: UpsellTrigger
  trigger_value: string // product_id or category_id
  recommended_product_ids: string[]
  priority: number
  is_active: boolean
  created_at: string
}

// ── Notifications (consolidated log) ──────────────────────────
export interface NotificationLogEntry {
  id: string
  user_id: string | null
  channel: 'push' | 'whatsapp' | 'email' | 'in_app'
  type: 'order' | 'booking' | 'promo' | 'system' | 'loyalty' | 'review'
  title: string
  body: string
  read_at: string | null
  meta: Record<string, unknown>
  created_at: string
}

// ── Analytics ─────────────────────────────────────────────────
export interface RFMSegment {
  user_id: string
  recency: number // 1-5
  frequency: number
  monetary: number
  label: string // Champions | Loyal | At Risk | Lost | New | Needs Attention
}

export interface CohortRow {
  cohort_month: string
  cohort_size: number
  retention: number[] // % per month offset
}

export interface HeatmapCell {
  day_of_week: number // 0-6
  hour: number        // 0-23
  count: number
}

export interface FunnelStep {
  name: string
  count: number
  drop_off_pct: number
}

export interface RevenueStream {
  period: string
  products: number
  services: number
  commission: number
  gst: number
}
