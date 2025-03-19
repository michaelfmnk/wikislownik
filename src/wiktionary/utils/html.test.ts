import { describe, expect, it } from "vitest";
import { extractConjugationTables, detectGender, markTableHeaders, extractMeanings, convertToMarkdown } from "./html";
import { Gender } from "../../dictionary";

/**
 * HTML snippet containing a Polish noun definition with conjugation table
 */
const sampleHtml = `
<html lang="pl" dir="ltr">
<head>
  <title>gruby – Wikisłownik, wolny słownik wielojęzyczny</title>
</head>
<body>
  <section data-mw-section-id="1">
    <div class="mw-heading">
      <h2 id="gruby_(język_polski)">gruby (<span class="lang-code-pl">język polski</span>)</h2>
    </div>

    <table class="wikitable odmiana adj">
      <tbody>
        <tr>
          <th rowspan="2">przypadek</th>
          <th colspan="4"><i>liczba pojedyncza</i></th>
          <th colspan="2"><i>liczba mnoga</i></th>
        </tr>
        <tr>
          <td class="forma">mos/mzw</td>
          <td class="forma">mrz</td>
          <td class="forma">ż</td>
          <td class="forma">n</td>
          <td class="forma">mos</td>
          <td class="forma">nmos</td>
        </tr>
        <tr>
          <td class="forma">mianownik</td>
          <td colspan="2">gruby</td>
          <td>gruba</td>
          <td>grube</td>
          <td>grubi</td>
          <td>grube</td>
        </tr>
      </tbody>
    </table>
    
    <span>wymowa: IPA: [ˈɡrubɨ]</span>
    
    <dl>
      <dt><span class="field-title fld-znaczenia">znaczenia:</span></dt>
      <dd></dd>
    </dl>
    
    <p><i>przymiotnik</i></p>
    
    <dl>
      <dd>(1.1) otyły</dd>
      <dd>(1.2) mający dużą grubość, średnicę</dd>
      <dd>(1.3) wulgarny, prostacki, nieokrzesany</dd>
    </dl>
  </section>
</body>
</html>
`;

/**
 * Sample HTML with gender indicators
 */
const genderHtml = `
<html>
  <body>
    <div>rzeczownik, rodzaj męskorzeczowy</div>
    <div>Some other content</div>
  </body>
</html>
`;

/**
 * Sample table HTML for header marking
 */
const tableWithHeaders = `
<table>
  <tr>
    <td>przypadek</td>
    <td>liczba pojedyncza</td>
    <td>liczba mnoga</td>
  </tr>
  <tr>
    <td>mianownik</td>
    <td>słowo</td>
    <td>słowa</td>
  </tr>
</table>
`;

/**
 * HTML with meanings
 */
const meaningsHtml = `
<html>
  <dl>
    <dt><span class="fld-znaczenia">znaczenia:</span></dt>
    <dd></dd>
  </dl>
  <span></span>
  <dl>
    <dd>(1.1) pierwsze znaczenie</dd>
    <dd>(1.2) drugie znaczenie; dodatkowy opis</dd>
    <dd>(1.3) trzecie znaczenie</dd>
  </dl>
</html>
`;

describe("HTML Utilities", () => {
  describe("extractConjugationTables", () => {
    it("should extract conjugation tables from HTML", () => {
      const tables = extractConjugationTables(sampleHtml);

      // Should find one table
      expect(tables).toHaveLength(1);

      // Table should contain expected content
      expect(tables[0]).toContain('class="wikitable odmiana adj"');
      expect(tables[0]).toContain("przypadek");
      expect(tables[0]).toContain("liczba pojedyncza");
      expect(tables[0]).toContain("liczba mnoga");
      expect(tables[0]).toContain("mianownik");
      expect(tables[0]).toContain("gruby");
      expect(tables[0]).toContain("gruba");
    });

    it("should return empty array when no tables found", () => {
      const html = "<html><body><p>No tables here</p></body></html>";
      const tables = extractConjugationTables(html);
      expect(tables).toHaveLength(0);
    });

    it("should handle HTML with nested tables correctly", () => {
      const html = `
        <section data-mw-section-id="1" lang-code-pl>
          <table class="odmiana">
            <tr><td>Main table</td></tr>
            <tr><td>
              <table class="inner">
                <tr><td>Inner table</td></tr>
              </table>
            </td></tr>
          </table>
        </section>
      `;

      const tables = extractConjugationTables(html);

      // Should find one table with inner table removed
      expect(tables).toHaveLength(1);
      expect(tables[0]).toContain("Main table");
      expect(tables[0]).not.toContain("Inner table");
    });
  });

  describe("detectGender", () => {
    it("should detect male gender from HTML", () => {
      const html = "<div>rzeczownik, rodzaj męskorzeczowy</div>";
      const gender = detectGender(html);
      expect(gender).toBe(Gender.Male);
    });

    it("should detect female gender from HTML", () => {
      const html = "<div>rzeczownik, rodzaj żeński</div>";
      const gender = detectGender(html);
      expect(gender).toBe(Gender.Female);
    });

    it("should detect neutral gender from HTML", () => {
      const html = "<div>rzeczownik, rodzaj nijaki</div>";
      const gender = detectGender(html);
      expect(gender).toBe(Gender.Neutral);
    });

    it("should return undefined when no gender is found", () => {
      const html = "<div>No gender information here</div>";
      const gender = detectGender(html);
      expect(gender).toBeUndefined();
    });

    it("should find the first gender when multiple are present", () => {
      const html = `
        <div>rzeczownik, rodzaj męskorzeczowy</div>
        <div>rzeczownik, rodzaj żeński</div>
      `;
      const gender = detectGender(html);
      expect(gender).toBe(Gender.Male);
    });
  });

  describe("markTableHeaders", () => {
    it("should correctly mark table headers", () => {
      const result = markTableHeaders(tableWithHeaders, (row) => row.includes("mianownik"));

      // Should contain thead and tbody tags
      expect(result).toContain("<thead");
      expect(result).toContain("</thead>");
      expect(result).toContain("<tbody");
      expect(result).toContain("</tbody>");

      // Headers should be in thead
      expect(result).toMatch(/<thead[^>]*>.*?przypadek.*?<\/thead>/s);

      // Body should be in tbody
      expect(result).toMatch(/<tbody[^>]*>.*?mianownik.*?<\/tbody>/s);
    });

    it("should return original HTML when no headers are found", () => {
      const tableHtml = "<table><tr><td>No header here</td></tr></table>";
      const result = markTableHeaders(tableHtml, (row) => row.includes("mianownik"));
      expect(result).toBe(tableHtml);
    });
  });

  describe("extractMeanings", () => {
    it("should extract meanings from HTML", () => {
      const meanings = extractMeanings(meaningsHtml);

      expect(meanings).toHaveLength(3);
      expect(meanings[0]).toBe("pierwsze znaczenie");
      expect(meanings[1]).toBe("drugie znaczenie");
      expect(meanings[2]).toBe("trzecie znaczenie");
    });

    it("should return empty array when no meanings found", () => {
      const html = "<html><body><p>No meanings here</p></body></html>";
      const meanings = extractMeanings(html);
      expect(meanings).toHaveLength(0);
    });
  });

  describe("convertToMarkdown", () => {
    it("should convert HTML to Markdown", () => {
      const html = "<h1>Title</h1><p>Paragraph <strong>bold</strong></p>";
      const markdown = convertToMarkdown(html);

      expect(markdown).toContain("# Title");
      expect(markdown).toContain("Paragraph **bold**");
    });

    it("should handle tables in HTML", () => {
      const html = `
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const markdown = convertToMarkdown(html);

      expect(markdown).toContain("Header 1");
      expect(markdown).toContain("Header 2");
      expect(markdown).toContain("Cell 1");
      expect(markdown).toContain("Cell 2");
      expect(markdown).toContain("|");
    });
  });
});
