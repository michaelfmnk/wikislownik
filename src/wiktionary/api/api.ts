import { URLSearchParams } from "node:url";
import fetch from "node-fetch";
import { SearchResponse } from "./models";

// API Constants
const BASE_URL = "https://pl.wiktionary.org";
const SEARCH_URL = `${BASE_URL}/w/rest.php/v1/search/title`;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:136.0) Gecko/20100101 Firefox/136.0";
const DEFAULT_LIMIT = 10;

/**
 * Interface for the Wiktionary API client
 */
export interface WiktionaryApi {
  /**
   * Search for words matching the given query
   * @param query The search term
   * @returns Search results containing matching pages
   */
  search(query: string): Promise<SearchResponse>;

  /**
   * Load the HTML content of a word's page
   * @param word The word to look up
   * @returns HTML content of the page
   */
  loadWordPageHtml(word: string): Promise<string>;
}

/**
 * Implementation of the Wiktionary API client
 */
class WiktionaryApiImpl implements WiktionaryApi {
  /**
   * Search for words matching the given query
   * @param query The search term
   * @returns Search results containing matching pages
   */
  async search(query: string): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: DEFAULT_LIMIT.toString(),
      });

      const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Search request failed with status: ${response.status}`);
      }

      const searchResponse = (await response.json()) as SearchResponse;
      searchResponse.pages = searchResponse.pages.map((it) => {
        it.url = `${BASE_URL}/wiki/${it.title}`;
        return it;
      });
      return searchResponse;
    } catch (error) {
      console.error("Error during search:", error);
      return { pages: [] };
    }
  }

  /**
   * Load the HTML content of a word's page
   * @param word The word to look up
   * @returns HTML content of the page
   */
  async loadWordPageHtml(word: string): Promise<string> {
    try {
      const html = await this.loadPageHtml(word);
      if (!html) {
        console.warn(`No content found for word: ${word}`);
        return "";
      }
      return html;
    } catch (error) {
      console.error("Error loading page:", error);
      return "";
    }
  }

  /**
   * Helper method to fetch HTML content from a specific wiki page
   * @param word The word for the wiki page
   * @returns Raw HTML content
   */
  private async loadPageHtml(word: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/wiki/${word}`);
    if (!response.ok) {
      throw new Error(`Page load failed with status: ${response.status}`);
    }

    return await response.text();
  }
}

export default WiktionaryApiImpl;
