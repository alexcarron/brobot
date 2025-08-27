import type {
  Reporter,
  TestResult,
} from "@jest/reporters";
import type { AssertionResult, Test } from "@jest/test-result";
import fs from "fs";
import os from "os";
import path from "path";

const TMP_DIR = path.join(os.tmpdir(), "jest-hook-timings");

const DURATION_LIMIT_MS = 250;

const toGray = (text: string) => `\x1b[90m${text}\x1b[0m`;
const toRed = (text: string) => `\x1b[31m${text}\x1b[0m`;
const toYellow = (text: string) => `\x1b[33m${text}\x1b[0m`;

/**
 * Formats a number to a string with the given number of decimal places.
 * @param value the value to format
 * @param decimals the number of decimal places to format to (default is 2)
 * @returns a string representation of the number
 */
function formatNumber(value: number, decimals = 2): string {
  return parseFloat(value.toFixed(decimals)).toString();
}

/**
 * Returns a styled string representing the given duration in milliseconds. The styling is a rough heuristic for how good or bad the duration is. The colors are as follows:
 *  - Red for durations over {@link DURATION_LIMIT_MS} ms
 *  - Yellow for durations between half and full {@link DURATION_LIMIT_MS} ms
 *  - Green for durations under half {@link DURATION_LIMIT_MS} ms
 * @param duration the duration to style
 * @returns a styled string representation of the duration
 */
function toStyledDuration(duration: number) {
	const displayText = `[${formatNumber(duration)}ms]`;

	if (duration > DURATION_LIMIT_MS) {
    // Red for too slow
    return toRed(displayText);
  }
	else if (duration > DURATION_LIMIT_MS * 0.5) {
    // Yellow for warning
    return toYellow(displayText);
  }
  // Green for acceptable
  return toGray(displayText);
}

/**
 * Given a test file path, returns a file path to a .json file in
 * {@link TMP_DIR} that will store the hook timings for that test file.
 * @param testFilePath The path to the test file for which to generate the hook timings file.
 * @returns The file path to the .json file in which hook timings will be stored.
 */
function fileForTest(testFilePath: string) {
  // use base64 to avoid invalid filename chars and keep it deterministic
  const name = Buffer.from(testFilePath).toString("base64");
  return path.join(TMP_DIR, `${name}.json`);
}

/**
 * A custom Jest reporter that records test durations and hook durations.
 */
class TimingReporter implements Reporter {
  private globalStart = 0;
  private fileStartTimes = new Map<string, number>();

  onRunStart(): void {
    this.globalStart = performance.now();
    console.log("Starting Jest run...");
  }

  onTestFileStart(test: Test): void {
    this.fileStartTimes.set(test.path, performance.now());
    console.log(`▶️ Starting ${test.path}`);
  }

  onTestResult(test: Test, testResult: TestResult): void {
    const fileStart = this.fileStartTimes.get(test.path) ?? this.globalStart;
    const fileDuration = performance.now() - fileStart;
    console.log(`📄 ${test.path} finished in ${fileDuration.toFixed(2)} ms`);

    // Test durations (Jest-provided)
    testResult.testResults.forEach((t: AssertionResult) => {
      if (t.duration != null) {
        console.log(`   ${toStyledDuration(t.duration)} Test "${t.fullName}"`);
      }
    });

    // Read hook timings file created by the worker (if any)
    try {
      if (fs.existsSync(TMP_DIR)) {
        const hookFile = fileForTest(test.path);
        if (fs.existsSync(hookFile)) {
          const raw = fs.readFileSync(hookFile, "utf8");
          const data = JSON.parse(raw) as { hooks?: Record<string, number> } | null;
          if (data?.hooks) {
            Object.entries(data.hooks).forEach(([hookName, duration]) => {
              console.log(`   ${toStyledDuration(duration)} Hook "${hookName}"`);
            });
          }
          // remove file after reading
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          try { fs.unlinkSync(hookFile); } catch (_) { /* ignore */ }
        }
      }
    } catch (err) {
      // don't crash reporter for IO errors; just warn
      console.warn("TimingReporter: couldn't read hook timings:", (err as Error).message);
    }
  }

  onRunComplete(): void {
    const total = performance.now() - this.globalStart;
    console.log(`✅ All tests finished in ${total.toFixed(2)} ms`);
  }
}

export = TimingReporter;