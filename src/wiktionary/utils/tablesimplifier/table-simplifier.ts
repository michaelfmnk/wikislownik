import { HTMLElement, parse } from "node-html-parser";

/**
 * Special marker for cells to skip in the output rendering
 */
export const SKIP_MARKER = "[SKIP]";


/**
 * Cleanup the document by removing <style> and <script> tags
 * @param doc
 * @returns Cleaned document
 */
function cleanupDoc(doc: HTMLElement): HTMLElement {
  const styles = doc.querySelectorAll("style");
  const scripts = doc.querySelectorAll("script");

  styles.forEach((style) => style.remove());
  scripts.forEach((script) => script.remove());
  return doc;
}

/**
 * Convert HTML table with complex rowspan/colspan structure to a simplified format
 * @param html The HTML content of the table
 * @returns Simplified HTML table without rowspan/colspan attributes
 */
export function simplifyTableSpans(html: string): string {
  const doc = cleanupDoc(parse(html));
  const dimensions = calculateHtmlTableDimensions(doc);
  const matrix = createMatrix(dimensions.rows, dimensions.cols);
  fillInMatrix(doc, matrix);
  return printTable(matrix);
}

/**
 * Calculate the dimensions of an HTML table
 * @param doc The HTML element containing the table
 * @returns Object with rows and columns count
 */
export function calculateHtmlTableDimensions(doc: HTMLElement): { rows: number; cols: number } {
  const rows = doc.querySelectorAll("tr").length;
  let cols = 0;
  const firstRow = doc.querySelector("tr");

  if (firstRow) {
    const cells = firstRow.querySelectorAll("td, th");
    cells.forEach((cell) => {
      const colspan = parseInt(cell.getAttribute("colspan") || "1");
      cols += colspan;
    });
  }

  return { rows, cols };
}

/**
 * Create a matrix to represent table cell data
 * @param rows Number of rows
 * @param cols Number of columns
 * @returns 2D array initialized with null values
 */
export function createMatrix(rows: number, cols: number): string[][] {
  const matrix = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  return matrix;
}

/**
 * Fill the matrix with cell content from the HTML table
 * @param doc The HTML element containing the table
 * @param matrix The matrix to fill
 */
export function fillInMatrix(doc: HTMLElement, matrix: string[][]) {
  const rows = doc.querySelectorAll("tr");

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll("td, th");
    let colIndex = 0;
    const maxCols = matrix[i].length;

    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const colspan = Math.min(parseInt(cell.getAttribute("colspan") || "1"), maxCols - colIndex);
      const rowspan = parseInt(cell.getAttribute("rowspan") || "1");

      // Find next available column
      while (matrix[i][colIndex]) {
        colIndex++;
      }

      // Place cell text in the matrix
      setCellWithShift(matrix, i, colIndex, cell.text);

      // Handle rowspan and colspan by filling in cells
      let first = true;
      for (let k = 0; k < rowspan; k++) {
        for (let l = 0; l < colspan; l++) {
          matrix[i + k][colIndex + l] = first ? cell.text.trim() : SKIP_MARKER;
          first = false;
        }
      }

      colIndex += colspan;
    }
  }
}

/**
 * Convert the matrix back to HTML table
 * @param matrix The matrix containing cell data
 * @returns HTML table string
 */
export function printTable(matrix: string[][]): string {
  let output = "";

  for (let i = 0; i < matrix.length; i++) {
    output += "<tr>";
    for (let j = 0; j < matrix[i].length; j++) {
      const value = matrix[i][j];
      if (value === SKIP_MARKER) {
        // Use non-breaking space for skipped cells
        output += "<td>&#8193;</td>";
      } else {
        output += `<td>${value || ""}</td>`;
      }
    }
    output += "</tr>";
  }

  return "<table>" + output + "</table>";
}

/**
 * Set a cell value with potential column shift if the target cell is occupied
 * @param matrix The matrix to modify
 * @param i Row index
 * @param colIndex Column index
 * @param text Cell text
 */
export function setCellWithShift(matrix: string[][], i: number, colIndex: number, text: string) {
  let shift = 0;
  while (matrix[i][colIndex + shift]) {
    shift++;
  }
  matrix[i][colIndex + shift] = text;
}
