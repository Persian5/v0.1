import { Module, LessonStep, VocabularyItem } from "../types";
import { ConversationFlowService } from "../services/conversation-flow-service";

// Define all modules, lessons, and their content
export const curriculumData: Module[] = [
  {
    id: "module1",
    title: "Module 1: Greetings & Politeness",
    description: "Start a conversation the right way. Learn how to say hello, goodbye, thank you, please, and the difference between formal and casual tone.",
    emoji: "👋",
    lessonCount: 5,
    estimatedTime: "25 minutes",
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
              options: ["Hello", "Goodbye", "Thank you", "How are you"],
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
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Salam chetori",
              expectedTranslation: "Hello How are you",
              maxWordBankSize: 10
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
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "How are you?" }
              ]
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
              vocabularyId: "salam",
              distractors: ["chetori", "khosh_amadid", "khodafez"]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'How are you?' in Persian?",
              options: ["Chetori", "Salam", "Khodafez", "Khosh Amadid"],
              correct: 0
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khosh_amadid",
              distractors: ["salam", "chetori", "khodafez"]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "How are you?" },
                { id: "slot3", text: "Welcome" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Salam khosh amadid chetori",
              expectedTranslation: "Hello Welcome How are you",
              maxWordBankSize: 10
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "chetori"],
              expectedTranslation: "Hello How are you"
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'goodbye' in Persian?",
              options: ["Khodafez", "Salam", "Khosh Amadid", "Chetori"],
              correct: 0
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "khosh_amadid", "chetori"],
              expectedTranslation: "Hello Welcome How are you"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Khosh Amadid", slotId: "slot2" },
                { id: "word3", text: "Chetori", slotId: "slot3" },
                { id: "word4", text: "Khodafez", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "Welcome" },
                { id: "slot3", text: "How are you?" },
                { id: "slot4", text: "Goodbye" }
              ]
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "khosh_amadid", text: "Khosh Amadid", translation: "Welcome" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "khosh_amadid", "chetori", "khodafez"],
              conversationFlow: {
                description: "A polite introduction conversation",
                expectedPhrase: "Hello, welcome, how are you, goodbye",
                persianSequence: ["salam", "khosh_amadid", "chetori", "khodafez"]
              },
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
            id: "khoob",
            en: "Good",
            fa: "خوب",
            finglish: "Khoob",
            phonetic: "khoob",
            lessonId: "module1-lesson2"
          },
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
          // PHASE 1: FOUNDATION REVIEW
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
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Chetori", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" },
                { id: "word4", text: "Khodafez", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "How are you?" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "Goodbye" }
              ]
            }
          },
          
          // PHASE 2: INTRODUCE BASE ADJECTIVE - "khoob"
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoob"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'khoob' mean?",
              options: ["Good", "Bad", "Hello", "Thank you"],
              correct: 0
            }
          },
          
          // PHASE 3: INTRODUCE "merci" & YES/NO
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "merci"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "merci",
              distractors: ["salam", "salam", "khodafez"]
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
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "baleh",
              distractors: ["na", "merci", "salam"]
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'No, thank you' in Persian?",
              options: ["Na, merci", "Baleh, merci", "Salam, merci", "Salam"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'Yes' in Persian?",
              answer: "Baleh"
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
          
          // PHASE 4: GRAMMAR CONCEPT - ADJECTIVE SUFFIXES
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "adjective-suffixes"
            }
          },
          
          // PHASE 5: APPLY GRAMMAR - INTRODUCE "khoobam" & "khoobi"
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoobam"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khoobam",
              distractors: ["salam", "chetori", "khodafez"]
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'I'm good' in Persian?",
              options: ["Khoobam", "Salam", "Baleh", "Na"],
              correct: 0
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["khoobam", "merci"]
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
              conversationFlow: {
                description: "A polite conversation",
                expectedPhrase: "Hello, how are you? I'm good, thank you, goodbye",
                persianSequence: ["salam", "chetori", "khoobam", "merci", "khodafez"]
              },
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
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "esm", "chi", "khosh_amadid", "khodafez", "baleh", "na", "esme", "chiye"],
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
            id: "esme",
            en: "Name of",
            fa: "اسمه",
            finglish: "Esme",
            phonetic: "es-MEH",
            lessonId: "module1-lesson3"
          },
          {
            id: "chi",
            en: "What",
            fa: "چی",
            finglish: "Chi",
            phonetic: "chee",
            lessonId: "module1-lesson3"
          },
          {
            id: "chiye",
            en: "What is it?",
            fa: "چیه",
            finglish: "Chiye",
            phonetic: "chee-YEH",
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
          // PHASE 1: INTRODUCE BASIC VOCABULARY FIRST
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
              vocabularyId: "shoma"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Man", slotId: "slot1" },
                { id: "word2", text: "Shoma", slotId: "slot2" }
              ],
              slots: [
                { id: "slot1", text: "I / Me" },
                { id: "slot2", text: "You" },
                { id: "slot3", text: "Name" },
                { id: "slot4", text: "What" }
              ]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "esm"
            }
          },
          // PHASE 2: GRAMMAR CONCEPT - EZAFE CONNECTOR  
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "ezafe-connector"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "man"],
              expectedTranslation: "My name"
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
          // PHASE 3: CHI VOCABULARY AND VERB CONTRACTION
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "chi"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type how you ask 'What' in Persian?",
              answer: "chi"
            }
          },
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "verb-contraction"
            }
          },
          // PHASE 4: AUDIO SEQUENCES WITH SHOMA (NOW PROPERLY INTRODUCED)
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "shoma"],
              expectedTranslation: "Your name"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "chiye",
              distractors: ["esme", "chi", "shoma"]
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
          // PHASE 5: QUIZ SECTION
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
              options: ["Esme shoma chiye?", "Esme man chiye?", "Chi shoma?", "Shoma chi?"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'Salam' mean?",
              options: ["Hello", "Goodbye", "Thank you", "How are you"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'my name is Sara, thank you' in Persian?",
              options: ["Esme man Sara-e, merci", "Esme shoma Sara-e, merci", "Man esm Sara-e, merci", "Shoma esm Sara-e, merci"],
              correct: 0
            }
          },
          // PHASE 6: REVIEW AUDIO SEQUENCE (KEEPING BOTH AS REQUESTED)
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "man", "chiye"],
              expectedTranslation: "What is my name",
              targetWordCount: 4
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
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "esme", text: "Esme", translation: "Name of" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "chiye", text: "Chiye", translation: "What is it?" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "esme", "shoma", "chiye", "merci", "khodafez"],
              conversationFlow: {
                description: "A polite introduction conversation",
                expectedPhrase: "Hello, what is your name, thank you, goodbye",
                persianSequence: ["salam", "esme", "shoma", "chiye", "merci", "khodafez"]
              },
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
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "esm", "chi", "khosh_amadid", "khodafez", "baleh", "na", "esme", "chiye"],
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
          // NEW ORDER: 3) flashcard is now first after welcome intro
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoshbakhtam"
            }
          },
          // 1) matching game of salam khodafez khosh amadid khoobam
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Khodafez", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" },
                { id: "word4", text: "Khoobam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "Goodbye" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "I'm good" }
              ]
            }
          },
          // 2) matching game of esm chi baleh nah merci
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Esm", slotId: "slot1" },
                { id: "word2", text: "Chi", slotId: "slot2" },
                { id: "word3", text: "Baleh", slotId: "slot3" },
                { id: "word4", text: "Na", slotId: "slot4" },
                { id: "word5", text: "Merci", slotId: "slot5" }
              ],
              slots: [
                { id: "slot1", text: "Name" },
                { id: "slot2", text: "What" },
                { id: "slot3", text: "Yes" },
                { id: "slot4", text: "No" },
                { id: "slot5", text: "Thank you" }
              ]
            }
          },
          // NEW: khoshbakhtam audio to english game (between items 3 and 4)
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khoshbakhtam",
              distractors: ["khoobam", "khosh_amadid", "khodafez"]
            }
          },
          // 4) matching game of shoma man chetori khoshbakhtam (now moved to position 5)
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Shoma", slotId: "slot1" },
                { id: "word2", text: "Man", slotId: "slot2" },
                { id: "word3", text: "Chetori", slotId: "slot3" },
                { id: "word4", text: "Khoshbakhtam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "You" },
                { id: "slot2", text: "I / Me" },
                { id: "slot3", text: "How are you?" },
                { id: "slot4", text: "Nice to meet you" }
              ]
            }
          },
          // 5) matching game of esme chiye esm chi (now moved to position 6)
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Esme", slotId: "slot1" },
                { id: "word2", text: "Chiye", slotId: "slot2" },
                { id: "word3", text: "Esm", slotId: "slot3" },
                { id: "word4", text: "Chi", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Name of" },
                { id: "slot2", text: "What is it?" },
                { id: "slot3", text: "Name" },
                { id: "slot4", text: "What" }
              ]
            }
          },
          // 6) audio to sequence of salam, khosh amadid, chetori (now moved to position 7)
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "khosh_amadid", "chetori"]
            }
          },
          // 7) audio to sequence of esme shoma chiye? khoshbakhtam (now moved to position 8)
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "shoma", "chiye", "khoshbakhtam"],
              expectedTranslation: "What is your name nice to meet you",
              targetWordCount: 5,
              maxWordBankSize: 6
            }
          },
          // 8) audio to sequence of na merci, khoobam
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["na", "merci", "khoobam"]
            }
          },
          // 9) audio to sequence of khosh amadid, khodafez
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["khosh_amadid", "khodafez"]
            }
          },
          // 10) multiple choice of what does esme man mean
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'esme man' mean?",
              options: ["My name", "Your name", "What name", "Name is"],
              correct: 0
            }
          },
          // 11) multiple choice of how do you say yes in persian
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'Yes' in Persian?",
              options: ["Baleh", "Na", "Chi", "Merci"],
              correct: 0
            }
          },
          // 12) multiple choice of how do you say welcome
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'Welcome' in Persian?",
              options: ["Khosh Amadid", "Khoshbakhtam", "Khoobam", "Khodafez"],
              correct: 0
            }
          },
          // 13) multiple choice of how do you say what
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'What' in Persian?",
              options: ["Chi", "Chiye", "Esm", "Man"],
              correct: 0
            }
          },
          // 14) audio to english of khosh amadid
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khosh_amadid",
              distractors: ["salam", "khodafez", "khoshbakhtam"]
            }
          },
          // 15) audio to english of esm
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "esm",
              distractors: ["esme", "chi", "man"]
            }
          },
          // 16) audio to english of what is it
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "chiye",
              distractors: ["chi", "esme", "shoma"]
            }
          },
          // 17) audio to english of esme man sequence
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "man"],
              expectedTranslation: "My name"
            }
          },
          // 18) audio to english of na
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "na",
              distractors: ["baleh", "merci", "chi"]
            }
          },
          // 19) audio to english of chetori
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "chetori",
              distractors: ["salam", "khoobam", "khodafez"]
            }
          },
          // 20) audio to english of shoma
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "shoma",
              distractors: ["man", "esm", "chi"]
            }
          },
          // 21) final challenge organize the sentence Hello, what is your name? How Are you? Im good, thank you. goodbye
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "esme", text: "Esme", translation: "Name of" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "chiye", text: "Chiye", translation: "What is it?" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "khoobam", text: "Khoobam", translation: "I'm good" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "esme", "shoma", "chiye", "chetori", "khoobam", "merci", "khodafez"],
              conversationFlow: {
                description: "A complete polite conversation",
                expectedPhrase: "Hello, what is your name? How are you? I'm good, thank you. Goodbye",
                persianSequence: ["salam", "esme", "shoma", "chiye", "chetori", "khoobam", "merci", "khodafez"]
              },
              title: "Your Perfect Introduction",
              successMessage: "Amazing! You can now have full, natural conversations in Persian!",
              incorrectMessage: "Almost perfect—let's practice that conversation flow one more time!"
            }
          }
        ]
      },
      {
        id: "lesson5",
        title: "Story Mode: Meeting Someone New",
        description: "Practice your greetings in a real conversation with Sara at a friend's house",
        emoji: "🗣️",
        locked: false,
        isStoryLesson: true,
        vocabulary: [], // Uses vocabulary from previous lessons
        steps: [
          {
            type: "story-conversation",
            points: 0, // XP awarded per-choice, not at completion
            data: {
              storyId: "module1-story",
              title: "Meeting Someone New",
              description: "Practice a real conversation using all your greeting skills",
              setting: "You're walking down the street when someone new approaches you",
              characterName: "Sara",
              characterEmoji: "👩",
              requiresPersonalization: true,
              exchanges: [
                {
                  id: "exchange1",
                  initiator: "user",
                  characterMessage: "",
                  choices: [
                    {
                      id: "choice1a",
                      text: "Salam",
                      vocabularyUsed: ["salam"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Salam! Chetori?"
                    },
                    {
                      id: "choice1b", 
                      text: "Salam, khosh amadid",
                      vocabularyUsed: ["salam", "khosh_amadid"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                },
                {
                  id: "exchange2",
                  initiator: "character",
                  characterMessage: "Salam! Chetori?",
                  choices: [
                    {
                      id: "choice2a",
                      text: "Baleh",
                      vocabularyUsed: ["baleh"],
                      isCorrect: false,
                      points: 0
                    },
                    {
                      id: "choice2b",
                      text: "Khoobam, merci!",
                      vocabularyUsed: ["khoobam", "merci"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: ""
                    },
                    {
                      id: "choice2c",
                      text: "Esme man {name}-e?",
                      vocabularyUsed: ["esme_man"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                },
                {
                  id: "exchange3",
                  initiator: "user",
                  characterMessage: "",
                  choices: [
                    {
                      id: "choice3a",
                      text: "Shoma chetori?",
                      vocabularyUsed: ["shoma", "chetori"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Khoobam, merci! Esme shoma chiye?"
                    },
                    {
                      id: "choice3b",
                      text: "Salam chetori?", 
                      vocabularyUsed: ["salam", "chetori"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                },
                {
                  id: "exchange4",
                  initiator: "character",
                  characterMessage: "Khoobam, merci! Esme shoma chiye?",
                  choices: [
                    {
                      id: "choice4a",
                      text: "Esme man {name}-e",
                      vocabularyUsed: ["esme_man"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: ""
                    },
                    {
                      id: "choice4b",
                      text: "Esme shoma {name}-e",
                      vocabularyUsed: ["esme_shoma"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                },
                {
                  id: "exchange5",
                  initiator: "user",
                  characterMessage: "",
                  choices: [
                    {
                      id: "choice5a",
                      text: "Esme shoma chiye?",
                      vocabularyUsed: ["esme_shoma", "chiye"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Esme man Sara-e"
                    },
                    {
                      id: "choice5b",
                      text: "Esme man chiye?",
                      vocabularyUsed: ["esme_man", "chiye"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                },
                {
                  id: "exchange6",
                  initiator: "character",
                  characterMessage: "Esme man Sara-e",
                  choices: [
                    {
                      id: "choice6a",
                      text: "Khoshbakhtam Sara",
                      vocabularyUsed: ["khoshbakhtam"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Khoshbakhtam {name}!"
                    },
                    {
                      id: "choice6b",
                      text: "Khoshbakhtam",
                      vocabularyUsed: ["khoshbakhtam"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Khoshbakhtam {name}!"
                    }
                  ]
                },
                {
                  id: "exchange7",
                  initiator: "user",
                  characterMessage: "",
                  choices: [
                    {
                      id: "choice7a",
                      text: "Khodafez Sara",
                      vocabularyUsed: ["khodafez"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Khodafez {name}!"
                    },
                    {
                      id: "choice7b",
                      text: "Salam Sara",
                      vocabularyUsed: ["salam"],
                      isCorrect: false,
                      points: 0
                    },
                    {
                      id: "choice7c",
                      text: "Baleh Sara",
                      vocabularyUsed: ["baleh"],
                      isCorrect: false,
                      points: 0
                    },
                    {
                      id: "choice7d",
                      text: "Na Sara",
                      vocabularyUsed: ["na"],
                      isCorrect: false,
                      points: 0
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "module2",
    title: "Module 2: Responses & Feelings",
    description: "Learn to express how you feel and respond naturally. Master essential phrases for describing your state and using intensifiers.",
    emoji: "😊",
    lessonCount: 7,
    estimatedTime: "120 minutes",
    available: true,
    requiresPremium: true,
    lessons: [
      {
        id: "lesson1",
        title: "Adjective Suffixes \"–am\" & \"–i\"",
        description: "Learn how to form 'I am...' and 'you are...' with adjectives using suffixes",
        emoji: "📚",
        progress: 0,
        locked: false,
        grammarLesson: true,
        reviewVocabulary: ["salam", "esme", "man", "shoma", "chi", "chiye", "chetori", "khoshbakhtam", "merci", "khoobam", "baleh", "na", "khodafez", "khosh_amadid", "esm"],
        vocabulary: [
          {
            id: "khoob",
            en: "Good",
            fa: "خوب",
            finglish: "Khoob",
            phonetic: "khoob",
            lessonId: "module2-lesson1"
          },
          {
            id: "khoobi",
            en: "You Are Good",
            fa: "خوبی",
            finglish: "Khoob-i",
            phonetic: "khoob-ee",
            lessonId: "module2-lesson1"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Adjective Suffixes \"–am\" & \"–i\"",
            description: "This rule applies only to adjectives, not nouns (we'll do noun possession later). We take the adjective khoob (\"good\") and attach: –am (\"I am …\") → khoob‑am, –i (\"you are …\") → khoob‑i",
            points: 0,
            data: {
              objectives: [
                "Recognize the base adjective khoob",
                "Form khoob‑am and khoob‑i correctly", 
                "Distinguish between \"I am good\" and \"you are good\""
              ],
              lessonType: "grammar"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khoob"
            }
          },
          {
            type: "grammar-concept",
            points: 2,
            data: {
              conceptId: "adjective-suffixes"
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
              vocabularyId: "khoobi"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which form means \"I am good\"?",
              options: ["khoobi", "khoobam", "khoob", "khodafez"],
              correct: 1
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which form means \"you are good\"?",
              options: ["khoobam", "khoob", "khoobi", "merci"],
              correct: 2
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "khoob", slotId: "slot1" },
                { id: "word2", text: "khoobam", slotId: "slot2" },
                { id: "word3", text: "khoobi", slotId: "slot3" }
              ],
              slots: [
                { id: "slot1", text: "good" },
                { id: "slot2", text: "I am good" },
                { id: "slot3", text: "You are good" },
                { id: "slot4", text: "Very good" }
              ]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "-am", slotId: "slot1" },
                { id: "word2", text: "-i", slotId: "slot2" }
              ],
              slots: [
                { id: "slot1", text: "I am" },
                { id: "slot2", text: "You are" },
                { id: "slot3", text: "Good" },
                { id: "slot4", text: "Hello" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian (phonetic) for 'I am good.'",
              answer: "khoob-am"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian (phonetic) for 'you are good.'",
              answer: "khoob-i"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man khoob-am",
              expectedTranslation: "I am good"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "khoobi?",
              expectedTranslation: "are you good?"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "chetori", text: "Chetori", translation: "How are you" },
                { id: "khoobam", text: "khoobam", translation: "I am good" },
                { id: "khoobi", text: "khoobi", translation: "Are you good" }
              ],
              targetWords: ["salam", "chetori", "khoobam", "khoobi"],
              conversationFlow: {
                description: "A conversation with adjective suffixes",
                expectedPhrase: "Hello, how are you? I am good, are you good?",
                persianSequence: ["salam", "chetori", "khoobam", "khoobi"]
              },
              title: "Grammar Practice",
              successMessage: "Excellent! You understand adjective suffixes!",
              incorrectMessage: "Almost there—let's practice that suffix pattern again!"
            }
          }
        ]
      },
      {
        id: "lesson2",
        title: "Basic Responses Continued",
        description: "Learn to use 'is' and 'is not' with Persian verb roots and build complex responses",
        emoji: "🌍",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "esme", "man", "shoma", "chetori", "merci", "khodafez", "khoob", "khoobam", "khoobi"],
        vocabulary: [
          {
            id: "hast",
            en: "Is",
            fa: "هست",
            finglish: "Hast",
            phonetic: "hast",
            lessonId: "module2-lesson2"
          },
          {
            id: "neest",
            en: "Is Not",
            fa: "نیست",
            finglish: "Neest",
            phonetic: "neest",
            lessonId: "module2-lesson2"
          },
          {
            id: "hastam",
            en: "I Am",
            fa: "هستم",
            finglish: "Hastam",
            phonetic: "has-TAM",
            lessonId: "module2-lesson2"
          },
          {
            id: "neestam",
            en: "I Am Not",
            fa: "نیستم",
            finglish: "Neestam",
            phonetic: "nees-TAM",
            lessonId: "module2-lesson2"
          },
          {
            id: "neesti",
            en: "You Are Not",
            fa: "نیستی",
            finglish: "Neesti",
            phonetic: "nees-TEE",
            lessonId: "module2-lesson2"
          },
          {
            id: "hasti",
            en: "You Are",
            fa: "هستی",
            finglish: "Hasti",
            phonetic: "has-TEE",
            lessonId: "module2-lesson2"
          },
          {
            id: "kheily",
            en: "Very",
            fa: "خیلی",
            finglish: "Kheily",
            phonetic: "khay-LEE",
            lessonId: "module2-lesson2"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Basic Responses Continued",
            description: "Learn to use Persian verb roots 'hast' (is) and 'neest' (is not) with the suffix patterns you already know.",
            points: 0,
            data: {
              objectives: [
                "Learn the verb roots 'hast' and 'neest'",
                "Apply suffix patterns to create 'I am', 'you are not', etc.",
                "Build complex responses using these new forms",
                "Practice natural Persian conversation patterns"
              ],
              lessonType: "responses"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "hast"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "neest"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which root means 'is not'?",
              options: ["hast", "neest", "khoob", "esm"],
              correct: 1
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'you are not' using the neest root?",
              answer: "neest-i"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'I am' using the hast root?",
              answer: "hast-am"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "hastam", slotId: "slot1" },
                { id: "word2", text: "neestam", slotId: "slot2" },
                { id: "word3", text: "neesti", slotId: "slot3" },
                { id: "word4", text: "hasti", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "I am" },
                { id: "slot2", text: "I am not" },
                { id: "slot3", text: "You are not" },
                { id: "slot4", text: "You are" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'I am not'?",
              answer: "neest-am"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "kheily"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man kheily khoob hastam",
              expectedTranslation: "I am very good"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "khoob neestam",
              expectedTranslation: "I am not good"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "kheily",
              distractors: ["khoob", "hast", "neest"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme man James neest",
              expectedTranslation: "My name is not James"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "baleh", slotId: "slot1" },
                { id: "word2", text: "man", slotId: "slot2" },
                { id: "word3", text: "khodafez", slotId: "slot3" },
                { id: "word4", text: "khoshbakhtam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Yes" },
                { id: "slot2", text: "I / Me" },
                { id: "slot3", text: "Goodbye" },
                { id: "slot4", text: "Nice to meet you" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man James hastam",
              expectedTranslation: "I am James"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "man", text: "Man", translation: "I" },
                { id: "kheily", text: "Kheily", translation: "Very" },
                { id: "khoob", text: "Khoob", translation: "Good" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "chetori", "man", "kheily", "khoob", "hastam", "merci", "khodafez"],
              title: "Complete Conversation Practice",
              successMessage: "Excellent! You can now express complex states and responses!",
              incorrectMessage: "Almost there—let's practice that conversation flow again!",
              conversationFlow: {
                description: "A complete conversation with complex responses",
                expectedPhrase: "Hello, how are you? I am very good, thank you, goodbye",
                persianSequence: ["salam", "chetori", "man", "kheily", "khoob", "hastam", "merci", "khodafez"]
              }
            }
          }
        ]
      },
      {
        id: "lesson3",
        title: "Saying Where You Are From",
        description: "Learn how to ask and tell where you are from using 'koja' (where) and 'ahle' (from/belonging to)",
        emoji: "🌍",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "baleh", "hasti"],
        vocabulary: [
          {
            id: "koja",
            en: "Where",
            fa: "کجا",
            finglish: "Koja",
            phonetic: "ko-JAH",
            lessonId: "module2-lesson3"
          },
          {
            id: "ahle",
            en: "From",
            fa: "اهل",
            finglish: "Ahle",
            phonetic: "ah-LEH",
            lessonId: "module2-lesson3"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Saying Where You Are From",
            description: "Learn how to ask and tell where you are from using essential location vocabulary.",
            points: 0,
            data: {
              objectives: [
                "Learn 'koja' (where) to ask about location",
                "Learn 'ahle' (from/belonging to) for origin",
                "Ask 'where are you from?' in Persian",
                "Say 'I am from Iran' confidently"
              ],
              lessonType: "location"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "koja"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'where'?",
              options: ["Koja", "Merci", "Khoobam", "Hasti"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "koja hasti?",
              expectedTranslation: "where are you"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "ahle"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian word for 'where'",
              answer: "koja"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "ahle",
              distractors: ["koja", "hasti", "iran"]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Koja", slotId: "slot1" },
                { id: "word2", text: "Merci", slotId: "slot2" },
                { id: "word3", text: "Chetori", slotId: "slot3" },
                { id: "word4", text: "Baleh", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Where" },
                { id: "slot2", text: "Thank you" },
                { id: "slot3", text: "How are you" },
                { id: "slot4", text: "Yes" }
              ]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Ahle", slotId: "slot1" },
                { id: "word2", text: "Koja", slotId: "slot2" },
                { id: "word3", text: "Hasti", slotId: "slot3" },
                { id: "word4", text: "Shoma", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "From" },
                { id: "slot2", text: "Where" },
                { id: "slot3", text: "You are" },
                { id: "slot4", text: "You" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man khoobam shoma chi",
              expectedTranslation: "I am good what about you"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma ahle koja hasti",
              expectedTranslation: "where are you from"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man ahle Iran hastam",
              expectedTranslation: "I am from Iran"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["shoma", "ahle", "koja", "hasti"],
              expectedTranslation: "where are you from"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "ahle_1", text: "Ahle", translation: "From" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "hasti", text: "Hasti", translation: "You are" },
                { id: "man", text: "Man", translation: "I" },
                { id: "ahle_2", text: "Ahle", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" }
              ],
              targetWords: ["shoma", "ahle_1", "koja", "hasti", "man", "ahle_2", "iran", "hastam"],
              title: "Where Are You From?",
              successMessage: "Excellent! You can now ask and answer where someone is from!",
              incorrectMessage: "Almost there—let's practice that location conversation again!",
              conversationFlow: {
                description: "A complete conversation about origins",
                expectedPhrase: "where are you from? I am from Iran",
                persianSequence: ["shoma", "ahle_1", "koja", "hasti", "man", "ahle_2", "iran", "hastam"]
              }
            }
          }
        ]
      },
      {
        id: "lesson4",
        title: "Where I Live",
        description: "Learn to ask and say where you live, combining location words with action verbs",
        emoji: "🏠",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "koja", "ahle", "man", "shoma", "khoobam"],
        vocabulary: [
          {
            id: "zendegi",
            en: "Life",
            fa: "",
            finglish: "Zendegi",
            phonetic: "zen-deh-GEE",
            lessonId: "module2-lesson4"
          },
          {
            id: "mikonam",
            en: "I do",
            fa: "",
            finglish: "Mikonam",
            phonetic: "MEE-ko-nam",
            lessonId: "module2-lesson4"
          },
          {
            id: "mikoni",
            en: "You do",
            fa: "",
            finglish: "Mikoni",
            phonetic: "MEE-kon-ee",
            lessonId: "module2-lesson4"
          },
          {
            id: "dar",
            en: "In",
            fa: "",
            finglish: "Dar",
            phonetic: "dahr",
            lessonId: "module2-lesson4"
          },
          {
            id: "amrika",
            en: "America",
            fa: "",
            finglish: "Amrika",
            phonetic: "uhm-ree-ka",
            lessonId: "module2-lesson4"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Where I Live",
            description: "Learn to ask and say where you live, building on location vocabulary with action verbs.",
            points: 0,
            data: {
              objectives: [
                "Learn 'zendegi' (life) for living and residence",
                "Learn 'mikonam' (I do) and 'mikoni' (you do)",
                "Ask 'where do you live?' vs 'where are you from?'",
                "Say 'I live in America' confidently"
              ],
              lessonType: "location"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "zendegi"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "mikonam"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "amrika"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'life'?",
              options: ["Zendegi", "Koja", "Ahle", "Mikonam"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'I do'?",
              options: ["Mikonam", "Hastam", "Neestam", "Zendegi"],
              correct: 0
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "mikoni"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "dar"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word connects location phrases (like 'in America')?",
              options: ["Dar", "Koja", "Ahle", "Zendegi"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What suffix makes 'you do' from the root 'mikon'?",
              options: ["-i", "-am", "-ast", "-im"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'I do' using the mikon root?",
              answer: "mikon-am"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'you do' using the mikon root?",
              answer: "mikon-i"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man dar amrika zendegi mikonam",
              expectedTranslation: "I live in America"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Zendegi", slotId: "slot1" },
                { id: "word2", text: "Mikonam", slotId: "slot2" },
                { id: "word3", text: "Mikoni", slotId: "slot3" },
                { id: "word4", text: "Dar", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Life" },
                { id: "slot2", text: "I do" },
                { id: "slot3", text: "You do" },
                { id: "slot4", text: "In" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma koja zendegi mikoni",
              expectedTranslation: "where do you live"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "zendegi_1", text: "Zendegi", translation: "Life/Live" },
                { id: "mikoni", text: "Mikoni", translation: "You do" },
                { id: "man", text: "Man", translation: "I" },
                { id: "dar", text: "Dar", translation: "In" },
                { id: "amrika", text: "Amrika", translation: "America" },
                { id: "zendegi_2", text: "Zendegi", translation: "Life/Live" },
                { id: "mikonam", text: "Mikonam", translation: "I do" }
              ],
              targetWords: ["salam", "shoma", "koja", "zendegi_1", "mikoni", "man", "dar", "amrika", "zendegi_2", "mikonam"],
              title: "Where Do You Live?",
              successMessage: "Perfect! You can now ask and say where you live!",
              incorrectMessage: "Almost there—let's practice that residence phrase again!",
              conversationFlow: {
                description: "A complete phrase about where you live",
                expectedPhrase: "Hello, where do you live? I live in America.",
                persianSequence: ["salam", "shoma", "koja", "zendegi_1", "mikoni", "man", "dar", "amrika", "zendegi_2", "mikonam"]
              }
            }
          }
        ]
      },
      {
        id: "lesson5",
        title: "Connect Ideas Naturally",
        description: "Learn to connect ideas with 'and', 'also', and 'but' to sound natural and fluent",
        emoji: "🔗",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "esm", "baleh", "na", "khoob", "hast", "neest", "hastam", "hasti", "kheily", "koja", "ahle", "dar", "zendegi", "mikonam", "mikoni", "iran", "amrika", "khoshbakhtam", "chiye"],
        vocabulary: [
          {
            id: "va",
            en: "And",
            fa: "و",
            finglish: "Va",
            phonetic: "vah",
            lessonId: "module2-lesson5"
          },
          {
            id: "ham",
            en: "Also",
            fa: "هم",
            finglish: "Ham",
            phonetic: "hahm",
            lessonId: "module2-lesson5"
          },
          {
            id: "vali",
            en: "But",
            fa: "ولی",
            finglish: "Vali",
            phonetic: "vah-LEE",
            lessonId: "module2-lesson5"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Connectors: va, ham, vali",
            description: "Learn to connect ideas and sound more natural in conversation.",
            points: 0,
            data: {
              objectives: [
                "Join words with va (and)",
                "Say 'also' with ham",
                "Contrast ideas with vali (but)",
                "Build longer, natural sentences"
              ],
              lessonType: "vocabulary"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "va"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "ham"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "vali"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Va", slotId: "slot1" },
                { id: "word2", text: "Ham", slotId: "slot2" },
                { id: "word3", text: "Vali", slotId: "slot3" }
              ],
              slots: [
                { id: "slot1", text: "And" },
                { id: "slot2", text: "Also" },
                { id: "slot3", text: "But" }
              ]
            }
          },
          {
            type: "grammar-concept",
            points: 0,
            data: {
              conceptId: "connectors-placement"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which connector belongs here: Iran ___ Amrika?",
              options: ["va", "ham", "vali", "dar"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man khoobam vali khoob neestam",
              expectedTranslation: "I am good but not good"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "If someone says 'man khoobam' and you want to say 'me too', which word goes here: man ___ khoobam?",
              options: ["ham", "va", "vali", "kheily"],
              correct: 0
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "koja",
              distractors: ["va", "ham", "dar"]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Shoma", slotId: "slot1" },
                { id: "word2", text: "Koja", slotId: "slot2" },
                { id: "word3", text: "Dar", slotId: "slot3" },
                { id: "word4", text: "Hastam", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "You" },
                { id: "slot2", text: "Where" },
                { id: "slot3", text: "In" },
                { id: "slot4", text: "I am" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'in'?",
              options: ["Dar", "Koja", "Ahle", "Ham"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man ham khoobam",
              expectedTranslation: "I am good too"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man dar amrika zendegi mikonam",
              expectedTranslation: "I live in America"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'how are you'?",
              options: ["Chetori", "Khoobam", "Khoshbakhtam", "Chiye"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Va", slotId: "slot1" },
                { id: "word2", text: "Vali", slotId: "slot2" },
                { id: "word3", text: "Zendegi", slotId: "slot3" },
                { id: "word4", text: "Ham", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "And" },
                { id: "slot2", text: "But" },
                { id: "slot3", text: "Life" },
                { id: "slot4", text: "Also" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man ahle iran hastam vali dar amrika zendegi mikonam",
              expectedTranslation: "I am from Iran but I live in America"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "man", text: "Man", translation: "I" },
                { id: "ahle", text: "Ahle", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "vali", text: "Vali", translation: "But" },
                { id: "dar", text: "Dar", translation: "In" },
                { id: "amrika", text: "Amrika", translation: "America" },
                { id: "zendegi", text: "Zendegi", translation: "Live" },
                { id: "mikonam", text: "Mikonam", translation: "I do" }
              ],
              targetWords: ["man", "ahle", "iran", "hastam", "vali", "dar", "amrika", "zendegi", "mikonam"],
              title: "Say It Naturally",
              successMessage: "Perfect! You connected ideas naturally!",
              incorrectMessage: "Almost—watch where vali goes for contrast!",
              conversationFlow: {
                description: "Express origin and residence with contrast",
                expectedPhrase: "I am from Iran but I live in America",
                persianSequence: ["man", "ahle", "iran", "hastam", "vali", "dar", "amrika", "zendegi", "mikonam"]
              }
            }
          }
        ]
      },
      {
        id: "lesson6",
        title: "Module 2 Review: Put It All Together",
        description: "Practice everything you've learned with mixed exercises reviewing all Module 2 vocabulary and phrases",
        emoji: "🔄",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "khodafez", "baleh", "na", "man", "shoma", "khoob", "hastam", "hasti", "neestam", "neesti", "kheily", "va", "ham", "vali", "ahle", "koja", "dar", "zendegi", "mikonam", "mikoni", "iran", "amrika", "esme", "chiye", "khoshbakhtam"],
        vocabulary: [],
        steps: [
          {
            type: "welcome",
            title: "Module 2 Review: Put It All Together",
            description: "Time to practice everything you've learned! This lesson reviews all vocabulary and phrases from Module 2.",
            points: 0,
            data: {
              objectives: [
                "Review all Module 2 vocabulary",
                "Practice connectors (va, ham, vali)",
                "Build complete conversations",
                "Master greetings through goodbyes"
              ],
              lessonType: "review"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Baleh", slotId: "slot1" },
                { id: "word2", text: "Na", slotId: "slot2" },
                { id: "word3", text: "Merci", slotId: "slot3" },
                { id: "word4", text: "Kheily", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "Yes" },
                { id: "slot2", text: "No" },
                { id: "slot3", text: "Thank you" },
                { id: "slot4", text: "Very" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'and'?",
              options: ["Va", "Vali", "Ham", "Dar"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'but'?",
              options: ["Vali", "Va", "Ham", "Koja"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'also'?",
              options: ["Ham", "Va", "Vali", "Kheily"],
              correct: 0
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "chetori", "man", "khoobam", "merci", "khodafez"],
              expectedTranslation: "hello how are you I am good thank you goodbye"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Your friend says 'man khoobam', you feel the same. What do you reply?",
              options: ["man ham khoobam", "vali man neestam", "man ham khoob neestam", "man va khoobam"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man kheily khoob hastam shoma chi",
              expectedTranslation: "I am very good what about you"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma koja zendegi mikoni",
              expectedTranslation: "where do you live"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Hastam", slotId: "slot1" },
                { id: "word2", text: "Hasti", slotId: "slot2" },
                { id: "word3", text: "Neestam", slotId: "slot3" },
                { id: "word4", text: "Neesti", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "I am" },
                { id: "slot2", text: "You are" },
                { id: "slot3", text: "I am not" },
                { id: "slot4", text: "You are not" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian (phonetic) for 'you'",
              answer: "shoma"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma ahle koja hasti",
              expectedTranslation: "where are you from"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["man", "dar", "amrika", "zendegi", "mikonam"],
              expectedTranslation: "I live in America"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Ahle", slotId: "slot1" },
                { id: "word2", text: "Koja", slotId: "slot2" },
                { id: "word3", text: "Zendegi", slotId: "slot3" },
                { id: "word4", text: "Dar", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "From" },
                { id: "slot2", text: "Where" },
                { id: "slot3", text: "Life" },
                { id: "slot4", text: "In" }
              ]
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "shoma", "chiye"],
              expectedTranslation: "what is your name"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme man Bob-e khoshbakhtam",
              expectedTranslation: "my name is Bob nice to meet you"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Khoob", slotId: "slot1" },
                { id: "word2", text: "Khoobam", slotId: "slot2" },
                { id: "word3", text: "Khoobi", slotId: "slot3" }
              ],
              slots: [
                { id: "slot1", text: "Good" },
                { id: "slot2", text: "I am good" },
                { id: "slot3", text: "You are good" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'welcome'?",
              options: ["Khosh amadid", "Khoshbakhtam", "Khodafez", "Chetori"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Hastam", slotId: "slot1" },
                { id: "word2", text: "Mikonam", slotId: "slot2" },
                { id: "word3", text: "Neestam", slotId: "slot3" }
              ],
              slots: [
                { id: "slot1", text: "I am" },
                { id: "slot2", text: "I do" },
                { id: "slot3", text: "I am not" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type the Persian (phonetic) for 'also'",
              answer: "ham"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "salam", text: "Salam", translation: "Hello" },
                { id: "chetori", text: "Chetori", translation: "How are you" },
                { id: "man_1", text: "Man", translation: "I" },
                { id: "kheily", text: "Kheily", translation: "Very" },
                { id: "khoobam", text: "Khoobam", translation: "I am good" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "ahle_1", text: "Ahle", translation: "From" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "hasti", text: "Hasti", translation: "You are" },
                { id: "man_2", text: "Man", translation: "I" },
                { id: "dar", text: "Dar", translation: "In" },
                { id: "amrika", text: "Amrika", translation: "America" },
                { id: "zendegi", text: "Zendegi", translation: "Live" },
                { id: "mikonam", text: "Mikonam", translation: "I do" },
                { id: "vali", text: "Vali", translation: "But" },
                { id: "ahle_2", text: "Ahle", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "chetori", "man_1", "kheily", "khoobam", "merci", "shoma", "ahle_1", "koja", "hasti", "man_2", "dar", "amrika", "zendegi", "mikonam", "vali", "ahle_2", "iran", "hastam", "khodafez"],
              title: "Complete Conversation",
              successMessage: "Amazing! You've mastered all of Module 2!",
              incorrectMessage: "Almost there—review the order and try again!",
              conversationFlow: {
                description: "A complete conversation using everything from Module 2",
                expectedPhrase: "Hello, how are you? I am very good, thank you. Where are you from? I live in America, but I am from Iran. Goodbye.",
                persianSequence: ["salam", "chetori", "man_1", "kheily", "khoobam", "merci", "shoma", "ahle_1", "koja", "hasti", "man_2", "dar", "amrika", "zendegi", "mikonam", "vali", "ahle_2", "iran", "hastam", "khodafez"]
              }
            }
          }
        ]
      },
      {
        id: "lesson7",
        title: "Story Mode Review",
        description: "Practice a real conversation with Leyla using everything you've learned in Module 2",
        emoji: "💬",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "kheily", "esme", "chiye", "ahle", "koja", "hasti", "iran", "vali", "dar", "amrika", "zendegi", "mikonam", "ham", "khoshbakhtam", "khodafez"],
        vocabulary: [],
        steps: [
          {
            type: "welcome",
            title: "Story Mode Review",
            description: "Have a real conversation with Leyla! Use everything you've learned to chat naturally.",
            points: 0,
            data: {
              objectives: [
                "Practice natural conversation flow",
                "Use greetings, introductions, and location phrases",
                "Apply connectors (va, ham, vali) in context",
                "Review all Module 2 vocabulary"
              ],
              lessonType: "story"
            }
          },
          {
            type: "story-conversation",
            points: 0, // XP awarded per-choice, not at completion
            data: {
              storyId: "module2-review-leyla",
              title: "Chat with Leyla",
              description: "Have a natural conversation using everything you've learned",
              setting: "You're meeting Leyla for the first time. Introduce yourself and get to know her!",
              characterName: "Leyla",
              characterEmoji: "👩",
              requiresPersonalization: true,
              successMessage: "Amazing! You had a perfect conversation with Leyla!",
              exchanges: [
                {
                  id: "exchange1",
                  initiator: "character",
                  characterMessage: "Salam! Chetori!",
                  choices: [
                    {
                      id: "choice1a",
                      text: "Salam! Khoobam, merci.",
                      vocabularyUsed: ["salam", "khoobam", "merci"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Perfect! A natural greeting response."
                    },
                    {
                      id: "choice1b",
                      text: "Salam! Khoob, merci.",
                      vocabularyUsed: ["salam", "khoob", "merci"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Close, but you need to say 'khoobam' (I am good), not just 'khoob' (good)."
                    },
                    {
                      id: "choice1c",
                      text: "Salam! Man ham khoobam, merci.",
                      vocabularyUsed: ["salam", "man", "ham", "khoobam", "merci"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Using 'ham' (also) doesn't make sense here since Leyla didn't say she was good yet."
                    }
                  ]
                },
                {
                  id: "exchange2",
                  initiator: "character",
                  characterMessage: "Kheily khoob! Man ham khoobam. Esme shoma chiye?",
                  choices: [
                    {
                      id: "choice2a",
                      text: "Esme man {{userName}}-e. Esme shoma chiye?",
                      vocabularyUsed: ["esme", "man", "shoma", "chiye"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Excellent! You introduced yourself and asked her name back."
                    },
                    {
                      id: "choice2b",
                      text: "Esme man {{userName}}.",
                      vocabularyUsed: ["esme", "man"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You introduced yourself, but it's polite to ask her name too!"
                    },
                    {
                      id: "choice2c",
                      text: "Esme shoma {{userName}}-e.",
                      vocabularyUsed: ["esme", "shoma"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Watch out! 'Shoma' means 'you', but you're talking about yourself. Use 'man' (I)."
                    },
                    {
                      id: "choice2d",
                      text: "Esme shoma {{userName}}.",
                      vocabularyUsed: ["esme", "shoma"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You mixed up 'man' (I) and 'shoma' (you). This says 'your name is [name]'."
                    }
                  ]
                },
                {
                  id: "exchange3",
                  initiator: "character",
                  characterMessage: "Esme man Leyla-e. Shoma ahle koja hasti?",
                  choices: [
                    {
                      id: "choice3a",
                      text: "Man ahle Iran hastam, shoma chi?",
                      vocabularyUsed: ["man", "ahle", "iran", "hastam", "shoma"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Perfect! You answered and asked back using 'chi' (what about you)."
                    },
                    {
                      id: "choice3b",
                      text: "Man ahle Iran neestam.",
                      vocabularyUsed: ["man", "ahle", "iran", "neestam"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You said you're NOT from Iran. If that's true, say where you ARE from!"
                    },
                    {
                      id: "choice3c",
                      text: "Shoma ahle Iran hastam, shoma chi?",
                      vocabularyUsed: ["shoma", "ahle", "iran", "hastam"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Watch out! You said 'you are from Iran' instead of 'I am from Iran'. Use 'man' and 'hastam'."
                    },
                    {
                      id: "choice3d",
                      text: "Man koja Iran hastam, shoma chi?",
                      vocabularyUsed: ["man", "koja", "iran", "hastam", "shoma"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "The word order is wrong. Say 'man ahle Iran hastam' (I am from Iran)."
                    }
                  ]
                },
                {
                  id: "exchange4",
                  initiator: "character",
                  characterMessage: "Man ahle Iran hastam vali dar amrika zendegi mikonam. What does 'vali' mean in that sentence?",
                  choices: [
                    {
                      id: "choice4a",
                      text: "But",
                      vocabularyUsed: ["vali"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Correct! 'Vali' means 'but' - showing contrast between being from Iran and living in America."
                    },
                    {
                      id: "choice4b",
                      text: "And",
                      vocabularyUsed: ["va"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Not quite. 'And' would be 'va'. 'Vali' shows contrast."
                    },
                    {
                      id: "choice4c",
                      text: "Also",
                      vocabularyUsed: ["ham"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Not quite. 'Also' would be 'ham'. 'Vali' shows contrast."
                    },
                    {
                      id: "choice4d",
                      text: "In",
                      vocabularyUsed: ["dar"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Not quite. 'In' is 'dar'. 'Vali' is a connector meaning 'but'."
                    }
                  ]
                },
                {
                  id: "exchange5",
                  initiator: "character",
                  characterMessage: "Shoma chi?",
                  choices: [
                    {
                      id: "choice5a",
                      text: "Man ham dar amrika zendegi mikonam.",
                      vocabularyUsed: ["man", "ham", "dar", "amrika", "zendegi", "mikonam"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Perfect! You used 'ham' (also) to show you both live in America."
                    },
                    {
                      id: "choice5b",
                      text: "Man vali dar amrika zendegi mikonam.",
                      vocabularyUsed: ["man", "vali", "dar", "amrika", "zendegi", "mikonam"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "Using 'vali' (but) doesn't make sense here. Use 'ham' (also) to agree with Leyla."
                    },
                    {
                      id: "choice5c",
                      text: "Man va dar amrika zendegi mikonam.",
                      vocabularyUsed: ["man", "va", "dar", "amrika", "zendegi", "mikonam"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You can't use 'va' (and) like this. Use 'ham' (also) to say 'me too'."
                    }
                  ]
                },
                {
                  id: "exchange6",
                  initiator: "character",
                  characterMessage: "Khoshbakhtam {{userName}}-e!",
                  choices: [
                    {
                      id: "choice6a",
                      text: "Khoshbakhtam Leyla, khodafez!",
                      vocabularyUsed: ["khoshbakhtam", "khodafez"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: "Perfect ending! You said 'nice to meet you' and 'goodbye' naturally."
                    },
                    {
                      id: "choice6b",
                      text: "Khoshbakhtam, Leyla salam!",
                      vocabularyUsed: ["khoshbakhtam", "salam"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You're saying goodbye, so use 'khodafez' not 'salam' (hello)."
                    },
                    {
                      id: "choice6c",
                      text: "Merci Leyla!",
                      vocabularyUsed: ["merci"],
                      isCorrect: false,
                      points: 0,
                      responseMessage: "You should say 'khoshbakhtam' (nice to meet you) back before saying goodbye!"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "module3",
    title: "Module 3: Family & Relationships",
    description: "Describe your family or ask about someone else's. Includes parents, siblings, friends, and possessive structures.",
    emoji: "👪",
    lessonCount: 6,
    estimatedTime: "120 minutes",
    available: true,
    requiresPremium: true,
    lessons: [
      {
        id: "lesson1",
        title: "Review & Refresh",
        description: "Let's review everything you've learned before we talk about family!",
        emoji: "🔄",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "chetori", "man", "shoma", "merci", "esm", "esmam", "chi", "chiye", "ahle", "koja", "dar", "iran", "amrika", "mikonam", "mikoni", "zendegi", "hast", "neest", "hastam", "hasti", "neestam", "neesti", "khoob", "kheily", "va", "ham", "vali", "khodafez"],
        vocabulary: [],
        steps: [
          {
            type: "welcome",
            title: "Review & Refresh",
            description: "Let's review everything you've learned before we talk about family!",
            points: 0,
            data: {
              objectives: [
                "Review greetings and basic phrases",
                "Practice name and origin questions",
                "Reinforce possession and connector usage",
                "Prepare for family vocabulary"
              ],
              lessonType: "review"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "salam", text: "salam", slotId: "hello" },
                { id: "chetori", text: "chetori", slotId: "how_are_you" },
                { id: "man", text: "man", slotId: "i_me" },
                { id: "shoma", text: "shoma", slotId: "you" }
              ],
              slots: [
                { id: "hello", text: "hello" },
                { id: "how_are_you", text: "how are you" },
                { id: "i_me", text: "I / me" },
                { id: "you", text: "you" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'name'?",
              options: ["esm", "koja", "man", "chi"],
              correct: 0
            }
          },
          {
            type: "audio-sequence",
            points: 2,
            data: {
              sequence: ["salam", "chetori"],
              expectedTranslation: "hello how are you",
              targetWordCount: 4
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "chetori", "man", "khoobam", "merci"],
              expectedTranslation: "hello how are you I am good thank you",
              targetWordCount: 9
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "esm", text: "esm", slotId: "name" },
                { id: "esmam", text: "esmam", slotId: "my_name" },
                { id: "chi", text: "chi", slotId: "what" },
                { id: "chiye", text: "chiye", slotId: "what_is_it" }
              ],
              slots: [
                { id: "name", text: "name" },
                { id: "my_name", text: "my name" },
                { id: "what", text: "what" },
                { id: "what_is_it", text: "what is it" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "The suffix -e is used at the end of a noun to mark what?",
              options: ["belonging / possession", "action / doing", "question / asking", "plural / many"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esmam Bob-e, esmet chiye",
              expectedTranslation: "my name is Bob what is your name"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "ahle", text: "ahle", slotId: "from" },
                { id: "koja", text: "koja", slotId: "where" },
                { id: "dar", text: "dar", slotId: "in" },
                { id: "iran", text: "iran", slotId: "iran" }
              ],
              slots: [
                { id: "from", text: "from" },
                { id: "where", text: "where" },
                { id: "in", text: "in" },
                { id: "iran", text: "Iran" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which word means 'where'?",
              options: ["koja", "ahle", "dar", "chi"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "mikonam", text: "mikonam", slotId: "i_do_will" },
                { id: "mikoni", text: "mikoni", slotId: "you_do_will" },
                { id: "zendegi", text: "zendegi", slotId: "life" },
                { id: "amrika", text: "amrika", slotId: "america" }
              ],
              slots: [
                { id: "i_do_will", text: "I do / will" },
                { id: "you_do_will", text: "you do / will" },
                { id: "life", text: "life" },
                { id: "america", text: "America" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma koja zendegi mikoni? man dar amrika zendegi mikonam",
              expectedTranslation: "where do you live I live in America"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "hast", text: "hast", slotId: "is" },
                { id: "neest", text: "neest", slotId: "is_not" },
                { id: "khoob", text: "khoob", slotId: "good" },
                { id: "kheily", text: "kheily", slotId: "very" }
              ],
              slots: [
                { id: "is", text: "is" },
                { id: "is_not", text: "is not" },
                { id: "good", text: "good" },
                { id: "very", text: "very" }
              ]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "hastam", text: "hastam", slotId: "i_am" },
                { id: "hasti", text: "hasti", slotId: "you_are" },
                { id: "neestam", text: "neestam", slotId: "i_am_not" },
                { id: "neesti", text: "neesti", slotId: "you_are_not" }
              ],
              slots: [
                { id: "i_am", text: "I am" },
                { id: "you_are", text: "you are" },
                { id: "i_am_not", text: "I am not" },
                { id: "you_are_not", text: "you are not" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -am mean when attached to a root word?",
              options: ["I / my", "you / your", "is / are", "not / no"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type 'I am' using its root and suffix",
              answer: "hast-am"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "va", text: "va", slotId: "and" },
                { id: "ham", text: "ham", slotId: "also" },
                { id: "vali", text: "vali", slotId: "but" },
                { id: "chi_2", text: "chi", slotId: "what" }
              ],
              slots: [
                { id: "and", text: "and" },
                { id: "also", text: "also" },
                { id: "but", text: "but" },
                { id: "what", text: "what" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Which word means 'but'?",
              answer: "vali"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man ahle iran hastam vali dar amrika zendegi mikonam",
              expectedTranslation: "I am from Iran but I live in America"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "man", "khoob", "neestam", "shoma", "khodafez"],
              expectedTranslation: "hello I am not good what about you goodbye",
              targetWordCount: 9
            }
          }
        ]
      },
      {
        id: "lesson2",
        title: "My & Your",
        description: "Learn to say 'my' and 'your' with the -am and -et suffixes",
        emoji: "👤",
        progress: 0,
        locked: false,
        reviewVocabulary: ["esm", "va", "vali", "ham"],
        vocabulary: [
          {
            id: "esmam",
            en: "my name",
            fa: "اسمم",
            finglish: "esmam",
            phonetic: "es-MAM",
            lessonId: "lesson2"
          },
          {
            id: "esmet",
            en: "your name",
            fa: "اسمت",
            finglish: "esmet",
            phonetic: "es-MET",
            lessonId: "lesson2"
          },
          {
            id: "hast",
            en: "is",
            fa: "هست",
            finglish: "hast",
            phonetic: "hast",
            lessonId: "lesson2"
          },
          {
            id: "in",
            en: "this",
            fa: "این",
            finglish: "in",
            phonetic: "een",
            lessonId: "lesson2"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "My & Your",
            description: "Learn to say 'my name' and 'your name' using possession suffixes!",
            points: 0,
            data: {
              objectives: [
                "Learn -am suffix (my)",
                "Learn -et suffix (your)",
                "Understand hast (is) as base form",
                "Practice with 'in' (this)"
              ],
              lessonType: "grammar"
            }
          },
          {
            type: "grammar-concept",
            points: 3,
            data: {
              conceptId: "possession-suffixes"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -am mean when attached to a noun?",
              options: ["my", "your", "is", "this"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -et mean when attached to a noun?",
              options: ["your", "my", "is", "name"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "esmam", text: "esmam", slotId: "my_name" },
                { id: "esmet", text: "esmet", slotId: "your_name" },
                { id: "esm", text: "esm", slotId: "name" }
              ],
              slots: [
                { id: "my_name", text: "my name" },
                { id: "your_name", text: "your name" },
                { id: "name", text: "name" }
              ]
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type 'my name' (use hyphen between root and suffix)",
              answer: "esm-am"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "Type 'your name' (use hyphen between root and suffix)",
              answer: "esm-et"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esmam Bob-e, esme shoma chiye",
              expectedTranslation: "my name is Bob what is your name"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              front: "hast",
              back: "is",
              vocabularyId: "hast"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which is the base form of 'is'?",
              options: ["hast", "hastam", "hasti", "neestam"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme man Bob hast",
              expectedTranslation: "my name is Bob"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "esmet",
              distractors: ["my name", "is", "this"]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              front: "in",
              back: "this",
              vocabularyId: "in"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "in", text: "in", slotId: "this" },
                { id: "va", text: "va", slotId: "and" },
                { id: "vali", text: "vali", slotId: "but" },
                { id: "ham", text: "ham", slotId: "also" }
              ],
              slots: [
                { id: "this", text: "this" },
                { id: "and", text: "and" },
                { id: "but", text: "but" },
                { id: "also", text: "also" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esmet Bob-e",
              expectedTranslation: "your name is Bob"
            }
          },
          {
            type: "audio-sequence",
            points: 2,
            data: {
              sequence: ["esmam"],
              expectedTranslation: "my name",
              targetWordCount: 2
            }
          },
          {
            type: "audio-sequence",
            points: 2,
            data: {
              sequence: ["esmet"],
              expectedTranslation: "your name",
              targetWordCount: 2
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "esme", "shoma", "chiye", "khoshbakhtam"],
              expectedTranslation: "hello what is your name nice to meet you",
              targetWordCount: 9
            }
          }
        ]
      },
      {
        id: "lesson3",
        title: "Parents",
        description: "Learn to talk about your mother and father using family words",
        emoji: "👨‍👩‍👦",
        progress: 0,
        locked: false,
        reviewVocabulary: ["in", "hast", "va", "ahle", "koja", "dar", "iran", "amrika", "zendegi", "mikonam", "mikoni", "esm", "esmam", "esmet"],
        vocabulary: [
          {
            id: "madar",
            en: "mother",
            fa: "مادر",
            finglish: "madar",
            phonetic: "MAH-dar",
            lessonId: "lesson3"
          },
          {
            id: "pedar",
            en: "father",
            fa: "پدر",
            finglish: "pedar",
            phonetic: "peh-DAR",
            lessonId: "lesson3"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Parents",
            description: "Learn to talk about your mother and father!",
            points: 0,
            data: {
              objectives: [
                "Learn the words for mother and father",
                "Apply -am and -et suffixes to family words",
                "Practice asking about family names",
                "Use 'in' to ask about family members"
              ],
              lessonType: "vocabulary"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "madar"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'my mother'?",
              answer: "madar-am"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "pedar"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'your father'?",
              answer: "pedar-et"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "madaret", text: "madaret", slotId: "your_mother" },
                { id: "madaram", text: "madaram", slotId: "my_mother" },
                { id: "pedaret", text: "pedaret", slotId: "your_father" },
                { id: "pedaram", text: "pedaram", slotId: "my_father" }
              ],
              slots: [
                { id: "your_mother", text: "your mother" },
                { id: "my_mother", text: "my mother" },
                { id: "your_father", text: "your father" },
                { id: "my_father", text: "my father" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -e do when you say 'esme pedare man'?",
              options: ["shows belonging/of", "means 'and'", "makes it plural", "means 'very'"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "in pedare shoma hast?",
              expectedTranslation: "is this your father"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "pedare_shoma", text: "pedare shoma", slotId: "your_father_slot" },
                { id: "pedare_man", text: "pedare man", slotId: "my_father_slot" },
                { id: "madare_shoma", text: "madare shoma", slotId: "your_mother_slot" },
                { id: "madare_man", text: "madare man", slotId: "my_mother_slot" }
              ],
              slots: [
                { id: "your_father_slot", text: "your father" },
                { id: "my_father_slot", text: "my father" },
                { id: "your_mother_slot", text: "your mother" },
                { id: "my_mother_slot", text: "my mother" }
              ]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "madar",
              distractors: ["pedar", "esm", "shoma"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "madaret va pedaret",
              expectedTranslation: "your mother and your father"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'dar' mean?",
              options: ["in / at", "from", "where", "with"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'koja' mean?",
              options: ["where", "from", "in", "what"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "shoma koja zendegi mikoni",
              expectedTranslation: "where do you live"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "man dar amrika zendegi mikonam",
              expectedTranslation: "I live in America"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "pedaram ahle iran hast vali madaram ahle amrika hast",
              expectedTranslation: "my father is from Iran but my mother is from America"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "esme_1", text: "esme", translation: "name of" },
                { id: "pedare", text: "pedare", translation: "father" },
                { id: "shoma", text: "shoma", translation: "you" },
                { id: "chiye", text: "chiye", translation: "what is it" },
                { id: "esme_2", text: "esme", translation: "name of" },
                { id: "pedaram", text: "pedaram", translation: "my father" },
                { id: "Bob-e", text: "Bob-e", translation: "is Bob" }
              ],
              targetWords: ["esme_1", "pedare", "shoma", "chiye", "esme_2", "pedaram", "Bob-e"],
              title: "Ask About Family",
              successMessage: "Amazing! You can now talk about your parents!",
              incorrectMessage: "Try again - remember the question comes first!",
              conversationFlow: {
                description: "Ask about someone's father's name",
                expectedPhrase: "what is your father's name? My father's name is Bob",
                persianSequence: ["esme_1", "pedare", "shoma", "chiye", "esme_2", "pedaram", "Bob-e"]
              }
            }
          }
        ]
      },
      {
        id: "lesson4",
        title: "Parents Practice",
        description: "Practice everything you learned about talking about your parents!",
        emoji: "👨‍👩‍👦‍👦",
        progress: 0,
        locked: false,
        reviewVocabulary: ["madar", "pedar", "salam", "khodafez", "chetori", "merci", "baleh", "khoshbakhtam", "esm", "esmam", "esmet", "in", "hast", "hastam", "va", "ahle", "koja", "dar", "iran", "amrika", "zendegi", "mikonam", "khoob"],
        vocabulary: [],
        steps: [
          {
            type: "welcome",
            title: "Parents Practice",
            description: "Let's practice talking about your parents in different ways!",
            points: 0,
            data: {
              objectives: [
                "Practice asking and answering about parents",
                "Review forgotten Module 1 & 2 words",
                "Master using 'in' with family members",
                "Build complex family sentences"
              ],
              lessonType: "review"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "madar",
              distractors: ["pedar", "esm", "man"]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "pedar",
              distractors: ["madar", "shoma", "esm"]
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["madar", "va", "pedar"],
              expectedTranslation: "mother and father",
              targetWordCount: 3
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "salam", text: "salam", slotId: "hello" },
                { id: "khodafez", text: "khodafez", slotId: "goodbye" },
                { id: "chetori", text: "chetori", slotId: "how_are_you" },
                { id: "merci", text: "merci", slotId: "thank_you" }
              ],
              slots: [
                { id: "hello", text: "hello" },
                { id: "goodbye", text: "goodbye" },
                { id: "how_are_you", text: "how are you" },
                { id: "thank_you", text: "thank you" }
              ]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khoshbakhtam",
              distractors: ["khodafez", "merci", "salam"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme madare shoma chiye?",
              expectedTranslation: "what is your mother's name"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme madaram Sara-e",
              expectedTranslation: "my mother's name is Sara"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "pedare shoma ahle koja hast?",
              expectedTranslation: "where is your father from"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "in madare shoma hast?",
              expectedTranslation: "is this your mother"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["madar", "ahle", "iran", "hast"],
              expectedTranslation: "mother is from Iran",
              targetWordCount: 4
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "madaret khoob hast?",
              expectedTranslation: "is your mother good"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'yes thank you'?",
              options: ["baleh merci", "na merci", "merci baleh", "khoobam merci"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -e mean in 'pedare man'?",
              options: ["of / belonging to", "and", "also", "very"],
              correct: 0
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["pedar", "ahle", "amrika", "hast"],
              expectedTranslation: "father is from America",
              targetWordCount: 4
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["madar", "ahle", "amrika", "hast", "vali", "pedar", "ahle", "iran", "hast"],
              expectedTranslation: "mother is from America but father is from Iran",
              targetWordCount: 9
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "esme_1", text: "esme", translation: "name of" },
                { id: "pedaram", text: "pedaram", translation: "my father" },
                { id: "Bob-e", text: "Bob-e", translation: "is Bob" },
                { id: "vali", text: "vali", translation: "but" },
                { id: "esme_2", text: "esme", translation: "name of" },
                { id: "madaram", text: "madaram", translation: "my mother" },
                { id: "Sara-e", text: "Sara-e", translation: "is Sara" }
              ],
              targetWords: ["esme_1", "pedaram", "Bob-e", "vali", "esme_2", "madaram", "Sara-e"],
              title: "Introduce Your Parents",
              successMessage: "Amazing! You can confidently talk about your parents!",
              incorrectMessage: "Try again - start with father's name, then mother's!",
              conversationFlow: {
                description: "Introduce both parents with their names",
                expectedPhrase: "my father's name is bob but my mother's name is Sara",
                persianSequence: ["esme_1", "pedaram", "Bob-e", "vali", "esme_2", "madaram", "Sara-e"]
              }
            }
          }
        ]
      },
      {
        id: "lesson5",
        title: "Siblings",
        description: "Learn to talk about your brother and sister using the same suffix patterns!",
        emoji: "👫",
        progress: 0,
        locked: false,
        reviewVocabulary: ["madar", "pedar", "esm", "esmam", "esmet", "in", "hast", "khoob", "neest", "va", "vali", "ham", "ahle", "koja", "zendegi"],
        vocabulary: [
          {
            id: "baradar",
            en: "brother",
            fa: "برادر",
            finglish: "baradar",
            phonetic: "bah-rah-DAR",
            lessonId: "lesson5"
          },
          {
            id: "khahar",
            en: "sister",
            fa: "خواهر",
            finglish: "khahar",
            phonetic: "khah-HAR",
            lessonId: "lesson5"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Siblings",
            description: "Learn to talk about your brother and sister!",
            points: 0,
            data: {
              objectives: [
                "Learn the words for brother and sister",
                "Apply -am and -et suffixes to siblings",
                "Practice asking about family members",
                "Compare all family members together"
              ],
              lessonType: "vocabulary"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "baradar"
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'your brother'?",
              answer: "baradar-et"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "khahar", text: "khahar", slotId: "sister" },
                { id: "khaharam", text: "khaharam", slotId: "my_sister" },
                { id: "khaharet", text: "khaharet", slotId: "your_sister" }
              ],
              slots: [
                { id: "sister", text: "sister" },
                { id: "my_sister", text: "my sister" },
                { id: "your_sister", text: "your sister" }
              ]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "khahar"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "madar",
              distractors: ["pedar", "baradar", "khahar"]
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["pedar", "va", "baradar"],
              expectedTranslation: "father and brother",
              targetWordCount: 3
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "madar", text: "madar", slotId: "mother" },
                { id: "pedar", text: "pedar", slotId: "father" },
                { id: "baradar", text: "baradar", slotId: "brother" },
                { id: "khahar", text: "khahar", slotId: "sister" }
              ],
              slots: [
                { id: "mother", text: "mother" },
                { id: "father", text: "father" },
                { id: "brother", text: "brother" },
                { id: "sister", text: "sister" }
              ]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khahar",
              distractors: ["baradar", "madar", "pedar"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme baradare shoma chiye?",
              expectedTranslation: "what is your brother's name"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "baradar", "Amir-e"],
              expectedTranslation: "my brother's name is Amir",
              targetWordCount: 5
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme baradaram Amir neest",
              expectedTranslation: "my brother's name is not Amir"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["khahar", "khoob", "hast"],
              expectedTranslation: "sister is good",
              targetWordCount: 3
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "baradaram khoob hast vali khaharam khoob neest",
              expectedTranslation: "my brother is good but my sister is not good"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'zendegi' mean?",
              options: ["life", "live", "brother", "sister"],
              correct: 0
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "Which connector means 'also'?",
              options: ["ham", "va", "vali", "dar"],
              correct: 0
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "baradaret", text: "baradaret", translation: "your brother" },
                { id: "khoob_1", text: "khoob", translation: "good" },
                { id: "hast_1", text: "hast", translation: "is" },
                { id: "khaharet", text: "khaharet", translation: "your sister" },
                { id: "khoob_2", text: "khoob", translation: "good" },
                { id: "hast_2", text: "hast", translation: "is" },
                { id: "baradaram", text: "baradaram", translation: "my brother" },
                { id: "khoob_3", text: "khoob", translation: "good" },
                { id: "neest", text: "neest", translation: "not" },
                { id: "vali", text: "vali", translation: "but" },
                { id: "khaharam", text: "khaharam", translation: "my sister" },
                { id: "khoob_4", text: "khoob", translation: "good" },
                { id: "hast_3", text: "hast", translation: "is" }
              ],
              targetWords: ["baradaret", "khoob_1", "hast_1", "khaharet", "khoob_2", "hast_2", "baradaram", "khoob_3", "neest", "vali", "khaharam", "khoob_4", "hast_3"],
              title: "Talk About Siblings",
              successMessage: "Amazing! You can now talk about your entire family!",
              incorrectMessage: "Try again - ask about their brother and sister first!",
              conversationFlow: {
                description: "Compare siblings with contrasting qualities",
                expectedPhrase: "is your brother good? is your sister good? my brother is not good but my sister is good",
                persianSequence: ["baradaret", "khoob_1", "hast_1", "khaharet", "khoob_2", "hast_2", "baradaram", "khoob_3", "neest", "vali", "khaharam", "khoob_4", "hast_3"]
              }
            }
          }
        ]
      },
      {
        id: "lesson6",
        title: "Family Review",
        description: "Practice everything you've learned about family members and put it all together!",
        emoji: "👨‍👩‍👧‍👦",
        progress: 0,
        locked: false,
        reviewVocabulary: ["madar", "pedar", "baradar", "khahar", "salam", "khodafez", "merci", "khoshbakhtam", "esm", "esmam", "esmet", "in", "hast", "khoob", "neest", "va", "vali", "ahle", "koja", "dar", "iran", "amrika", "zendegi", "kheily", "na", "baleh"],
        vocabulary: [],
        steps: [
          {
            type: "welcome",
            title: "Family Review",
            description: "Let's practice everything you've learned about family!",
            points: 0,
            data: {
              objectives: [
                "Review all family vocabulary",
                "Master possession suffixes",
                "Practice complex family sentences",
                "Review important Module 1 & 2 words"
              ],
              lessonType: "review"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "madar", text: "madar", slotId: "mother" },
                { id: "pedar", text: "pedar", slotId: "father" },
                { id: "baradar", text: "baradar", slotId: "brother" },
                { id: "khahar", text: "khahar", slotId: "sister" }
              ],
              slots: [
                { id: "mother", text: "mother" },
                { id: "father", text: "father" },
                { id: "brother", text: "brother" },
                { id: "sister", text: "sister" }
              ]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "baradar",
              distractors: ["pedar", "khahar", "madar"]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -am mean when added to a noun?",
              options: ["my", "your", "is", "of"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'my brother'?",
              answer: "baradar-am"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["esme", "madar", "Sara-e", "vali", "esme", "pedar", "Bob-e"],
              expectedTranslation: "my mother's name is Sara but my father's name is Bob",
              targetWordCount: 11
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "salam", text: "salam", slotId: "hello" },
                { id: "khodafez", text: "khodafez", slotId: "goodbye" },
                { id: "merci", text: "merci", slotId: "thank_you" },
                { id: "khoshbakhtam", text: "khoshbakhtam", slotId: "nice_to_meet_you" }
              ],
              slots: [
                { id: "hello", text: "hello" },
                { id: "goodbye", text: "goodbye" },
                { id: "thank_you", text: "thank you" },
                { id: "nice_to_meet_you", text: "nice to meet you" }
              ]
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -e mean in 'madare man'?",
              options: ["of / belonging to", "and", "also", "my"],
              correct: 0
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khoshbakhtam",
              distractors: ["khodafez", "salam", "merci"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "madaret va khaharet",
              expectedTranslation: "your mother and your sister"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does the suffix -et mean when added to a noun?",
              options: ["your", "my", "is", "of"],
              correct: 0
            }
          },
          {
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'your mother'?",
              answer: "madar-et"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "koja",
              distractors: ["ahle", "dar", "zendegi"]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "esme baradare shoma chiye?",
              expectedTranslation: "what is your brother's name"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'kheily' mean?",
              options: ["very", "good", "also", "where"],
              correct: 0
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "madaret", text: "madaret", slotId: "your_mother" },
                { id: "pedare_shoma", text: "pedare shoma", slotId: "your_father" },
                { id: "khaharam", text: "khaharam", slotId: "my_sister" },
                { id: "baradare_man", text: "baradare man", slotId: "my_brother" }
              ],
              slots: [
                { id: "your_mother", text: "your mother" },
                { id: "your_father", text: "your father" },
                { id: "my_sister", text: "my sister" },
                { id: "my_brother", text: "my brother" }
              ]
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["salam", "in", "pedar", "man", "hast"],
              expectedTranslation: "hello this is my father",
              targetWordCount: 5
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "baradaram khoob hast vali madaram khoob neest",
              expectedTranslation: "my brother is good but my mother is not good"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "madaram ahle iran hast vali pedaram ahle amrika hast",
              expectedTranslation: "my mother is from Iran but my father is from America"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "khahare", text: "khahare", translation: "sister of" },
                { id: "shoma", text: "shoma", translation: "you" },
                { id: "ahle", text: "ahle", translation: "from" },
                { id: "amrika", text: "amrika", translation: "America" },
                { id: "hast", text: "hast", translation: "is" },
                { id: "na", text: "na", translation: "no" },
                { id: "khaharam", text: "khaharam", translation: "my sister" },
                { id: "ahle_2", text: "ahle", translation: "from" },
                { id: "iran", text: "iran", translation: "Iran" },
                { id: "hast_2", text: "hast", translation: "is" }
              ],
              targetWords: ["khahare", "shoma", "ahle", "amrika", "hast", "na", "khaharam", "ahle_2", "iran", "hast_2"],
              title: "Is your sister from America? No, my sister is from Iran",
              successMessage: "Incredible! You've mastered family vocabulary in Persian!",
              incorrectMessage: "Almost there - remember the question comes first, then the answer!"
            }
          }
        ]
      }
    ]
  },
  {
    id: "module4",
    title: "Module 4: Food & Ordering at a Restaurant",
    description: "Order like a pro. Learn how to ask for the check, express what you want or don't want, and talk about Persian dishes.",
    emoji: "🍽️",
    lessonCount: 5,
    estimatedTime: "40 minutes",
    available: false,
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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
    requiresPremium: true,
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

/**
 * Helper function to generate conversation flow for final challenges
 * Uses ConversationFlowService to create proper Persian conversation patterns
 */
function createConversationFlow(
  englishPhrase: string, 
  vocabularyIds: string[]
): { description: string; expectedPhrase: string; persianSequence: string[] } | undefined {
  const flow = ConversationFlowService.generateConversationFlow(englishPhrase, vocabularyIds);
  return flow || undefined;
}

/**
 * SYSTEMATIC PREVENTION: Helper function to generate complete reviewVocabulary arrays
 * This ensures all previous lesson vocabulary is available for audio sequences and other components
 * 
 * @param moduleId - The module ID (e.g., "module1")
 * @param currentLessonNumber - The current lesson number (e.g., 4 for lesson4)
 * @returns Array of all vocabulary IDs from previous lessons in the module
 */
function generateCompleteReviewVocabulary(moduleId: string, currentLessonNumber: number): string[] {
  const module = getModule(moduleId);
  if (!module) return [];
  
  const allPreviousVocab: string[] = [];
  
  // Get vocabulary from all previous lessons in the module
  for (let lessonNum = 1; lessonNum < currentLessonNumber; lessonNum++) {
    const lessonId = `lesson${lessonNum}`;
    const lesson = module.lessons.find(l => l.id === lessonId);
    
    if (lesson?.vocabulary) {
      lesson.vocabulary.forEach(vocab => {
        if (!allPreviousVocab.includes(vocab.id)) {
          allPreviousVocab.push(vocab.id);
        }
      });
    }
  }
  
  return allPreviousVocab;
}

/**
 * Validation function to check if audio sequences have required vocabulary
 * This helps catch missing vocabulary issues during development
 */
function validateAudioSequenceVocabulary(
  sequenceIds: string[], 
  availableVocab: string[]
): { isValid: boolean; missingVocab: string[] } {
  const missingVocab = sequenceIds.filter(id => !availableVocab.includes(id));
  
  return {
    isValid: missingVocab.length === 0,
    missingVocab
  };
} 