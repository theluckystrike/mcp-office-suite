/** The one intermediate shape every input (arguments, markdown, an existing .docx) is turned into. */
export type Block = {
    type: "heading";
    level: number;
    text: string;
} | {
    type: "para";
    text: string;
} | {
    type: "bullets";
    items: string[];
    ordered: boolean;
    levels?: number[];
} | {
    type: "table";
    headers: string[];
    rows: string[][];
} | {
    type: "code";
    text: string;
};
/** Inline runs: bold, italic and monospace inside a paragraph. */
export interface Run {
    text: string;
    bold?: boolean;
    italic?: boolean;
    mono?: boolean;
}
/**
 * Parse **bold**, *italic* / _italic_ and `code` into runs. Unmatched markers stay literal.
 *
 * Underscore italics use CommonMark's left/right-flanking rule so intraword underscores
 * (e.g. late_fee_percent) are left alone: an opening `_` must not be preceded by a word
 * character (start of text, whitespace or punctuation counts) and must be immediately
 * followed by a non-space character; a closing `_` must be immediately preceded by a
 * non-space character and must not be followed by a word character (whitespace,
 * punctuation or end of text counts). Asterisk italics keep the simpler "no adjacent
 * space" rule, so *this* still works intraword.
 */
export declare function inlineRuns(text: string): Run[];
/** Plain text of a block, used by doc_read and by the free-tier text response. */
export declare function blockText(b: Block): string;
