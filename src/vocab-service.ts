import { LocalStorage } from "@raycast/api";
import { KnowledgeScore, Translation, VocabEntry } from "./dictionary";

const VOCAB_STORAGE_KEY = "user_vocabulary";

/**
 * Service for managing user's vocabulary list
 */
export class VocabService {
  /**
   * Save a word to the vocabulary list
   * @param word The Polish word to save
   * @param translations Current translations for the word
   * @param score Knowledge score for the word (defaults to Unknown)
   * @returns Promise that resolves when word is saved
   */
  async saveWord(
    word: string,
    translations: Translation[],
    score: KnowledgeScore = KnowledgeScore.Unknown,
  ): Promise<void> {
    const vocab = await this.getVocabulary();

    // Check if word already exists
    const existingIndex = vocab.findIndex((entry) => entry.word === word);

    const entry: VocabEntry = {
      id: existingIndex >= 0 ? vocab[existingIndex].id : this.generateId(),
      word,
      translations,
      score,
      savedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing entry
      vocab[existingIndex] = entry;
    } else {
      // Add new entry
      vocab.push(entry);
    }

    await LocalStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocab));
  }

  /**
   * Update the score for a vocabulary entry
   * @param wordId The ID of the word to update
   * @param newScore The new knowledge score
   * @returns Promise that resolves when score is updated
   */
  async updateScore(wordId: string, newScore: KnowledgeScore): Promise<void> {
    const vocab = await this.getVocabulary();
    const entryIndex = vocab.findIndex((entry) => entry.id === wordId);

    if (entryIndex >= 0) {
      vocab[entryIndex].score = newScore;
      await LocalStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocab));
    }
  }

  /**
   * Remove a word from the vocabulary list
   * @param wordId The ID of the word to remove
   * @returns Promise that resolves when word is removed
   */
  async removeWord(wordId: string): Promise<void> {
    const vocab = await this.getVocabulary();
    const filtered = vocab.filter((entry) => entry.id !== wordId);
    await LocalStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Get all vocabulary entries sorted alphabetically
   * @returns Promise that resolves to sorted vocabulary list
   */
  async getVocabulary(): Promise<VocabEntry[]> {
    try {
      const stored = await LocalStorage.getItem<string>(VOCAB_STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const vocab: VocabEntry[] = JSON.parse(stored);

      // Sort alphabetically by Polish word
      return vocab.sort((a, b) => a.word.localeCompare(b.word, "pl"));
    } catch (error) {
      console.error("Error loading vocabulary:", error);
      return [];
    }
  }

  /**
   * Check if a word is already in the vocabulary
   * @param word The word to check
   * @returns Promise that resolves to true if word exists
   */
  async isWordSaved(word: string): Promise<boolean> {
    const vocab = await this.getVocabulary();
    return vocab.some((entry) => entry.word === word);
  }

  /**
   * Export vocabulary as CSV string
   * @returns Promise that resolves to CSV formatted string
   */
  async exportAsCSV(): Promise<string> {
    const vocab = await this.getVocabulary();

    if (vocab.length === 0) {
      return "pl,score\n";
    }

    // Get all unique language codes from all vocabulary entries
    const allLanguageCodes = new Set<string>();
    vocab.forEach((entry) => {
      entry.translations.forEach((translation) => {
        // Extract language code from full language name
        const langCode = this.getLanguageCode(translation.language);
        if (langCode) {
          allLanguageCodes.add(langCode);
        }
      });
    });

    // Create CSV header with Polish first, then other languages in alphabetical order, then score
    const sortedLanguageCodes = ["pl", ...Array.from(allLanguageCodes).sort(), "score"];
    let csvContent = sortedLanguageCodes.join(",") + "\n";

    // Add each vocabulary entry
    for (const entry of vocab) {
      const row: string[] = [];

      for (const langCode of sortedLanguageCodes) {
        if (langCode === "pl") {
          // Polish word
          row.push(this.escapeCsvValue(entry.word));
        } else if (langCode === "score") {
          // Knowledge score
          row.push(entry.score.toString());
        } else {
          // Find translation for this language
          const translation = entry.translations.find(
            (t: Translation) => this.getLanguageCode(t.language) === langCode,
          );
          row.push(this.escapeCsvValue(translation?.text || ""));
        }
      }

      csvContent += row.join(",") + "\n";
    }

    return csvContent;
  }

  /**
   * Extract language code from language name
   * @param languageName Full language name (e.g., "English", "Ukrainian")
   * @returns Language code (e.g., "en", "uk") or undefined if not found
   */
  private getLanguageCode(languageName: string): string | undefined {
    const languageCodeMap: { [key: string]: string } = {
      English: "en",
      Ukrainian: "uk",
      German: "de",
      French: "fr",
      Spanish: "es",
      Portuguese: "pt",
      Swedish: "sw",
      Czech: "cs",
      Italian: "it",
      Dutch: "nl",
      Hungarian: "hu",
    };

    return languageCodeMap[languageName];
  }

  /**
   * Generate a unique ID for vocabulary entries
   * @returns Unique identifier string
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Escape CSV values to handle commas and quotes
   * @param value The value to escape
   * @returns Escaped CSV value
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Export singleton instance
export const vocabService = new VocabService();
