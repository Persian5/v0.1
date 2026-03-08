import { Module, LessonStep, VocabularyItem } from "../types";
import { vocabQuiz, flashcard, input, audioMeaning, audioSequence, textSequence, matching, final } from "./curriculum-helpers";
import { createVocabulary } from "./vocabulary-builder";

// Define all modules, lessons, and their content
export const curriculumData: Module[] = [
  {
    id: "module1",
    title: "Module 1: Greetings & Politeness",
    description: "Start a conversation the right way. Learn how to say hello, goodbye, thank you, please, and the difference between formal and casual tone.",
    emoji: "👋",
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
          input("How do you say 'What' in Persian?", "Chi"),
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
                "{userFirstName}-e" // Plain string - personalized, appears in word bank, not tracked as vocab
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
              "{userFirstName}-e", // Plain string - personalized, appears in word bank, not tracked as vocab
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
                "man",
                "{userFirstName}-e" // Plain string - personalized, appears in word bank, not tracked as vocab
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
              "{userFirstName}-e", // Plain string - personalized, appears in word bank, not tracked as vocab
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
              "{userFirstName}-e", // Plain string - personalized, appears in word bank, not tracked as vocab
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
      // Module 2 Lesson 5: Putting It All Together
      (() => {
        // No new vocabulary - mastery lesson
        const vocabulary: VocabularyItem[] = [];

        return {
          id: "lesson5",
          title: "Putting It All Together",
          description: "Today you'll put everything you've learned together into your first real Persian conversation. No new words, just mastery.",
          emoji: "💬",
        progress: 0,
        locked: false,
          vocabulary,
        steps: [
            // 1. Welcome Intro
          {
            type: "welcome",
              title: "Putting It All Together",
              description: "Today you'll put everything you've learned together into your first real Persian conversation. No new words, just mastery.",
            points: 0,
            data: {
              objectives: [
                  "Confidently hold a 20-25 second Persian conversation",
                  "Use all greetings, introductions, and responses naturally",
                  "Master the complete conversation flow",
                  "Feel confident speaking Persian"
                ],
                lessonType: "conversations"
              }
            },
            // 2. Audio Sequence: Salam esm|e shoma chiye
            audioSequence(
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "shoma",
                "chiye"
              ],
              "Hello what is your name"
            ),
            // 3. Matching: Man Shoma Esm|e Chi
            matching([
              "man",
              "shoma",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "chi"
            ]),
            // 4. Audio Meaning: Khoshbakhtam
            audioMeaning("khoshbakhtam"),
            // 5. MC Quiz: Esm
          {
            type: "quiz",
            points: 2,
            data: {
                prompt: "What does 'esm' mean?",
                options: ["Name", "My name", "Your name", "Name of"],
                correct: 0,
                quizType: "vocab-normal",
                lexemeRef: "esm"
              }
            },
            // 6. Text Sequence: Salam, esm|e man {userFirstName}-e
            textSequence(
              "Salam, esme man {userFirstName}-e",
              "Hello, my name is {userFirstName}",
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "{userFirstName}-e" // Plain string - personalized, appears in word bank, not tracked as vocab
              ]
            ),
            // 7. Audio Sequence: Man ham khoshbakhtam
            audioSequence(
              [
                "man",
                "ham",
                "khoshbakhtam"
              ],
              "Nice to meet you too"
            ),
            // 8. Text Sequence: Baleh Merci Khoob|am
            textSequence(
              "Baleh merci khoobam",
              "Yes thank you I'm good",
              [
                "baleh",
                "merci",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ]
            ),
            // 9. Audio Meaning: Khoob|i
            audioMeaning({ kind: "suffix", baseId: "khoob", suffixId: "i" } as const),
            // 10. Grammar Fill in the Blank: Khoob-(blank) for -i
            {
              type: "grammar-fill-blank",
              points: 1,
            data: {
                conceptId: "suffix-i-khoob-review",
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
            // 11. Grammar Fill in the Blank: Bad-(blank) for -am
            {
              type: "grammar-fill-blank",
              points: 1,
            data: {
                conceptId: "suffix-am-bad-review",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
                exercises: [
                  {
                    sentence: "Bad-___",
                    translation: "I am bad",
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
            // 12. Matching: Khoob|i Bad|i Khoob|am Bad|am
            matching([
              { kind: "suffix", baseId: "khoob", suffixId: "i" } as const,
              { kind: "suffix", baseId: "bad", suffixId: "i" } as const,
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              { kind: "suffix", baseId: "bad", suffixId: "am" } as const
            ]),
            // 13. Audio Meaning: Khodafez
            audioMeaning("khodafez"),
            // 14. Reverse Quiz: Khoob
            vocabQuiz([], "khoob", "vocab-reverse"),
            // 15. Audio Sequence: Na merci khoob|am
            audioSequence(
              [
                "na",
                "merci",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const
              ],
              "No thank you I'm good"
            ),
            // 16. Reverse Quiz: Nice to meet you too
            vocabQuiz([], "khoshbakhtam", "vocab-reverse"),
            // 17. Input Game: Chetori
            input(
              "How do you say 'how are you' in Persian?",
              "Chetori",
              2,
              "chetori"
            ),
            // 18. Input Game: Khoob-i
            input(
              "How do you say 'you are good' in Persian?",
              "khoob-i",
              2,
              { kind: "suffix", baseId: "khoob", suffixId: "i" } as const
            ),
            // 19. Final Challenge: Salam, esme shoma chiye? Esme man {userFirstName}-e, man ham khoshbakhtam khodafez
            final(vocabulary, [
              "salam",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "shoma",
              "chiye",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "man",
              "{userFirstName}-e", // Plain string - personalized, appears in word bank, not tracked as vocab
              "man",
              "ham",
              "khoshbakhtam",
              "khodafez"
            ], {
              conversationFlow: {
                description: "A complete 20-25 second Persian conversation",
                expectedPhrase: "Hello, what is your name? my name is {userFirstName}-e, nice to meet you too! Goodbye."
              },
              title: "Your First Real Conversation"
            })
          ]
        };
      })(),
      // Module 2 Lesson 6: Texting Game
      (() => {
        // No new vocabulary - mastery lesson
        const vocabulary: VocabularyItem[] = [];

        return {
          id: "lesson6",
          title: "Texting Game",
          description: "Practice a real texting conversation using all your greeting and introduction skills",
        emoji: "💬",
        progress: 0,
        locked: false,
          vocabulary,
        steps: [
          {
            type: "story-conversation",
            points: 6, // XP awarded once at story completion (idempotent)
            data: {
                storyId: "module2-texting-game",
                title: "Texting Game",
                description: "Practice a real texting conversation using all your greeting and introduction skills",
                setting: "You're texting with Sara, a new friend",
                characterName: "Sara",
              characterEmoji: "👩",
              requiresPersonalization: true,
              exchanges: [
                  // Exchange 1: Sara initiates - "Salam {FirstName}"
                {
                  id: "exchange1",
                  initiator: "character",
                    characterMessage: "Salam {name}",
                  choices: [
                    {
                      id: "choice1a",
                        text: "Salam Sara",
                        vocabularyUsed: ["salam"],
                      isCorrect: true,
                      points: 1,
                        responseMessage: "Khoobi?"
                    },
                    {
                      id: "choice1b",
                        text: "Khodafez Sara",
                        vocabularyUsed: ["khodafez"],
                      isCorrect: false,
                        points: 0
                    },
                    {
                      id: "choice1c",
                        text: "Merci Sara",
                        vocabularyUsed: ["merci"],
                      isCorrect: false,
                        points: 0
                    }
                  ]
                },
                  // Exchange 2: Sara asks "Khoobi?" - User responds
                {
                  id: "exchange2",
                  initiator: "character",
                    characterMessage: "Khoobi?",
                  choices: [
                    {
                      id: "choice2a",
                        text: "Baleh khoobam",
                        vocabularyUsed: ["baleh", "khoobam"],
                      isCorrect: true,
                      points: 1,
                        responseMessage: ""
                    },
                    {
                      id: "choice2b",
                        text: "Baleh khoobi",
                        vocabularyUsed: ["baleh", "khoobi"],
                      isCorrect: false,
                        points: 0
                    },
                    {
                      id: "choice2c",
                        text: "Nah khoobi",
                        vocabularyUsed: ["na", "khoobi"],
                      isCorrect: false,
                        points: 0
                    },
                    {
                      id: "choice2d",
                        text: "Nah khoobam",
                        vocabularyUsed: ["na", "khoobam"],
                      isCorrect: false,
                        points: 0
                    }
                  ]
                },
                  // Exchange 3: User follow-up - asks "Shoma chetori?"
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
                        responseMessage: "Man ham khoobam!"
                    },
                    {
                      id: "choice3b",
                        text: "Man chetori",
                        vocabularyUsed: ["man", "chetori"],
                      isCorrect: false,
                        points: 0
                      }
                    ]
                  },
                  // Exchange 4: Sara says "Man ham khoobam!" then asks "Esme shoma chiye?"
                {
                  id: "exchange4",
                  initiator: "character",
                    characterMessage: "Man ham khoobam! Esme shoma chiye?",
                  choices: [
                    {
                      id: "choice4a",
                        text: "Esme man {name}-e",
                        vocabularyUsed: ["esme", "man"],
                      isCorrect: true,
                      points: 1,
                        responseMessage: ""
                    },
                    {
                      id: "choice4b",
                        text: "Esme shoma {name}-e",
                        vocabularyUsed: ["esme", "shoma"],
                      isCorrect: false,
                        points: 0
                    },
                    {
                      id: "choice4c",
                        text: "Esm man {name}-e",
                        vocabularyUsed: ["esm", "man"],
                      isCorrect: false,
                        points: 0
                    },
                    {
                      id: "choice4d",
                        text: "Esm shoma {name}-e",
                        vocabularyUsed: ["esm", "shoma"],
                      isCorrect: false,
                        points: 0
                    }
                  ]
                },
                  // Exchange 5: User follow-up - asks "Esme shoma chiye?"
                {
                  id: "exchange5",
                    initiator: "user",
                    characterMessage: "",
                  choices: [
                    {
                      id: "choice5a",
                        text: "Esme shoma chiye?",
                        vocabularyUsed: ["esme", "shoma", "chiye"],
                      isCorrect: true,
                      points: 1,
                        responseMessage: "Esme man Sara-e, khoshbakhtam"
                    },
                    {
                      id: "choice5b",
                        text: "Esme man chiye?",
                        vocabularyUsed: ["esme", "man", "chiye"],
                      isCorrect: false,
                        points: 0
                      }
                    ]
                  },
                  // Exchange 6: Sara says "Esme man Sara-e, khoshbakhtam"
                {
                  id: "exchange6",
                  initiator: "character",
                    characterMessage: "Esme man Sara-e, khoshbakhtam",
                  choices: [
                    {
                      id: "choice6a",
                        text: "Man ham khoshbakhtam",
                        vocabularyUsed: ["man", "ham", "khoshbakhtam"],
                      isCorrect: true,
                      points: 1,
                        responseMessage: ""
                    },
                    {
                      id: "choice6b",
                        text: "Shoma ham khoshbakhtam",
                        vocabularyUsed: ["shoma", "ham", "khoshbakhtam"],
                      isCorrect: false,
                        points: 0
                      }
                    ]
                  },
                  // Exchange 7: Sara says goodbye "Khodafez {name}"
                  {
                    id: "exchange7",
                    initiator: "character",
                    characterMessage: "Khodafez {name}",
                    choices: [
                      {
                        id: "choice7a",
                        text: "Khodafez Sara",
                        vocabularyUsed: ["khodafez"],
                        isCorrect: true,
                        points: 1,
                        responseMessage: ""
                      },
                      {
                        id: "choice7b",
                        text: "Salam Sara",
                        vocabularyUsed: ["salam"],
                      isCorrect: false,
                        points: 0
                    }
                  ]
                }
              ]
            }
          }
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
    estimatedTime: "15 minutes",
    available: true,
    lessons: [
      // Module 3 Lesson 1: Where Are You From?
      (() => {
        const vocabulary = createVocabulary("module3-lesson1", {
          ids: ["hast", "ahle"],
          en: ["Is / To Be", "From / Belonging To"],
          fa: ["هست", "اهل"],
          finglish: ["Hast", "Ahle"],
          phonetic: ["hast", "AH-leh"]
        });

        return {
        id: "lesson1",
          title: "Where Are You From?",
          description: "Today you'll learn how to say where you're from in Persian. By the end of this lesson, you can introduce yourself and ask others about their origin.",
          emoji: "🌍",
        progress: 0,
        locked: false,
          vocabulary,
        steps: [
            // 1. Welcome Intro
          {
            type: "welcome",
              title: "Where Are You From?",
              description: "Today you'll learn how to say where you're from in Persian. By the end of this lesson, you can introduce yourself and ask others about their origin.",
            points: 0,
            data: {
              objectives: [
                  "Learn the verb 'hast' (to be)",
                  "Learn 'ahle' (from)",
                  "Say 'I am from Iran' naturally",
                  "Ask 'Are you from Iran?' confidently"
                ],
                lessonType: "grammar"
              }
            },
            
            // 2. Review: Audio Sequence - Previous greetings
            audioSequence(["salam", "chetori"], "Hello how are you"),
            
            // 3. Review: Matching - Pronouns and responses
            matching([
              "man",
              "shoma",
              { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
              "merci"
            ]),
            
            // 4. Flashcard: Hast (to be)
            flashcard(vocabulary, "hast"),
            
            // 5. Audio Meaning: Hast
            audioMeaning("hast"),
            
            // 6. Vocab Quiz: Hast (What does "hast" mean?)
            vocabQuiz(vocabulary, "hast", "vocab-normal"),
            
            // 7. Flashcard: Ahle (from)
            flashcard(vocabulary, "ahle"),
            
            // 8. Audio Meaning: Ahle
            audioMeaning("ahle"),
            
            // 9. Matching: Hast, Ahle, Man, Shoma
            matching(["hast", "ahle", "man", "shoma"]),
            
            // 10. Text Sequence - Standalone "hast" with user's first name (BEFORE grammar intros)
            textSequence(
              "{userFirstName} ahle Iran hast",
              "{userFirstName} is from Iran",
              [
                "{userFirstName}", // Plain string - personalized, appears in word bank, not tracked as vocab
                "ahle",
                "Iran", // Plain string - appears in word bank, not tracked as vocab
                "hast" // Standalone base word - tracked as regular vocab
              ]
            ),
            
            // 11. Grammar Intro: hastam (I am)
            {
              type: "grammar-intro",
              points: 1,
            data: {
                conceptId: "verb-hastam",
                title: "hastam = I am",
                description: "In Persian, you add -am to 'hast' to say 'I am'. For example: hast → hastam ('I am'), Man ahle Iran hastam ('I am from Iran').",
                rule: "Add -am to 'hast' to say 'I am'",
                visualType: "tree",
                visualData: {
                  base: "hast",
                  transformations: [
                    { label: "-am", result: "hastam", meaning: "I am" },
                    { label: "Man ahle Iran + hastam", result: "Man ahle Iran hastam", meaning: "I am from Iran" }
                  ]
                }
              }
            },
            
            // 12. Grammar Fill in the Blank: Hast-___ (testing hastam)
            {
              type: "grammar-fill-blank",
              points: 1,
            data: {
                conceptId: "verb-hastam-fill",
                label: "FILL IN THE SUFFIX",
                subtitle: "Choose the correct ending",
                exercises: [
                  {
                    sentence: "Hast-___",
                    translation: "I am",
                    blankPosition: 5,
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
            
            // 13. Audio Meaning: Hast|am (TRACKED)
            audioMeaning({ kind: "suffix", baseId: "hast", suffixId: "am" } as const),
            
            // 14. Text Sequence: Man ahle Iran hast|am (TRACKED)
            textSequence(
              "Man ahle Iran hastam",
              "I am from Iran",
              [
                "man",
                "ahle",
                "Iran", // Plain string - not tracked
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ]
            ),
            
            // 15. Audio Sequence: Man ahle Iran hast|am (TRACKED)
            audioSequence(
              [
                "man",
                "ahle",
                "Iran", // Plain string - not tracked
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ],
              "I am from Iran"
            ),
            
            // 16. Grammar Intro: hasti (you are)
          {
            type: "grammar-intro",
            points: 1,
            data: {
                conceptId: "verb-hasti",
                title: "hasti = you are",
                description: "In Persian, you add -i to 'hast' to say 'you are'. As a question: Shoma ahle Iran hasti? ('Are you from Iran?'). As a statement: Shoma ahle Iran hasti ('You are from Iran').",
                rule: "Add -i to 'hast' to say 'you are'",
                visualType: "tree",
              visualData: {
                  base: "hast",
                  transformations: [
                    { label: "-i", result: "hasti", meaning: "You are" },
                    { label: "Shoma ahle Iran + hasti?", result: "Shoma ahle Iran hasti?", meaning: "Are you from Iran?" }
                  ]
                }
              }
            },
            
            // 17. Grammar Fill in the Blank: Hast-___? (testing hasti)
          {
            type: "grammar-fill-blank",
            points: 1,
            data: {
                conceptId: "verb-hasti-fill",
              label: "FILL IN THE SUFFIX",
              subtitle: "Choose the correct ending",
              exercises: [
                {
                    sentence: "Hast-___?",
                    translation: "Are you?",
                    blankPosition: 5,
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
            
            // 18. Audio Meaning: Hast|i (TRACKED)
            audioMeaning({ kind: "suffix", baseId: "hast", suffixId: "i" } as const),
            
            // 19. Text Sequence: Shoma ahle Iran hast|i? (TRACKED)
            textSequence(
              "Shoma ahle Iran hasti?",
              "Are you from Iran",
              [
                "shoma",
                "ahle",
                "Iran", // Plain string - not tracked
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ]
            ),
            
            // 20. Audio Sequence: Shoma ahle Iran hast|i? (TRACKED)
            audioSequence(
              [
                "shoma",
                "ahle",
                "Iran", // Plain string - not tracked
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ],
              "Are you from Iran"
            ),
            
            // 21. Review: Matching - Grammar forms and base words
            matching([
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const,
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              "hast",
              "ahle"
            ]),
            
            // 22. Review: Vocab Quiz - Ahle (What does "ahle" mean?)
            vocabQuiz(vocabulary, "ahle", "vocab-reverse"),
            
            // 23. Review: Text Sequence - Combining with previous vocab
            textSequence(
              "Salam, man ahle Iran hastam",
              "Hello I am from Iran",
              [
                "salam",
                "man",
                "ahle",
                "Iran", // Plain string - not tracked
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ]
            ),
            
            // 24. Final Challenge: Salam shoma ahle Iran hasti? Baleh, man ahle Iran hastam
            final(vocabulary, [
              "salam",
              "shoma",
              "ahle",
              "Iran", // Plain string - not tracked
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              "baleh",
              "man",
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const
            ], {
              conversationFlow: {
                description: "A conversation asking where someone is from",
                expectedPhrase: "Hello are you from Iran yes I am from Iran"
              },
              title: "Asking Where Someone Is From"
            })
          ]
        };
      })(),
      // Module 3 Lesson 2: Where Are You From? (Continued)
      (() => {
        const vocabulary = createVocabulary("module3-lesson2", {
          ids: ["koja"],
          en: ["Where"],
          fa: ["کجا"],
          finglish: ["Koja"],
          phonetic: ["ko-JAH"]
        });

        return {
          id: "lesson2",
          title: "Where Are You From? (Continued)",
          description: "Today you'll learn how to ask someone where they're from using the question 'Shoma ahle koja hasti?'",
          emoji: "🌍",
        progress: 0,
        locked: false,
          vocabulary,
        steps: [
            // 1. Welcome Intro
          {
            type: "welcome",
              title: "Where Are You From? (Continued)",
              description: "Today you'll learn how to ask someone where they're from using the question 'Shoma ahle koja hasti?'",
            points: 0,
            data: {
              objectives: [
                  "Learn 'koja' (where)",
                  "Ask 'Where are you from?' naturally",
                  "Understand the question when hearing it",
                  "Answer using what you learned in Lesson 1",
                  "Review greetings and responses from previous lessons"
                ],
                lessonType: "grammar"
              }
            },
            
            // 2. Review: Audio Sequence - Lesson 1 structure
            audioSequence(
              [
                "man",
                "ahle",
                "Iran", // Plain string
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ],
              "I am from Iran"
            ),
            
            // 3. Review: Matching - Module 1 & 2 vocab
            matching([
              "khodafez",
              "baleh",
              "na",
              "esm"
            ]),
            
            // 4. Review: Audio Sequence - Lesson 1 structure
            audioSequence(
              [
                "salam",
                "man",
                "ahle",
                "Iran", // Plain string
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ],
              "Hello I am from Iran"
            ),
            
            // 5. Review: Matching - Lesson 1 vocab
            matching([
              "ahle",
              "man",
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const
            ]),
            
            // 6. Review: Audio Meaning - Hasti
            audioMeaning({ kind: "suffix", baseId: "hast", suffixId: "i" } as const),
            
            // 7. Flashcard: Koja
            flashcard(vocabulary, "koja"),
            
            // 8. MC Quiz: Koja
            vocabQuiz(vocabulary, "koja", "vocab-normal"),
            
            // 9. Audio Meaning: Koja
            audioMeaning("koja"),
            
            // 10. Matching: Ahle Koja Shoma Hast|i
            matching([
              "ahle",
              "koja",
              "shoma",
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const
            ]),
            
            // 11. Text Sequence: Shoma ahle koja hast|i?
            textSequence(
              "Shoma ahle koja hasti?",
              "Where are you from",
              [
                "shoma",
                "ahle",
                "koja",
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ]
            ),
            
            // 12. Audio Sequence: Shoma ahle koja hast|i?
            audioSequence(
              [
                "shoma",
                "ahle",
                "koja",
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ],
              "Where are you from"
            ),
            
            // 13. Review: Text Sequence - Module 1 response
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
            
            // 14. Reverse Quiz: Which phrase means "Where are you from?"
            vocabQuiz(
              vocabulary,
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              "vocab-reverse"
            ),
            
            // 15. Input Game: Shoma ahle ____ hasti?
            input(
              "How do you say 'Where are you from?' in Persian?",
              "shoma-ahle-koja-hasti",
              2,
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const
            ),
            
            // 16. Review: Matching - Module 2 vocab
            matching([
              "esm",
              { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
              "chiye",
              "man"
            ]),
            
            // 17. Matching: Ahle Koja Hast|am Hast|i Shoma
            matching([
              "ahle",
              "koja",
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const,
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              "shoma"
            ]),
            
            // 18. Text Sequence: Man ahle Iran hast|am (reinforcing answer)
            textSequence(
              "Man ahle Iran hastam",
              "I am from Iran",
              [
                "man",
                "ahle",
                "Iran", // Plain string
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ]
            ),
            
            // 19. Review: Audio Sequence - Module 1 & 2 combined
            audioSequence(
              [
                "salam",
                "chetori",
                { kind: "suffix", baseId: "khoob", suffixId: "am" } as const,
                "merci"
              ],
              "Hello how are you I'm good thank you"
            ),
            
            // 20. Audio Sequence: Salam shoma ahle koja hast|i?
            audioSequence(
              [
                "salam",
                "shoma",
                "ahle",
                "koja",
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ],
              "Hello where are you from"
            ),
            
            // 21. PERSONALIZATION FIXED: Text Sequence - "Where is {userFirstName} from?"
            textSequence(
              "{userFirstName} ahle koja hast?",
              "Where is {userFirstName} from",
              [
                "{userFirstName}", // Plain string - personalized, appears in word bank, not tracked as vocab
                "ahle",
                "koja",
                "hast"
              ]
            ),
            
            // 22. Review: Text Sequence - Module 2 introduction pattern
            textSequence(
              "Salam, esme man {userFirstName}-e",
              "Hello my name is {userFirstName}",
              [
                "salam",
                { kind: "suffix", baseId: "esm", suffixId: "e" } as const,
                "man",
                "{userFirstName}-e" // Plain string - personalized, appears in word bank, not tracked as vocab
              ]
            ),
            
            // 23. Text Sequence: Salam, shoma ahle koja hast|i?
            textSequence(
              "Salam, shoma ahle koja hasti?",
              "Hello where are you from",
              [
                "salam",
                "shoma",
                "ahle",
                "koja",
                { kind: "suffix", baseId: "hast", suffixId: "i" } as const
              ]
            ),
            
            // 24. Audio Sequence: Baleh man ham ahle Iran hast|am
            audioSequence(
              [
                "baleh",
                "man",
                "ham",
                "ahle",
                "Iran", // Plain string
                { kind: "suffix", baseId: "hast", suffixId: "am" } as const
              ],
              "Yes I am from Iran too"
            ),
            
            // 25. Review: Matching - All vocab mix
            matching([
              "koja",
              "ahle",
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const,
              "shoma",
              "salam"
            ]),
            
            // 26. Final Challenge: Salam {userFirstName}, shoma ahle koja hasti? Man ahle Iran hastam
            final(vocabulary, [
              "salam",
              "{userFirstName}", // Plain string - personalized, appears in word bank, not tracked as vocab
              "shoma",
              "ahle",
              "koja",
              { kind: "suffix", baseId: "hast", suffixId: "i" } as const,
              "man",
              "ahle",
              "Iran", // Plain string - appears in word bank, not tracked as vocab
              { kind: "suffix", baseId: "hast", suffixId: "am" } as const
            ], {
              conversationFlow: {
                description: "A conversation asking where someone is from",
                expectedPhrase: "Hello {userFirstName} where are you from I am from Iran"
              },
              title: "Asking Where Someone Is From"
            })
          ]
        };
      })()
    ],
    requiresPremium: true
  },
  {
    id: "module4",
    title: "Module 4: Food & Ordering at a Restaurant",
    description: "Order like a pro. Learn how to ask for the check, express what you want or don't want, and talk about Persian dishes.",
    emoji: "🍽️",
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

/**
 * Get the next available module in curriculum order.
 * Returns the first module after the current one that has available: true and lessons.
 * Returns undefined when at the frontier (no next available module).
 */
export function getNextAvailableModule(moduleId: string): Module | undefined {
  const idx = curriculumData.findIndex(m => m.id === moduleId);
  if (idx < 0) return undefined;
  for (let i = idx + 1; i < curriculumData.length; i++) {
    const m = curriculumData[i];
    if (m.available && (m.lessons?.length ?? 0) > 0) return m;
  }
  return undefined;
}

/**
 * Get the actual lesson count for a module (fully automated)
 * Always uses module.lessons.length - lesson counts are now fully automated
 * This ensures completion checks are always accurate even when lessons are added/removed
 */
export function getModuleLessonCount(module: Module): number {
  return module.lessons?.length || 0;
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
