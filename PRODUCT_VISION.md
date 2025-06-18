# Product Vision

## 🎯 **Core Mission**

**Learn Persian. Reconnect with Your Roots.**

Persian language learning through authentic cultural connection, specifically designed for the Iranian diaspora and anyone wanting to engage with Iranian culture meaningfully.

### **Target Audience**
- **Primary**: Iranian-Americans/diaspora wanting to reconnect with heritage
- **Secondary**: Non-Iranians interested in Persian culture, language, and travel
- **Tertiary**: Language learning enthusiasts seeking culturally-rich content

### **Unique Value Proposition**
- **Cultural Context**: Every lesson embedded in real Iranian scenarios
- **Story-Based Learning**: Practical situations over academic grammar
- **Diaspora-Focused**: Understands the emotional connection to heritage
- **Authentic Content**: Created with deep cultural knowledge and sensitivity

---

## 📚 **V0.1 Launch Requirements (July 7, 2025)**

### **Content & Lesson Structure**

**Modules:**
- At least 6 modules total
- Each module contains 4–6+ lessons
- Ends with a "Story Mode" branching scenario as the final lesson

**Lessons:**
- Introduce 4-6 new vocabulary words per lesson
- Reuse past vocabulary for reinforcement
- Combine multiple item types in one lesson
- Must flow smoothly, avoid excessive repetition but reinforce key concepts

**Lesson Types:**
- Flashcards with pronunciation
- Matching games
- Multiple Choice quizzes
- Fill in the Blank exercises
- Sentence Reordering challenges

**Review Mode:**
- Separate section like a "Module"
- Smart review based on:
  - Most commonly incorrect words
  - Recently learned vocabulary
  - Words not reviewed in a while
- XP is uncapped but has anti-farming protection
- Offers games, vocab challenges, time trials, etc.

### **Payments & Business Model**

**Stripe Integration:**
- $4.99/month subscription
- Waitlist members get $0.99 first month

**Access Rules:**
- Module 1 Lesson 1–2 are always free
- All other lessons locked behind paywall
- Lessons are sequentially unlocked after payment

**Payment Flow:**
- Payment must link to user account
- After Lesson 2, prompt users to pay
- If payment fails, account is locked from paid content
- Free lessons remain visible, locked lessons show padlock → CTA to upgrade
- No free trial
- Stripe handles cancellation, failure, and renewals

### **Accounts & Authentication**

**Auth via Supabase:**
- Email/password + Google OAuth
- Email verification required
- Option to delay login until user tries to access locked lesson

**Account Data:**
- Tracks streaks, XP, lesson progress
- Login required only for paid users (unless early user feedback suggests otherwise)

### **Gamification & Engagement**

**Streaks:**
- Tracked on user dashboard
- Has a grace period for missed days

**XP System:**
- Earned through lesson actions and review mode
- Not capped, but fair logic to prevent abuse

**Leaderboard:**
- Shows XP totals, username, and country
- Only all-time leaderboard in v0.1
- Refreshes in real-time or hourly

---

## 📚 **Content Strategy**

### **Learning Philosophy**
- **Practical Over Academic**: Focus on real conversations, not grammar rules
- **Cultural Integration**: Language as gateway to culture, not isolated skill
- **Progressive Building**: Each lesson builds vocabulary and cultural understanding
- **Engaging Scenarios**: Make learning feel like experiencing Iran

### **Content Structure**

**Module 1: Greetings & Politeness (FREE - Lessons 1-2)**
- Lesson 1: Basic Persian Greetings ✅
- Lesson 2: Basic Politeness and Essential Responses ✅
- Lesson 3: Introducing Yourself and Asking Questions (PAID)
- Lesson 4: Basic Greetings Continued (PAID)
- Story Mode: Meeting family at Iranian gathering

**Module 2: Numbers & Age (PAID)**
- Numbers 1-10 with cultural context
- Asking and telling age appropriately
- Basic math in daily conversations
- Story Mode: Shopping in Persian bazaar

**Future Modules (V0.1+):**
- Module 3: Family & Relationships
- Module 4: Food & Ordering at Restaurants
- Module 5: Daily Activities & Routines
- Module 6: Getting Around (Travel & Directions)

### **Story Mode Integration**
- **Cultural Scenarios**: 
  - Nowruz at family house
  - Dinner at grandma's house
  - Shopping in the bazaar
  - Wedding celebrations
- **Branching Conversations**: Different outcomes based on language choices
- **Cultural Learning**: Embedded lessons about Iranian customs, etiquette, traditions

### **Vocabulary Strategy**
- **4-6 words per lesson** for focused learning
- **Progressive Building**: New lessons incorporate previous vocabulary
- **Cultural Relevance**: Words chosen for real-world utility in Iranian contexts
- **Pronunciation Focus**: Audio guides for diaspora who can't read Farsi script
- **Script Introduction**: Eventually transition to Farsi script reading

---

## 💰 **Business Model**

### **V0.1 Monetization**
- **Freemium Model**: Module 1 Lessons 1-2 completely free
- **Monthly Subscription**: $4.99/month for all paid content
- **Waitlist Incentive**: $0.99 first month for early supporters
- **No Per-Module Pricing**: Simple, predictable pricing
- **Sequential Access**: Lessons unlock in order after payment

### **Revenue Strategy**
- **Content Value**: Continuous new modules and story modes
- **Cultural Premium**: Unique positioning commands higher perceived value
- **Community Building**: Engaged diaspora community increases retention
- **Word-of-Mouth**: Cultural authenticity drives organic referrals

### **Growth Strategy**
- **V0.1**: Prove concept with 200-person waitlist conversion
- **V0.2**: Scale content, improve features based on feedback
- **V1.0**: Native iOS app when revenue supports developer hiring
- **V2.0**: Community features, user-generated content, cultural events

---

## 🚀 **Platform Evolution**

### **Current: Web App (V0.1)**
- **Responsive Design**: Mobile and desktop optimized
- **Progressive Web App**: App-like experience in browser
- **Supabase Backend**: Authentication and data management
- **Stripe Payments**: Subscription management

### **Future: Native Mobile (V1.0+)**
- **iOS Priority**: When revenue supports dedicated developer
- **Offline Capability**: Downloaded lessons for practice anywhere
- **Native Features**: Push notifications, better performance
- **Audio Integration**: Built-in recording and playback

### **Long-Term Vision (V2.0+)**
- **Community Platform**: User forums, cultural discussions
- **Live Events**: Virtual Persian cultural events, language exchanges
- **Advanced Analytics**: Personalized learning paths based on progress
- **Cultural Library**: Stories, recipes, traditions alongside language

---

## 📊 **V0.1 Success Metrics**

### **Launch Goals (July 7)**
- **User Acquisition**: 50%+ of waitlist converts to signups
- **Engagement**: 60%+ complete both free lessons
- **Conversion**: 25%+ upgrade to paid subscription
- **Retention**: 40%+ return after 3 days
- **Cultural Connection**: Positive feedback on cultural authenticity

### **Technical Requirements**
- **Zero critical bugs** in user journey
- **< 3 second page load times**
- **99%+ uptime** during launch week
- **All payment flows** working correctly
- **All authentication flows** working correctly

### **Content Requirements**
- **Minimum 6 modules** with 4+ lessons each
- **All lessons follow dynamic architecture**
- **Cultural context** included appropriately
- **Story Mode finales** for each module
- **Review Mode** functional with smart algorithms

---

## 🌍 **Cultural Integration Strategy**

### **Authentic Representation**
- **Diverse Perspectives**: Different Iranian regions, backgrounds, experiences
- **Modern Context**: Contemporary Iranian life, not just traditional
- **Respectful Approach**: Sensitive to political and social complexities
- **Inclusive Content**: Welcoming to all learners regardless of background

### **Cultural Learning Integration**
- **Holiday Lessons**: Special content for Nowruz, Yalda, Chaharshanbe Suri
- **Food Culture**: Vocabulary around Persian cuisine with cultural context
- **Family Dynamics**: Understanding Iranian family structures and relationships
- **Social Etiquette**: Appropriate behavior in different Iranian social contexts

### **Community Building**
- **Leaderboards**: Friendly competition with global Persian learners
- **Shared Progress**: Diaspora learners connecting over shared cultural goals
- **User Stories**: Feature learner journeys and cultural connections made
- **Expert Content**: Collaboration with Persian cultural experts and native speakers

---

This vision balances immediate practical goals (V0.1 launch) with long-term cultural and business aspirations, always centered on authentic Persian cultural connection. 