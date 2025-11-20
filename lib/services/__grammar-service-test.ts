/**
 * SMOKE TEST for GrammarService (PHASE 2)
 * 
 * Quick verification that resolve() works correctly.
 * This file can be deleted after PHASE 2 is complete.
 * 
 * To run: node --loader ts-node/esm lib/services/__grammar-service-test.ts
 */

import { resolve, isGrammarRef } from './grammar-service';

console.log('🧪 GrammarService Smoke Test\n');

// ============================================================================
// TEST 1: Base Vocabulary Resolution
// ============================================================================

console.log('TEST 1: Base vocabulary resolution');
try {
  const salam = resolve("salam");
  console.log('✅ resolve("salam"):', {
    id: salam.id,
    en: salam.en,
    finglish: salam.finglish,
    isGrammarForm: salam.isGrammarForm
  });
  
  if (salam.id !== 'salam' || salam.baseId !== 'salam' || salam.isGrammarForm !== false) {
    throw new Error('Base vocab resolution failed validation');
  }
} catch (error) {
  console.error('❌ TEST 1 FAILED:', error);
  process.exit(1);
}

// ============================================================================
// TEST 2: Grammar Form Resolution (suffix "am")
// ============================================================================

console.log('\nTEST 2: Grammar form resolution (suffix "am")');
try {
  const khoobam = resolve({ kind: "suffix", baseId: "khoob", suffixId: "am" });
  console.log('✅ resolve({ kind: "suffix", baseId: "khoob", suffixId: "am" }):', {
    id: khoobam.id,
    baseId: khoobam.baseId,
    en: khoobam.en,
    finglish: khoobam.finglish,
    fa: khoobam.fa,
    isGrammarForm: khoobam.isGrammarForm,
    grammar: khoobam.grammar
  });
  
  if (
    khoobam.id !== 'khoobam' ||
    khoobam.baseId !== 'khoob' ||
    khoobam.en !== "I'm good" ||
    khoobam.finglish !== 'Khoobam' ||
    khoobam.isGrammarForm !== true ||
    khoobam.grammar?.suffixId !== 'am'
  ) {
    throw new Error('Grammar form resolution failed validation');
  }
} catch (error) {
  console.error('❌ TEST 2 FAILED:', error);
  process.exit(1);
}

// ============================================================================
// TEST 3: Type Guard
// ============================================================================

console.log('\nTEST 3: Type guard isGrammarRef()');
const stringRef = "salam";
const grammarRef = { kind: "suffix", baseId: "khoob", suffixId: "am" };

if (isGrammarRef(stringRef)) {
  console.error('❌ TEST 3 FAILED: String should not be GrammarRef');
  process.exit(1);
}

if (!isGrammarRef(grammarRef)) {
  console.error('❌ TEST 3 FAILED: GrammarRef should be identified as GrammarRef');
  process.exit(1);
}

console.log('✅ isGrammarRef() works correctly');

// ============================================================================
// TEST 4: Error Handling (unsupported suffix)
// ============================================================================

console.log('\nTEST 4: Error handling for unsupported suffix');
try {
  resolve({ kind: "suffix", baseId: "khoob", suffixId: "INVALID" });
  console.error('❌ TEST 4 FAILED: Should have thrown error for unsupported suffix');
  process.exit(1);
} catch (error: any) {
  if (error.message.includes('Unsupported suffix')) {
    console.log('✅ Correctly throws error for unsupported suffix');
  } else {
    console.error('❌ TEST 4 FAILED: Wrong error message:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// TEST 5: Error Handling (missing base vocab)
// ============================================================================

console.log('\nTEST 5: Error handling for missing base vocab');
try {
  resolve("NONEXISTENT_VOCAB_ID");
  console.error('❌ TEST 5 FAILED: Should have thrown error for missing vocab');
  process.exit(1);
} catch (error: any) {
  if (error.message.includes('not found in curriculum')) {
    console.log('✅ Correctly throws error for missing base vocab');
  } else {
    console.error('❌ TEST 5 FAILED: Wrong error message:', error.message);
    process.exit(1);
  }
}

console.log('\n🎉 ALL TESTS PASSED\n');
console.log('GrammarService.resolve() is working correctly.');
console.log('Ready to proceed to PHASE 3.');

