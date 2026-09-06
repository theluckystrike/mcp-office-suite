/**
 * The clause library on disk.
 *
 * One JSON file holds every clause, starter and own. A read or JSON.parse failure is never
 * reported as "empty library": the next mutation would overwrite a history that is still on
 * disk. Only ENOENT means empty. A parse failure quarantines the file byte-for-byte as
 * <file>.corrupt-<timestamp>, writes a marker so every later call keeps failing until a human
 * resolves it, and throws. Same contract as servers/expense-tracker/src/store.ts.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { STARTER_CLAUSES } from "./starter.js";
export const EMPTY = { version: 1, clauses: [], seeded: false };
/** Assembly order when clauses come from `categories`, and the order of clauses://categories. */
export const CATEGORY_ORDER = [
    "parties", "scope", "payment", "expenses", "ip", "confidentiality",
    "data", "term", "liability", "warranty", "disputes", "general",
];
export function categoryRank(c) {
    const i = CATEGORY_ORDER.indexOf(c);
    return i < 0 ? CATEGORY_ORDER.length : i;
}
export function dataDir() {
    const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
    return join(base, "mcp-servers", "clauses");
}
export function dbPath() { return join(dataDir(), "data.json"); }
export function lockPath() { return join(dataDir(), ".lock"); }
export class CorruptDataError extends Error {
}
export function markerPath(file) { return `${file}.corrupt`; }
function corruptStamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
function blocked(file, moved) {
    return new CorruptDataError(`data file is corrupt; moved to ${moved}; nothing was written. ` +
        `Restore a good copy to ${file}, then delete ${markerPath(file)} to continue.`);
}
export function markerBody(quarantined) {
    return JSON.stringify({
        quarantined,
        at: new Date().toISOString(),
        hint: "the original data file failed to parse; it was moved, nothing was overwritten; restore it manually or delete this marker to start fresh",
    }) + "\n";
}
function markerQuarantinePath(raw) {
    const t = raw.trim();
    if (!t)
        return undefined;
    try {
        const parsed = JSON.parse(t);
        if (typeof parsed.quarantined === "string" && parsed.quarantined)
            return parsed.quarantined;
        return undefined;
    }
    catch {
        return t;
    }
}
export function readJsonFile(file, empty) {
    const marker = markerPath(file);
    if (existsSync(marker)) {
        let moved = `${file}.corrupt-*`;
        try {
            moved = markerQuarantinePath(readFileSync(marker, "utf8")) ?? moved;
        }
        catch { /* marker unreadable */ }
        throw blocked(file, moved);
    }
    let raw;
    try {
        raw = readFileSync(file, "utf8");
    }
    catch (e) {
        if (e.code === "ENOENT")
            return empty;
        throw new CorruptDataError(`cannot read the data file ${file}: ${e.message}; nothing was written.`);
    }
    try {
        return JSON.parse(raw);
    }
    catch (e) {
        const moved = `${file}.corrupt-${corruptStamp()}`;
        try {
            renameSync(file, moved);
            writeFileSync(marker, markerBody(moved));
        }
        catch { /* keep the parse error */ }
        process.stderr.write(`${file} is not valid JSON (${e.message}); moved to ${moved}\n`);
        throw blocked(file, moved);
    }
}
function normalize(c) {
    if (!c || typeof c.id !== "string" || typeof c.title !== "string" || typeof c.body !== "string")
        return undefined;
    const now = new Date().toISOString();
    return {
        id: c.id,
        title: c.title,
        body: c.body,
        category: typeof c.category === "string" && c.category ? c.category : "general",
        tags: Array.isArray(c.tags) ? c.tags.filter((t) => typeof t === "string") : [],
        variables: Array.isArray(c.variables) ? c.variables.filter((t) => typeof t === "string") : [],
        jurisdiction: typeof c.jurisdiction === "string" ? c.jurisdiction : undefined,
        language: typeof c.language === "string" && c.language ? c.language : "en",
        starter: c.starter === true,
        note: typeof c.note === "string" ? c.note : undefined,
        created: typeof c.created === "string" ? c.created : now,
        updated: typeof c.updated === "string" ? c.updated : now,
        history: Array.isArray(c.history)
            ? c.history.filter((h) => !!h && typeof h.at === "string" && typeof h.body === "string")
            : [],
    };
}
/**
 * The starter set is seeded once, on the first load, and marked with `seeded`. A user who
 * deletes a starter clause does not get it back on the next call -- re-seeding every load
 * would make clause_delete silently useless.
 */
export function load() {
    const raw = readJsonFile(dbPath(), { ...EMPTY, clauses: [] });
    const clauses = (Array.isArray(raw.clauses) ? raw.clauses : [])
        .map((c) => normalize(c))
        .filter((c) => !!c);
    if (raw.seeded === true)
        return { version: 1, clauses, seeded: true };
    const now = new Date().toISOString();
    const have = new Set(clauses.map((c) => c.id));
    const seeded = STARTER_CLAUSES
        .filter((s) => !have.has(s.id))
        .map((s) => ({
        ...s, tags: [...s.tags], variables: [...s.variables],
        starter: true, note: STARTER_NOTE, language: "en",
        created: now, updated: now, history: [],
    }));
    return { version: 1, clauses: [...clauses, ...seeded], seeded: true };
}
export const STARTER_NOTE = "generic template, not legal advice";
/** tmp + rename, so a crash mid-write never leaves a half file. */
export function save(db) {
    const dir = dataDir();
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    const p = dbPath();
    const tmp = `${p}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, p);
}
