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
import { readSelectedLanguages } from "../../preferences";
import { Cache } from "@raycast/api";

const cache = new Cache();
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
    const languages = readSelectedLanguages();

    // Reset cache if languages have changed
    this.resetCacheOnLanguageChange(languages);

    // Check cache for previously fetched definitions
    const cachedDefinition = cache.get(word.text);
    if (cachedDefinition) {
      return JSON.parse(cachedDefinition);
    }

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

      cache.get(ENABLED_LANGUAGES_KEY);
      const translations = await this.fetchTranslations(word.text, languages);

      // Save the definition to cache
      const definition = {
        word,
        gender,
        meanings,
        translations,
        conjugationMarkdown,
      };

      cache.set(word.text, JSON.stringify(definition));
      return definition;
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
   * @param languages The target languages for translation
   * @returns Array of translations
   */
  private async fetchTranslations(text: string, languages: Language[]): Promise<Translation[]> {
    const translations: Translation[] = [];

    for (const lang of languages) {
      try {
        const translation = await translate(text, { from: "pl", to: lang.code });
        translations.push({
          language: lang.fullName,
          text: translation.text,
        });
      } catch (error) {
        console.error("Error fetching translations:", error);
      }
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

  private resetCacheOnLanguageChange(languages: Language[]) {
    const languagesString = this.serialize(languages);
    const previouslyEnabledLanguages = cache.get("enabled_languages") || "";
    if (previouslyEnabledLanguages.localeCompare(languagesString) !== 0) {
      cache.clear();
      cache.set("enabled_languages", languagesString);
    }
  }

  private serialize(languages: Language[]): string {
    return languages.map((it) => it.code).join(",");
  }
}
