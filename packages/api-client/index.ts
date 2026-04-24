import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Order,
  OrderStatus,
  ServiceBooking,
  HallBooking,
  BookingStatus,
} from '@kurnool-mall/shared-types'

export interface ApiClientConfig {
  supabase: SupabaseClient
  /** e.g. https://xxxx.supabase.co/functions/v1 */
  apiUrl: string
}

export interface ApiResponse<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

export interface CreateOrderPayload {
  vendor_id: string
  items: Array<{ product_id: string; quantity: number }>
  delivery_address_id: string
  payment_method: 'cod' | 'upi' | 'card'
  notes?: string
  coupon_code?: string
}

export interface CreateOrderResponse {
  order: Order
  /** Present when payment_method !== 'cod' */
  razorpay_order_id?: string
  razorpay_key_id?: string
}

export interface VerifyPaymentPayload {
  order_id: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface UpdateOrderStatusPayload {
  order_id: string
  status: OrderStatus
  rejection_reason?: string
  rider_name?: string
  rider_phone?: string
}

export interface UpdateBookingStatusPayload {
  booking_id: string
  status: BookingStatus
  reason?: string
}

export interface CreateServiceBookingPayload {
  package_id: string
  address_id: string
  slot_start: string
  slot_end?: string
  notes?: string
}

export interface CreateHallBookingPayload {
  hall_id: string
  event_date: string
  start_time: string
  end_time: string
  guest_count: number
  notes?: string
}

export interface ToggleWishlistPayload {
  product_id: string
}

export interface CheckAvailabilityPayload {
  resource_type: 'service_package' | 'hall'
  resource_id: string
  date: string
}

export interface SearchServicesPayload {
  query?: string
  category_slug?: string
  lat?: number
  lng?: number
  radius_km?: number
}

export function createApiClient({ supabase, apiUrl }: ApiClientConfig) {
  async function callEdge<T>(
    functionName: string,
    body: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${apiUrl}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const json = (await res.json()) as ApiResponse<T> | { error?: unknown; data?: T }
      if (!res.ok) {
        const err = (json as { error?: { message?: string; code?: string } }).error
        return {
          data: null,
          error: {
            message: err?.message ?? 'Request failed',
            code: err?.code,
          },
        }
      }
      return json as ApiResponse<T>
    } catch (e) {
      return {
        data: null,
        error: {
          message: e instanceof Error ? e.message : 'Network error',
          code: 'NETWORK',
        },
      }
    }
  }

  return {
    createOrder: (p: CreateOrderPayload) =>
      callEdge<CreateOrderResponse>('create-order', p),
    verifyPayment: (p: VerifyPaymentPayload) =>
      callEdge<Order>('verify-payment', p),
    updateOrderStatus: (p: UpdateOrderStatusPayload) =>
      callEdge<Order>('update-order-status', p),
    createServiceBooking: (p: CreateServiceBookingPayload) =>
      callEdge<ServiceBooking>('create-service-booking', p),
    createHallBooking: (p: CreateHallBookingPayload) =>
      callEdge<HallBooking>('create-hall-booking', p),
    updateBookingStatus: (p: UpdateBookingStatusPayload) =>
      callEdge<ServiceBooking | HallBooking>('update-booking-status', p),
    updateServiceBooking: (p: UpdateBookingStatusPayload) =>
      callEdge<ServiceBooking>('update-service-booking', p),
    toggleWishlist: (p: ToggleWishlistPayload) =>
      callEdge<{ in_wishlist: boolean }>('toggle-wishlist', p),
    checkAvailability: (p: CheckAvailabilityPayload) =>
      callEdge<{ available: boolean; busy_slots?: string[] }>('check-availability', p),
    searchServices: (p: SearchServicesPayload) =>
      callEdge<unknown[]>('search-services', p),
    submitReview: (p: { order_id: string; rating: number; comment?: string }) =>
      callEdge<unknown>('submit-review', p),
    submitServiceReview: (p: { booking_id: string; rating: number; comment?: string }) =>
      callEdge<unknown>('submit-service-review', p),
    sendCampaign: (p: { campaign_id: string }) =>
      callEdge<{ sent: number }>('send-campaign', p),
    /** Escape hatch for calling any Edge Function not typed above. */
    callEdge,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
