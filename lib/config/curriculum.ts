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
            en: "How Are You?",
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
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "chetori",
              distractors: ["salam", "khosh_amadid", "khodafez"]
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "khosh_amadid"]
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
              title: "Your First Conversation",
              successMessage: "You're a natural—you made a great impression!",
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
            en: "I'm Good",
            fa: "خوبم",
            finglish: "Khoobam",
            phonetic: "khoo-BAHM",
            lessonId: "module1-lesson2"
          },
          {
            id: "merci",
            en: "Thank You",
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete the greeting pattern: Salam, ___ (Hello, How are you?)",
              options: ["Chetori", "Khoobam", "Merci", "Baleh"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you respond to 'Chetori?' (How are you?)",
              options: ["Khoobam", "Salam", "Chetori", "Baleh"],
              correct: 0
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
              vocabularyId: "na"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'Khodafez' mean?",
              options: ["Goodbye", "Hello", "Thank you", "Yes"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'No, thank you' in Persian?",
              options: ["Na, merci", "Baleh, merci", "Salam, merci", "Khoobam, merci"],
              correct: 0
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'I'm good, thank you' in Persian?",
              options: ["Khoobam, merci", "Salam, merci", "Baleh, merci", "Na, merci"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Baleh", slotId: "slot1" },
                { id: "word2", text: "Na", slotId: "slot2" }
              ],
              slots: [
                { id: "slot1", text: "Yes" },
                { id: "slot2", text: "No" },
                { id: "slot3", text: "Maybe" },
                { id: "slot4", text: "Hello" }
              ]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Khosh Amadid", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" },
                { id: "word3", text: "Khodafez", slotId: "slot3" },
                { id: "word4", text: "Baleh", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Welcome" },
                { id: "slot2", text: "How are you?" },
                { id: "slot3", text: "Goodbye" },
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
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "chetori", "khoobam", "merci", "khodafez"],
              title: "Your Polite Conversation",
              successMessage: "Perfect! You handled that polite conversation beautifully!",
              incorrectMessage: "Almost there—let's practice that conversation flow again!"
            }
          }
        ]
      },
      {
        id: "lesson3",
        title: "Basic Pronouns and Question Words",
        description: "Master essential pronouns (I, You) and question words (What, Name)",
        emoji: "🧑‍💼",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci"],
        vocabulary: [
          {
            id: "man",
            en: "I / Me",
            fa: "من",
            finglish: "Man",
            phonetic: "man",
            lessonId: "module1-lesson3"
          },
          {
            id: "shoma",
            en: "You",
            fa: "شما",
            finglish: "Shoma",
            phonetic: "sho-MAH",
            lessonId: "module1-lesson3"
          },
          {
            id: "esm",
            en: "Name",
            fa: "اسم",
            finglish: "Esm",
            phonetic: "esm",
            lessonId: "module1-lesson3"
          },
          {
            id: "chi",
            en: "What",
            fa: "چی",
            finglish: "Chi",
            phonetic: "chee",
            lessonId: "module1-lesson3"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Basic Pronouns & Question Words",
            description: "Learn essential pronouns and question words that form the foundation of Persian conversation.",
            points: 0,
            data: {
              objectives: [
                "Learn basic pronouns: I/Me and You",
                "Use 'Name' and 'What' in conversations",
                "Build simple sentences with basic words",
                "Practice combining pronouns with greetings"
              ],
              lessonType: "introductions"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "man"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "esm"
            }
          },
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "ezafe-connector"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Esm", slotId: "slot1" },
                { id: "word2", text: "Man", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" },
                { id: "word4", text: "Khodafez", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Name" },
                { id: "slot2", text: "I / Me" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "Goodbye" }
              ]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "chi"
            }
          },
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "verb-contraction"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete: Esme ___ Sara-ye (My name is Sara)",
              options: ["man", "shoma", "chi", "esm"],
              correct: 0
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "shoma"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "What is 'name' in Farsi?",
              answer: "esm"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'Shoma' mean?",
              options: ["You", "I / Me", "Name", "What"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'my name' in Farsi?",
              options: ["esme man", "man esm", "shoma esm", "esm chi"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you ask 'What is your name?' in Persian?",
              options: ["Esme shoma chiye?", "Esm shoma?", "Chi shoma?", "Shoma chi?"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'Salam' mean? (Review from Lesson 1)",
              options: ["Hello", "Goodbye", "Thank you", "How are you"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete the introduction: Salam, esme man Sara-ye. ___?",
              options: ["Esme shoma chiye?", "Chetori?", "Merci", "Khodafez"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type how you ask 'What is it?' in Persian",
              answer: "chiye"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Man", slotId: "slot1" },
                { id: "word2", text: "Shoma", slotId: "slot2" },
                { id: "word3", text: "Chi", slotId: "slot3" },
                { id: "word4", text: "Salam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "I / Me" },
                { id: "slot2", text: "You" },
                { id: "slot3", text: "What" },
                { id: "slot4", text: "Hello" }
              ]
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "esme", text: "Esme", translation: "Name of" },
                { id: "man", text: "Man", translation: "I / Me" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "chiye", text: "Chiye", translation: "What is it?" }
              ],
              targetWords: ["salam", "esme", "man", "shoma", "chiye"],
              title: "Your Perfect Introduction",
              successMessage: "Incredible! You can now have complete, polite conversations!",
              incorrectMessage: "Almost there—let's practice that introduction conversation again!"
            }
          }
        ]
      },
      {
        id: "lesson4",
        title: "Complete Conversations & Meeting People",
        description: "Put it all together! Practice full conversations and learn to end introductions politely",
        emoji: "💬",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "esm", "chi"],
        vocabulary: [
          {
            id: "khoshbakhtam",
            en: "Nice to Meet You",
            fa: "خوشبختم",
            finglish: "Khoshbakhtam",
            phonetic: "khosh-BAHKH-tam",
            lessonId: "module1-lesson4"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Complete Conversations & Meeting People",
            description: "Master full conversations by combining everything you've learned with one essential new phrase.",
            points: 0,
            data: {
              objectives: [
                "Complete full introduction conversations",
                "Review all vocabulary from lessons 1-3",
                "Learn to end conversations politely",
                "Practice natural conversation flow"
              ],
              lessonType: "conversations"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoshbakhtam"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "After someone tells you their name, what should you say?",
              options: ["Khoshbakhtam", "Chetori", "Merci", "Khodafez"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" },
                { id: "word3", text: "Khoobam", slotId: "slot3" },
                { id: "word4", text: "Merci", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "How are you?" },
                { id: "slot3", text: "I'm good" },
                { id: "slot4", text: "Thank you" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What's the difference between 'chi' and 'chiye'?",
              options: ["Chi = what, Chiye = what is it", "Chi = who, Chiye = what", "Chi = name, Chiye = question", "No difference"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Man", slotId: "slot1" },
                { id: "word2", text: "Shoma", slotId: "slot2" },
                { id: "word3", text: "Esme", slotId: "slot3" },
                { id: "word4", text: "Chiye", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "I / Me" },
                { id: "slot2", text: "You" },
                { id: "slot3", text: "Name of" },
                { id: "slot4", text: "What is it?" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete the conversation: 'Salam, esme man Sara-ye.' Response: '___'",
              options: ["Khoshbakhtam, esme man Sara-ye", "Chetori", "Merci", "Khodafez"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type a complete introduction: 'My name is [YourName]'",
              answer: "esme man"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you politely ask someone's name?",
              options: ["Esme shoma chiye?", "Chi shoma?", "Shoma chi?", "Man esm?"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Review: How do you respond to 'Chetori?'",
              options: ["Khoobam, merci", "Salam", "Baleh", "Khoshbakhtam"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Baleh", slotId: "slot1" },
                { id: "word2", text: "Na", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" },
                { id: "word4", text: "Khodafez", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Yes" },
                { id: "slot2", text: "No" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "Goodbye" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Put the conversation in order: 1) Salam 2) ? 3) Khoshbakhtam",
              options: ["Esme shoma chiye?", "Chetori?", "Merci", "Khodafez"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type how you ask 'What is your name?' in Persian",
              answer: "esme shoma chiye"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Complete: 'Esme man Sara-ye. ___'",
              options: ["Esme shoma chiye?", "Khoobam", "Baleh", "Na"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Khoshbakhtam", slotId: "slot1" },
                { id: "word2", text: "Esme man", slotId: "slot2" },
                { id: "word3", text: "Chetori", slotId: "slot3" },
                { id: "word4", text: "Khoobam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Nice to meet you" },
                { id: "slot2", text: "My name" },
                { id: "slot3", text: "How are you?" },
                { id: "slot4", text: "I'm good" }
              ]
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "esme", text: "Esme", translation: "Name of" },
                { id: "man", text: "Man", translation: "I / Me" },
                { id: "chiye", text: "Chiye", translation: "What is it?" },
                { id: "khoshbakhtam", text: "Khoshbakhtam", translation: "Nice to meet you" }
              ],
              targetWords: ["salam", "esme", "man", "chiye", "khoshbakhtam"],
              title: "Your Perfect Introduction",
              successMessage: "Incredible! You can now have complete, polite conversations!",
              incorrectMessage: "Almost perfect—let's practice that full conversation one more time!"
            }
          }
        ]
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