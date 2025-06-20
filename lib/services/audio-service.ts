// Audio service for handling vocabulary pronunciation across all lessons
// Follows convention-based approach: vocabulary ID maps to audio filename

export class AudioService {
  
  // Get audio path for vocabulary item
  static getVocabularyAudioPath(vocabularyId: string, type: 'persian' | 'english' = 'persian'): string {
    // Convention-based mapping for scalability
    if (type === 'persian') {
      // Convention: Use vocabulary ID directly (e.g., "salam" -> "/audio/salam.mp3")
      return `/audio/${vocabularyId}.mp3`;
    } else {
      // English audio: Use common English words (e.g., "hello" -> "/audio/hello.mp3")
      const englishAudioMap: Record<string, string> = {
        'salam': 'hello.mp3',
        'chetori': 'howareyou.mp3',
        'khodafez': 'goodbye.mp3',
        'khosh_amadid': 'welcome.mp3'
      };
      
      const englishFile = englishAudioMap[vocabularyId];
      return englishFile ? `/audio/${englishFile}` : '';
    }
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

  // Play vocabulary audio (with fallback logic)
  static async playVocabularyAudio(vocabularyId: string, type: 'persian' | 'english' = 'persian'): Promise<boolean> {
    const audioPath = this.getVocabularyAudioPath(vocabularyId, type);
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