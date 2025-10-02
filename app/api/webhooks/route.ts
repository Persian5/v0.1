import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// CRITICAL: Force Node.js runtime (Edge runtime doesn't support Stripe webhooks)
export const runtime = 'nodejs'

// Validate environment variables at build time
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Initialize Stripe with VALID API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any, // Type workaround for Stripe SDK version
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Initialize Supabase with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('❌ [WEBHOOK] No Stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log(`✅ [WEBHOOK] Signature verified for event: ${event.type} (${event.id})`)
  } catch (err) {
    console.error('❌ [WEBHOOK] Signature verification failed:', err)
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    )
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`🎉 [WEBHOOK] Checkout session completed: ${session.id}`)

        // Get customer email from session
        const customerEmail = session.customer_email || session.customer_details?.email
        if (!customerEmail) {
          console.error('❌ [WEBHOOK] No customer email in session')
          return NextResponse.json({ error: 'No customer email' }, { status: 400 })
        }
        console.log(`📧 [WEBHOOK] Customer email: ${customerEmail}`)

        // Look up user_id from user_profiles by email
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', customerEmail)
          .single()

        if (profileError || !profile) {
          console.error('❌ [WEBHOOK] Could not find user profile for email:', customerEmail, {
            message: profileError?.message,
            code: profileError?.code,
            details: profileError?.details
          })
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        console.log(`👤 [WEBHOOK] Found user_id: ${profile.id}`)

        // Get subscription details
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!subscriptionId) {
          console.error('❌ [WEBHOOK] No subscription ID in session')
          return NextResponse.json({ error: 'No subscription ID' }, { status: 400 })
        }

        // Retrieve the subscription to get period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        console.log(`📋 [WEBHOOK] Retrieved subscription: ${subscriptionId}, status: ${subscription.status}`)

        // Type assertion for subscription properties
        const subStatus = subscription.status as string
        const subPeriodEnd = (subscription as any).current_period_end as number
        const subCancelAtEnd = (subscription as any).cancel_at_period_end as boolean

        // Create or update subscription in database
        const { data: subData, error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: profile.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: 'premium',
            status: subStatus,
            current_period_end: new Date(subPeriodEnd * 1000).toISOString(),
            cancel_at_period_end: subCancelAtEnd,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })
          .select()

        if (subError) {
          console.error('❌ [WEBHOOK] Failed to upsert subscription:', {
            message: subError.message,
            code: subError.code,
            details: subError.details,
            hint: subError.hint
          })
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        
        console.log(`✅ [WEBHOOK] Subscription saved for user ${profile.id}:`, subData)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`🔄 [WEBHOOK] Subscription updated: ${subscription.id}`)

        // Get customer from Stripe
        const customerData = await stripe.customers.retrieve(subscription.customer as string)
        
        // Type guard for deleted customer
        if ('deleted' in customerData && customerData.deleted) {
          console.error('❌ [WEBHOOK] Customer was deleted')
          return NextResponse.json({ error: 'Customer deleted' }, { status: 400 })
        }

        const customerEmail = customerData.email
        if (!customerEmail) {
          console.error('❌ [WEBHOOK] No email for customer:', subscription.customer)
          return NextResponse.json({ error: 'No customer email' }, { status: 400 })
        }
        console.log(`📧 [WEBHOOK] Customer email: ${customerEmail}`)

        // Look up user_id from user_profiles by email
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', customerEmail)
          .single()

        if (profileError || !profile) {
          console.error('❌ [WEBHOOK] Could not find user profile for email:', customerEmail, {
            message: profileError?.message,
            code: profileError?.code
          })
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Type assertions for subscription update
        const updateStatus = subscription.status as string
        const updatePeriodEnd = (subscription as any).current_period_end as number
        const updateCancelAtEnd = (subscription as any).cancel_at_period_end as boolean

        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: updateStatus,
            current_period_end: new Date(updatePeriodEnd * 1000).toISOString(),
            cancel_at_period_end: updateCancelAtEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('❌ [WEBHOOK] Failed to update subscription:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details
          })
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        
        console.log(`✅ [WEBHOOK] Subscription updated for user ${profile.id}: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`🗑️ [WEBHOOK] Subscription deleted: ${subscription.id}`)

        // Update subscription status to canceled
        const { error: deleteError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('❌ [WEBHOOK] Failed to mark subscription as canceled:', {
            message: deleteError.message,
            code: deleteError.code
          })
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        
        console.log(`✅ [WEBHOOK] Subscription marked as canceled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💳❌ [WEBHOOK] Payment failed for invoice: ${invoice.id}`)

        // Type assertion for invoice subscription
        const invoiceSubId = (invoice as any).subscription as string | null

        // Update subscription status to past_due
        if (invoiceSubId) {
          const { error: failError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoiceSubId)

          if (failError) {
            console.error('❌ [WEBHOOK] Failed to mark subscription as past_due:', {
              message: failError.message,
              code: failError.code
            })
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
          }
          
          console.log(`⚠️ [WEBHOOK] Subscription marked as past_due: ${invoiceSubId}`)
        } else {
          console.log('ℹ️ [WEBHOOK] No subscription linked to failed invoice')
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💳✅ [WEBHOOK] Payment succeeded for invoice: ${invoice.id}`)

        // Type assertion for invoice subscription
        const successSubId = (invoice as any).subscription as string | null

        // Update subscription status back to active if it was past_due
        if (successSubId) {
          const subscription = await stripe.subscriptions.retrieve(successSubId)
          
          // Type assertions for subscription properties
          const successStatus = subscription.status as string
          const successPeriodEnd = (subscription as any).current_period_end as number

          const { error: successError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: successStatus,
              current_period_end: new Date(successPeriodEnd * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', successSubId)

          if (successError) {
            console.error('❌ [WEBHOOK] Failed to update subscription after payment:', {
              message: successError.message,
              code: successError.code
            })
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
          }
          
          console.log(`✅ [WEBHOOK] Payment succeeded, subscription updated: ${successSubId}, status: ${successStatus}`)
        } else {
          console.log('ℹ️ [WEBHOOK] No subscription linked to successful invoice')
        }
        break
      }

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
