import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { removeTree, TEST_TMP_ROOT } from "./_tmp-scope.mjs";

function size(path) {
  const stat = lstatSync(path);
  return stat.isDirectory()
    ? readdirSync(path).reduce((total, name) => total + size(join(path, name)), 0)
    : stat.size;
}

/** Stop only this fixture's process, then remove its closed, bounded scope. */
export async function closeFixture(child, input) {
  const path = resolve(input), rel = relative(TEST_TMP_ROOT, path);
  if (!rel || rel.startsWith("..") || rel.startsWith("/")) {
    throw Error("Refusing fixture cleanup outside its run scope");
  }
  if (child.exitCode === null && child.signalCode === null) {
    let timer;
    const closed = new Promise((resolveClose) => child.once("close", resolveClose));
    child.kill("SIGTERM");
    try {
      await Promise.race([
        closed,
        new Promise((_, reject) => { timer = setTimeout(() => reject(Error("Fixture process did not close")), 5000); }),
      ]);
    } catch (error) {
      child.kill("SIGKILL");
      throw error; // Retain the fixture when shutdown cannot be proved.
    } finally {
      clearTimeout(timer);
    }
  }
  if (!existsSync(path)) return;
  const bytes = size(path);
  if (bytes > 50_000_000) throw Error(`Fixture exceeds 50 MB: ${bytes} bytes`);
  // Closing the proxy also closes its children's stdio. Give those processes time
  // to finish before the scoped helper performs its own lsof check and manifest.
  const deadline = Date.now() + 5000;
  while (true) {
    const open = spawnSync("lsof", ["-t", "+D", path], { encoding: "utf8" });
    if (!open.error && open.status === 1 && !open.stdout.trim()) {
      removeTree(path);
      if (!existsSync(path)) return;
      // The helper checks again immediately before deletion. A child may acquire
      // a handle between scans, so retry the guarded removal instead of racing it.
    } else if (open.error || open.status !== 0) {
      throw Error("Retaining fixture: lsof could not prove all handles closed");
    }
    if (Date.now() >= deadline) throw Error("Retaining fixture: handles did not close before the deadline");
    await delay(100);
  }
}
