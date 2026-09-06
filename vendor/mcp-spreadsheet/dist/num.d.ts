/**
 * One locale-aware numeric parser, shared by CSV coercion, aggregation and the
 * expression language (Codex v3 items 4, 5, 7). Every place that turns a cell of text
 * into a number goes through `parseNumberBody` here, so "12,99" cannot mean 12.99 in one
 * code path and 1299 in another.
 *
 * Accepted shapes:
 *   plain            42   -1.5   .5   1e3   1250.00
 *   english grouped  1,250.00   1,250
 *   space grouped    1 250.00   1 250   (also NBSP / narrow NBSP)
 *   european         12,99   1250,00   1.234,56   1 250,00
 *
 * European decimal comma is accepted ONLY in the unambiguous shape: a comma followed by
 * exactly two digits at the end of the string, with dots or spaces (never commas) used
 * for grouping. Anything else that mixes separators ("1,2500.00", "1,234,56") is not a
 * number and stays text.
 */
/**
 * Parse a bare numeric body (no currency, no percent, no parentheses) using the
 * separator rules above. Returns null when the string is not unambiguously a number.
 */
export declare function parseNumberBody(input: string): number | null;
/**
 * Strict parse for CSV import: the cell must be a number and nothing else. Identifiers
 * ("007") and unsafe integers stay text; no currency symbols are stripped.
 */
export declare function parseNumberStrict(raw: string): number | null;
interface LooseOpts {
    /** keep "007" and other leading-zero identifiers as text instead of parsing them */
    identifiers?: boolean;
}
/**
 * Lenient parse for aggregation and comparisons: strips currency symbols and codes,
 * a trailing percent sign and accounting parentheses, then applies the same separator
 * rules. Returns null when nothing numeric is left.
 */
export declare function parseNumberLoose(v: unknown, opts?: LooseOpts): number | null;
/**
 * Parse for expression comparisons (v3 #7): same leniency as aggregation, but a value
 * the CSV layer deliberately preserved as text ("007") is NOT a number here either, so
 * `[Code] = 7` compares "007" against "7" as strings and is false.
 */
export declare function parseNumberForCompare(v: unknown): number | null;
export {};
