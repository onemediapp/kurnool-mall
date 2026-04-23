import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, preflight, checkRateLimit } from '../_shared/cors.ts'

function errorResponse(req: Request, message: string, code: string, status = 400) {
  return new Response(
    JSON.stringify({ data: null, error: { message, code } }),
    { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
  )
}

function successResponse<T>(req: Request, data: T) {
  return new Response(
    JSON.stringify({ data, error: null }),
    { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
  )
}

serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
    return errorResponse(req, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405)
  }

  try {
    // ─── 1. Auth check ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse(req, 'Missing authorization', 'UNAUTHORIZED', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return errorResponse(req, 'Unauthorized', 'UNAUTHORIZED', 401)

    // ─── 1b. Rate limit: 10 order creates per user per hour ──
    const allowed = await checkRateLimit(adminClient, user.id, 'create-order', 10)
    if (!allowed) return errorResponse(req, 'Too many orders. Please try again later.', 'RATE_LIMITED', 429)

    // ─── 2. Parse body ────────────────────────────────────────
    const body = await req.json()
    const { vendor_id, items, delivery_address_id, payment_method, notes, coupon_code } = body

    if (!vendor_id || !items?.length || !delivery_address_id || !payment_method) {
      return errorResponse(req, 'Missing required fields', 'VALIDATION_ERROR')
    }

    // ─── 3. Validate address belongs to user ─────────────────
    const { data: address, error: addrError } = await userClient
      .from('addresses')
      .select('*')
      .eq('id', delivery_address_id)
      .eq('user_id', user.id)
      .single()

    if (addrError || !address) {
      return errorResponse(req, 'Invalid delivery address', 'INVALID_ADDRESS')
    }

    // ─── 4. Fetch & validate products ────────────────────────
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: prodError } = await adminClient
      .from('products')
      .select('id, vendor_id, name_en, name_te, price_selling, images, stock_qty, unit, is_available, is_deleted')
      .in('id', productIds)

    if (prodError || !products?.length) {
      return errorResponse(req, 'Failed to fetch products', 'PRODUCTS_NOT_FOUND')
    }

    for (const item of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = products.find((p: any) => p.id === item.product_id)
      if (!product) return errorResponse(req, `Product not found: ${item.product_id}`, 'PRODUCT_NOT_FOUND')
      if (product.is_deleted) return errorResponse(req, `Product unavailable: ${product.name_en}`, 'PRODUCT_UNAVAILABLE')
      if (!product.is_available) return errorResponse(req, `Product not available: ${product.name_en}`, 'PRODUCT_UNAVAILABLE')
      if (product.vendor_id !== vendor_id) return errorResponse(req, 'Products must be from same vendor', 'VENDOR_MISMATCH')
      if (product.stock_qty < item.quantity) {
        return errorResponse(
          req,
          `Insufficient stock for ${product.name_en}. Available: ${product.stock_qty}`,
          'INSUFFICIENT_STOCK'
        )
      }
    }

    // ─── 5. Build order items ─────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItems = items.map((item: { product_id: string; quantity: number }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = products.find((p: any) => p.id === item.product_id)!
      return {
        product_id: product.id,
        product_name: product.name_en,
        product_image: product.images?.[0] || null,
        quantity: item.quantity,
        unit_price: product.price_selling,
        total_price: product.price_selling * item.quantity,
      }
    })

    // ─── 6. Calculate totals ──────────────────────────────────
    const subtotal = orderItems.reduce((sum: number, i: { total_price: number }) => sum + i.total_price, 0)
    const delivery_fee = subtotal >= 499 ? 0 : 20

    // ─── 6b. Validate coupon (if provided) ───────────────────
    let discount = 0
    let couponId: string | null = null
    let appliedCouponCode: string | null = null

    if (coupon_code) {
      const { data: couponResult, error: couponError } = await adminClient
        .rpc('validate_coupon', {
          p_code: coupon_code.toUpperCase(),
          p_user_id: user.id,
          p_order_total: subtotal,
          p_vendor_id: vendor_id,
        })
        .single()

      if (couponError || !couponResult) {
        return errorResponse(req, 'Invalid coupon', 'INVALID_COUPON')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cv = couponResult as any
      if (!cv.valid) {
        return errorResponse(req, cv.message || 'Coupon is not valid', 'INVALID_COUPON')
      }
      discount = cv.discount_amount ?? 0
      couponId = cv.coupon_id ?? null
      appliedCouponCode = coupon_code.toUpperCase()
    }

    const grand_total = Math.max(0, subtotal + delivery_fee - discount)

    // ─── 7. INSERT order ──────────────────────────────────────
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        customer_id: user.id,
        vendor_id,
        subtotal,
        delivery_fee,
        discount,
        grand_total,
        payment_method,
        payment_status: 'pending',
        delivery_address_id,
        delivery_address_snapshot: address,
        notes: notes || null,
        coupon_id: couponId,
        coupon_code: appliedCouponCode,
      })
      .select()
      .single()

    if (orderError || !order) {
      return errorResponse(req, 'Failed to create order: ' + orderError?.message, 'ORDER_CREATE_FAILED', 500)
    }

    // ─── 8. INSERT order items ────────────────────────────────
    const { error: itemsError } = await adminClient
      .from('order_items')
      .insert(orderItems.map((item: Record<string, unknown>) => ({ ...item, order_id: order.id })))

    if (itemsError) {
      await adminClient.from('orders').delete().eq('id', order.id)
      return errorResponse(req, 'Failed to create order items', 'ORDER_ITEMS_FAILED', 500)
    }

    // ─── 9. Decrement stock ───────────────────────────────────
    for (const item of items) {
      await adminClient.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }

    // ─── 10. Coupon usage + loyalty points ───────────────────
    if (couponId) {
      await Promise.all([
        adminClient.from('coupon_usages').insert({
          coupon_id: couponId,
          user_id: user.id,
          order_id: order.id,
        }),
        adminClient.rpc('increment_coupon_usage', { p_coupon_id: couponId }).catch(() => {
          // Fallback: increment manually
          adminClient.from('coupons').select('used_count').eq('id', couponId).single()
            .then(({ data }) => {
              if (data) {
                adminClient.from('coupons').update({ used_count: (data.used_count ?? 0) + 1 }).eq('id', couponId!)
              }
            })
        }),
      ])
    }

    // Award loyalty points: 1 point per ₹10 spent
    const pointsEarned = Math.floor(grand_total / 10)
    if (pointsEarned > 0) {
      // Upsert loyalty account
      const { data: acc } = await adminClient
        .from('loyalty_accounts')
        .select('points_balance, points_lifetime')
        .eq('user_id', user.id)
        .maybeSingle()

      if (acc) {
        await adminClient.from('loyalty_accounts').update({
          points_balance: acc.points_balance + pointsEarned,
          points_lifetime: acc.points_lifetime + pointsEarned,
        }).eq('user_id', user.id)
      } else {
        await adminClient.from('loyalty_accounts').insert({
          user_id: user.id,
          points_balance: pointsEarned,
          points_lifetime: pointsEarned,
        })
      }

      await adminClient.from('loyalty_transactions').insert({
        user_id: user.id,
        order_id: order.id,
        points: pointsEarned,
        balance_after: (acc?.points_balance ?? 0) + pointsEarned,
        type: 'earn',
        description: `Order ${order.order_number} placed`,
      })
    }

    // ─── 11. Razorpay (non-COD stub) ──────────────────────────
    let razorpay_order_id: string | undefined
    let razorpay_key_id: string | undefined

    if (payment_method !== 'cod') {
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
      const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

      if (razorpayKeyId && razorpaySecret) {
        const credentials = btoa(`${razorpayKeyId}:${razorpaySecret}`)
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: Math.round(grand_total * 100),
            currency: 'INR',
            receipt: order.order_number,
            notes: { order_id: order.id },
          }),
        })

        if (rzpRes.ok) {
          const rzpOrder = await rzpRes.json()
          razorpay_order_id = rzpOrder.id
          razorpay_key_id = razorpayKeyId
          await adminClient.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id)
        }
      }
    }

    const { data: fullOrder } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single()

    return successResponse(req, {
      order: fullOrder,
      razorpay_order_id,
      razorpay_key_id,
    })

  } catch (err) {
    return errorResponse(
      req,
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
