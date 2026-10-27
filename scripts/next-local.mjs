// Runs a Next.js command (`dev`, `start`, `build`) with the local credential file loaded.
//
// The file lives outside the working copy, in ~/.secrets/four-seasons/.env.local (owner,
// 2026-10-27), and Next only reads `.env*` files from the project folder. Values already in
// `process.env` take precedence over them
// (https://nextjs.org/docs/app/guides/environment-variables, read 2026-10-27), so this script
// puts the file's values into the environment and starts Next with it.
//
// `node --env-file-if-exists=… next dev` doesn't work: `next dev` copies the parent's
// execArgv into its child server's NODE_OPTIONS, where Node refuses that flag (Next 16.2.6).
//
// Variables already set in the shell win over the file, as with `--env-file`. Without the file,
// Next runs as usual and still reads a `.env.local` in the project folder, if there is one.
// util.parseEnv doesn't expand `$VAR` references the way Next's own loader does.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";

const envFile = join(homedir(), ".secrets", "four-seasons", ".env.local");
const env = { ...process.env };
if (existsSync(envFile)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(envFile, "utf8")))) {
    if (!(key in env)) env[key] = value;
  }
}

const next = join(import.meta.dirname, "..", "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, ...process.argv.slice(2)], { stdio: "inherit", env });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => {
  if (!signal) process.exit(code ?? 1);
  process.removeAllListeners(signal); // so the re-raised signal ends this process too
  process.kill(process.pid, signal);
});
