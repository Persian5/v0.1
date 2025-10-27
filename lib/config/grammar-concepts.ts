import { VocabularyItem } from "../types";

// Use It example types
export interface UseItInputExample {
  type: 'input';
  sentence: string; // e.g., "na merci, man khoob-___"
  translation: string; // e.g., "No thank you, I am good"
  targetSuffix: string; // e.g., "am"
  baseWord: string; // e.g., "khoob"
}

export interface UseItQuizExample {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
}

export type UseItExample = UseItInputExample | UseItQuizExample;

// Grammar concept interfaces
export interface GrammarPhase {
  id: string;
  baseWord: string;
  transformedWord: string;
  baseDefinition: string;
  transformedDefinition: string;
  explanation: string;
  exampleBefore: string; // Example sentence with base word
  exampleAfter: string;  // Example sentence with transformed word
  points: number;
  suffixType?: 'state' | 'possession' | 'question' | 'connector'; // For color-coding badges
}

export interface GrammarConcept {
  conceptId: string;
  title: string;
  description: string;
  rule: string;
  phases: GrammarPhase[];
  useItSentence?: string; // Deprecated: kept for backward compatibility
  useItExamples?: UseItExample[]; // New: array of examples for "Use It" tab
}

// All grammar concepts for the Persian learning app
export const grammarConcepts: GrammarConcept[] = [
  {
    conceptId: "adjective-suffixes",
    title: "I Am / You Are: Adding Suffixes",
    description: "When you want to say 'I am' or 'you are' something, you add a suffix to the descriptive word. Add –am to say 'I am' and –i to say 'you are'.",
    rule: "Add –am for 'I am' and –i for 'you are' to any descriptive word",
    useItSentence: "na merci, man khoob-am (No thank you, I am good)", // Kept for backward compatibility
    useItExamples: [
      {
        type: 'input',
        sentence: 'na merci, man khoob-___',
        translation: 'No thank you, I am good',
        targetSuffix: 'am',
        baseWord: 'khoob'
      },
      {
        type: 'input',
        sentence: 'khoob-___',
        translation: 'you are good',
        targetSuffix: 'i',
        baseWord: 'khoob'
      },
      {
        type: 'quiz',
        question: "What does 'Khoobi?' mean as a question?",
        options: ["Are you good?", "You are good", "I am good", "Goodbye"],
        correctIndex: 0
      }
    ],
    phases: [
      {
        id: "khoob-to-khoob-am",
        baseWord: "khoob",
        transformedWord: "khoob-am",
        baseDefinition: "good",
        transformedDefinition: "I am good",
        explanation: "Add –am to the descriptive word to say 'I am'",
        exampleBefore: "khoob (good)",
        exampleAfter: "khoobam (I am good)",
        points: 1,
        suffixType: 'state'
      },
      {
        id: "khoob-to-khoob-i",
        baseWord: "khoob",
        transformedWord: "khoob-i",
        baseDefinition: "good",
        transformedDefinition: "you are good",
        explanation: "Add –i to the descriptive word to say 'you are'",
        exampleBefore: "khoob (good)",
        exampleAfter: "khoobi (you are good)",
        points: 1,
        suffixType: 'state'
      },
      {
        id: "khoob-to-khoob-i-question",
        baseWord: "khoob",
        transformedWord: "khoob-i?",
        baseDefinition: "good",
        transformedDefinition: "are you good?",
        explanation: "Add –i? to the descriptive word to say 'are you?'",
        exampleBefore: "khoob (good)",
        exampleAfter: "khoobi? (are you good?)",
        points: 1,
        suffixType: 'question'
      }
    ]
  },
  {
    conceptId: "ezafe-connector",
    title: "Name Of: The –e Connector",
    description: "In Persian, you say 'esme man' (not 'esm man') to mean 'my name.' The little 'e' sound connects words together to show 'of' or possession.",
    rule: "In Persian we use '-e' to connect words together, like adding 'of' in English to show relationship or possession.",
    useItSentence: "esme man (my name)", // Kept for backward compatibility
    useItExamples: [
      {
        type: 'input',
        sentence: 'esm-___ man',
        translation: 'my name',
        targetSuffix: 'e',
        baseWord: 'esm'
      },
      {
        type: 'input',
        sentence: 'esm-___ shoma',
        translation: 'your name',
        targetSuffix: 'e',
        baseWord: 'esm'
      },
      {
        type: 'quiz',
        question: "What does 'esm-e man' mean?",
        options: ["my name", "your name", "I am name", "good name"],
        correctIndex: 0
      }
    ],
    phases: [
      {
        id: "esm-man-to-esme-man",
        baseWord: "esm",
        transformedWord: "esm-e man",
        baseDefinition: "name", 
        transformedDefinition: "my name",
        explanation: "Add –e after 'esm' to connect with 'man'",
        exampleBefore: "esm (name)",
        exampleAfter: "esm-e man (my name)",
        points: 1,
        suffixType: 'connector'
      },
      {
        id: "esm-shoma-to-esme-shoma",
        baseWord: "esm",
        transformedWord: "esm-e shoma",
        baseDefinition: "name",
        transformedDefinition: "your name",
        explanation: "Add –e after 'esm' to connect with 'shoma'",
        exampleBefore: "esm (name)",
        exampleAfter: "esm-e shoma (your name)",
        points: 1,
        suffixType: 'connector'
      }
    ]
  },
  {
    conceptId: "verb-contraction",
    title: "What Is It: Adding –ye",
    description: "When you want to ask 'what is it?' in Persian, you add –ye to 'chi' (what). This is the same connector –e, but it sounds like 'ye' after certain words.",
    rule: "Add –ye to 'chi' to ask 'what is it?'",
    useItSentence: "esme shoma chiye? (what is your name?)", // Kept for backward compatibility
    useItExamples: [
      {
        type: 'input',
        sentence: 'chi-___?',
        translation: 'what is it?',
        targetSuffix: 'ye',
        baseWord: 'chi'
      },
      {
        type: 'input',
        sentence: 'esme shoma chi-___?',
        translation: 'what is your name?',
        targetSuffix: 'ye',
        baseWord: 'chi'
      },
      {
        type: 'quiz',
        question: "How do you ask 'what is it?' in Persian?",
        options: ["chiye?", "chi?", "esme?", "man chi?"],
        correctIndex: 0
      }
    ],
    phases: [
      {
        id: "chi-to-chiye",
        baseWord: "chi",
        transformedWord: "chi-ye",
        baseDefinition: "what",
        transformedDefinition: "what is it?",
        explanation: "Add –ye to turn 'what' into 'what is it?'",
        exampleBefore: "chi (what)",
        exampleAfter: "chiye? (what is it?)",
        points: 1,
        suffixType: 'question'
      }
    ]
  },
  {
    conceptId: "connectors-placement",
    title: "Linking Words: va, ham, vali",
    description: "In Persian, you use linking words to connect ideas. 'va' means 'and' (joins things), 'ham' means 'also' (goes after the word), and 'vali' means 'but' (contrasts ideas).",
    rule: "'va' joins things, 'ham' goes after the word it emphasizes, 'vali' contrasts ideas",
    useItSentence: "man ham khoobam, shoma khoob-i? vali man khoob neest-am (I am also good, are you good? but I am not good)",
    phases: [
      {
        id: "ham-placement",
        baseWord: "man khoobam",
        transformedWord: "man ham khoobam",
        baseDefinition: "I am good",
        transformedDefinition: "I am also good",
        explanation: "ham goes after the word it emphasizes",
        exampleBefore: "man khoobam (I am good)",
        exampleAfter: "man ham khoobam (I am also good)",
        points: 1
      },
      {
        id: "vali-contrast",
        baseWord: "man khoobam",
        transformedWord: "man khoobam vali",
        baseDefinition: "I am good",
        transformedDefinition: "I am good but",
        explanation: "vali means 'but' and contrasts ideas",
        exampleBefore: "man khoobam (I am good)",
        exampleAfter: "man khoobam vali... (I am good but...)",
        points: 1
      },
      {
        id: "va-joining",
        baseWord: "man, shoma",
        transformedWord: "man va shoma",
        baseDefinition: "I, you",
        transformedDefinition: "I and you",
        explanation: "va joins equal things like words or phrases",
        exampleBefore: "man, shoma (I, you)",
        exampleAfter: "man va shoma (I and you)",
        points: 1
      }
    ]
  },
  {
    conceptId: "possession-suffixes",
    title: "My & Your: Adding Suffixes",
    description: "When you want to say 'my' or 'your,' you add a suffix to the word. Add –am to say 'my' and –et to say 'your.'",
    rule: "Add -am for 'my' and -et for 'your' to any word",
    useItSentence: "esm-am Amir-e (my name is Amir)",
    phases: [
      {
        id: "esm-to-esmam",
        baseWord: "esm",
        transformedWord: "esm-am",
        baseDefinition: "name",
        transformedDefinition: "my name",
        explanation: "Add -am to a word to say 'my'",
        exampleBefore: "esm (name)",
        exampleAfter: "esmam (my name)",
        points: 1,
        suffixType: 'possession'
      },
      {
        id: "esm-to-esmet",
        baseWord: "esm",
        transformedWord: "esm-et",
        baseDefinition: "name",
        transformedDefinition: "your name",
        explanation: "Add -et to a word to say 'your'",
        exampleBefore: "esm (name)",
        exampleAfter: "esmet (your name)",
        points: 1,
        suffixType: 'possession'
      }
    ]
  }
];

// Helper functions to access grammar concepts
export function getGrammarConcept(conceptId: string): GrammarConcept | undefined {
  return grammarConcepts.find(concept => concept.conceptId === conceptId);
}

export function getGrammarPhases(conceptId: string): GrammarPhase[] {
  const concept = getGrammarConcept(conceptId);
  return concept?.phases || [];
} 