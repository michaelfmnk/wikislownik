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
export enum Language {
  EN = "English",
  UK = "Ukrainian",
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
