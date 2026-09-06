import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
export function dataDir() {
    const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
    const dir = join(base, "mcp-servers", "pdf");
    mkdirSync(dir, { recursive: true });
    return dir;
}
export class CorruptDataError extends Error {
}
export function markerPath(file) { return `${file}.corrupt`; }
function blocked(file, moved) {
    return new CorruptDataError(`data file is corrupt; moved to ${moved}; nothing was written. ` +
        `Restore a good copy to ${file}, then delete ${markerPath(file)} to continue.`);
}
export function readJsonFile(file, empty) {
    const marker = markerPath(file);
    if (existsSync(marker)) {
        let moved = `${file}.corrupt-*`;
        try {
            const t = readFileSync(marker, "utf8").trim();
            if (t) {
                try {
                    const j = JSON.parse(t);
                    moved = typeof j.quarantined === "string" && j.quarantined ? j.quarantined : t;
                }
                catch {
                    moved = t;
                }
            }
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
        const moved = `${file}.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`;
        try {
            renameSync(file, moved);
            writeFileSync(marker, JSON.stringify({
                quarantined: moved, at: new Date().toISOString(),
                hint: "the original data file failed to parse; it was moved, nothing was overwritten; restore it manually or delete this marker to start fresh",
            }) + "\n");
        }
        catch { /* keep the parse error */ }
        process.stderr.write(`${file} is not valid JSON (${e.message}); moved to ${moved}\n`);
        throw blocked(file, moved);
    }
}
function file() { return join(dataDir(), "operations.json"); }
export function getOps() { return readJsonFile(file(), []); }
export function addOp(rec) {
    const all = getOps();
    all.push(rec);
    const trimmed = all.slice(-500);
    const p = file();
    const tmp = `${p}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(trimmed, null, 2));
    renameSync(tmp, p);
}
