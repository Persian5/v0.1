import { Module, LessonStep, VocabularyItem } from "../types";
import { ConversationFlowService } from "../services/conversation-flow-service";
import { generateGrammarOptions } from "../utils/grammar-options";
import { vocabQuiz, flashcard, input, audioMeaning, audioSequence, textSequence, matching, final } from "./curriculum-helpers";
import { createVocabulary } from "./vocabulary-builder";

// Define all modules, lessons, and their content
export const curriculumData: Module[] = [
  {
    id: "module1",
    title: "Module 1: Greetings & Politeness",
    description: "Start a conversation the right way. Learn how to say hello, goodbye, thank you, please, and the difference between formal and casual tone.",
    emoji: "👋",
    lessonCount: 6,
    estimatedTime: "30 minutes",
    available: true,
    lessons: [
      // Module 1 Lesson 1
      (() => {
        const vocabulary = createVocabulary("module1-lesson1", {
          ids: ["salam", "chetori", "khodafez", "merci"],
          en: ["Hello", "How Are You?", "Goodbye", "Thank You"],
          fa: ["سلام", "چطوری", "خداحافظ", "مرسی"],
          finglish: ["Salam", "Chetori", "Khodafez", "Merci"],
          phonetic: ["sah-LUHM", "che-TOH-ree", "kho-DUH-fez", "mer-SEE"]
        });
        
        return {
          id: "lesson1",
          title: "Basic Persian Greetings",
          description: "Learn essential greetings and how to say hello in different contexts",
          emoji: "",
          progress: 0,
          locked: false,
          vocabulary,
        steps: [
          {
            type: "welcome",
            title: "Basic Persian Greetings",
            description: "Learn the four essential Persian greetings used in everyday interactions.",
            points: 0,
            data: {
              objectives: [
                "Say hello",
                "Ask how are you",
                "Say thank you",
                "Say goodbye",
                "Recognize these phrases when you hear them"
              ],
              lessonType: "greetings",
              sectionDescription: "By the end of this lesson You'll be able to understand and use the core greetings Iranians say every day, the perfect foundation before building real conversations."
            }
          },
          flashcard(vocabulary, "salam"),
          flashcard(vocabulary, "chetori"),
          vocabQuiz(vocabulary, "salam", "vocab-reverse"),
          textSequence("Salam chetori", "Hello how are you"),
          audioMeaning("chetori"),
        vocabQuiz(vocabulary, "salam", "vocab-normal"),
          flashcard(vocabulary, "khodafez"),
          audioMeaning("salam"),
          textSequence("Salam khodafez", "Hello goodbye"),
          audioMeaning("khodafez"),
        vocabQuiz(vocabulary, "chetori", "vocab-reverse"),
        flashcard(vocabulary, "merci"),
        audioMeaning("merci"),
        audioSequence(["merci", "khodafez"], "Thank you goodbye"),
          input("How do you say 'Goodbye' in Persian?", "Khodafez"),
          matching(["merci", "khodafez", "salam", "chetori"]),
          final(vocabulary, ["salam", "chetori", "merci", "khodafez"], {
            conversationFlow: {
              description: "A polite greeting conversation",
              expectedPhrase: "Hello {userFirstName}, how are you, thank you, goodbye"
            },
            title: "Your First Conversation"
          })
        ]
        };
      })(),
      // Module 1 Lesson 2
      (() => {
        const vocabulary = createVocabulary("module1-lesson2", {
          ids: ["khoob", "khoobam"],
          en: ["Good", "I'm Good"],
          fa: ["خوب", "خوبم"],
          finglish: ["Khoob", "Khoobam"],
          phonetic: ["Kh-oob", "khoo-BAHM"]
        });
        
        return {
          id: "lesson2",
          title: "Basic Responses",
          description: "Today you'll learn how to answer Chetori? ('How are you?') like a native Persian speaker. By the end of this lesson, you can tell someone you're good and understand when they say it to you.",
          emoji: "🙏",
          progress: 0,
          locked: false,
          vocabulary,
        steps: [
          {
            type: "welcome",
            title: "Basic Responses",
            description: "Today you'll learn how to answer Chetori? ('How are you?') like a native Persian speaker. By the end of this lesson, you can tell someone you're good and understand when they say it to you.",
            points: 0,
            data: {
              objectives: [
                "Learn the word \"khoob\" (good)",
                "Learn \"khoobam\" (I'm good)",
                "Respond naturally to \"chetori?\"",
                "Continue reviewing Lesson 1 greetings"
              ],
              lessonType: "responses"
            }
          },
          // Review Lesson 1 vocabulary - VocabularyService looks it up automatically
          matching(["salam", "chetori", "merci", "khodafez"]),
          audioMeaning("chetori"),
          audioSequence(["salam", "chetori"], "Hello how are you"),
        flashcard(vocabulary, "khoob"),
        vocabQuiz(vocabulary, "khoob", "vocab-reverse"),
        audioMeaning("salam"),
        flashcard(vocabulary, "khoobam"),
        vocabQuiz(vocabulary, "khoobam", "vocab-normal"),
        audioMeaning("khoobam"),
        matching(["khoob", "khoobam"]),
          textSequence("Salam chetori khoobam", "Hello how are you I'm good"),
          audioSequence(["khoobam", "merci"], "I'm good thank you"),
          vocabQuiz(vocabulary, "khoobam", "vocab-reverse"),
          matching(["khoob", "khoobam", "chetori", "salam"]),
        audioMeaning("merci"),
          final(vocabulary, ["salam", "chetori", "khoobam", "merci", "khodafez"], {
            conversationFlow: {
              description: "A polite conversation",
              expectedPhrase: "Hello, how are you? I'm good, thank you, goodbye"
            },
            title: "Your Polite Conversation"
          })
        ]
        };
      })(),
      // Module 1 Lesson 3
      (() => {
        const vocabulary = createVocabulary("module1-lesson3", {
          ids: ["baleh", "na"],
          en: ["Yes", "No"],
          fa: ["بله", "نه"],
          finglish: ["Baleh", "Na"],
          phonetic: ["ba-LEH", "nah"]
        });
        
        return {
          id: "lesson3",
          title: "Yes, No & Basic Responses",
          description: "Today you'll learn how to say yes and no in Persian, and use them in everyday conversations.",
          emoji: "👋",
          progress: 0,
          locked: false,
          vocabulary,
        steps: [
          {
            type: "welcome",
            title: "Yes, No & Basic Responses",
            description: "Today you'll learn how to say yes and no in Persian, and use them in everyday conversations.",
            points: 0,
            data: {
              objectives: [
                "Learn 'yes' and 'no'",
                "Use basic responses",
                "Combine yes/no with greetings",
                "Practice natural conversation flow"
              ],
              lessonType: "responses"
            }
          },
          textSequence("Salam, Chetori, Khoobam, Merci", "Hello, how are you, I'm good, thank you"),
          audioMeaning("khodafez"),
          flashcard(vocabulary, "baleh"),
          flashcard(vocabulary, "na"),
          matching(["baleh", "na"]),
          audioMeaning("baleh"),
          matching(["khodafez", "salam", "khoobam", "chetori"]),
          audioMeaning("na"),
          vocabQuiz(vocabulary, "baleh", "vocab-normal"),
          audioSequence(["baleh", "merci"], "Yes thank you"),
          audioMeaning("khoob"),
          input("How do you say 'Yes' in Persian?", "Baleh"),
          vocabQuiz(vocabulary, "na", "vocab-normal"),
          audioSequence(["na", "merci"], "No thank you"),
          textSequence("Salam Chetori", "Hello how are you"),
          audioSequence(["khoobam", "merci"], "I'm good thank you"),
          vocabQuiz(vocabulary, "khoob", "vocab-reverse"),
          matching(["baleh", "na", "chetori", "khodafez"]),
          textSequence("Na Merci Khoobam", "No thank you I'm good"),
          final(vocabulary, ["salam", "na", "merci", "khoobam", "khodafez"], {
            conversationFlow: {
              description: "A conversation using yes, no, and basic responses",
              expectedPhrase: "Hello, no, thank you, I'm good, goodbye"
            },
            title: "Your Basic Conversation"
          })
        ]
        };
      })(),
      // Module 1 Lesson 4
      (() => {
        const vocabulary = createVocabulary("module1-lesson4", {
          ids: ["man", "shoma", "esm", "esme", "chi", "chiye"],
          en: ["I / Me", "You", "Name", "Name of", "What", "What is / What is it"],
          fa: ["من", "شما", "اسم", "اسمه", "چی", "چیه"],
          finglish: ["Man", "Shoma", "Esm", "Esme", "Chi", "Chiye"],
          phonetic: ["man", "sho-MUH", "esm", "es-MEH", "chee", "chee-YEH"]
        });
        
        return {
          id: "lesson4",
          title: "Basic Pronouns and Question Words",
          description: "Today you'll learn how to introduce yourself in Persian using simple words like \"I,\" \"you,\" and \"name.\" By the end of this lesson, you'll understand and respond to the question, \"What is your name?\"",
          emoji: "🧑‍💼",
          progress: 0,
          locked: false,
          vocabulary,
        steps: [
          {
            type: "welcome",
            title: "Basic Pronouns and Question Words",
            description: "Today you'll learn how to introduce yourself in Persian using simple words like \"I,\" \"you,\" and \"name.\" By the end of this lesson, you'll understand and respond to the question, \"What is your name?\"",
            points: 0,
            data: {
              objectives: [
                "Learn pronouns I and You",
                "Learn question words What and Name",
                "Ask and answer 'What is your name?'",
                "Build simple introduction sentences"
              ],
              lessonType: "introductions"
            }
          },
          audioSequence(["salam", "chetori", "khoobam", "merci"], "Hello how are you I'm good thank you"),
          matching(["baleh", "na", "khodafez", "khoob"]),
          audioMeaning("chetori"),
          flashcard(vocabulary, "man"),
          flashcard(vocabulary, "shoma"),
          vocabQuiz(vocabulary, "man", "vocab-normal"),
          matching(["man", "shoma", "salam", "merci"]),
          audioMeaning("shoma"),
          flashcard(vocabulary, "esm"),
          flashcard(vocabulary, "esme"),
          matching(["man", "shoma", "esm", "esme"]),
          audioSequence(["esme", "man"], "My name"),
          textSequence("Esme Shoma", "Your name"),
          audioMeaning("esm"),
          flashcard(vocabulary, "chi"),
          vocabQuiz(vocabulary, "chi", "vocab-reverse"),
          flashcard(vocabulary, "chiye"),
          vocabQuiz(vocabulary, "chiye", "vocab-normal"),
          matching(["esme", "shoma", "chiye", "man"]),
          textSequence("Esme Shoma Chiye", "What is your name"),
          audioSequence(["esme", "shoma", "chiye"], "What is your name"),
          textSequence("Esme Man", "My name"),
          input("How do you say 'I' in Persian?", "Man"),
          audioMeaning("khodafez"),
          final(vocabulary, ["salam", "esme", "shoma", "chiye"], {
            conversationFlow: {
              description: "A polite introduction conversation asking for a name",
              expectedPhrase: "Hello, what is your name?"
            },
            title: "Your Introduction"
          })
        ]
        };
      })(),
      // Module 1 Lesson 5 - The -am Ending (I Am)
      (() => {
        const vocabulary = createVocabulary("module1-lesson5", {
          ids: ["bad"],
          en: ["Bad"],
          fa: ["بد"],
          finglish: ["Bad"],
          phonetic: ["bad"]
        });

        // Add semantic group for "bad"
        vocabulary[0].semanticGroup = "feelings";

        return {
          id: "lesson5",
          title: "Lesson 5: The -am Ending (I Am)",
          description: "Today, you'll learn the Persian ending –am, which means 'I am.' By the end of this lesson, you'll be able to say 'I'm good' and 'I'm bad' naturally.",
          emoji: "😊",
          progress: 0,
          locked: false,
          vocabulary,
          steps: [
            // 1. Welcome Intro
            {
              type: "welcome",
              title: "The -am Ending (I Am)",
              description: "Today, you'll learn the Persian ending –am, which means 'I am.' By the end of this lesson, you'll be able to say 'I'm good' and 'I'm bad' naturally.",
              points: 0,
              data: {
                objectives: [
                  "Learn the Persian ending –am (\"I am\")",
                  "Say \"I'm good\" and \"I'm bad\"",
                  "Review greetings and basic conversation flow"
                ],
                lessonType: "grammar"
              }
            },
            // 2. Audio Sequence: Salam, Chetori
            audioSequence(["salam", "chetori"], "Hello, how are you"),
            // 3. Matching: Salam Merci Khodafez Chetori
            matching(["salam", "merci", "khodafez", "chetori"]),
            // 4. Flashcard: Bad
            flashcard(vocabulary, "bad"),
            // 5. MC Reverse: Bad (What does "bad" mean)
            vocabQuiz(vocabulary, "bad", "vocab-normal"),
            // 6. Matching: Bad Khoob Na Baleh
            matching(["bad", "khoob", "na", "baleh"]),
            // 7. Grammar Intro: -am = I am
            {
              type: "grammar-intro",
              points: 1,
              data: {
                conceptId: "suffix-am",
                title: "-am = I am",
                description: "In Persian, you add –am to adjectives to say 'I am …'. For example: khoob → khoobam ('I'm good'), bad → badam ('I'm bad').",
                rule: "Add -am to adjectives to say 'I am'",
                visualType: "tree",
                visualData: {
                  base: "khoob",
                  transformations: [
                    { label: "-am", result: "khoobam", meaning: "I'm good" },
                    { label: "-am (bad)", result: "badam", meaning: "I'm bad" }
                  ]
                }
              }
            },
            // 8. Grammar Fill in the suffix (Bad) - (am) suffix empty
            {
              type: "grammar-fill-blank",
              points: 1,
              data: {
                conceptId: "suffix-am-bad",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
                exercises: [
                  {
                    sentence: "Bad-___",
                    translation: "I'm bad",
                    blankPosition: 4,
                    correctAnswer: "am",
                    suffixOptions: [
                      { id: "suffix-am", text: "-am" },
                      { id: "suffix-i", text: "-i" },
                      { id: "suffix-e", text: "-e" },
                      { id: "suffix-et", text: "-et" }
                    ]
                  }
                ]
              }
            },
            // 9. Grammar Fill in the Suffix + Vocab (Khoob) + (Am) both empty
            {
              type: "grammar-fill-blank",
              points: 1,
              data: {
                conceptId: "suffix-am-khoob",
                label: "FILL IN THE SUFFIX + VOCAB",
                subtitle: "Choose the correct word and ending",
                exercises: [
                  {
                    sentence: "___-___",
                    translation: "I'm good",
                    blankPosition: 0,
                    correctAnswer: "Khoob-am",
                    grammarBaseWord: "Khoob",
                    grammarSuffix: "am",
                    suffixOptions: [
                      { id: "word-khoob", text: "Khoob" },
                      { id: "word-bad", text: "Bad" }
                    ],
                    vocabOptions: [
                      { id: "suffix-am", text: "-am" },
                      { id: "suffix-i", text: "-i" },
                      { id: "suffix-e", text: "-e" },
                      { id: "suffix-et", text: "-et" }
                    ]
                  }
                ]
              }
            },
            // 10. Matching: Man Shoma Khoobam Badam
            matching([
              "man",
              "shoma",
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const
            ]),
            // 11. Audio Meaning: Badam
            audioMeaning({ kind: "suffix", baseId: "bad", suffixId: "am" } as const),
            // 12. Text Sequence: Na, Badam (GRAMMAR FORMS: Now uses lexemeRef)
            textSequence(
              "Na, Badam", 
              "No, I'm bad",
              ["na", { kind: "suffix", baseId: "bad", suffixId: "am" } as const]
            ),
            // 13. Audio Meaning: Khoobam
            audioMeaning({ kind: "suffix", baseId: "khoob", suffixId: "am" } as const),
            // 14. Audio Sequence: Khoobam, Merci
            audioSequence([
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              "merci"
            ], "I'm good, thank you"),
            // 15. Matching: Chi, Chetori, Esm, Esme
            matching(["chi", "chetori", "esm", "esme"]),
            // 16. MC Quiz: Khoob
            vocabQuiz(vocabulary, "khoob", "vocab-normal"),
            // 17. MC Quiz: Khoobam - IMPORTANT: This uses grammar quiz for "I'm good"
            {
              type: "quiz",
              points: 2,
              data: {
                prompt: "What does 'Khoobam' mean?",
                options: ["I'm good", "I'm bad", "Good", "You're good"],
                correct: 0,
                vocabularyId: "khoob",
                quizType: "grammar"
              }
            },
            // 18. Audio Meaning: Man
            audioMeaning("man"),
            // 19. Final Challenge: Salam, chetori? Khoobam merci
            final(vocabulary, [
              "salam",
              "chetori",
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              "merci"
            ], {
              conversationFlow: {
                description: "Greet someone and respond that you're doing well.",
                expectedPhrase: "Hello, how are you? I'm good, thank you"
              },
              title: "Your Mini Conversation"
            })
          ]
        };
      })(),
      {
        id: "lesson6",
        title: "Story Mode: Meeting Someone New",
        description: "Practice your greetings in a real conversation with Sara at a friend's house",
        emoji: "🗣️",
        locked: false,
        vocabulary: [], // Uses vocabulary from previous lessons
        steps: [
          {
            type: "story-conversation",
            points: 6, // XP awarded once at story completion (idempotent)
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
                      text: "Khodafez",
                      vocabularyUsed: ["khodafez"],
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
                      text: "Khoobam, merci!",
                      vocabularyUsed: ["khoobam", "merci"],
                      isCorrect: true,
                      points: 1,
                      responseMessage: ""
                    },
                    {
                      id: "choice2b",
                      text: "Baleh, merci",
                      vocabularyUsed: ["baleh", "merci"],
                      isCorrect: false,
                      points: 0
                    },
                    {
                      id: "choice2c",
                      text: "Khoobi, merci",
                      vocabularyUsed: ["khoobi", "merci"],
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
                      text: "Khosh amadid",
                      vocabularyUsed: ["khosh_amadid"],
                      isCorrect: false,
                      points: 0
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
    lessonCount: 4,
    estimatedTime: "60 minutes",
    available: true,
    requiresPremium: true,
    lessons: [
      // Module 2 Lesson 1: Introducing Yourself with Ezafe
      (() => {
        // No vocabulary needed - names are used as plain strings, not grammar forms
        const vocabulary: VocabularyItem[] = [];

        return {
        id: "lesson1",
          title: "Introducing Yourself",
          description: "Today you'll learn how to introduce yourself in Persian using \"esme man … e\" and reinforce the identity-question pattern introduced in Module 1.",
          emoji: "👋",
        progress: 0,
        locked: false,
          vocabulary,
        steps: [
            // 1. Welcome Intro
          {
            type: "welcome",
              title: "Introducing Yourself",
              description: "Today you'll learn how to introduce yourself in Persian. You already know how to ask, \"What is your name?\" Now it's time to answer it naturally like a native.",
            points: 0,
            data: {
              objectives: [
                  "Learn the ezafe connector (-e)",
                  "Say \"my name is...\" naturally",
                  "Answer \"What is your name?\" confidently",
                  "Use names in introductions"
                ],
                lessonType: "introductions"
              }
            },
            // 2. Audio Sequence: Salam, esm|e shoma chiye
            audioSequence(
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ],
              "Hello what is your name"
            ),
            // 3. Matching: Man, Shoma, Chi, Chiye
            matching(["man", "shoma", "chi", "chiye"]),
            // 4. Audio Meaning: Khodafez
            audioMeaning("khodafez"),
            // 5. Grammar Intro: Ezafe -e
            {
              type: "grammar-intro",
              points: 1,
              data: {
                conceptId: "ezafe-e",
                title: "Ezafe: -e = belonging",
                description: "In Persian, you add -e to connect words that belong together. For example: esm → esme ('name of'), esme man ('my name'), esme shoma ('your name').",
                rule: "Add -e to connect words that belong together",
                visualType: "tree",
                visualData: {
                  base: "esm",
                  transformations: [
                    { label: "-e", result: "esme", meaning: "name of" },
                    { label: "-e + man", result: "esme man", meaning: "my name" },
                    { label: "-e + shoma", result: "esme shoma", meaning: "your name" }
                  ]
                }
              }
            },
            // 6. Grammar Fill in the Blank: Esm-___ man (testing for -e)
          {
            type: "grammar-fill-blank",
            points: 1,
            data: {
                conceptId: "ezafe-e-esm",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
              exercises: [
                {
                    sentence: "Esm-___ man",
                    translation: "My name",
                    blankPosition: 4,
                    correctAnswer: "e",
                  suffixOptions: [
                      { id: "suffix-e", text: "-e" },
                    { id: "suffix-am", text: "-am" },
                    { id: "suffix-i", text: "-i" },
                    { id: "suffix-et", text: "-et" }
                  ]
                }
              ]
            }
          },
            // 7. Audio Meaning: Esm|e
            audioMeaning({ kind: "suffix", baseId: "esm", suffixId: "e" } as const),
            // 8. Text Sequence: Esm|e Man
            textSequence(
              "Esme Man",
              "My name",
              [{ kind: "suffix", baseId: "esm", suffixId: "e" } as const, "man"]
            ),
            // 9. Audio Meaning: Esm|e Shoma
            audioMeaning({ kind: "suffix", baseId: "esm", suffixId: "e" } as const),
            // 10. Text Sequence: Esm|e Shoma Chiye
            textSequence(
              "Esme Shoma Chiye",
              "What is your name",
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ]
            ),
            // 11. Text Sequence: Esm|e Man {userFirstName}-e (name as plain string, no grammar tracking)
            textSequence(
              "Esme Man {userFirstName}-e",
              "My name is {userFirstName}",
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "{userFirstName}-e" // Plain string - name with ezafe connector (not tracked as grammar form)
              ]
            ),
            // 12. Matching: Baleh, Na, Esm|e, Esm
            matching([
              "baleh",
              "na",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "esm"
            ]),
            // 13. MC Quiz: What does "esm|e man" mean
            {
              type: "quiz",
            points: 2,
            data: {
                prompt: "What does 'Esme man' mean?",
                options: ["My name", "Your name", "Name", "What is your name"],
                correct: 0,
                quizType: "grammar",
                lexemeRef: { kind: "suffix", baseId: "esm", suffixId: "e" } as const
            }
          },
            // 14. Reverse MC: Which phrase means "your name"
            vocabQuiz(
              vocabulary,
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "vocab-reverse"
            ),
            // 15. Audio Sequence: Salam chetori Khoob|am merci
            audioSequence(
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ],
              "Hello how are you I'm good thank you"
            ),
            // 16. Input: Esm
            input(
              "How do you say 'name' in Persian?",
              "Esm",
              2,
              "esm"
            ),
            // 17. Audio Meaning: Bad|am
            audioMeaning({ kind: "suffix", baseId: "bad", suffixId: "am" } as const),
            // 18. Input: Khoob
            input(
              "How do you say 'good' in Persian?",
              "Khoob",
              2,
              "khoob"
            ),
            // 19. Text Sequence: Esm|e man chiye
            textSequence(
              "Esme Man Chiye",
              "What is my name",
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "chiye"
              ]
            ),
            // 20. Matching: Esm, Esm|e, Man, Shoma
            matching([
              "esm",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "man",
              "shoma"
            ]),
            // 21. Final Challenge: Salam Esm|e Shoma chiye, esm|e man {userFirstName}-e Khodafez (name as plain string)
            final(vocabulary, [
              "salam",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "shoma",
              "chiye",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "man",
              "{userFirstName}-e", // Plain string - name with ezafe connector (not tracked as grammar form)
              "khodafez"
            ], {
              conversationFlow: {
                description: "A complete introduction conversation",
                expectedPhrase: "Hello, what is your name? My name is {userFirstName}, goodbye"
              },
              title: "Your Introduction"
            })
        ]
        };
      })(),
      // Module 2 Lesson 2: Full Introductions
      (() => {
        const vocabulary = createVocabulary("module2-lesson2", {
          ids: ["khoshbakhtam"],
          en: ["Nice to Meet You"],
          fa: ["خوشبختم"],
          finglish: ["Khoshbakhtam"],
          phonetic: ["Khosh-bakh-TAM"]
        });

        return {
          id: "lesson2",
          title: "Full Introductions",
          description: "Today you'll learn how to complete a basic introduction using: \"My name is …\" \"Nice to meet you\" Recognize full introduction exchanges in listening and text Build comfort with ezafe + name structure",
          emoji: "👋",
          progress: 0,
          locked: false,
          vocabulary,
          steps: [
            // 1. Welcome Intro
            {
              type: "welcome",
              title: "Full Introductions",
              description: "Today you'll learn how to complete your introduction in Persian. You already know how to say your name, now let's sound natural and polite when meeting someone.",
              points: 0,
              data: {
                objectives: [
                  "Say your full introduction confidently",
                  "Use \"Nice to meet you\" naturally",
                  "Recognize full introduction exchanges",
                  "Build comfort with ezafe + name structure"
                ],
                lessonType: "introductions"
              }
            },
            // 2. Audio Sequence: Salam, esm|e shoma chiye
            audioSequence(
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ],
              "Hello what is your name"
            ),
            // 3. Matching: Man, Shoma, Esm, Esm|e
            matching([
              "man",
              "shoma",
              "esm",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const
            ]),
            // 4. Audio Meaning: Chiye
            audioMeaning("chiye"),
            // 5. Flashcard: Khoshbakhtam
            flashcard(vocabulary, "khoshbakhtam"),
            // 6. MC Quiz: What does "Khoshbakhtam" mean?
            vocabQuiz(vocabulary, "khoshbakhtam", "vocab-normal"),
            // 7. Text Sequence: Esm|e man (user firstName)-e khoshbakhtam
            textSequence(
              "Esme man {userFirstName}-e khoshbakhtam",
              "My name is {userFirstName} nice to meet you",
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "khoshbakhtam"
              ]
            ),
            // 8. Audio Meaning: Esm
            audioMeaning("esm"),
            // 9. Text Sequence: Salam, esm|e man (user firstName)-e
            textSequence(
              "Salam, esme man {userFirstName}-e",
              "Hello my name is {userFirstName}",
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man"
              ]
            ),
            // 10. Matching: Esm|e, Khoshbakhtam Esm|e Man Shoma
            matching([
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "khoshbakhtam",
              "man",
              "shoma"
            ]),
            // 11. Audio Sequence: Salam chetori khoob|am merci
            audioSequence(
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ],
              "Hello how are you I'm good thank you"
            ),
            // 12. Reverse Quiz: Which word means "Nice to Meet You"
            vocabQuiz(vocabulary, "khoshbakhtam", "vocab-reverse"),
            // 13. Audio Sequence: Esm|e shoma chiye
            audioSequence(
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ],
              "What is your name"
            ),
            // 14. Audio Sequence: Esm|e man
            audioSequence(
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man"
              ],
              "My name"
            ),
            // 15. Text Sequence: Na merci khoob|am, khodafez
            textSequence(
              "Na merci khoobam, khodafez",
              "No thank you I'm good goodbye",
              [
                "na",
                "merci",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "khodafez"
              ]
            ),
            // 16. MC Quiz: Khoob
            vocabQuiz([], "khoob", "vocab-normal"),
            // 17. Reverse Quiz: Bad|am
            vocabQuiz([], { kind: "suffix", baseId: "bad", suffixId: "am" } as const, "vocab-reverse"),
            // 18. Text Sequence: Baleh merci
            textSequence(
              "Baleh merci",
              "Yes thank you",
              ["baleh", "merci"]
            ),
            // 19. Input: Baleh
            input(
              "How do you say 'Yes' in Persian?",
              "Baleh",
              2,
              "baleh"
            ),
            // 20. Text Sequence: Salam chetori khoob|am merci
            textSequence(
              "Salam chetori khoobam merci",
              "Hello how are you I'm good thank you",
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ]
            ),
            // 21. Final Challenge: Salam esm|e man (userFirstName)-e, khoshbakhtam khodafez
            final(vocabulary, [
              "salam",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "man",
              "{userFirstName}-e", // Plain string - name with ezafe connector
              "khoshbakhtam",
              "khodafez"
            ], {
              conversationFlow: {
                description: "A complete introduction conversation",
                expectedPhrase: "Hello my name is {userFirstName} nice to meet you goodbye"
              },
              title: "Your Full Introduction"
            })
          ]
        };
      })(),
      // Module 2 Lesson 3: Nice to Meet You Too
      (() => {
        const vocabulary = createVocabulary("module2-lesson3", {
          ids: ["ham"],
          en: ["Too / Also"],
          fa: ["هم"],
          finglish: ["Ham"],
          phonetic: ["HAHM"]
        });

        return {
          id: "lesson3",
          title: "Nice to Meet You Too",
          description: "Today you'll practice real conversations. You'll learn how to reply when someone says \"Khoshbakhtam\" and you will build complete introductions with simple, natural responses.",
          emoji: "👋",
          progress: 0,
          locked: false,
          vocabulary,
          steps: [
            // 1. Welcome Intro
            {
              type: "welcome",
              title: "Nice to Meet You Too",
              description: "Today you'll practice real conversations. You'll learn how to reply when someone says \"Khoshbakhtam\" and you will build complete introductions with simple, natural responses.",
              points: 0,
              data: {
                objectives: [
                  "Reply naturally to \"Khoshbakhtam\"",
                  "Use \"ham\" (too/also) in conversations",
                  "Build complete introduction exchanges",
                  "Feel confident in short dialogues"
                ],
                lessonType: "conversations"
              }
            },
            // 2. Audio Sequence: Salam chetori khoob|am merci
            audioSequence(
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ],
              "Hello how are you I'm good thank you"
            ),
            // 3. Audio Meaning: Chetori
            audioMeaning("chetori"),
            // 4. Flashcard: Ham
            flashcard(vocabulary, "ham"),
            // 5. MC Quiz: Ham
            vocabQuiz(vocabulary, "ham", "vocab-normal"),
            // 6. Text Sequence: Man Ham Khoob|am
            textSequence(
              "Man ham khoobam",
              "I'm good too",
              [
                "man",
                "ham",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ]
            ),
            // 7. Matching: Bad|am, Ham, Khoshbakhtam, Khoob|am
            matching([
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const,
              "ham",
              "khoshbakhtam",
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
            ]),
            // 8. Audio Sequence: Esm|e shoma chiye?
            audioSequence(
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ],
              "What is your name"
            ),
            // 9. Text Sequence: Salam Esm|e shoma chiye?
            textSequence(
              "Salam esme shoma chiye?",
              "Hello what is your name",
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ]
            ),
            // 10. Audio Meaning: Esm
            audioMeaning("esm"),
            // 11. Text Sequence: Esm|e man {userFirstName}-e Khoshbakhtam
            textSequence(
              "Esme man {userFirstName}-e khoshbakhtam",
              "My name is {userFirstName} nice to meet you",
              [
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "khoshbakhtam"
              ]
            ),
            // 12. Audio Sequence: Man ham Khoshbakhtam
            audioSequence(
              [
                "man",
                "ham",
                "khoshbakhtam"
              ],
              "Nice to meet you too"
            ),
            // 13. Reverse Quiz: Khoshbakhtam
            vocabQuiz([], "khoshbakhtam", "vocab-reverse"),
            // 14. Audio Sequence: Man ham khoob|am
            audioSequence(
              [
                "man",
                "ham",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ],
              "I'm good too"
            ),
            // 15. Reverse Quiz: Shoma
            vocabQuiz([], "shoma", "vocab-reverse"),
            // 16. Text Sequence: Na, merci
            textSequence(
              "Na, merci",
              "No, thank you",
              ["na", "merci"]
            ),
            // 17. Text Sequence: Baleh Khoob|am, Merci
            textSequence(
              "Baleh khoobam, merci",
              "Yes I'm good, thank you",
              [
                "baleh",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ]
            ),
            // 18. Input Game: Bad|am
            input(
              "How do you say 'I'm bad' in Persian?",
              "bad-am",
              2,
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const
            ),
            // 19. Final Challenge: Salam chetori esm|e man {userFirstName}-e Khoshbakhtam khodafez
            final(vocabulary, [
              "salam",
              "chetori",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "man",
              "{userFirstName}-e", // Plain string - name with ezafe connector
              "khoshbakhtam",
              "khodafez"
            ], {
              conversationFlow: {
                description: "A complete introduction conversation with response",
                expectedPhrase: "Hello how are you my name is {userFirstName} nice to meet you goodbye"
              },
              title: "Your Complete Introduction"
            })
          ]
        };
      })(),
      // Module 2 Lesson 4: The -i Ending (You Are)
      (() => {
        // No vocabulary needed - all are grammar forms
        const vocabulary: VocabularyItem[] = [];

        return {
          id: "lesson4",
          title: "The -i Ending (You Are)",
          description: "Today, you'll learn the Persian ending –i, which means 'you are.' By the end of this lesson, you can ask someone how they're doing using words you already know.",
          emoji: "👋",
          progress: 0,
          locked: false,
          vocabulary,
          steps: [
            // 1. Welcome Intro
            {
              type: "welcome",
              title: "The -i Ending (You Are)",
              description: "Today, you'll learn the Persian ending –i, which means 'you are.' By the end of this lesson, you can ask someone how they're doing using words you already know.",
              points: 0,
              data: {
                objectives: [
                  "Learn the Persian ending –i (\"you are\")",
                  "Ask \"Are you good?\" and \"Are you bad?\"",
                  "Respond naturally to questions about how you are",
                  "Build confidence with question and answer patterns"
                ],
                lessonType: "grammar"
              }
            },
            // 2. Audio Sequence: Salam chetori khoob|am merci
            audioSequence(
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ],
              "Hello how are you I'm good thank you"
            ),
            // 3. Input: khoob|am - separated root + suffix input
            input(
              "How do you say 'I'm good' in Persian?",
              "khoob-am",
              2,
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
            ),
            // 4. Audio Meaning: Baleh
            audioMeaning("baleh"),
            // 5. Matching: Khoob, Khoob|am, Bad, Bad|am
            matching([
              "khoob",
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              "bad",
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const
            ]),
            // 6. Grammar Intro: -i (you are)
            {
              type: "grammar-intro",
              points: 1,
              data: {
                conceptId: "suffix-i",
                title: "-i = you are",
                description: "In Persian, add –i to adjectives to mean you are. As a question: Are you X? As a statement: You are X.",
                rule: "Add -i to adjectives to say 'you are'",
                visualType: "tree",
                visualData: {
                  base: "khoob",
                  transformations: [
                    { label: "-i", result: "khoobi", meaning: "You're good" },
                    { label: "-i (bad)", result: "badi", meaning: "You're bad" }
                  ]
                }
              }
            },
            // 7. Grammar Fill in the Blank: Khoob|i - you are good
            {
              type: "grammar-fill-blank",
              points: 1,
              data: {
                conceptId: "suffix-i-khoob",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
                exercises: [
                  {
                    sentence: "Khoob-___",
                    translation: "You are good",
                    blankPosition: 6,
                    correctAnswer: "i",
                    suffixOptions: [
                      { id: "suffix-i", text: "-i" },
                      { id: "suffix-am", text: "-am" },
                      { id: "suffix-e", text: "-e" },
                      { id: "suffix-et", text: "-et" }
                    ]
                  }
                ]
              }
            },
            // 8. Grammar Fill in the Blank: Bad|i - you are bad (with question mark)
            {
              type: "grammar-fill-blank",
              points: 1,
              data: {
                conceptId: "suffix-i-bad",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
                exercises: [
                  {
                    sentence: "Bad-___?",
                    translation: "Are you bad?",
                    blankPosition: 4,
                    correctAnswer: "i",
                    suffixOptions: [
                      { id: "suffix-i", text: "-i" },
                      { id: "suffix-am", text: "-am" },
                      { id: "suffix-e", text: "-e" },
                      { id: "suffix-et", text: "-et" }
                    ]
                  }
                ]
              }
            },
            // 9. Audio Meaning: Khoob|i
            audioMeaning({ kind: "suffix", baseId: "khoob", suffixId: "i" } as const),
            // 10. Audio Meaning: Bad|am
            audioMeaning({ kind: "suffix", baseId: "bad", suffixId: "am" } as const),
            // 11. Audio Sequence: Baleh Khoob|am
            audioSequence(
              [
                "baleh",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ],
              "Yes I'm good"
            ),
            // 12. Text Sequence: Khoob|i? Na Bad|am
            textSequence(
              "Khoobi? Na badam",
              "Are you good? No I'm bad",
              [
                { kind: "suffix", baseId: "khoob", suffixId: "i" } as const,
                "na",
                { kind: "suffix", baseId: "bad", suffixId: "am" } as const
              ]
            ),
            // 13. Matching: Khoob|i, Bad|i, Bad|am, Khoob|am
            matching([
              { kind: "suffix", baseId: "khoob", suffixId: "i" } as const,
              { kind: "suffix", baseId: "bad", suffixId: "i" } as const,
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const,
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
            ]),
            // 14. Reverse Quiz: Man
            vocabQuiz([], "man", "vocab-reverse"),
            // 15. MC Quiz: Shoma
            vocabQuiz([], "shoma", "vocab-normal"),
            // 16. Text Sequence: Salam shoma khoob|i?
            textSequence(
              "Salam shoma khoobi?",
              "Hello are you good",
              [
                "salam",
                "shoma",
                { kind: "suffix", baseId: "khoob", suffixId: "i" } as const
              ]
            ),
            // 17. Audio Sequence: Khoob|i? Baleh khoob|am
            audioSequence(
              [
                { kind: "suffix", baseId: "khoob", suffixId: "i" } as const,
                "baleh",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ],
              "Are you good? Yes I'm good"
            ),
            // 18. Input Game: Bad|i - separate root and suffix version
            input(
              "How do you say 'You're bad' in Persian?",
              "bad-i",
              2,
              { kind: "suffix", baseId: "bad", suffixId: "i" } as const
            ),
            // 19. Text Sequence: Na merci bad|am
            textSequence(
              "Na merci badam",
              "No thank you I'm bad",
              [
                "na",
                "merci",
                { kind: "suffix", baseId: "bad", suffixId: "am" } as const
              ]
            ),
            // 20. Final Challenge: Salam, shoma khoobi? Na badam, khodafez
            final(vocabulary, [
              "salam",
              "shoma",
              { kind: "suffix", baseId: "khoob", suffixId: "i" } as const,
              "na",
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const,
              "khodafez"
            ], {
              conversationFlow: {
                description: "A complete conversation asking how someone is",
                expectedPhrase: "Hello, are you good? No I'm bad, goodbye"
              },
              title: "Asking How Someone Is"
            })
          ]
        };
      })(),
    ]
  },
  {
    id: "module3",
    title: "Module 3: Family & Relationships",
    description: "Describe your family or ask about someone else's. Includes parents, siblings, friends, and possessive structures.",
    emoji: "👪",
    lessonCount: 0,
    estimatedTime: "0 minutes",
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
export function generateCompleteReviewVocabulary(moduleId: string, currentLessonNumber: number): string[] {
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