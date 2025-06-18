import { Module, LessonStep, VocabularyItem } from "../types";

// Define all modules, lessons, and their content
export const curriculumData: Module[] = [
  {
    id: "module1",
    title: "Module 1: Greetings & Politeness",
    description: "Start a conversation the right way. Learn how to say hello, goodbye, thank you, please, and the difference between formal and casual tone.",
    emoji: "👋",
    lessonCount: 4,
    estimatedTime: "20 minutes",
    available: true,
    lessons: [
      {
        id: "lesson1",
        title: "Basic Persian Greetings",
        description: "Learn essential greetings and how to say hello in different contexts",
        emoji: "👋",
        progress: 0,
        locked: false,
        vocabulary: [
          {
            id: "salam",
            en: "Hello",
            fa: "سلام",
            finglish: "Salam",
            phonetic: "sah-LUHM",
            lessonId: "module1-lesson1"
          },
          {
            id: "chetori",
            en: "How are you?",
            fa: "چطوری",
            finglish: "Chetori",
            phonetic: "che-TOH-ree",
            lessonId: "module1-lesson1"
          },
          {
            id: "khosh_amadid",
            en: "Welcome",
            fa: "خوش آمدید",
            finglish: "Khosh Amadid",
            phonetic: "khosh uh-mah-DEED",
            lessonId: "module1-lesson1"
          },
          {
            id: "khodafez",
            en: "Goodbye",
            fa: "خداحافظ",
            finglish: "Khodafez",
            phonetic: "kho-DUH-fez",
            lessonId: "module1-lesson1"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Basic Greetings",
            description: "Learn common Persian greetings used in everyday conversations.",
            points: 0,
            data: {
              objectives: [
                "Say hello and greet someone",
                "Ask how someone is doing",
                "Welcome someone",
                "Say goodbye properly"
              ],
              lessonType: "greetings"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "salam"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'Salam' mean?",
              options: ["Hello", "Goodbye", "Thank you", "You're welcome"],
              correct: 0
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "chetori"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'How are you?' in Persian?",
              answer: "Chetori"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khosh_amadid"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "How are you?" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "Goodbye" }
              ]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khodafez"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "khosh_ahmadid", text: "Khosh Amadid", translation: "Welcome" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "khosh_ahmadid", "chetori", "khodafez"],
              title: "Ali's First Conversation",
              successMessage: "🎉 You're a natural—Ali made a great impression!",
              incorrectMessage: "Almost there—let's try that conversation order again!"
            }
          }
        ]
      },
      {
        id: "lesson2",
        title: "Basic Politeness and Essential Responses",
        description: "Master polite responses and common conversational phrases",
        emoji: "🙏",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori"],
        vocabulary: [
          {
            id: "khoobam",
            en: "I'm good",
            fa: "خوبم",
            finglish: "Khoobam",
            phonetic: "khoo-BAHM",
            lessonId: "module1-lesson2"
          },
          {
            id: "merci",
            en: "Thank you",
            fa: "مرسی",
            finglish: "Merci",
            phonetic: "mer-SEE",
            lessonId: "module1-lesson2"
          },
          {
            id: "baleh",
            en: "Yes",
            fa: "بله",
            finglish: "Baleh",
            phonetic: "bah-LEH",
            lessonId: "module1-lesson2"
          },
          {
            id: "na",
            en: "No",
            fa: "نه",
            finglish: "Na",
            phonetic: "nah",
            lessonId: "module1-lesson2"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Politeness & Responses",
            description: "Master essential polite responses and learn to answer basic questions like a native Persian speaker.",
            points: 0,
            data: {
              objectives: [
                "Respond when someone asks how you are",
                "Say thank you properly in Persian",
                "Answer yes and no questions confidently",
                "Build simple conversations using greetings"
              ],
              lessonType: "politeness"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoobam"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "merci"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "baleh"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "na"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete: Salam, ___ (How are you?)",
              options: ["Chetori", "Khoobam", "Merci", "Baleh"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you respond to 'Chetori?'",
              options: ["Khoobam", "Salam", "Chetori", "Baleh"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian word for 'Hello'",
              answer: "Salam"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'Thank you' in Persian?",
              answer: "Merci"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Khodafez", slotId: "slot1" },
                { id: "word2", text: "Khosh Amadid", slotId: "slot2" },
                { id: "word3", text: "Khoobam", slotId: "slot3" },
                { id: "word4", text: "Baleh", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Goodbye" },
                { id: "slot2", text: "Welcome" },
                { id: "slot3", text: "I'm good" },
                { id: "slot4", text: "Yes" }
              ]
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "khoobam", text: "Khoobam", translation: "I'm good" },
                { id: "merci", text: "Merci", translation: "Thank you" }
              ],
              targetWords: ["salam", "chetori", "khoobam", "merci"],
              title: "Ali's Polite Conversation",
              successMessage: "🎉 Perfect! You helped Ali have a polite conversation!",
              incorrectMessage: "Almost there—let's practice that conversation flow again!"
            }
          }
        ]
      },
      {
        id: "lesson3",
        title: "Introducing Yourself and Asking Questions",
        description: "Learn how to introduce yourself and ask basic questions",
        emoji: "🧑‍💼",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci"],
        vocabulary: [
          {
            id: "man_hastam",
            en: "I am",
            fa: "من هستم",
            finglish: "Man hastam",
            phonetic: "man has-TAHM",
            lessonId: "module1-lesson3"
          },
          {
            id: "esme_man",
            en: "My name is",
            fa: "اسم من",
            finglish: "Esme man",
            phonetic: "es-MEH man",
            lessonId: "module1-lesson3"
          },
          {
            id: "shoma_chi",
            en: "What about you?",
            fa: "شما چی؟",
            finglish: "Shoma chi?",
            phonetic: "sho-MAH chee",
            lessonId: "module1-lesson3"
          },
          {
            id: "az_koja",
            en: "Where from?",
            fa: "از کجا",
            finglish: "Az koja",
            phonetic: "az ko-JAH",
            lessonId: "module1-lesson3"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Introducing Yourself",
            description: "Learn how to introduce yourself and ask questions about others in Persian.",
            points: 0,
            data: {
              objectives: [
                "Introduce yourself with your name",
                "Ask others about themselves",
                "Ask where someone is from",
                "Build on previous greetings"
              ],
              lessonType: "introductions"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "man_hastam"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete: Salam, ___ Ali. (Hello, I am Ali)",
              options: ["Man hastam", "Chetori", "Khoobam", "Merci"],
              correct: 0
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "esme_man"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'My name is' in Persian?",
              answer: "Esme man"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you respond to 'Chetori?' (Review from Lesson 2)",
              options: ["Khoobam", "Salam", "Man hastam", "Esme man"],
              correct: 0
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "shoma_chi"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "az_koja"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete: Esme man Ali. ___ (My name is Ali. What about you?)",
              options: ["Shoma chi?", "Chetori", "Az koja", "Merci"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian greeting from Lesson 1",
              answer: "Salam"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Man hastam", slotId: "slot1" },
                { id: "word2", text: "Shoma chi?", slotId: "slot2" },
                { id: "word3", text: "Merci", slotId: "slot3" },
                { id: "word4", text: "Az koja", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "I am" },
                { id: "slot2", text: "What about you?" },
                { id: "slot3", text: "Thank you" },
                { id: "slot4", text: "Where from?" }
              ]
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "man_hastam", text: "Man hastam", translation: "I am" },
                { id: "esme_man", text: "Esme man", translation: "My name is" },
                { id: "shoma_chi", text: "Shoma chi?", translation: "What about you?" }
              ],
              targetWords: ["salam", "man_hastam", "esme_man", "shoma_chi"],
              title: "Ali Introduces Himself",
              successMessage: "🎉 Perfect! Ali can now introduce himself confidently!",
              incorrectMessage: "Almost there—let's practice that introduction again!"
            }
          }
        ]
      },
      {
        id: "lesson4",
        title: "Basic Greetings Continued",
        description: "Expand your greeting vocabulary with more formal and informal options",
        emoji: "💬",
        progress: 0,
        locked: true,
        steps: []
      }
    ]
  },
  {
    id: "module2",
    title: "Module 2: Numbers & Age",
    description: "Count, ask age, and talk prices. Learn numbers from 1 to 100, how to ask about age, and use simple math in daily conversation.",
    emoji: "🔢",
    lessonCount: 4,
    estimatedTime: "30 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module3",
    title: "Module 3: Family & Relationships",
    description: "Describe your family or ask about someone else's. Includes parents, siblings, friends, and possessive structures.",
    emoji: "👪",
    lessonCount: 3,
    estimatedTime: "25 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module4",
    title: "Module 4: Food & Ordering at a Restaurant",
    description: "Order like a pro. Learn how to ask for the check, express what you want or don't want, and talk about Persian dishes.",
    emoji: "🍽️",
    lessonCount: 5,
    estimatedTime: "40 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module5",
    title: "Module 5: Daily Activities & Routines",
    description: "Talk about your daily schedule. Wake up, go to work or school, and describe habits and everyday actions.",
    emoji: "📅",
    lessonCount: 3,
    estimatedTime: "30 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module6",
    title: "Module 6: Getting Around (Travel & Directions)",
    description: "Navigate with ease. Ask for directions, take taxis, and find locations using common travel vocabulary.",
    emoji: "🚕",
    lessonCount: 3,
    estimatedTime: "30 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module7",
    title: "Module 7: Feelings & Small Talk",
    description: "Talk about how you feel. Learn casual check-ins, emotions, and how to keep a conversation going.",
    emoji: "😊",
    lessonCount: 3,
    estimatedTime: "25 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module8",
    title: "Module 8: Persian Slang & Humor",
    description: "Speak like a true Tehrani. Learn playful, everyday expressions used with friends and family.",
    emoji: "😎",
    lessonCount: 3,
    estimatedTime: "30 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module9",
    title: "Module 9: Shopping, Prices & Bargaining",
    description: "Ask how much, negotiate prices, and describe items by size, color, and quality.",
    emoji: "🛍️",
    lessonCount: 3,
    estimatedTime: "25 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module10",
    title: "Module 10: Celebrations & Holidays",
    description: "Join the fun. Learn phrases for Nowruz, Yalda, birthdays, weddings, and other cultural events.",
    emoji: "🎉",
    lessonCount: 3,
    estimatedTime: "30 minutes",
    available: false,
    lessons: []
  },
  {
    id: "module11",
    title: "Module 11: Story Mode – A Day in Tehran",
    description: "Practice what you've learned in an interactive choose-your-path story through real-life situations.",
    emoji: "📚",
    lessonCount: 4,
    estimatedTime: "45 minutes",
    available: false,
    lessons: []
  }
];

// Helper functions to access curriculum data
export function getModules(): Module[] {
  return curriculumData;
}

export function getModule(moduleId: string): Module | undefined {
  return curriculumData.find(m => m.id === moduleId);
}

export function getLesson(moduleId: string, lessonId: string) {
  const module = getModule(moduleId);
  if (!module) return undefined;
  return module.lessons.find(l => l.id === lessonId);
}

export function getLessonSteps(moduleId: string, lessonId: string): LessonStep[] {
  const lesson = getLesson(moduleId, lessonId);
  return lesson?.steps || [];
}

// Get flashcard data for a specific lesson
export function getFlashcards(moduleId: string, lessonId: string) {
  const steps = getLessonSteps(moduleId, lessonId);
  return steps
    .filter(step => step.type === 'flashcard')
    .map(step => (step.type === 'flashcard' ? step.data : null))
    .filter(Boolean);
}

// Get vocabulary for a specific lesson
export function getLessonVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
  const lesson = getLesson(moduleId, lessonId);
  return lesson?.vocabulary || [];
} 