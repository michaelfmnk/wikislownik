import translate from "@iamtraction/google-translate";
import { DictionaryService, Language, SearchResult, Translation, Word, WordDefinition } from "../../dictionary";
import { WiktionaryApi } from "../api/api";
import {
  convertToMarkdown,
  detectGender,
  extractConjugationTables,
  extractMeanings,
  markTableHeaders,
} from "../utils/html";
import { Page } from "../api";
import simplifyTableSpans from "../utils/tablesimplifier";

/**
 * Implementation of the dictionary service using Wiktionary
 */
export default class WiktionaryServiceImpl implements DictionaryService {
  private api: WiktionaryApi;
  private readonly BASE_URL = "https://pl.wiktionary.org/wiki/";

  /**
   * Create a new WiktionaryServiceImpl instance
   * @param api The Wiktionary API client
   */
  constructor(api: WiktionaryApi) {
    this.api = api;
  }

  /**
   * Search for words matching the query
   * @param query The search term
   * @returns Search results with matched words
   */
  async search(query: string): Promise<SearchResult> {
    const response = await this.api.search(query);
    return {
      words: response.pages.map((page) => ({
        id: page.id.toString(),
        text: page.title,
        thumbnail: this.createThumbnailUrl(page),
        dictionaryUrl: this.BASE_URL + page.title,
      })),
    };
  }

  /**
   * Load detailed definition for a word
   * @param word The word to look up
   * @returns Complete word definition including translations and conjugation tables
   */
  async loadDefinition(word: Word): Promise<WordDefinition> {
    try {
      // Fetch HTML content for the word
      const pageHtml = await this.api.loadWordPageHtml(word.text);
      
      // Extract grammatical gender if present
      const gender = detectGender(pageHtml);
      
      // Process conjugation tables
      const tablesHtml = extractConjugationTables(pageHtml)
        .map(simplifyTableSpans)
        .map((it) => markTableHeaders(it, (row) => row.includes("mianownik")));
      const conjugationMarkdown = tablesHtml.map(convertToMarkdown).join("\n\n");
      
      // Extract word meanings
      const meanings = extractMeanings(pageHtml);

      // Fetch translations
      const translations = await this.fetchTranslations(word.text);

      return {
        word,
        gender,
        meanings,
        translations,
        conjugationMarkdown,
      };
    } catch (error) {
      console.error(`Error loading definition for ${word.text}:`, error);
      // Return a basic definition with the word but without details
      return {
        word,
        gender: undefined,
        meanings: [],
        translations: [],
        conjugationMarkdown: "",
      };
    }
  }

  /**
   * Fetch translations for a word
   * @param text The word to translate
   * @returns Array of translations
   */
  private async fetchTranslations(text: string): Promise<Translation[]> {
    const translations: Translation[] = [];
    
    try {
      // Get Ukrainian translation
      const ukTranslation = await translate(text, { from: "pl", to: "uk" });
      translations.push({
        language: Language.UK,
        text: ukTranslation.text,
      });
      
      // Get English translation
      const enTranslation = await translate(text, { from: "pl", to: "en" });
      translations.push({
        language: Language.EN,
        text: enTranslation.text,
      });
    } catch (error) {
      console.error("Error fetching translations:", error);
    }
    
    return translations;
  }

  /**
   * Create a thumbnail URL from a page object
   * @param page The page containing thumbnail information
   * @returns Formatted thumbnail URL or undefined
   */
  private createThumbnailUrl(page: Page): string | undefined {
    let thumbnail = page.thumbnail?.url;
    if (thumbnail) {
      thumbnail = thumbnail.replace("//", "https://");
      thumbnail = thumbnail.replace(/\d+px/, "500px");
      return thumbnail;
    }

    return undefined;
  }
}
