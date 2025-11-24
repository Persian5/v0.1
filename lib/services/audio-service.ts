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
   * @param noPause - If true, play files back-to-back with zero delay (for grammar forms)
   * @returns true if all files played successfully, false if any failed
   */
  static async playAudioSequence(paths: string[], noPause: boolean = false): Promise<boolean> {
    if (paths.length === 0) return false;
    
    if (noPause) {
      // Seamless playback: Load all audio elements and play them back-to-back with zero delay
      // For grammar forms, we want NO pause between root and suffix
      const audioElements: HTMLAudioElement[] = [];
      
      // Load all audio files and wait for them to be ready
      const loadPromises = paths.map(path => {
        return new Promise<HTMLAudioElement>((resolve, reject) => {
          const audio = new Audio(path);
          audio.preload = 'auto';
          
          // Wait for audio to be ready to play
          const onCanPlayThrough = () => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            resolve(audio);
          };
          
          const onError = () => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            console.log(`Audio not available: ${path}`);
            reject(new Error(`Audio not available: ${path}`));
          };
          
          audio.addEventListener('canplaythrough', onCanPlayThrough);
          audio.addEventListener('error', onError);
          
          // Start loading
          audio.load();
        });
      });
      
      // Wait for all audio files to be ready, then play seamlessly
      return Promise.allSettled(loadPromises).then(results => {
        // Filter out failed loads and create audio elements array
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            audioElements.push(result.value);
          } else {
            console.log(`Failed to load audio: ${paths[index]}`);
          }
        });
        
        if (audioElements.length === 0) {
          return false;
        }
        
        // Play all audio files seamlessly (zero delay between them)
        // For grammar forms: Start next audio BEFORE current ends to eliminate gap
        return new Promise<boolean>((resolve) => {
          let hasError = false;
          const nextStartedFlags = new Array(audioElements.length).fill(false);
          
          // Set up seamless chaining for all audio files
          for (let i = 0; i < audioElements.length; i++) {
            const audio = audioElements[i];
            const isLast = i === audioElements.length - 1;
            
            if (!isLast) {
              const nextAudio = audioElements[i + 1];
              
              // Preload next audio immediately
              nextAudio.load();
              
              // CRITICAL: Use 'timeupdate' to start next audio BEFORE current ends
              // This eliminates any gap between root and suffix for grammar forms
              const onTimeUpdate = () => {
                if (!nextStartedFlags[i] && audio.duration > 0) {
                  const timeRemaining = audio.duration - audio.currentTime;
                  // Start next audio in the last 80ms for seamless transition
                  if (timeRemaining <= 0.08) {
                    nextStartedFlags[i] = true;
                    audio.removeEventListener('timeupdate', onTimeUpdate);
                    // Start next audio slightly before current ends
                    nextAudio.play().catch(() => {
                      // If play fails, will be handled by onended fallback
                    });
                  }
                }
              };
              
              audio.addEventListener('timeupdate', onTimeUpdate);
            }
            
            // Set up onended handler (fallback if timeupdate didn't trigger)
            audio.onended = () => {
              if (!isLast && !nextStartedFlags[i]) {
                // Timeupdate didn't trigger - start next audio immediately
                const nextAudio = audioElements[i + 1];
                nextAudio.play().catch(() => {
                  hasError = true;
                });
              }
              
              // Check if all audio has finished
              if (isLast) {
                resolve(!hasError);
              }
            };
            
            audio.onerror = () => {
              hasError = true;
              console.log(`Audio playback error: ${paths[i]}`);
              // Continue playback even if one fails
              if (!isLast && !nextStartedFlags[i]) {
                const nextAudio = audioElements[i + 1];
                nextAudio.play().catch(() => {});
              }
            };
          }
          
          // Start playing first audio
          audioElements[0].play().catch((error) => {
            hasError = true;
            console.log(`Audio play() failed: ${paths[0]}`, error);
            resolve(false);
          });
        });
      });
    } else {
      // Original behavior: Play sequentially with pauses
      for (const path of paths) {
        const success = await this.playAudio(path);
        if (!success) {
          return false; // Stop on first failure
        }
      }
      return true;
    }
  }

  /**
   * Play audio for a resolved lexeme (base vocab or grammar form)
   * 
   * For base vocabulary: Plays single audio file
   * For grammar forms: Always plays base + suffix seamlessly (no pause)
   *   - Skips composite audio check (e.g., "khoobam.mp3") as these are edge cases
   *   - Always uses base word audio + suffix audio with zero delay
   * 
   * @param resolved - ResolvedLexeme from GrammarService.resolve()
   * @returns true if audio played successfully, false otherwise
   */
  static async playLexeme(resolved: ResolvedLexeme): Promise<boolean> {
    // Base vocabulary - use existing playback
    if (!resolved.isGrammarForm || !resolved.grammar) {
      return await this.playVocabularyAudio(resolved.id);
    }
    
    // Grammar form with suffix
    if (resolved.grammar.kind === 'suffix') {
      // ALWAYS use base + suffix seamlessly (no composite audio check)
      // Composite audio files (e.g., "khoobam.mp3") are edge cases and will be removed
      const basePath = this.getVocabularyAudioPath(resolved.baseId);
      const suffixPath = this.getSuffixAudioPath(resolved.grammar.suffixId);
      
      // Play base + suffix seamlessly with zero pause (noPause=true)
      return await this.playAudioSequence([basePath, suffixPath], true);
    }
    
    // Unknown grammar kind - fall back to base vocab
    console.warn(`[AudioService] Unknown grammar kind: ${resolved.grammar.kind}`);
    return await this.playVocabularyAudio(resolved.baseId);
  }
} 