import type { Block } from "./blocks.js";
/**
 * A small WordprocessingML walk. Enough to read text, headings, lists and tables back
 * out of any .docx, and to substitute {{placeholders}} in one without touching the rest
 * of the package - so formatting, styles, headers and images survive a template fill.
 * No XML library: the shapes we need are regular, and an extra dependency is not worth it.
 */
export declare function unescapeXml(s: string): string;
export declare function escapeXml(s: string): string;
/**
 * numId -> "bullet" | "decimal" | ... , read from word/numbering.xml. Without it every
 * numbered list reads back as a bullet list, because in WordprocessingML the only
 * difference between the two is the numbering definition the paragraph points at.
 */
export type NumFormats = Map<string, string>;
export declare function numberingFormats(numberingXml: string): NumFormats;
/** Walk a WordprocessingML fragment into blocks, in document order. */
export declare function blocksOf(xml: string, fmts?: NumFormats): Block[];
/**
 * Refuse anything that is a ZIP but not a Word package. Without this, doc_fill_template
 * happily rewrites an arbitrary .zip and hands back a "-filled.docx" that Word cannot open.
 */
export declare function assertDocx(buf: Buffer, path: string): void;
export declare function documentXml(buf: Buffer): string;
export declare function readDocx(buf: Buffer): Block[];
/**
 * XML 1.0 allows only TAB, LF, CR and #x20 upward. A NUL or a stray 0x1B inside a
 * placeholder value is well-formed after escaping but makes Word refuse the file, so
 * every string that reaches document.xml passes through here first.
 */
export declare function stripInvalidXml(s: string): {
    text: string;
    removed: number;
};
/** Every distinct {{placeholder}} in a .docx, in first-seen order. */
export declare function placeholdersIn(buf: Buffer): string[];
/** The visible text of one `<w:p>` body. */
export declare function paragraphText(inner: string): string;
export interface FillResult {
    buffer: Buffer;
    replaced: string[];
    unfilled: string[];
    sanitized: string[];
}
/** Replace {{key}} placeholders across document, headers and footers; everything else is byte-identical. */
export declare function fillDocx(buf: Buffer, values: Record<string, string>): FillResult;
