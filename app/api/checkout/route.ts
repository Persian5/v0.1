import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Force Node.js runtime for API route
export const runtime = 'nodejs'

// Validate environment variables at module load
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}
if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('Missing STRIPE_PRICE_ID environment variable')
}

// Initialize Stripe with valid API version (matches webhook)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [CHECKOUT] No authenticated user:', authError?.message)
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      )
    }

    // Get user email
    const userEmail = user.email
    if (!userEmail) {
      console.error('❌ [CHECKOUT] No email for user:', user.id)
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    console.log(`📧 [CHECKOUT] Creating checkout for user: ${userEmail} (${user.id})`)

    // Check if user already has a Stripe customer ID in database
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('❌ [CHECKOUT] Database error:', fetchError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    let customerId = existingSubscription?.stripe_customer_id

    // If no customer ID exists, create a new Stripe customer AND save it
    if (!customerId) {
      console.log('🆕 [CHECKOUT] Creating new Stripe customer')
      
      try {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = customer.id
        console.log(`✅ [CHECKOUT] Created Stripe customer: ${customerId}`)

        // CRITICAL: Save customer ID to database immediately
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            plan_type: 'free', // Still free until they complete checkout
            status: 'free',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })

        if (upsertError) {
          console.error('⚠️ [CHECKOUT] Failed to save customer ID:', upsertError)
          // Don't fail the checkout, webhook will fix this later
        } else {
          console.log('💾 [CHECKOUT] Saved customer ID to database')
        }
      } catch (stripeError: any) {
        console.error('❌ [CHECKOUT] Stripe customer creation failed:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code
        })
        return NextResponse.json(
          { error: 'Failed to create Stripe customer' },
          { status: 500 }
        )
      }
    } else {
      console.log(`✅ [CHECKOUT] Using existing Stripe customer: ${customerId}`)
    }

    // Use environment variable for site URL (more reliable than origin header)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'

    console.log(`🌐 [CHECKOUT] Using site URL: ${siteUrl}`)

    // Create Stripe Checkout session with METADATA for webhook
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: userEmail, // Explicitly set for webhook access
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        supabase_user_id: user.id, // CRITICAL: Webhook needs this to link subscription
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id, // Also attach to subscription for future events
        },
      },
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe/cancel`,
    })

    console.log(`✅ [CHECKOUT] Created checkout session: ${session.id}`)
    console.log(`🔗 [CHECKOUT] Checkout URL: ${session.url}`)
    console.log(`📝 [CHECKOUT] Metadata: supabase_user_id=${user.id}`)

    // Return the checkout session URL
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('❌ [CHECKOUT] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    })
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
