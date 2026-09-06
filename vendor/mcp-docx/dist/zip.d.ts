/**
 * A .docx is a ZIP. Reading and rewriting one needs no dependency beyond node:zlib,
 * so doc_read and doc_fill_template add zero install weight and stay pure JS.
 * Only the two methods a .docx actually uses are supported: 0 (stored) and 8 (deflate).
 */
export interface ZipEntry {
    name: string;
    data: Buffer;
}
export declare function crc32(buf: Buffer): number;
/** Read every entry of a ZIP archive in central-directory order. */
export declare function readZip(buf: Buffer): ZipEntry[];
/** Write entries back as a deflate ZIP, entry order preserved. */
export declare function writeZip(entries: ZipEntry[]): Buffer;
