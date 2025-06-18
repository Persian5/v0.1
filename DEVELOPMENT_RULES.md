# Development Rules

## 🚫 **MANDATORY ANTI-PATTERNS (Never Do This)**

### **1. Hardcoded Lesson References**
❌ **NEVER:**
```typescript
// BAD - hardcoded paths
router.push('/modules/module1/lesson1')
<Link href="/modules/module1/lesson1">
window.location.href = '/modules/module1/lesson1'
```

✅ **ALWAYS:**
```typescript
// GOOD - dynamic routing
const nextLesson = LessonProgressService.getFirstAvailableLesson()
router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
```

### **2. Direct Storage Access**
❌ **NEVER:**
```typescript
// BAD - direct localStorage calls
localStorage.getItem('user-lesson-progress')
localStorage.setItem('global-user-xp', xp.toString())
```

✅ **ALWAYS:**
```typescript
// GOOD - through service layer
LessonProgressService.getProgress()
XpService.addXp(amount, source)
```

### **3. Content Duplication**
❌ **NEVER:**
```typescript
// BAD - duplicated lesson content
const words = ["Salam", "Chetori", "Merci"]
const lesson1Words = {salam: "Hello", chetori: "How are you?"}
```

✅ **ALWAYS:**
```typescript
// GOOD - single source of truth
import { getLessonVocabulary } from '@/lib/config/curriculum'
const vocabulary = getLessonVocabulary(moduleId, lessonId)
```

### **4. Non-Scalable Solutions**
❌ **NEVER:**
```typescript
// BAD - breaks with new modules
if (moduleId === 'module1') { /* special logic */ }
switch(lessonId) { case 'lesson1': /* hardcoded */ }
```

✅ **ALWAYS:**
```typescript
// GOOD - scales with any module/lesson
const lesson = getLesson(moduleId, lessonId)
if (lesson.type === 'greetings') { /* type-based logic */ }
```

### **5. Tight Coupling**
❌ **NEVER:**
```typescript
// BAD - components knowing too much about each other
<Flashcard lesson={lesson} module={module} progress={progress} />
```

✅ **ALWAYS:**
```typescript
// GOOD - minimal, focused props
<Flashcard vocabularyItem={vocab} onComplete={handleComplete} />
```

---

## ✅ **MANDATORY PATTERNS (Always Do This)**

### **1. Service Layer Architecture**
All data operations MUST go through services:

```typescript
// Data Access Pattern
lib/services/
  ├── xp-service.ts
  ├── lesson-progress-service.ts
  ├── vocabulary-service.ts
  └── [new-feature]-service.ts
```

**Service Requirements:**
- Static methods for stateless operations
- Error handling with try/catch
- Consistent return types
- Browser safety checks (`typeof window !== 'undefined'`)

### **2. Type Safety**
All data structures MUST have TypeScript interfaces:

```typescript
// Required in lib/types.ts
interface LessonStep {
  type: StepType
  points: number
  data: any  // Specific per step type
}

interface VocabularyItem {
  id: string
  en: string
  fa: string
  finglish: string
  phonetic: string
  lessonId: string
  audio?: string
}
```

### **3. Curriculum as Source of Truth**
ALL content MUST live in `lib/config/curriculum.ts`:

```typescript
// Content Structure
export const curriculumData: Module[] = [
  {
    id: "module1",
    lessons: [
      {
        id: "lesson1",
        vocabulary: [...],
        steps: [...]
      }
    ]
  }
]
```

### **4. Dynamic Navigation**
ALL navigation MUST use progress services:

```typescript
// Navigation Pattern
const getNavigationTarget = () => {
  return LessonProgressService.getFirstAvailableLesson()
}

// In onClick handlers
const handleContinue = () => {
  const nextLesson = LessonProgressService.getNextSequentialLesson(
    currentModuleId, 
    currentLessonId
  )
  router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
}
```

### **5. Fallback Safety**
Every dynamic system MUST have graceful fallbacks:

```typescript
// Fallback Pattern
static getFirstAvailableLesson(): AvailableLesson {
  // ... logic to find lesson ...
  
  // ALWAYS include fallback
  return {
    moduleId: 'module1',
    lessonId: 'lesson1'
  }
}
```

### **6. Component Reusability**
Components MUST be designed for reuse:

```typescript
// Reusable Component Pattern
interface FlashcardProps {
  vocabularyItem?: VocabularyItem  // New dynamic way
  front?: string                   // Legacy fallback
  back?: string                    // Legacy fallback
  onComplete: () => void           // Required callback
}
```

---

## 🏗️ **ARCHITECTURAL STANDARDS**

### **File Organization Rules**

```
lib/
  config/
    curriculum.ts     # ONLY place for lesson content
  services/
    *.ts             # All data operations
  types.ts           # All TypeScript interfaces

app/
  components/
    LessonRunner.tsx  # Core orchestration - handle with care
    games/           # Individual game components
    ui/              # Reusable UI components
  modules/[moduleId]/[lessonId]/
    page.tsx         # Dynamic lesson pages
    completion/      # Completion flow
    summary/         # Summary pages
```

### **Import Standards**

```typescript
// Service imports
import { XpService } from '@/lib/services/xp-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'

// Config imports
import { getLesson, getLessonVocabulary } from '@/lib/config/curriculum'

// Type imports
import { LessonStep, VocabularyItem } from '@/lib/types'
```

### **Props Interface Standards**

```typescript
// Always define props interfaces
interface ComponentProps {
  // Required props first
  onComplete: () => void
  
  // Optional props with defaults
  points?: number
  
  // Data props with clear types
  vocabularyItem?: VocabularyItem
}
```

### **Error Handling Standards**

```typescript
// Service error handling
static getData(): DataType {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error('Error reading data:', error)
    return defaultValue
  }
}
```

---

## 🎯 **LESSON DEVELOPMENT STANDARDS**

### **Vocabulary Integration**
```typescript
// Lesson vocabulary MUST be in curriculum.ts
vocabulary: [
  {
    id: "unique_id",
    en: "English translation",
    fa: "فارسی script", 
    finglish: "Romanized",
    phonetic: "pronunciation guide",
    lessonId: "module1-lesson1"
  }
]

// Flashcard steps MUST reference by ID
{
  type: "flashcard",
  data: {
    vocabularyId: "unique_id"  // NOT front/back text
  }
}
```

### **Step Flexibility Requirements**
Lesson steps MUST support variety:
- Different step orders per lesson
- Different step types per lesson  
- Extensible for new game types
- No hardcoded step sequences

### **Progress Tracking Standards**
```typescript
// Lesson completion MUST mark progress
LessonProgressService.markLessonCompleted(moduleId, lessonId)

// Vocabulary progress MUST be tracked
VocabularyService.markWordLearned(moduleId, lessonId, wordId)
```

---

## 🚀 **PERFORMANCE STANDARDS**

### **Component Optimization**
- Minimize re-renders in LessonRunner
- Use React.memo for expensive components
- Lazy load lesson content
- Optimize bundle size

### **Data Loading**
- Cache service responses where appropriate
- Minimize localStorage reads/writes
- Batch updates when possible

### **User Experience**
- Loading states for all async operations
- Error boundaries for component crashes
- Graceful degradation for network issues

---

## 📝 **CODE QUALITY STANDARDS**

### **Commit Message Format**
```
type: brief description

✅ V0.1: [checklist item completed]
📋 ARCH: [architecture pattern followed] 
🚫 FIX: [anti-pattern avoided]

Example:
feat: add vocabulary service for dynamic word tracking

✅ V0.1: Vocabulary system with local storage
📋 ARCH: Service layer pattern for data access
🚫 FIX: Removed hardcoded word lists from components
```

### **Component Documentation**
```typescript
/**
 * Flashcard component for vocabulary learning
 * 
 * Supports both new vocabulary ID system and legacy front/back props
 * for backward compatibility during migration.
 * 
 * @param vocabularyItem - Dynamic vocabulary from curriculum
 * @param front - Legacy front text (fallback)
 * @param back - Legacy back text (fallback)
 * @param onComplete - Called when user completes flashcard
 */
```

### **Testing Requirements**
- Test dynamic navigation paths
- Test service layer methods
- Test component reusability
- Test error handling and fallbacks

---

## 🔄 **MIGRATION STANDARDS**

### **localStorage → Supabase**
```typescript
// Services MUST abstract storage
export class DataService {
  private static async getStorageData() {
    if (useSupabase) {
      return await supabase.from('table').select()
    } else {
      return JSON.parse(localStorage.getItem(key) || '{}')
    }
  }
}
```

### **Backward Compatibility**
- New features MUST support old data formats
- Migration MUST preserve user progress
- Fallbacks MUST handle missing data gracefully

---

These rules ensure **modular, scalable, and maintainable** code that supports rapid feature development without breaking existing functionality. 