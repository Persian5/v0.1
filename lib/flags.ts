export const FLAGS = {
  LOG_LEARNED_VOCAB: true,
  LOG_DISTRACTORS: false,
  LOG_WORDBANK: true, // ✅ Enable for testing
  LOG_SEMANTIC_GROUPS: false,
  USE_NEW_DISTRACTOR_LOGIC: false,
  USE_NEW_WORDBANK_LOGIC: false,
  USE_NEW_GRAMMAR_OPTIONS: false,
  USE_LEARNED_VOCAB_IN_WORDBANK: true, // ✅ Enable for testing
  USE_LEARNED_VOCAB_IN_AUDIO_MEANING: true, // ✅ PHASE 5: Enable for testing
  USE_LEARNED_VOCAB_IN_QUIZ: true, // ✅ PHASE 4A: Enable for testing - Use WordBankService for quiz distractors
  USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE: true, // ✅ PHASE 4A: Enable for testing - Filter final challenge words by learnedState
};

