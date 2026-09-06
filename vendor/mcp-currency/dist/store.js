import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
export function dataDir() {
    const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
    return join(base, "mcp-servers", "currency");
}
export function dailyPath() { return join(dataDir(), "daily.json"); }
export function historyPath() { return join(dataDir(), "history.json"); }
export function lockPath() { return join(dataDir(), ".lock"); }
/**
 * A read or JSON.parse failure must never be reported as "no cache": the next refresh
 * would then overwrite a cache that is still on disk, and an offline machine would lose
 * the only rates it has. Only ENOENT means empty. A parse failure quarantines the file
 * byte-for-byte as <file>.corrupt-<timestamp>, writes a marker so every later call keeps
 * failing until a human resolves it, and throws.
 */
export class CorruptDataError extends Error {
    /** The `<file>.corrupt-<timestamp>` copy holding the original bytes. */
    quarantined;
    /** True only when this very call did the moving, so the caller can be told it just happened. */
    justQuarantined = false;
}
export function markerPath(file) { return `${file}.corrupt`; }
function corruptStamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
function blocked(file, moved, justQuarantined = false) {
    const e = new CorruptDataError(`the cache file is corrupt; moved to ${moved}; nothing was written. ` +
        `Delete ${markerPath(file)} to let the next call re-download it from the ECB.`);
    e.quarantined = moved;
    e.justQuarantined = justQuarantined;
    return e;
}
export function markerBody(quarantined) {
    return JSON.stringify({
        quarantined,
        at: new Date().toISOString(),
        hint: "the rate cache failed to parse; it was moved, nothing was overwritten; delete this marker and the next call re-downloads the ECB file",
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
/** Returns undefined when the file does not exist. Throws CorruptDataError on anything else. */
export function readJsonFile(file) {
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
            return undefined;
        {
            const err = new CorruptDataError(`cannot read the cache file ${file}: ${e.message}; nothing was written.`);
            throw err;
        }
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
        throw blocked(file, moved, true);
    }
}
/** tmp + rename, so a crash mid-write, or two processes refreshing at once, never leaves a half file. */
export function writeJsonFile(file, value) {
    const dir = dataDir();
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(value));
    renameSync(tmp, file);
}
export function loadDaily() {
    const c = readJsonFile(dailyPath());
    if (!c || typeof c.date !== "string" || !c.rates || typeof c.rates !== "object")
        return undefined;
    return { version: 1, fetched_at: String(c.fetched_at ?? ""), date: c.date, rates: c.rates };
}
export function loadHistory() {
    const c = readJsonFile(historyPath());
    if (!c || !c.days || typeof c.days !== "object")
        return undefined;
    return { version: 1, fetched_at: String(c.fetched_at ?? ""), days: c.days };
}
