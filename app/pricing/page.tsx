"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from 'react-confetti';

export default function PricingPage() {
  // Waitlist Form State
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedValue = localStorage.getItem('isSubscribed');
    setIsSubscribed(storedValue === 'true');
  }, []);

  const handleWaitlistClick = () => {
    setShowWaitlistForm(true);
  };

  const handleCloseWaitlistForm = () => {
    setShowWaitlistForm(false);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to subscribe');
        }
        setIsSubscribed(true);
        localStorage.setItem('isSubscribed', 'true');
        setShowConfetti(true);
        setEmail("");

        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // If not JSON, get the text and throw an error
        const text = await response.text();
        throw new Error('Server error: ' + text);
      }
    } catch (err) {
      console.error('Waitlist submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to scroll to waitlist
  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showConfetti && isClient && <Confetti recycle={false} numberOfPieces={200} />}
      
      {/* Navbar from Landing Page */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
            Home
          </Link>
          {isClient ? (
            isSubscribed ? (
              <Link href="/modules/module1/lesson1">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                  Start Now
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={handleWaitlistClick}> 
                Start Now
              </Button>
            )
          ) : (
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" disabled>
              Loading...
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section - Minimized top padding */}
      <section className="flex flex-col items-center justify-center px-6 pt-4 pb-6 bg-primary/5">
        {/* Title Outside Card - Reduced bottom margin MORE */}
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary text-center mb-4">
            Ready to speak Persian for less than a snack?
          </h1>
        </div>

        {/* Pricing Card - Reduced vertical padding */}
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl px-8 sm:px-10 py-6 text-center">
          {/* Disclaimer - Moved above pricing boxes */}
          <p className="text-xs text-gray-500 mb-6 text-center">
            These plans go live after launch. Waitlist members get notified first and pay just $0.99 for month one.
          </p>

          {/* Price Blocks Container */}
          <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto">
            {/* Monthly Block */}
            <div 
              className="rounded-xl border-2 shadow-md p-6 bg-primary text-white hover:scale-105 active:scale-95 hover:ring-2 hover:ring-accent transition-all cursor-pointer flex flex-col justify-between text-center"
              onClick={handleWaitlistClick}
            >
              <div>
                <p className="font-semibold">Monthly</p>
                {/* Discounted price - Moved up */}
                <p className="text-lg font-semibold text-white mt-1">$0.99 for your first month</p>
                {/* Original price struck through - Moved down */}
                <p className="text-sm mt-1">
                  <span className="line-through text-primary-foreground/50">$9.99 / mo</span>
                </p>
                {/* Waitlist note - Updated text */}
                <p className="text-sm text-white italic opacity-90">🔒 Waitlist Members Only – Lock it in now</p>
              </div>
              <p className="text-sm text-primary-foreground/80 mt-2">Try it risk-free, cancel anytime</p>
            </div>
            
            {/* Yearly Block - THIS ENTIRE DIV WILL BE REMOVED
            <div 
              className="rounded-xl border-2 border-primary shadow-md p-6 bg-white text-primary hover:scale-105 active:scale-95 hover:ring-2 hover:ring-accent transition-all cursor-pointer sm:w-1/2 flex flex-col justify-between"
              onClick={handleWaitlistClick}
            >
              <div>
                <p className="font-semibold">Yearly</p>
                <p className="text-xl font-bold">$89 / yr</p>
                <p className="text-xs text-gray-500">(3 months free)</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">Best value – save 3 months</p>
            </div>
            */}
          </div>
          
          {/* CTA Button - Consistent across all screen sizes */}
          <Button
            className="w-full max-w-5xl mx-auto bg-[#E11D48] text-white font-semibold py-3 px-4 sm:py-4 sm:px-5 rounded-full shadow-md text-center mt-8 whitespace-nowrap overflow-hidden min-h-[54px] flex items-center justify-center"
            onClick={handleWaitlistClick}
          >
            <span className="text-[12px] xs:text-sm sm:text-base md:text-lg font-semibold truncate">
              👉 Tap for Early Access — Join the Waitlist
            </span>
          </Button>

          {/* Feature Boxes Grid - Added more top margin */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-6 mt-8 text-center max-w-5xl mx-auto">
            {/* Box 1: What's Included - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-4">
              <h3 className="text-xl font-bold mb-2 text-primary">What's Included</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center justify-center gap-2">• Tap-to-learn lessons that actually stick</li>
                <li className="flex items-center justify-center gap-2">• XP, streaks & milestones to track your growth</li>
                <li className="flex items-center justify-center gap-2">• Real-life phrases you'll actually use</li>
                <li className="flex items-center justify-center gap-2">• Designed for modern learners on the go</li>
                <li className="flex items-center justify-center gap-2">• Cultural extras like jokes, slang, and poems</li>
                <li className="flex items-center justify-center gap-2">• Useful sentences — not textbook fluff</li>
                <li className="flex items-center justify-center gap-2">• Speak from day one, no Persian background needed</li>
              </ul>
            </div>

            {/* Box 2: Coming Soon - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold mb-2 text-primary">Coming Soon</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center justify-center gap-2">🧠 AI pronunciation coach</li>
                <li className="flex items-center justify-center gap-2">🧍 1-on-1 tutoring (roadmap)</li>
                <li className="flex items-center justify-center gap-2">🧵 Community forum</li>
                <li className="flex items-center justify-center gap-2">🏆 Global leaderboard</li>
                <li className="flex items-center justify-center gap-2">📚 Story mode dialogue</li>
                <li className="flex items-center justify-center gap-2">✈️ Travel crash course</li>
              </ul>
            </div>

            {/* Box 3: Built for Trust - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold mb-2 text-primary/80">Built for Trust</h3>
              <ul className="space-y-1 text-sm text-gray-600 italic">
                <li className="flex items-center justify-center gap-2">🔁 Cancel anytime</li>
                <li className="flex items-center justify-center gap-2">🔐 No ads, ever</li>
                <li className="flex items-center justify-center gap-2">🧩 Always improving</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Reduced padding and heading margin */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 text-primary">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-white p-4 rounded-lg shadow-sm">
              <summary className="font-medium text-lg cursor-pointer capitalize">
                Is Joining The Waitlist Free?
              </summary>
              <p className="mt-2 text-gray-700">100% free. No payment. No credit card. No commitment. Just sign up and we'll save your spot. You'll also unlock early access to new lessons, features, and the $0.99 launch offer available only to waitlist members.</p>
            </details>
            
            <details className="bg-white p-4 rounded-lg shadow-sm">
              <summary className="font-medium text-lg cursor-pointer capitalize">
                What Features Are Coming Soon?
              </summary>
              <p className="mt-2 text-gray-700">We're building everything from an AI-powered pronunciation scorer and immersive story mode to interactive games, XP competitions, global leaderboards, and a vibrant community for learners and native speakers — and as a waitlist member, you'll be the first to experience it all.</p>
            </details>
            
            <details className="bg-white p-4 rounded-lg shadow-sm">
              <summary className="font-medium text-lg cursor-pointer capitalize">
                Why Should I Join The Waitlist Instead Of Waiting For Launch?
              </summary>
              <p className="mt-2 text-gray-700">Waitlist members get early access, sneak peeks of new features, and exclusive pricing! You'll be the first to speak Persian while others are still on the sidelines.</p>
            </details>
            
            <details className="bg-white p-4 rounded-lg shadow-sm">
              <summary className="font-medium text-lg cursor-pointer capitalize">
                Will This Help Me Talk To Family Or Travel To Iran?
              </summary>
              <p className="mt-2 text-gray-700">Whether you want to connect with Persian-speaking loved ones or prep for a trip, our lessons focus on practical conversation, not academic grammar drills.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA Banner - Reduced padding and heading margin */}
      <section className="py-10 px-6 bg-primary/5 border-t border-gradient-to-r from-primary via-accent to-primary">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-primary">Ready to start your Persian journey?</h2>
          <Button
            className="bg-accent hover:brightness-105 transition text-white font-semibold py-6 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95"
            aria-label="Join waitlist"
            onClick={handleWaitlistClick}
          >
            Join the Waitlist — No Payment
          </Button>
          <p className="text-sm text-gray-700 font-medium mt-4">
            Founding Learners get their first month for just $0.99
          </p>
        </div>
      </section>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseWaitlistForm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {isSubscribed ? (
                <>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                    You're on the list! 🎉
                  </h3>
                  <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                    You're officially part of the early access crew! We'll let you know the moment the full platform is ready.
                  </p>
                  <Button 
                    onClick={handleCloseWaitlistForm}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-lg"
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                    Join Our Free Beta Waitlist
                  </h3>
                  <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                    Waitlist closes before launch. No commitment. Reserve your spot.
                  </p>
                  <form onSubmit={handleWaitlistSubmit} className="w-full mx-auto">
                    <div className="flex flex-col gap-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-lg"
                        disabled={isLoading}
                        aria-label="Email address"
                        aria-describedby="email-error"
                      />
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-white text-lg"
                        disabled={isLoading}
                        aria-label="Join waitlist"
                      >
                        {isLoading ? 'Joining...' : 'Join Waitlist'}
                      </Button>
                    </div>
                    {error && (
                      <p id="email-error" className="text-red-500 mt-2 text-sm text-center" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 