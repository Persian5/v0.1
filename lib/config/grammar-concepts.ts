import { VocabularyItem } from "../types";

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
  useItSentence?: string; // Example sentence for "Use It" tab
}

// All grammar concepts for the Persian learning app
export const grammarConcepts: GrammarConcept[] = [
  {
    conceptId: "adjective-suffixes",
    title: "I Am / You Are: Adding Suffixes",
    description: "When you want to say 'I am' or 'you are' something, you add a suffix to the descriptive word. Add –am to say 'I am' and –i to say 'you are'.",
    rule: "Add –am for 'I am' and –i for 'you are' to any descriptive word",
    useItSentence: "na merci, man khoob-am (No thank you, I am good)",
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
      }
    ]
  },
  {
    conceptId: "ezafe-connector",
    title: "Name Of: The –e Connector",
    description: "In Persian, you say 'esme man' (not 'esm man') to mean 'my name.' The little 'e' connects words to show ownership or relationship, like 'of' in English.",
    rule: "Add -e between words to show possession or relationship",
    useItSentence: "esme man Amir-e (my name is Amir)",
    phases: [
      {
        id: "esm-to-esme",
        baseWord: "esm",
        transformedWord: "esme",
        baseDefinition: "name", 
        transformedDefinition: "name of",
        explanation: "Add -e to connect words (called ezāfe)",
        exampleBefore: "esm (name)",
        exampleAfter: "esme man (my name)",
        points: 1,
        suffixType: 'connector'
      }
    ]
  },
  {
    conceptId: "verb-contraction",
    title: "What Is It: Adding –ye",
    description: "When you want to ask 'what is it?' in Persian, you add –ye to 'what.' This creates a question about something specific.",
    rule: "Add -ye to 'chi' to create questions meaning 'what is it?'",
    useItSentence: "esme shoma chi-ye? (what is your name?)",
    phases: [
      {
        id: "chi-to-chiye",
        baseWord: "chi",
        transformedWord: "chiye", 
        baseDefinition: "what",
        transformedDefinition: "what is it?",
        explanation: "Add -ye to create questions",
        exampleBefore: "chi (what)",
        exampleAfter: "chiye (what is it?)",
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