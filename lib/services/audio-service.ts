// Audio service for handling Persian vocabulary pronunciation across all lessons
// Follows convention-based approach: vocabulary ID maps to audio filename

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

  // Play audio with error handling
  static async playAudio(audioPath: string): Promise<boolean> {
    if (!audioPath) return false;
    
    try {
      const audio = new Audio(audioPath);
      await audio.play();
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
} 