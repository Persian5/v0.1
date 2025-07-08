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
        explanation: "In Persian, this is called ezāfe — and you'll use it all the time.",
        exampleBefore: "esm man ❌ (unnatural)", // Showing what NOT to say
        exampleAfter: "esme man ✅ (\"my name\" / \"name of me\")", // Showing correct way
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
        explanation: "Add -ye (shortened 'is') to ask 'what is it?' about something specific",
        exampleBefore: "Chi? (What?)", // General question
        exampleAfter: "Chiye? (What is it?)", // Asking about a specific thing
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