/**
 * Semantic Groups Configuration
 * 
 * Defines semantic groups for vocabulary items to enable intelligent distractor generation.
 * Groups are based on meaning + grammar categories as confirmed.
 * 
 * Usage:
 * - Distractor generation: Select distractors from same semantic group
 * - Review mode: Group words by semantic similarity
 * - Analytics: Track performance by semantic category
 */

/**
 * Semantic group definitions
 * Maps vocabulary IDs to their semantic groups
 */
export const SEMANTIC_GROUPS = {
  greetings: ['salam', 'chetori', 'khosh_amadid', 'khodafez', 'khoshbakhtam'],
  responses: ['khoobam', 'khoobi', 'merci', 'baleh', 'na'],
  pronouns: ['man', 'shoma'],
  questions: ['chi', 'chiye', 'koja'],
  adjectives: ['khoob', 'kheily'],
  verbs: ['hast', 'neest', 'hastam', 'neestam', 'neesti', 'hasti', 'mikonam', 'mikoni'],
  nouns: ['esm', 'esme', 'zendegi', 'madar', 'pedar', 'baradar', 'khahar', 'amrika', 'in'],
  prepositions: ['ahle', 'dar'],
  connectors: ['va', 'ham', 'vali'],
  possessives: ['esmam', 'esmet'],
} as const;

/**
 * Related groups for distractor selection
 * Used to find semantically related distractors when same-group options are limited
 */
export const RELATED_GROUPS: Record<string, string[]> = {
  greetings: ['responses'],
  responses: ['greetings'],
  pronouns: ['verbs'],
  verbs: ['pronouns'],
  questions: ['responses'],
  adjectives: ['verbs'],
  nouns: ['possessives'],
  prepositions: ['nouns'],
  connectors: ['verbs'],
  possessives: ['nouns'],
};

/**
 * Get semantic group for a vocabulary ID
 * 
 * @param vocabularyId - Vocabulary item ID (e.g., "salam")
 * @returns Semantic group name or undefined if not found
 */
export function getSemanticGroup(vocabularyId: string): string | undefined {
  for (const [group, ids] of Object.entries(SEMANTIC_GROUPS) as [string, readonly string[]][]) {
    if (ids.includes(vocabularyId)) {
      return group;
    }
  }
  return undefined;
}

/**
 * Get related groups for a semantic group
 * Used for distractor generation (70% same group, 30% related groups)
 * 
 * @param semanticGroup - Semantic group name
 * @returns Array of related group names
 */
export function getRelatedGroups(semanticGroup: string): string[] {
  return RELATED_GROUPS[semanticGroup] || [];
}

/**
 * Get all vocabulary IDs in a semantic group
 * 
 * @param semanticGroup - Semantic group name
 * @returns Array of vocabulary IDs
 */
export function getVocabIdsInGroup(semanticGroup: string): string[] {
  const group = SEMANTIC_GROUPS[semanticGroup as keyof typeof SEMANTIC_GROUPS];
  return group ? [...group] : [];
}

