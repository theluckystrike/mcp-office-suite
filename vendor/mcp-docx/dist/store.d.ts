/**
 * Same shape as servers/invoice/src/store.ts. The two servers are meant to be
 * merged later, so the business profile is field-for-field identical; brand_color
 * is the only addition (letterhead colour, Pro) and it is optional.
 */
export interface Business {
    name: string;
    address?: string;
    email?: string;
    vat_id?: string;
    iban?: string;
    bank?: string;
    logo_path?: string;
    brand_color?: string;
    default_currency: string;
    default_tax_rate: number;
    payment_terms_days: number;
    invoice_prefix: string;
}
export type DocKind = "document" | "markdown" | "proposal" | "contract" | "template" | "html";
export interface DocRecord {
    id: string;
    kind: DocKind;
    title: string;
    client?: string;
    number?: string;
    path: string;
    created: string;
    /** The structured input a proposal or contract was built from, so it can be rewritten in place. */
    data?: unknown;
}
export declare function dataDir(): string;
/**
 * A read or JSON.parse failure must never be reported as "empty database": the next
 * mutation would then overwrite a history that is still on disk. Only ENOENT means
 * empty. A parse failure quarantines the file byte-for-byte as <file>.corrupt-<ts>,
 * writes a marker so every later call keeps failing until a human resolves it, and throws.
 */
export declare class CorruptDataError extends Error {
}
export declare function markerPath(file: string): string;
export declare function readJsonFile<T>(file: string, empty: T): T;
export declare const DEFAULT_BUSINESS: Business;
/**
 * D-R31. Same rule as invoice: the shared profile is read first and wins field by field,
 * the local business.json stays as the compatibility copy. brand_color is docx-only and
 * therefore never leaves the local file.
 */
export declare function getBusiness(): Business;
/** Writes the shared profile as well, so invoice, expense-tracker and recurring see it. */
export declare function setBusiness(b: Business): void;
export declare function hasBusiness(): boolean;
export declare function getDocs(): DocRecord[];
export declare function setDocs(d: DocRecord[]): void;
/** Rewrite one stored record in place, keyed by id. Returns false when the id is gone. */
export declare function updateDoc(id: string, patch: Partial<DocRecord>): boolean;
export declare function addDoc(rec: DocRecord): void;
/**
 * Allocate the next document reference: <prefix>-<YYYY>-<NNNN>. The counter is
 * written before the record is stored, so a crash burns a number rather than
 * reusing one, and existing numbers are scanned so a restored documents.json can
 * never hand back a reference that is already on a sent document.
 */
export declare function nextNumber(prefix: string, year: string): string;
export declare function docsInMonth(month: string, kinds: DocKind[]): DocRecord[];
