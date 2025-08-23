/**
 * Interface for dictionary service operations
 */
export interface DictionaryService {
  /**
   * Search for words matching the query
   * @param query The search term
   * @returns Search results
   */
  search(query: string): Promise<SearchResult>;

  /**
   * Load detailed definition for a word
   * @param word The word to look up
   * @returns Complete word definition
   */
  loadDefinition(word: Word): Promise<WordDefinition>;
}

/**
 * Represents a dictionary word
 */
export interface Word {
  /** Unique identifier */
  id: string;
  /** The word text */
  text: string;
  /** Optional thumbnail image URL */
  thumbnail: string | undefined;
  /** URL to the dictionary page */
  dictionaryUrl: string;
}

/**
 * Result of a dictionary search operation
 */
export interface SearchResult {
  /** List of matching words */
  words: Word[];
}

/**
 * Grammatical gender in Polish
 */
export enum Gender {
  Male = "męskorzeczowy",
  Female = "żeńskorzeczowy",
  Neutral = "nijaki",
}

/**
 * Supported languages for translations
 */
export const Languages = {
  EN: { fullName: "English", code: "en" } as Language,
  UK: { fullName: "Ukrainian", code: "uk" } as Language,
  DE: { fullName: "German", code: "de" } as Language,
  FR: { fullName: "French", code: "fr" } as Language,
  ES: { fullName: "Spanish", code: "es" } as Language,
  PT: { fullName: "Portuguese", code: "pt" } as Language,
  SW: { fullName: "Swedish", code: "sw" } as Language,
  CS: { fullName: "Czech", code: "cs" } as Language,
  IT: { fullName: "Italian", code: "it" } as Language,
  NL: { fullName: "Dutch", code: "nl" } as Language,
  HU: { fullName: "Hungarian", code: "hu" } as Language,
};

/**
 * Language definition
 */
export interface Language {
  /** Full name of the language */
  fullName: string;
  /** Language code */
  code: string;
}

/**
 * Translation of a word to another language
 */
export interface Translation {
  /** Target language */
  language: Language;
  /** Translated text */
  text: string;
}

/**
 * Complete definition of a word
 */
export interface WordDefinition {
  /** The word being defined */
  word: Word;
  /** List of different meanings */
  meanings: string[];
  /** Markdown representation of conjugation tables */
  conjugationMarkdown: string;
  /** Grammatical gender (if applicable) */
  gender: Gender | undefined;
  /** Translations to other languages */
  translations: Translation[];
}

/**
 * Knowledge score levels for vocabulary words
 */
export enum KnowledgeScore {
  Unknown = 0,
  Familiar = 1,
  Good = 2,
  VeryGood = 3,
  Perfect = 4,
}

/**
 * Vocabulary entry saved by user
 */
export interface VocabEntry {
  /** Unique identifier */
  id: string;
  /** The Polish word */
  word: string;
  /** Translations in user's selected languages */
  translations: Translation[];
  /** How well the user knows this word (0-4) */
  score: KnowledgeScore;
  /** When the word was saved */
  savedAt: number;
}
