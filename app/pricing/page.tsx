"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubscribeButton } from "@/components/SubscribeButton";

export default function PricingPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartLearning = () => {
    router.push('/modules')
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      
      {/* Navbar from Landing Page */}      {/* Hero Section - Minimized top padding */}
      <section className="flex flex-col items-center justify-center px-6 pt-4 pb-6 bg-primary/5">
        {/* Title Outside Card - Reduced bottom margin MORE */}
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary text-center mb-4">
            Start Learning Persian Today!
          </h1>
        </div>

        {/* Pricing Card - Reduced vertical padding */}
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl px-8 sm:px-10 py-6 text-center">
          {/* Updated description */}
          <p className="text-lg text-gray-600 mb-6 text-center">
            Begin your Persian learning journey with our interactive lessons and games.
          </p>

          {/* Price Blocks Container */}
          <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto">
            {/* Free Access Block */}
            <div 
              className="rounded-xl border-2 shadow-md p-6 bg-primary text-white hover:scale-105 active:scale-95 hover:ring-2 hover:ring-accent transition-all cursor-pointer flex flex-col justify-between text-center"
              onClick={handleStartLearning}
            >
              <div>
                <p className="font-semibold text-2xl">Free Access</p>
                <p className="text-lg font-semibold text-white mt-1">Start learning Persian now</p>
                <p className="text-sm text-white italic opacity-90">✨ Available immediately – No signup required</p>
              </div>
              <p className="text-sm text-primary-foreground/80 mt-2">Try all lessons and features for free</p>
            </div>

            {/* Premium Subscription Block */}
            <div className="rounded-xl border-2 shadow-md p-6 bg-accent text-white flex flex-col justify-between text-center">
              <div>
                <p className="font-semibold text-2xl">Premium Access</p>
                <p className="text-lg font-semibold text-white mt-1">$4.99/month - All modules unlocked</p>
                <p className="text-sm text-white italic opacity-90">🎯 Full access to all content</p>
              </div>
              <div className="mt-4">
                <SubscribeButton className="w-full bg-white text-accent hover:bg-gray-100">
                  Subscribe Now - $4.99/month
                </SubscribeButton>
              </div>
            </div>
          </div>
          
          {/* CTA Button - Consistent across all screen sizes */}
          <Button
            className="w-full max-w-5xl mx-auto bg-[#E11D48] text-white font-semibold py-3 px-4 sm:py-4 sm:px-5 rounded-full shadow-md text-center mt-8 whitespace-nowrap overflow-hidden min-h-[54px] flex items-center justify-center"
            onClick={handleStartLearning}
          >
            <span className="text-[12px] xs:text-sm sm:text-base md:text-lg font-semibold truncate">
              🚀 Start Learning Persian Now
            </span>
          </Button>

          {/* Feature Boxes Grid - Added more top margin */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-6 mt-8 text-center max-w-5xl mx-auto">
            {/* Box 1: What's Included - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-4">
              <h3 className="text-xl font-bold mb-2 text-primary">What's Included</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center justify-center gap-2">• Interactive lessons that actually stick</li>
                <li className="flex items-center justify-center gap-2">• XP, streaks & milestones to track your growth</li>
                <li className="flex items-center justify-center gap-2">• Real-life phrases you'll actually use</li>
                <li className="flex items-center justify-center gap-2">• Designed for modern learners on the go</li>
                <li className="flex items-center justify-center gap-2">• Cultural context and practical examples</li>
                <li className="flex items-center justify-center gap-2">• Useful sentences — not textbook fluff</li>
                <li className="flex items-center justify-center gap-2">• Speak from day one, no Persian background needed</li>
              </ul>
            </div>

            {/* Box 2: Coming Soon - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold mb-2 text-primary">Coming Soon</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center justify-center gap-2">🧠 AI pronunciation coach</li>
                <li className="flex items-center justify-center gap-2">🧍 1-on-1 tutoring sessions</li>
                <li className="flex items-center justify-center gap-2">🧵 Community forum</li>
                <li className="flex items-center justify-center gap-2">🏆 Global leaderboard</li>
                <li className="flex items-center justify-center gap-2">📚 Story mode dialogue</li>
                <li className="flex items-center justify-center gap-2">✈️ Travel crash course</li>
              </ul>
            </div>

            {/* Box 3: Why Persian? - Reduced padding and heading margin */}
            <div className="border rounded-lg p-5 bg-gray-50/50 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold mb-2 text-primary">Why Persian?</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center justify-center gap-2">🌍 110M+ speakers worldwide</li>
                <li className="flex items-center justify-center gap-2">📜 Rich literary tradition</li>
                <li className="flex items-center justify-center gap-2">🏛️ Gateway to culture & history</li>
                <li className="flex items-center justify-center gap-2">👨‍👩‍👧‍👦 Connect with family</li>
                <li className="flex items-center justify-center gap-2">💼 Career opportunities</li>
                <li className="flex items-center justify-center gap-2">🎵 Understand Persian music & poetry</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">Is the app really free?</h3>
              <p className="text-gray-700">Yes! All lessons and features are currently available for free. Start learning Persian immediately without any payment or signup required.</p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">Do I need any prior knowledge of Persian?</h3>
              <p className="text-gray-700">Not at all! Our lessons are designed for complete beginners. We start with the basics and gradually build up your skills using practical phrases and cultural context.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">What makes this different from other language apps?</h3>
              <p className="text-gray-700">We focus specifically on Persian with cultural context from Iran. Our lessons include real-life situations, cultural references, and practical phrases that Persian speakers actually use — not just textbook Persian.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">How long are the lessons?</h3>
              <p className="text-gray-700">Each lesson is designed to take 5-10 minutes, perfect for busy schedules. You can learn at your own pace and complete lessons whenever it's convenient for you.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">Will there be paid features in the future?</h3>
              <p className="text-gray-700">We may introduce premium features like AI pronunciation coaching and 1-on-1 tutoring in the future, but all core lessons will remain accessible to everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">Ready to start your Persian journey?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of learners who are already discovering the beauty of Persian language and culture.</p>
          
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-white px-8 py-4 text-lg rounded-full shadow-lg"
            onClick={handleStartLearning}
            aria-label="Start learning Persian"
          >
            Start Learning Persian Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-4">
            © 2025 Iranopedia — Made with ❤️ for anyone learning Persian
          </p>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
              Home
            </Link>
            <Link href="/modules" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
              Start Learning
            </Link>
            <a 
              href="https://iranopedia.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
                      >
              Iranopedia
            </a>
          </nav>
                    </div>
      </footer>
    </div>
  );
} 