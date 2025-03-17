import parse, { HTMLElement } from "node-html-parser";
import { Gender } from "../../dictionary";
import { NodeHtmlMarkdown } from "node-html-markdown";

/**
 * Extract conjugation tables from HTML content
 * @param html The HTML content to parse
 * @returns Array of table HTML strings
 */
export function extractConjugationTables(html: string): string[] {
  const htmlElement = parse(html);
  const result: string[] = [];

  try {
    const sections = htmlElement.querySelectorAll("section");
    
    // Find Polish language section containing conjugation tables
    for (const section of sections) {
      if (section.outerHTML.includes("lang-code-pl")) {
        const odmianaElements = section.querySelectorAll(".odmiana");
        return odmianaElements.map((element) => removeInnerTables(element));
      }
    }
  } catch (error) {
    console.error("Error extracting conjugation tables:", error);
  }

  return result;
}

/**
 * Remove nested tables from a table element
 * @param table The table HTML element
 * @returns String representation of the table without nested tables
 */
function removeInnerTables(table: HTMLElement): string {
  try {
    // Find and remove nested tables to avoid duplication
    table.querySelectorAll("table").forEach((nestedTable: HTMLElement) => {
      nestedTable.parentNode.parentNode.remove();
    });
    
    return table.toString();
  } catch (error) {
    console.error("Error removing inner tables:", error);
    return table.toString();
  }
}

/**
 * Detect grammatical gender from HTML content
 * @param html The HTML content to parse
 * @returns Detected gender or undefined
 */
export function detectGender(html: string): Gender | undefined {
  const genderPatterns = [
    { pattern: "rzeczownik, rodzaj męskorzeczowy", gender: Gender.Male },
    { pattern: "rzeczownik, rodzaj żeński", gender: Gender.Female },
    { pattern: "rzeczownik, rodzaj nijaki", gender: Gender.Neutral },
  ];

  try {
    // Find all gender matches and sort by position
    const foundGenders = genderPatterns
      .map(({ pattern, gender }) => ({
        gender,
        position: html.indexOf(pattern),
      }))
      .filter(({ position }) => position !== -1)
      .sort((a, b) => a.position - b.position);

    // Return the first match or undefined
    return foundGenders.length > 0 ? foundGenders[0].gender : undefined;
  } catch (error) {
    console.error("Error detecting gender:", error);
    return undefined;
  }
}

/**
 * Mark table headers by adding proper thead/tbody structure
 * @param tableHtml The HTML table as string
 * @param isHeader Function to determine if a row is a header row
 * @returns Reformatted HTML table string
 */
export function markTableHeaders(tableHtml: string, isHeader: (text: string) => boolean): string {
  try {
    const htmlElement = parse(tableHtml);
    const rows = htmlElement.querySelectorAll("tr");

    // Find the first body row
    let firstBodyRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (isHeader(rows[i].text)) {
        firstBodyRowIndex = i;
        break;
      }
    }

    if (firstBodyRowIndex === -1) {
      return tableHtml;
    }

    // Create new table structure with thead and tbody
    const table = new HTMLElement("table", {});

    // Add thead with header rows
    if (firstBodyRowIndex > 0) {
      const thead = new HTMLElement("thead", {});
      for (let i = 0; i < firstBodyRowIndex; i++) {
        thead.appendChild(rows[i].clone());
      }
      table.appendChild(thead);
    }

    // Add tbody with body rows
    const tbody = new HTMLElement("tbody", {});
    for (let i = firstBodyRowIndex; i < rows.length; i++) {
      tbody.appendChild(rows[i].clone());
    }
    table.appendChild(tbody);

    return table.outerHTML;
  } catch (error) {
    console.error("Error marking table headers:", error);
    return tableHtml;
  }
}

/**
 * Convert HTML to Markdown format
 * @param html The HTML string to convert
 * @returns Markdown representation
 */
export function convertToMarkdown(html: string): string {
  try {
    return new NodeHtmlMarkdown().translate(html);
  } catch (error) {
    console.error("Error converting to markdown:", error);
    return html;
  }
}

/**
 * Extract word meanings from HTML content
 * @param html The HTML content to parse
 * @returns Array of meaning strings
 */
export function extractMeanings(html: string): string[] {
  try {
    const doc = parse(html);
    
    // Find meaning section elements
    const headerDl = doc.querySelector("dl>dt>span.fld-znaczenia")?.parentNode.parentNode;
    const dlWithDefinitions = headerDl?.nextElementSibling?.nextElementSibling;
    const definitions = dlWithDefinitions?.querySelectorAll("dd");
    
    return (
      definitions?.map((it) =>
        it.innerText
          .replace(/;.*/, "") // Remove everything after semicolon
          .replace(/\(\d.\d\)/, "") // Remove number references
          .trim(),
      ) || []
    );
  } catch (error) {
    console.error("Error extracting meanings:", error);
    return [];
  }
}