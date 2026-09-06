import { PDFDocument } from "pdf-lib";
/**
 * Best-effort text extraction, on purpose and with no hidden dependency.
 *
 * A PDF does not store text; it stores drawing operators. This module decompresses
 * each page's FlateDecode content stream with node:zlib and reads the four
 * text-showing operators - Tj, TJ, ' and " - plus the positioning operators that
 * end a line. What comes out is the bytes the page hands its font. When the font
 * uses a standard encoding (every PDF written with a built-in font, and most
 * exports from word processors) those bytes are the text. When the font ships a
 * custom or CID encoding - most scanned, subset-embedded or CJK documents - they
 * are glyph indices, and the answer says so instead of pretending otherwise.
 *
 * There is no OCR here: a scanned page carries an image and no text operators at
 * all, so it comes back empty and is reported as empty.
 */
export interface PageText {
    page: number;
    text: string;
    /** Why a page produced nothing, when it produced nothing. */
    note?: string;
}
/** Read the text-showing operators out of one decompressed content stream. */
export declare function textFromContentStream(content: Buffer): string;
export interface ExtractResult {
    pages: PageText[];
    /** Pages whose bytes were not text-shaped: encoding notes, unsupported filters, image-only pages. */
    warnings: string[];
}
export declare function extractText(doc: PDFDocument, pageIndexes: number[]): ExtractResult;
