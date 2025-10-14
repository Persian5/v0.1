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
}

export interface GrammarConcept {
  conceptId: string;
  title: string;
  description: string;
  rule: string;
  phases: GrammarPhase[];
}

// All grammar concepts for the Persian learning app
export const grammarConcepts: GrammarConcept[] = [
  {
    conceptId: "adjective-suffixes",
    title: "Adjective Suffixes: –am vs –i",
    description: "Attach –am to an adjective to say \"I am ...\" and –i to say \"you are ....\" Applies only to adjectives.",
    rule: "Add –am/–i to the adjective stem (here: khoob).",
    phases: [
      {
        id: "khoob-to-khoob-am",
        baseWord: "khoob",
        transformedWord: "khoob-am",
        baseDefinition: "good",
        transformedDefinition: "I am good",
        explanation: "Add –am to say 'I am...'",
        exampleBefore: "khoob (just 'good')",
        exampleAfter: "khoobam (I am good)",
        points: 1
      },
      {
        id: "khoob-to-khoob-i",
        baseWord: "khoob",
        transformedWord: "khoob-i",
        baseDefinition: "good",
        transformedDefinition: "you are good",
        explanation: "Add –i to say 'you are...'",
        exampleBefore: "khoob (just 'good')",
        exampleAfter: "khoobi (you are good)",
        points: 1
      }
    ]
  },
  {
    conceptId: "ezafe-connector",
    title: "Why do we say \"esme\", not \"esm\"?",
    description: "In Persian, we say \"esme man\" — not \"esm man\" — to mean \"my name.\"\nThe little \"-e\" connects words like \"name of me\" or \"Sara's name.\"\nThis sound is called ezāfe, and it's one of the most common features in Persian.",
    rule: "Connect words with -e to show possession or relationship (like 'of' in English)",
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
        points: 1
      }
    ]
  },
  {
    conceptId: "verb-contraction",
    title: "Verb Contraction: Adding 'is'",
    description: "Learn how -ye is a shortened form of 'is' in Persian",
    rule: "Add -ye to create questions meaning 'what is it?'",
    phases: [
      {
        id: "chi-to-chiye",
        baseWord: "chi",
        transformedWord: "chiye", 
        baseDefinition: "what",
        transformedDefinition: "what is it?",
        explanation: "Add -ye (shortened 'is') to ask about something specific",
        exampleBefore: "chi (what)",
        exampleAfter: "chiye (what is it?)",
        points: 1
      }
    ]
  },
  {
    conceptId: "connectors-placement",
    title: "How to Use Connectors",
    description: "Learn where va, ham, and vali go in Persian sentences",
    rule: "ham follows what it emphasizes, vali contrasts ideas, va joins equal things",
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
        explanation: "vali means 'but' and connects contrasting ideas",
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
        explanation: "va joins equal things like nouns or phrases",
        exampleBefore: "man, shoma (I, you)",
        exampleAfter: "man va shoma (I and you)",
        points: 1
      }
    ]
  },
  {
    conceptId: "possession-suffixes",
    title: "My & Your: Possession Suffixes",
    description: "Add -am to a noun to say 'my' and -et to say 'your'",
    rule: "Add -am for 'my' and -et for 'your' to any noun",
    phases: [
      {
        id: "esm-to-esmam",
        baseWord: "esm",
        transformedWord: "esm-am",
        baseDefinition: "name",
        transformedDefinition: "my name",
        explanation: "Add -am to a noun to say 'my'",
        exampleBefore: "esm (name)",
        exampleAfter: "esmam (my name)",
        points: 1
      },
      {
        id: "esm-to-esmet",
        baseWord: "esm",
        transformedWord: "esm-et",
        baseDefinition: "name",
        transformedDefinition: "your name",
        explanation: "Add -et to a noun to say 'your'",
        exampleBefore: "esm (name)",
        exampleAfter: "esmet (your name)",
        points: 1
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