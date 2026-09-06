import type { Block } from "./blocks.js";
/** Word models nine list levels; deeper markdown indentation is clamped to the last one. */
export declare const MAX_LIST_LEVEL = 8;
/** Markdown to blocks: ATX headings, paragraphs, bullet and numbered lists, GFM pipe tables, fenced code. */
export declare function parseMarkdown(src: string): Block[];
