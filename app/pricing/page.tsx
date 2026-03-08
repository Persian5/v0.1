"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SubscribeButton } from "@/components/SubscribeButton"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const faqs = [
  {
    question: "What do I get for free?",
    answer:
      "Module 1 is completely free — no credit card, no signup required. It includes all lesson types, story games, XP tracking, and streaks. You get the full learning experience to try before you decide.",
  },
  {
    question: "What does Full Access unlock?",
    answer:
      "Full Access gives you Modules 2 through 11, covering everything from family conversations to advanced expressions. You also get unlimited review games and every future module we release — included at no extra cost.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel in 2 clicks from your account settings, no questions asked. We also offer a 14-day money-back guarantee if you're not satisfied.",
  },
  {
    question: "Do I need to know the Persian alphabet?",
    answer:
      "No. Finglish uses Persian written in English letters so you can start speaking immediately. Alphabet lessons are available later when you're ready.",
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleStartFree = () => {
    setIsNavigating(true)
    router.push("/modules")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* ============================================ */}
        {/* HERO                                        */}
        {/* ============================================ */}
        <section className="pt-12 pb-8 md:pt-20 md:pb-12 px-4 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-emerald-700 font-normal mb-4 tracking-wide uppercase">
              Finglish by Iranopedia
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-5">
              Unlock every Persian lesson
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Module 1 is free — no signup needed. Full Access starts at $0.99
              for your first month, then $9.99/month. All 11 modules, review
              games, and every future lesson included.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* PRICING CARDS                               */}
        {/* ============================================ */}
        <section className="py-12 md:py-20 bg-white px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Free Starter */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-[32px] p-8 md:p-10"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    Free Starter
                  </h3>
                  <div className="text-4xl font-bold text-primary">$0</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Full Module 1 (Greetings & Basics)",
                    "All lesson types and story games",
                    "XP, streaks, and progress tracking",
                    "No credit card required",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-2 border-gray-300 hover:border-primary hover:bg-primary/5 py-6 text-lg font-semibold"
                  size="lg"
                  onClick={handleStartFree}
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start Free"
                  )}
                </Button>
              </motion.div>

              {/* Full Access */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-primary/10 via-white to-accent/10 rounded-[32px] p-8 md:p-10 border-2 border-primary relative overflow-hidden"
              >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
                  <div className="px-5 py-1.5 bg-primary text-white text-sm font-semibold rounded-b-xl">
                    Most Popular
                  </div>
                </div>

                <div className="mb-6 mt-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    Full Access
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">
                      $0.99
                    </span>
                    <span className="text-gray-500">first month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Then $9.99/month &middot; Beta pricing
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Everything in Free, plus\u2026",
                    "Modules 2 through 11",
                    "Unlimited review mode and games",
                    "Every future lesson included",
                    "14-day money-back guarantee",
                    "Cancel anytime in 2 clicks",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <span
                        className={`text-gray-700 ${i === 0 ? "font-semibold" : ""}`}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <SubscribeButton
                  className="w-full rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all py-6 text-lg font-semibold"
                  size="lg"
                >
                  Get Full Access — $0.99
                </SubscribeButton>
              </motion.div>
            </div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Cancel anytime in 2 clicks</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Built by Iranians</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FAQ                                         */}
        {/* ============================================ */}
        <section className="py-16 md:py-24 bg-primary/5 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-primary text-center mb-12"
            >
              Common questions
            </motion.h2>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-lg text-gray-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA                                   */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-white to-accent/5 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight">
              Start free. Upgrade when you're ready.
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
              Module 1 is on us. Full Access is $0.99 for your first month,
              then $9.99/month with a 14-day guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-2 border-gray-300 hover:border-primary hover:bg-primary/5 px-8 py-6 text-lg font-semibold"
                onClick={handleStartFree}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Start Free"
                )}
              </Button>
              <SubscribeButton
                className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg font-semibold"
                size="lg"
              >
                Get Full Access
              </SubscribeButton>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card for free tier &middot; Cancel anytime &middot;
              14-day money-back guarantee
            </p>
          </motion.div>
        </section>
      </main>

      {/* ============================================ */}
      {/* FOOTER                                       */}
      {/* ============================================ */}
      <footer className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-px bg-gray-200 mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2025 Iranopedia</p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link
                href="/"
                className="hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href="/modules"
                className="hover:text-primary transition-colors"
              >
                Start Learning
              </Link>
              <a
                href="https://iranopedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Iranopedia
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
