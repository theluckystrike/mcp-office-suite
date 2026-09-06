import { PDFDocument } from "pdf-lib";
/** Nothing larger is read: a 100 MB PDF already needs more than a gigabyte of heap to rewrite. */
export declare const MAX_BYTES: number;
export declare function expandPath(p: string): string;
export declare function humanBytes(n: number): string;
export interface LoadedPdf {
    path: string;
    bytes: Uint8Array;
    size: number;
    doc: PDFDocument;
    pageCount: number;
    /** The PDF/A level the file claims for itself, if any. Not validated here. */
    pdfa: string | null;
}
/**
 * Read one input file. Encryption is not "handled with a warning": pdf-lib cannot
 * decrypt, and loading with ignoreEncryption yields garbage pages that would be
 * written into the output. Such a file is refused with the reason named.
 */
export declare function loadPdf(input: string): Promise<LoadedPdf>;
/** True when the trailer names an /Encrypt dictionary, used by pdf_info to report the flag. */
export declare function looksEncrypted(bytes: Uint8Array): boolean;
export interface Reservation {
    path: string;
    created: boolean;
}
/**
 * Reserve an output path with an exclusive create, not an existence check: two
 * processes writing the same out_path with overwrite:false would both pass a check
 * and the second would clobber the first. The reservation is a real 0-byte file, so
 * it is released again if the work that follows fails.
 */
export declare function reserveOutput(out: string, overwrite: boolean, inputs?: string[], ext?: string): Reservation;
export declare function releaseReservations(rs: Reservation[]): void;
/**
 * A file that carries an XMP pdfaid claim says it is PDF/A. Nothing here validates
 * that claim, and every write path below breaks it (a stamp adds a font that is not
 * embedded to the standard PDF/A requires; a merge builds a new document without the
 * source OutputIntents), so the claim is reported and the break is stated.
 */
export declare function pdfaClaim(bytes: Uint8Array): string | null;
export interface Range {
    from: number;
    to: number;
    label: string;
}
/**
 * "1-3,5,7-" against a 9-page file -> 1-3, 5-5, 7-9. An open-ended part runs to the
 * last page. Every number is 1-based, as a person counts pages, and a number past the
 * end is an error rather than a silent clamp.
 */
export declare function parseRanges(spec: string, pageCount: number): Range[];
/** "2,4-6" -> zero-based [1,3,4,5], in the order written. Duplicates are kept: asking for a page twice copies it twice. */
export declare function parsePageList(spec: string, pageCount: number): number[];
