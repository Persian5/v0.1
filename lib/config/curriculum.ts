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
            type: "text-sequence",
            points: 3,
            data: {
              finglishText: "Salam khosh amadid",
              expectedTranslation: "Hello Welcome",
              maxWordBankSize: 10
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
            type: "audio-sequence",
            points: 3,
            data: {
              sequence: ["khosh_amadid", "chetori"],
              expectedTranslation: "Welcome How are you"
            }
          },
          {
            type: "audio-meaning",
            points: 2,
            data: {
              vocabularyId: "khodafez",
              distractors: ["salam", "khosh_amadid", "khoobam"]
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
    title: "Module 2: Responses & Feelings",
    description: "Learn to express how you feel and respond naturally. Master essential phrases for describing your state and using intensifiers.",
    emoji: "😊",
    lessonCount: 6,
    estimatedTime: "100 minutes",
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
            id: "ahle_from",
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
              vocabularyId: "ahle_from"
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
              vocabularyId: "ahle_from",
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
              sequence: ["shoma", "ahle_from", "koja", "hasti"],
              expectedTranslation: "where are you from"
            }
          },
          {
            type: "final",
            points: 4,
            data: {
              words: [
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "ahle_from_1", text: "Ahle", translation: "From" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "hasti", text: "Hasti", translation: "You are" },
                { id: "man", text: "Man", translation: "I" },
                { id: "ahle_from_2", text: "Ahle", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" }
              ],
              targetWords: ["shoma", "ahle_from_1", "koja", "hasti", "man", "ahle_from_2", "iran", "hastam"],
              title: "Where Are You From?",
              successMessage: "Excellent! You can now ask and answer where someone is from!",
              incorrectMessage: "Almost there—let's practice that location conversation again!",
              conversationFlow: {
                description: "A complete conversation about origins",
                expectedPhrase: "where are you from? I am from Iran",
                persianSequence: ["shoma", "ahle_from_1", "koja", "hasti", "man", "ahle_from_2", "iran", "hastam"]
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
        reviewVocabulary: ["salam", "koja", "ahle_from", "man", "shoma", "khoobam"],
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
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "man", "shoma", "esm", "baleh", "na", "khoob", "hast", "neest", "hastam", "hasti", "kheily", "koja", "ahle_from", "dar", "zendegi", "mikonam", "mikoni", "iran", "amrika", "khoshbakhtam", "chiye"],
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
                { id: "ahle_from", text: "Ahle", translation: "From" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "vali", text: "Vali", translation: "But" },
                { id: "dar", text: "Dar", translation: "In" },
                { id: "amrika", text: "Amrika", translation: "America" },
                { id: "zendegi", text: "Zendegi", translation: "Live" },
                { id: "mikonam", text: "Mikonam", translation: "I do" }
              ],
              targetWords: ["man", "ahle_from", "iran", "hastam", "vali", "dar", "amrika", "zendegi", "mikonam"],
              title: "Say It Naturally",
              successMessage: "Perfect! You connected ideas naturally!",
              incorrectMessage: "Almost—watch where vali goes for contrast!",
              conversationFlow: {
                description: "Express origin and residence with contrast",
                expectedPhrase: "I am from Iran but I live in America",
                persianSequence: ["man", "ahle_from", "iran", "hastam", "vali", "dar", "amrika", "zendegi", "mikonam"]
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
        reviewVocabulary: ["salam", "chetori", "khoobam", "merci", "khodafez", "baleh", "na", "man", "shoma", "khoob", "hastam", "hasti", "neestam", "neesti", "kheily", "va", "ham", "vali", "ahle_from", "koja", "dar", "zendegi", "mikonam", "mikoni", "iran", "amrika", "esme", "chiye", "khoshbakhtam"],
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
              sequence: ["PLACEHOLDER_greeting_conversation"],
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
              sequence: ["PLACEHOLDER_live_in_america"],
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
              sequence: ["PLACEHOLDER_whats_your_name"],
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
                { id: "man", text: "Man", translation: "I" },
                { id: "kheily", text: "Kheily", translation: "Very" },
                { id: "khoobam", text: "Khoobam", translation: "I am good" },
                { id: "merci", text: "Merci", translation: "Thank you" },
                { id: "shoma", text: "Shoma", translation: "You" },
                { id: "ahle_from", text: "Ahle", translation: "From" },
                { id: "koja", text: "Koja", translation: "Where" },
                { id: "hasti", text: "Hasti", translation: "You are" },
                { id: "dar", text: "Dar", translation: "In" },
                { id: "amrika", text: "Amrika", translation: "America" },
                { id: "zendegi", text: "Zendegi", translation: "Live" },
                { id: "mikonam", text: "Mikonam", translation: "I do" },
                { id: "vali", text: "Vali", translation: "But" },
                { id: "iran", text: "Iran", translation: "Iran" },
                { id: "hastam", text: "Hastam", translation: "I am" },
                { id: "khodafez", text: "Khodafez", translation: "Goodbye" }
              ],
              targetWords: ["salam", "chetori", "man", "kheily", "khoobam", "merci", "shoma", "ahle_from", "koja", "hasti", "man", "dar", "amrika", "zendegi", "mikonam", "vali", "ahle_from", "iran", "hastam", "khodafez"],
              title: "Complete Conversation",
              successMessage: "Amazing! You've mastered all of Module 2!",
              incorrectMessage: "Almost there—review the order and try again!",
              conversationFlow: {
                description: "A complete conversation using everything from Module 2",
                expectedPhrase: "Hello, how are you? I am very good, thank you. Where are you from? I live in America, but I am from Iran. Goodbye.",
                persianSequence: ["salam", "chetori", "man", "kheily", "khoobam", "merci", "shoma", "ahle_from", "koja", "hasti", "man", "dar", "amrika", "zendegi", "mikonam", "vali", "ahle_from", "iran", "hastam", "khodafez"]
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
    requiresPremium: true,
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