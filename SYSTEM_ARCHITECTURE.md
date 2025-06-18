# System Architecture

## 🏗️ **Current Technical State**

### **Data Flow Architecture**
```
curriculum.ts → Services → React Components → localStorage → Supabase (planned)
```

**Core Flow:**
1. **Content Source**: All lessons, vocabulary, and structure defined in `lib/config/curriculum.ts`
2. **Service Layer**: Business logic handled by dedicated services
3. **Component Layer**: React components consume data via props and service calls
4. **Storage Layer**: Currently localStorage, migrating to Supabase before launch
5. **Routing**: Dynamic navigation based on user progress state

### **Service Architecture**

**XpService** (`lib/services/xp-service.ts`)
- Manages experience point rewards and calculations
- Handles XP formatting and display
- Defines reward amounts per activity type
- Storage: `global-user-xp` in localStorage

**LessonProgressService** (`lib/services/lesson-progress-service.ts`)
- Tracks lesson completion status
- Provides dynamic navigation logic
- Methods:
  - `getFirstAvailableLesson()` - finds first incomplete lesson
  - `getNextSequentialLesson()` - finds sequential next lesson regardless of completion
  - `markLessonCompleted()` - updates progress
- Storage: `user-lesson-progress` as `{"module1-lesson1": boolean}`

**VocabularyService** (`lib/services/vocabulary-service.ts`)
- Manages vocabulary learning progress
- Tracks words learned per lesson
- Storage: `vocabulary-progress` as lesson-specific word arrays

### **Lesson Structure System**

**Flexible Step Architecture:**
```typescript
interface LessonStep {
  type: 'welcome' | 'flashcard' | 'quiz' | 'input' | 'matching' | 'final'
  points: number
  data: StepTypeData
}
```

**Current Step Types:**
- `welcome` - Lesson introduction with objectives
- `flashcard` - Vocabulary cards with pronunciation
- `quiz` - Multiple choice questions
- `input` - Text input exercises
- `matching` - Drag and drop word matching
- `final` - Conversation challenge scenarios

**Extensibility**: New game types can be added by:
1. Adding new step type to interface
2. Creating component for the game
3. Adding handler in LessonRunner
4. No changes needed to existing lessons

### **Vocabulary System**

**Structure:**
```typescript
interface VocabularyItem {
  id: string
  en: string        // English translation
  fa: string        // Farsi script
  finglish: string  // Romanized Persian
  phonetic: string  // Pronunciation guide
  lessonId: string  // "module1-lesson1"
  audio?: string    // Future: audio file path
}
```

**Dynamic Integration:**
- Flashcards can reference vocabulary by ID
- Lessons build vocabulary progressively
- Summary pages show lesson-specific learned words
- Backward compatibility maintained for legacy flashcard data

### **Routing Architecture**

**Dynamic Navigation:**
- NO hardcoded lesson paths (e.g., `/modules/module1/lesson1`)
- All navigation uses progress services
- Routes automatically adapt to user state

**Navigation Points:**
- Homepage "Preview Lesson" → `LessonProgressService.getFirstAvailableLesson()`
- Account "Continue Learning" → `LessonProgressService.getFirstAvailableLesson()`
- Completion "Next Lesson" → `LessonProgressService.getNextSequentialLesson()`
- Fallback to module1/lesson1 if all complete

### **State Management**

**Current Pattern:**
- React state for component-level UI state
- localStorage for persistence
- Service layer abstracts storage implementation
- Props down, events up pattern

**Migration Strategy:**
- Services provide abstraction layer
- Storage implementation can be swapped without component changes
- localStorage → Supabase transition invisible to UI layer

### **Component Hierarchy**

**Core Reusable Components:**
- `LessonRunner` - orchestrates lesson flow
- `Flashcard` - vocabulary presentation
- `Quiz` - multiple choice interactions
- `InputExercise` - text input challenges
- `MatchingGame` - drag and drop
- `FinalChallenge` - conversation scenarios

**Page Components:**
- Lesson pages (`/modules/[moduleId]/[lessonId]`)
- Completion pages
- Summary pages
- Module overview pages

**Layout Components:**
- Header with dynamic navigation
- Progress bars
- XP displays

### **Authentication Architecture (Planned)**

**Supabase Integration:**
- Email/password authentication
- OAuth providers (Google, Apple)
- Email verification required
- Session management
- Row Level Security (RLS) policies

**Data Migration:**
```
localStorage → Supabase Tables:
- global-user-xp → users.total_xp
- user-lesson-progress → lesson_progress table
- vocabulary-progress → vocabulary_progress table
```

### **Payment Integration (Planned)**

**Stripe Setup:**
- Monthly subscription model ($4.99/month)
- Module 1 free, Module 2+ behind paywall
- Webhook handling for subscription events
- Subscription status checking before lesson access

### **Performance Considerations**

**Current Optimizations:**
- Lesson content lazy-loaded
- Minimal re-renders in LessonRunner
- Service layer caching
- Optimized bundle size

**Future Considerations:**
- Audio file compression and CDN
- Progressive lesson loading
- Offline capability for completed lessons

### **Error Handling**

**Current Strategy:**
- Graceful fallbacks in navigation services
- Safe lesson loading with error boundaries
- localStorage error catching
- Network failure handling

### **File Organization**

```
lib/
  config/
    curriculum.ts          # Single source of truth for all content
  services/
    xp-service.ts         # XP management
    lesson-progress-service.ts  # Progress tracking
    vocabulary-service.ts # Vocabulary progress
  types.ts               # TypeScript interfaces

app/
  components/
    LessonRunner.tsx      # Core lesson orchestration
    games/               # Individual game components
  modules/[moduleId]/[lessonId]/  # Dynamic lesson pages
```

### **Security Considerations**

**Current:**
- Client-side data validation
- Safe localStorage usage
- XSS prevention in content rendering

**Planned (Supabase):**
- Row Level Security policies
- JWT token management
- API rate limiting
- Secure payment processing

### **Monitoring & Analytics (Planned)**

**User Behavior:**
- Lesson completion rates
- Time spent per lesson
- Drop-off points
- XP earning patterns

**Technical Metrics:**
- Page load times
- Error rates
- API response times
- Payment success rates

---

## 🔄 **Migration Timeline**

### **Phase 1: Authentication**
- Supabase project setup
- User table creation
- Auth integration
- Email verification

### **Phase 2: Data Migration**
- Progress table creation
- localStorage → Supabase migration service
- Data preservation testing

### **Phase 3: Payment Integration**
- Stripe webhook setup
- Subscription management
- Paywall implementation

### **Phase 4: Analytics**
- Event tracking setup
- Dashboard creation
- Performance monitoring

---

This architecture supports the core principle: **modular, scalable, and dynamic**. Every component can be extended without breaking existing functionality, and all content flows through the single source of truth in curriculum.ts. 