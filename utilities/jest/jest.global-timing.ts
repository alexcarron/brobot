// utilities/jest/jest.global-timing.ts
import fs from "fs";
import os from "os";
import path from "path";
import { performance } from "perf_hooks";

const TMP_DIR = path.join(os.tmpdir(), "jest-hook-timings");
if (!fs.existsSync(TMP_DIR)) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

/**
 * Given a test file path, returns a file path to a .json file in
 * {@link TMP_DIR} that will store the hook timings for that test file.
 * @param testFilePath The path to the test file for which to generate the hook timings file.
 * @returns The file path to the .json file in which hook timings will be stored.
 */
function fileForTest(testFilePath: string) {
  const name = Buffer.from(testFilePath).toString("base64");
  return path.join(TMP_DIR, `${name}.json`);
}

/**
 * Writes hook timing data to disk. If the file already exists, it reads the existing data, updates the hook, and writes it back. If the file does not exist, it creates a new one. If the write fails, it simply ignores the failure.
 * @param testFilePath The path to the test file for which to save hook timings.
 * @param hookName The name of the hook for which to save timings.
 * @param duration The duration of the hook in milliseconds.
 */
function safeWriteHookDuration(testFilePath: string, hookName: string, duration: number) {
  if (!testFilePath) return;
  const file = fileForTest(testFilePath);
  let obj: { hooks: Record<string, number> } = { hooks: {} };
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      obj = JSON.parse(raw);
      if (!obj.hooks) obj.hooks = {};
    }
  } catch {
    obj = { hooks: {} };
  }
  obj.hooks[hookName] = duration;
  try {
    fs.writeFileSync(file, JSON.stringify(obj), "utf8");
  } catch {
    // ignore write failures (best-effort)
  }
}

/**
 * Wraps a hook function with a timer that records the duration of the hook to disk.
 * If the hook returns a Promise, it waits for the Promise to resolve before recording the duration.
 * If the hook does not return a Promise, it immediately records the duration.
 * The duration is written to a file named after the test file path, suffixed with ".json".
 * If the file already exists, it reads the existing data, updates the hook, and writes it back. If the file does not exist, it creates a new one. If the write fails, it simply ignores the failure.
 * @param original The original hook function to wrap.
 * @param hookName The name of the hook function.
 * @returns A wrapper function that records the duration of the original hook function and returns the result of the original hook function.
 */
function wrapHook(original: (...args: any[]) => any, hookName: string) {
  return async (...args: any[]) => {
    const start = performance.now();
    // run the original hook (may be sync or async)
    const res = original(...args);
    // wait if returns a promise
    if (res && typeof (res as Promise<any>).then === "function") {
      await res;
    }
    const duration = performance.now() - start;

    // determine test file path for this worker; prefer expect.getState().testPath
    let testFilePath: string | undefined;
    try {
      // expect.getState is available in Jest runtime
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof (global as any).expect?.getState === "function") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        testFilePath = (global as any).expect.getState().testPath;
      }
    } catch {
      // ignore
    }

    // fallback heuristics: if testFilePath undefined, try env var or unknown
    if (!testFilePath) {
      testFilePath = process.env.JEST_TEST_FILE_PATH || undefined;
    }

    if (testFilePath) {
      safeWriteHookDuration(testFilePath, hookName, duration);
    } else {
      // best-effort console output so you can still see something in worker logs
      // but reporter won't get it unless file exists
      // eslint-disable-next-line no-console
      console.log(`⏱ [${duration.toFixed(2)}ms] Hook "${hookName}" (unknown-file)`);
    }
  };
}

const hooks = ["beforeAll", "beforeEach", "afterEach", "afterAll"] as const;

hooks.forEach(hook => {
  const realHook = (global as any)[hook];
  if (!realHook) return;
  (global as any)[hook] = (fn?: (...args: any[]) => any) => {
    if (!fn) {
      // if no function passed, call original (should be allowed)
      return realHook(fn);
    }
    return realHook(wrapHook(fn, hook));
  };
});
