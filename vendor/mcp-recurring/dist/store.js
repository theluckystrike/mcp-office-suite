import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { readJsonFile } from "@theluckystrike/mcp-invoice/lib";
export function dataDir() {
    const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
    const dir = join(base, "mcp-servers", "recurring");
    mkdirSync(dir, { recursive: true });
    return dir;
}
export function lockPath() { return join(dataDir(), ".lock"); }
function read(file, empty) {
    return readJsonFile(join(dataDir(), file), empty);
}
function write(file, value) {
    const p = join(dataDir(), file);
    const tmp = `${p}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(value, null, 2));
    renameSync(tmp, p);
}
export function getSchedules() { return read("schedules.json", []); }
export function setSchedules(s) { write("schedules.json", s); }
export function getHistory() { return read("history.json", []); }
export function setHistory(h) { write("history.json", h); }
/** The generated-periods index: "<schedule_id>|<period>" for every invoice already made. */
export function generatedKeys(history) {
    return new Set(history.map((h) => `${h.schedule_id}|${h.period}`));
}
/**
 * Resolve a schedule by exact id, then by exact client name, then -- only if nothing
 * exact matched -- by partial client name. An exact id or client match always wins
 * outright, with no ambiguity check: it is a precise reference. The partial-name
 * fallback is not: "Acme Inc" is also a substring match for "Acme Inc (Consulting)", so
 * more than one candidate there is refused with the candidate list instead of silently
 * picking whichever is first in storage order (Review V5 P2), which could otherwise
 * point schedule_pause/schedule_delete/schedule_skip at the wrong client's schedule with
 * no warning.
 */
export function findSchedule(list, ref) {
    const needle = ref.trim().toLowerCase();
    const byId = list.find((s) => s.id === ref);
    if (byId)
        return byId;
    const byClient = list.find((s) => s.client.toLowerCase() === needle);
    if (byClient)
        return byClient;
    const partial = list.filter((s) => s.client.toLowerCase().includes(needle));
    if (partial.length > 1) {
        throw new Error(`"${ref}" matches more than one schedule: ${partial.map((s) => `${s.id} (${s.client})`).join(", ")}. ` +
            `Pass the exact id or the exact client name.`);
    }
    return partial[0];
}
