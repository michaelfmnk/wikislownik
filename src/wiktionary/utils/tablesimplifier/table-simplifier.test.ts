import { expect, describe, it } from "vitest";
import { parse } from "node-html-parser";
import {
  calculateHtmlTableDimensions,
  createMatrix,
  fillInMatrix,
  printTable,
  simplifyTableSpans,
  SKIP_MARKER,
} from "./table-simplifier";

/**
 * Sample simple table for testing
 */
const sampleTable = `
<table class="wikitable odmiana adj" style="border:none;">
  <tbody>
  <tr>
    <th rowspan="2"><a>przypadek</a></th>
    <th colspan="4"><i>liczba pojedyncza</i></th>
    <th colspan="2"><i>liczba mnoga</i></th>
  </tr>
  <tr>
    <td colspan="2">gruby</td>
    <td>gruba</td>
    <td>grube</td>
    <td>grubi</td>
    <td>grube</td>
  </tr>
  </tbody>
</table>
`;

/**
 * More complex conjugation table with nested elements and attributes
 */
const complexTable = `
<table class="wikitable odmiana adj collapsible collapsed" style="width:100%; margin:5px 0 0 0;">
  <tbody>
    <tr>
      <th colspan="7"><span typeof="mw:Entity">&nbsp;</span>stopień wyższy <b>grubszy</b></th>
    </tr>
    <tr>
      <th rowspan="2"><a rel="mw:WikiLink" href="//pl.wiktionary.org/wiki/przypadek" title="przypadek">przypadek</a></th>
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
      <td class="forma"><a rel="mw:WikiLink" href="//pl.wiktionary.org/wiki/mianownik" title="mianownik">mianownik</a></td>
      <td colspan="2">grubszy</td>
      <td>grubsza</td>
      <td>grubsze</td>
      <td>grubsi</td>
      <td>grubsze</td>
    </tr>
  </tbody>
</table>
`;

describe('Table Simplifier', () => {
  describe('createMatrix', () => {
    it('should create a matrix with correct dimensions', () => {
      const matrix = createMatrix(3, 4);
      
      expect(matrix.length).toBe(3);
      expect(matrix[0].length).toBe(4);
      expect(matrix[1].length).toBe(4);
      expect(matrix[2].length).toBe(4);
      
      // Verify all cells are initialized to null
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          expect(matrix[row][col]).toBe(null);
        }
      }
    });
  });

  describe('calculateHtmlTableDimensions', () => {
    it('should calculate correct dimensions for a simple table', () => {
      const doc = parse(sampleTable);
      const dimensions = calculateHtmlTableDimensions(doc);
      
      expect(dimensions.cols).toBe(7);
      expect(dimensions.rows).toBe(2);
    });
    
    it('should calculate correct dimensions for a complex table', () => {
      const doc = parse(complexTable);
      const dimensions = calculateHtmlTableDimensions(doc);
      
      // 7 columns because of the colspan in the header
      expect(dimensions.cols).toBe(7);
      // 4 rows in the sample complex table
      expect(dimensions.rows).toBe(4);
    });
  });

  describe('fillInMatrix', () => {
    it('should correctly fill the matrix with table data', () => {
      const doc = parse(sampleTable);
      const matrix = createMatrix(2, 7);
      
      fillInMatrix(doc, matrix);
      
      // Check some specific expected values
      expect(matrix[0][0]).toBe('przypadek');
      expect(matrix[0][1]).toBe('liczba pojedyncza');
      expect(matrix[0][5]).toBe('liczba mnoga');
      
      expect(matrix[1][1]).toBe('gruby');
      expect(matrix[1][3]).toBe('gruba');
      expect(matrix[1][4]).toBe('grube');
      expect(matrix[1][5]).toBe('grubi');
      expect(matrix[1][6]).toBe('grube');
    });
    
    it('should handle rowspan and colspan in complex tables', () => {
      const doc = parse(complexTable);
      const dimensions = calculateHtmlTableDimensions(doc);
      const matrix = createMatrix(dimensions.rows, dimensions.cols);
      
      fillInMatrix(doc, matrix);
      
      // Check h/eader text that spans columns
      expect(matrix[0][0]).toBe('stopień wyższy grubszy');
      
      // Check cells with rowspan
      expect(matrix[1][0]).toBe('przypadek');
      
      // Check cells with colspan
      expect(matrix[1][1]).toBe('liczba pojedyncza');
      
      // Check values in the last row
      expect(matrix[3][0]).toBe('mianownik');
      expect(matrix[3][1]).toBe('grubszy');
      expect(matrix[3][3]).toBe('grubsza');
    });
  });

  describe('printTable', () => {
    it('should generate correct HTML table from a matrix', () => {
      const data = [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Cell 1,1', 'Cell 1,2', 'Cell 1,3'],
        ['Cell 2,1', 'Cell 2,2', 'Cell 2,3']
      ];
      
      const result = printTable(data);
      
      // Expected HTML output
      const expected = "<table>" +
        "<tr><td>Header 1</td><td>Header 2</td><td>Header 3</td></tr>" +
        "<tr><td>Cell 1,1</td><td>Cell 1,2</td><td>Cell 1,3</td></tr>" +
        "<tr><td>Cell 2,1</td><td>Cell 2,2</td><td>Cell 2,3</td></tr>" +
        "</table>";
        
      expect(result).toBe(expected);
    });
    
    it('should handle SKIP_MARKER correctly', () => {
      const data = [
        ['Header', 'Span Content'],
        [SKIP_MARKER, 'Cell']
      ];
      
      const result = printTable(data);
      
      // Skip marker should be converted to a non-breaking space
      const expected = "<table>" +
        "<tr><td>Header</td><td>Span Content</td></tr>" +
        "<tr><td>&#8193;</td><td>Cell</td></tr>" +
        "</table>";
        
      expect(result).toBe(expected);
    });
  });

  describe('simplifyTableSpans', () => {
    it('should convert a complex table to a simplified table structure', () => {
      const result = simplifyTableSpans(complexTable);
      
      // The result should be a table string
      expect(result).toContain('<table>');
      expect(result).toContain('</table>');
      
      // The result should not contain rowspan or colspan attributes
      expect(result).not.toContain('rowspan=');
      expect(result).not.toContain('colspan=');
      
      // The result should contain all the text from the original table
      expect(result).toContain('stopień wyższy grubszy');
      expect(result).toContain('przypadek');
      expect(result).toContain('liczba pojedyncza');
      expect(result).toContain('liczba mnoga');
      expect(result).toContain('grubszy');
      expect(result).toContain('grubsza');
      expect(result).toContain('grubsi');
    });
    
    it('should handle a simple table correctly', () => {
      const result = simplifyTableSpans(sampleTable);
      
      // Verify basic structure
      expect(result).toContain('<table>');
      expect(result).toContain('</table>');
      
      // Verify content is preserved
      expect(result).toContain('przypadek');
      expect(result).toContain('liczba pojedyncza');
      expect(result).toContain('liczba mnoga');
      expect(result).toContain('gruby');
      expect(result).toContain('gruba');
      expect(result).toContain('grube');
      expect(result).toContain('grubi');
    });
  });
});

