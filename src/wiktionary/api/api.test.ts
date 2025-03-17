import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import WiktionaryApiImpl from "./api";
import fetch from "node-fetch";

// Mock fetch
vi.mock("node-fetch");

describe("WiktionaryApi", () => {
  let api: WiktionaryApiImpl;

  // Sample response data
  const sampleSearchResponse = {
    pages: [
      { id: 108328, title: "przykład", excerpt: "Sample excerpt" },
      { id: 12345, title: "miecz", excerpt: "Sample excerpt 2" },
    ],
  };

  const sampleHtmlContent = `
    <html>
      <body>
        <div id="content">
          <h1>Sample Word</h1>
          <table class="odmiana">Table content</table>
        </div>
      </body>
    </html>
  `;

  beforeEach(() => {
    api = new WiktionaryApiImpl();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("search", () => {
    it("should return search results for a valid query", async () => {
      // Mock successful response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => sampleSearchResponse,
      });

      const result = await api.search("miecz");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=miecz"), expect.any(Object));

      expect(result).not.toBeNull();
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].title).toBe("przykład");
      expect(result.pages[0].id).toBe(108328);
      expect(result.pages[0].url).toContain("/wiki/przykład");
    });

    it("should handle empty search results", async () => {
      // Mock empty response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pages: [] }),
      });

      const result = await api.search("nonexistentword");

      expect(result.pages).toHaveLength(0);
    });

    it("should handle network errors", async () => {
      // Mock network error
      (fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.search("word");

      expect(result.pages).toHaveLength(0);
    });

    it("should handle API errors", async () => {
      // Mock API error response
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await api.search("word");

      expect(result.pages).toHaveLength(0);
    });
  });

  describe("loadWordPageHtml", () => {
    it("should fetch and return HTML content for a word", async () => {
      // Mock successful response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => sampleHtmlContent,
      });

      const result = await api.loadWordPageHtml("gruby");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/wiki/gruby"));

      expect(result).toBe(sampleHtmlContent);
      expect(result).toContain('<table class="odmiana">');
    });

    it("should return empty string when page load fails", async () => {
      // Mock failed response
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await api.loadWordPageHtml("nonexistentword");

      expect(result).toBe("");
    });

    it("should handle network errors when loading a page", async () => {
      // Mock network error
      (fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.loadWordPageHtml("word");

      expect(result).toBe("");
    });

    it("should handle empty html response", async () => {
      // Mock empty response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      const result = await api.loadWordPageHtml("word");

      expect(result).toBe("");
    });
  });
});