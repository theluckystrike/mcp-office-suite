/**
 * The document engine, as a stable public API for other servers in this repo.
 *
 * `src/index.ts` is the MCP server (tools, licensing, storage). Everything below it --
 * the block model, the .docx writer, the .docx reader, the markdown parser, the ZIP
 * container and the XML sanitiser -- is generic and is re-exported here so a sibling
 * server (servers/resume) can build Word documents without a second copy of the code.
 *
 * Nothing in this module touches the filesystem, the network or the licence store at
 * import time. `buildDocx` is the only async entry point.
 *
 * Stability: the names below are the contract. `src/*.js` deep imports are not.
 */
export type { Block, Run } from "./blocks.js";
export { blockText, inlineRuns } from "./blocks.js";
export type { BuildOptions, DocStyle } from "./build.js";
export { buildDocx, toHtml } from "./build.js";
export { MAX_LIST_LEVEL, parseMarkdown } from "./md.js";
export type { FillResult, NumFormats } from "./wordxml.js";
export { assertDocx, documentXml, escapeXml, fillDocx, numberingFormats, placeholdersIn, readDocx, stripInvalidXml, unescapeXml, } from "./wordxml.js";
export type { ZipEntry } from "./zip.js";
export { crc32, readZip, writeZip } from "./zip.js";
export type { Business } from "./store.js";
import type { Business } from "./store.js";
/**
 * The minimum `Business` a caller needs to pass `buildDocx` a letterhead. The invoice
 * fields carry defaults so a server that has no invoicing concept does not have to
 * invent a tax rate to print a document.
 */
export declare function letterhead(o: Partial<Business> & {
    name: string;
}): Business;
