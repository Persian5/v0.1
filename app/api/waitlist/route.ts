import { Resend } from 'resend';
import { NextResponse } from 'next/server';

/**
 * SECURITY NOTICE: 
 * All API keys must live in .env.local and NEVER in source files.
 * Ensure .env.local is in .gitignore to prevent accidentally committing secrets.
 */

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

if (!process.env.RESEND_AUDIENCE_ID) {
  throw new Error('RESEND_AUDIENCE_ID is not set in environment variables');
}

// We've validated these exist above, so we can safely use them
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

const resend = new Resend(RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Store the email in Resend
    await resend.contacts.create({
      email,
      audienceId: RESEND_AUDIENCE_ID,
      unsubscribed: false,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Successfully joined the waitlist!'
    });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    
    // Handle specific Resend API errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process signup. Please try again later.' },
      { status: 500 }
    );
  }
} 