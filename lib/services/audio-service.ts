// Audio service for handling Persian vocabulary pronunciation across all lessons
// Follows convention-based approach: vocabulary ID maps to audio filename

import { ResolvedLexeme } from '../types';

export class AudioService {
  
  // Get audio path for vocabulary item (Persian only)
  static getVocabularyAudioPath(vocabularyId: string): string {
    // Convention: Use vocabulary ID directly (e.g., "salam" -> "/audio/salam.mp3")
    return `/audio/${vocabularyId}.mp3`;
  }

  // Check if audio file exists (for graceful fallbacks)
  static async audioExists(audioPath: string): Promise<boolean> {
    try {
      const response = await fetch(audioPath, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Play audio with error handling (waits for audio to finish playing)
  static async playAudio(audioPath: string): Promise<boolean> {
    if (!audioPath) return false;
    
    try {
      const audio = new Audio(audioPath);
      
      // Wait for both play start AND completion
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback error'));
        
        audio.play().catch(reject);
      });
      
      return true;
    } catch (error) {
      console.log(`Audio not available: ${audioPath}`);
      return false;
    }
  }

  // Play vocabulary audio (Persian only)
  static async playVocabularyAudio(vocabularyId: string): Promise<boolean> {
    const audioPath = this.getVocabularyAudioPath(vocabularyId);
    return await this.playAudio(audioPath);
  }

  // Get finglish-based audio path (fallback for vocabulary without ID mapping)
  static getFinglishAudioPath(finglish: string): string {
    // Clean finglish text and convert to lowercase
    const cleanFinglish = finglish.toLowerCase().replace(/\s+/g, '');
    return `/audio/${cleanFinglish}.mp3`;
  }

  // Play audio based on finglish text (fallback option)
  static async playFinglishAudio(finglish: string): Promise<boolean> {
    const audioPath = this.getFinglishAudioPath(finglish);
    return await this.playAudio(audioPath);
  }

  // ============================================================================
  // PHASE 3: LEXEME-AWARE AUDIO (GRAMMAR FORMS SUPPORT)
  // ============================================================================

  /**
   * Get audio path for a Persian suffix
   * Convention: /audio/suffix-{suffixId}.mp3
   * Example: getSuffixAudioPath("am") → "/audio/suffix-am.mp3"
   */
  static getSuffixAudioPath(suffixId: string): string {
    return `/audio/suffix-${suffixId}.mp3`;
  }

  /**
   * Play multiple audio files in sequence (waits for each to complete)
   * Used for grammar forms (base + suffix)
   * 
   * @param paths - Array of audio file paths to play in order
   * @returns true if all files played successfully, false if any failed
   */
  static async playAudioSequence(paths: string[]): Promise<boolean> {
    if (paths.length === 0) return false;
    
    for (const path of paths) {
      const success = await this.playAudio(path);
      if (!success) {
        return false; // Stop on first failure
      }
    }
    
    return true;
  }

  /**
   * Play audio for a resolved lexeme (base vocab or grammar form)
   * 
   * For base vocabulary: Plays single audio file
   * For grammar forms: Plays base + suffix in sequence
   * 
   * @param resolved - ResolvedLexeme from GrammarService.resolve()
   * @returns true if audio played successfully, false otherwise
   */
  static async playLexeme(resolved: ResolvedLexeme): Promise<boolean> {
    // Base vocabulary - use existing playback
    if (!resolved.isGrammarForm || !resolved.grammar) {
      return await this.playVocabularyAudio(resolved.id);
    }
    
    // Grammar form with suffix - play base + suffix sequence
    if (resolved.grammar.kind === 'suffix') {
      const basePath = this.getVocabularyAudioPath(resolved.baseId);
      const suffixPath = this.getSuffixAudioPath(resolved.grammar.suffixId);
      
      return await this.playAudioSequence([basePath, suffixPath]);
    }
    
    // Unknown grammar kind - fall back to base vocab
    console.warn(`[AudioService] Unknown grammar kind: ${resolved.grammar.kind}`);
    return await this.playVocabularyAudio(resolved.baseId);
  }
} 