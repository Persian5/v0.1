import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [CHECKOUT] No authenticated user')
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

    console.log(`📧 [CHECKOUT] Creating checkout for user: ${userEmail}`)

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      console.log('🆕 [CHECKOUT] Creating new Stripe customer')
      const customer = await stripe.customers.create({
        email: userEmail,
      })
      customerId = customer.id
      console.log(`✅ [CHECKOUT] Created Stripe customer: ${customerId}`)
    } else {
      console.log(`✅ [CHECKOUT] Using existing Stripe customer: ${customerId}`)
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'https://v01-psi.vercel.app'

    // Create Stripe Checkout session
    // IMPORTANT: customer_email is automatically set when we pass customer ID
    // Stripe will use the email from the customer record
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: userEmail, // Explicitly set email for webhook access
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe/cancel`,
    })

    console.log(`✅ [CHECKOUT] Created checkout session: ${session.id}`)
    console.log(`🔗 [CHECKOUT] Checkout URL: ${session.url}`)

    // Return the checkout session URL
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('❌ [CHECKOUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
