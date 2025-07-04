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
                { id: "khosh_amadid", text: "Khosh Amadid", translation: "Welcome" },
                { id: "chetori", text: "Chetori", translation: "How are you?" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "khosh_amadid", "chetori", "khodafez"],
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
          
          // PHASE 2: NEW VOCABULARY INTRODUCTION - "khoobam" & "merci"
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
              distractors: ["salam", "khoobam", "khodafez"]
            }
          },
          
          // PHASE 3: INTEGRATION & APPLICATION
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
            type: "input",
            points: 2,
            data: {
              question: "How do you say 'Thank you' in Persian?",
              answer: "Merci"
            }
          },
          {
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["khoobam", "merci"]
            }
          },
          
          // PHASE 4: YES/NO VOCABULARY - "baleh" & "na"
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
              distractors: ["na", "merci", "khoobam"]
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
          
          // PHASE 5: PHRASE BUILDING
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
            type: "quiz",
            points: 2,
            data: {
              prompt: "How do you say 'I'm good' in Persian?",
              options: ["Khoobam", "Salam", "Baleh", "Na"],
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
          
          // PHASE 6: COMPREHENSIVE PRACTICE
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
              prompt: "How do you say 'I am good, thank you' in Persian?",
              options: ["Man khoobam, merci", "Shoma khoobam, merci", "Shoma chetori, merci", "Man khoobam, khodafez"],
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
                { id: "chiye", text: "Chiye", translation: "What is it?" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "esm", text: "Esm", translation: "Name" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" },
                { id: "esme", text: "Esme", translation: "Name of" }
              ],
              targetWords: ["salam", "esme", "shoma", "chiye", "chetori", "khoobam", "merci", "khodafez"],
              conversationFlow: {
                description: "A polite introduction conversation",
                expectedPhrase: "Hello, what is your name, thank you, goodbye",
                persianSequence: ["salam", "esme", "shoma", "chiye", "chetori", "khoobam", "merci", "khodafez"]
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
            points: 7, // Total XP for completing the story
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
    title: "Module 2: Personal Origins & Location",
    description: "Learn to ask and answer where you're from. Master essential phrases for introductions and location-based conversations.",
    emoji: "🌍",
    lessonCount: 1,
    estimatedTime: "30 minutes",
    available: true,
    lessons: [
      {
        id: "lesson1",
        title: "Where Are You From?",
        description: "Learn to ask about origins and introduce yourself with location",
        emoji: "🗺️",
        progress: 0,
        locked: false,
        reviewVocabulary: ["salam", "esme", "man", "shoma", "chi", "chiye", "chetori", "khoshbakhtam", "merci", "khoobam", "baleh", "na", "khodafez", "khosh_amadid", "esm"],
        vocabulary: [
          {
            id: "koja",
            en: "Where",
            fa: "کجا",
            finglish: "Koja",
            phonetic: "ko-JAH",
            lessonId: "module2-lesson1"
          },
          {
            id: "az",
            en: "From",
            fa: "از",
            finglish: "Az",
            phonetic: "az",
            lessonId: "module2-lesson1"
          },
          {
            id: "hastid",
            en: "You Are",
            fa: "هستید",
            finglish: "Hastid",
            phonetic: "has-TEED",
            lessonId: "module2-lesson1"
          },
          {
            id: "hastam",
            en: "I Am",
            fa: "هستم",
            finglish: "Hastam",
            phonetic: "has-TAM",
            lessonId: "module2-lesson1"
          }
        ],
        steps: [
          {
            type: "welcome",
            title: "Where Are You From?",
            description: "Learn essential phrases for talking about your origins and asking others where they're from.",
            points: 0,
            data: {
              objectives: [
                "Ask where someone is from",
                "Say where you are from", 
                "Use location words in conversation",
                "Combine greetings with origin questions"
              ],
              lessonType: "origins"
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
              prompt: "What does 'chi' mean?",
              options: ["What", "Where", "Hello", "From"],
              correct: 0
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "koja",
              distractors: ["chi", "chiye", "esm"]
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "az"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "hastid"
            }
          },
          {
            type: "flashcard",
            points: 1,
            data: {
              vocabularyId: "hastam"
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Az", slotId: "slot1" },
                { id: "word2", text: "Hastid", slotId: "slot2" },
                { id: "word3", text: "Hastam", slotId: "slot3" },
                { id: "word4", text: "Koja", slotId: "slot4" }
              ],
              slots: [
                { id: "slot1", text: "From" },
                { id: "slot2", text: "You Are" },
                { id: "slot3", text: "I Am" },
                { id: "slot4", text: "Where" }
              ]
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Shoma az koja hastid",
              expectedTranslation: "Where are you from"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'esm' mean?",
              options: ["Name", "Where", "From", "Hello"],
              correct: 0
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Man az Iran hastam",
              expectedTranslation: "I am from Iran"
            }
          },
          {
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Shoma koja hastid",
              expectedTranslation: "Where are you"
            }
          },
          {
            type: "quiz",
            points: 2,
            data: {
              prompt: "What does 'az' mean?",
              options: ["From", "Where", "You are", "What"],
              correct: 0
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "chetori",
              distractors: ["koja", "hastam", "az"]
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khoshbakhtam",
              distractors: ["hastid", "koja", "esm"]
            }
          },
          {
            type: "matching",
            points: 3,
            data: {
              words: [
                { id: "word1", text: "Salam", slotId: "slot1" },
                { id: "word2", text: "Khodafez", slotId: "slot2" },
                { id: "word3", text: "Khosh Amadid", slotId: "slot3" },
                { id: "word4", text: "Hastid", slotId: "slot4" },
                { id: "word5", text: "Hastam", slotId: "slot5" }
              ],
              slots: [
                { id: "slot1", text: "Hello" },
                { id: "slot2", text: "Bye" },
                { id: "slot3", text: "Welcome" },
                { id: "slot4", text: "You Are" },
                { id: "slot5", text: "I Am" }
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
                { id: "man", text: "Man", translation: "I" },
                { id: "az", text: "Az", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "hastid", text: "Hastid", translation: "You are" },
                { id: "man2", text: "Man", translation: "I" },
                { id: "az2", text: "Az", translation: "From" }
              ],
              targetWords: ["salam", "esme", "man", "user-name", "man2", "az", "iran", "hastam", "shoma", "az2", "koja", "hastid"],
              title: "Your Origin Introduction",
              successMessage: "Perfect! You can now introduce yourself and ask about origins!",
              incorrectMessage: "Almost there—let's practice that conversation flow again!",
              conversationFlow: {
                description: "A complete introduction with origin",
                expectedPhrase: "Hello, my name is {name}. I am from Iran. Where are you from?",
                persianSequence: ["salam", "esme", "man", "user-name", "man2", "az", "iran", "hastam", "shoma", "az2", "koja", "hastid"]
              }
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