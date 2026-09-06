import { type Block } from "./blocks.js";
import type { Business } from "./store.js";
export type DocStyle = "plain" | "letter" | "proposal";
export interface BuildOptions {
    title: string;
    blocks: Block[];
    style?: DocStyle;
    business: Business;
    pro: boolean;
    date?: string;
    recipient?: string;
}
export declare function buildDocx(o: BuildOptions): Promise<Buffer>;
/** Semantic HTML with a print stylesheet: open it in a browser and print to PDF. */
export declare function toHtml(title: string, blocks: Block[]): string;
