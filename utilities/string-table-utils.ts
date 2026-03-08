export interface TableOptions {
  /** Alignment per column index: 'left' | 'center' | 'right' (default: 'left') */
  align?: Array<"left" | "center" | "right">;

  /** Whether to show a row of totals at the bottom */
  footer?: string[];

  /** Compact mode removes padding spaces (default: false) */
  compact?: boolean;

  /**
   * Maximum total table width in characters before columns are shrunk and
   * content wraps across multiple lines (default: 150).
   * Set to Infinity to disable wrapping entirely.
   */
  maxTableWidth?: number;
}

/**
 * Pads a cell value to a given width with spaces, using the
 * specified alignment.
 * @param {string} value - The value to pad.
 * @param {number} width - The width to pad to.
 * @param {"left"|"center"|"right"} align - The alignment to use.
 * @returns {string} The padded value.
 */
function padCell(
  value: string,
  width: number,
  align: "left" | "center" | "right"
): string {
  const len = value.length;
  const gap = width - len;
  if (gap <= 0) return value;
  if (align === "right") return " ".repeat(gap) + value;
  if (align === "center") {
    const left = Math.floor(gap / 2);
    const right = gap - left;
    return " ".repeat(left) + value + " ".repeat(right);
  }
  return value + " ".repeat(gap); // left
}

/**
 * Wraps `text` to fit within `width` characters per line.
 * Tries to break on whitespace; falls back to a hard break when no space is found.
 * Always returns at least one element.
 * @param text - Text to wrap
 * @param width - Maximum width per line
 * @returns Wrapped text
 */
export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [text]; // safety: don't wrap into zero-width columns
  if (text.length <= width) return [text];

  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > width) {
    // Prefer breaking on the last space within the allowed width
    let breakAt = remaining.lastIndexOf(" ", width);

    if (breakAt <= 0) {
      // No space found — hard-break at exactly `width`
      breakAt = width;
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt);
    } else {
      lines.push(remaining.slice(0, breakAt));
      // Skip the space itself so the next line doesn't start with whitespace
      remaining = remaining.slice(breakAt + 1);
    }
  }

  if (remaining.length > 0) lines.push(remaining);
  return lines;
}

/**
 * Computes the final column widths, shrinking the widest columns proportionally when the natural table width would exceed `maxTableWidth`.
 * Algorithm (O(n log n)):
 *  1. Sort columns by natural width (ascending).
 *  2. Walk from narrowest to widest, giving each column a "fair share" of the
 *     remaining budget.  Columns that fit within their fair share keep their
 *     natural width; the saved space rolls forward to the wider columns.
 *  3. Every column is guaranteed a minimum width of 1.
 *  @param naturalWidths - natural width of each column
 *  @param compact - whether to remove padding spaces
 *  @param maxTableWidth - maximum table width
 *  @returns final column widths
 */
export function computeColumnWidths(
  naturalWidths: number[],
  compact: boolean,
  maxTableWidth: number
): number[] {
  const padding = compact ? 0 : 2; // spaces added around each cell value
  // Total overhead = (n+1) border chars + n*padding spaces
  const overhead = naturalWidths.length + 1 + naturalWidths.length * padding;
  const available = maxTableWidth - overhead;

  const totalNatural = naturalWidths.reduce((a, b) => a + b, 0);

  // Nothing to do — table already fits
  if (totalNatural <= available) return [...naturalWidths];

  const finalWidths = new Array<number>(naturalWidths.length);

  // Sort indices by natural width (ascending) so small columns get their full
  // width first and we only shrink the columns that actually need it.
  const sortedIndices = naturalWidths
    .map((w, i) => ({ w, i }))
    .sort((a, b) => a.w - b.w);

  let budget = available;

  for (let k = 0; k < sortedIndices.length; k++) {
    const remaining = sortedIndices.length - k;
    const fair = Math.floor(budget / remaining);
    const { w, i } = sortedIndices[k];
    const allotted = Math.max(Math.min(w, fair), 1); // clamp [1, natural]
    finalWidths[i] = allotted;
    budget -= allotted;
  }

  return finalWidths;
}

function buildSeparator(
  colWidths: number[],
  compact: boolean,
  type: "top" | "mid" | "bottom" | "header"
): string {
  const fills = colWidths.map((w) => "─".repeat(w + (compact ? 0 : 2)));

  const chars = {
    top:    { l: "╭", m: "┬", r: "╮" },
    header: { l: "├", m: "┼", r: "┤" },
    mid:    { l: "├", m: "┼", r: "┤" },
    bottom: { l: "╰", m: "┴", r: "╯" },
  }[type];

  return chars.l + fills.join(chars.m) + chars.r;
}

/**
 * Builds one logical row, which may span multiple physical lines when any cell wraps. Returns a single string with embedded newlines.
 * @param cells - String values for each cell of this row
 * @param colWidths - Width of each column, in characters
 * @param aligns - Horizontal alignment for each column
 * @param compact - Whether to use compact mode
 * @returns A string representing this logical row
 */
export function buildRow(
  cells: string[],
  colWidths: number[],
  aligns: Array<"left" | "center" | "right">,
  compact: boolean
): string {
  const pad = compact ? "" : " ";

  // Wrap every cell independently
  const wrappedCells = cells.map((cell, i) => wrapText(cell, colWidths[i]));

  // All physical lines for this logical row must be the same height
  const lineCount = Math.max(...wrappedCells.map((w) => w.length), 1);

  const physicalLines: string[] = [];

  for (let line = 0; line < lineCount; line++) {
    const cols = wrappedCells.map((wrapped, i) => {
      const content = wrapped[line] ?? ""; // pad missing lines with empty string
      return pad + padCell(content, colWidths[i], aligns[i] ?? "left") + pad;
    });
    physicalLines.push("│" + cols.join("│") + "│");
  }

  return physicalLines.join("\n");
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Creates a formatted Discord table wrapped in a code block.
 * @param headers - Column header strings
 * @param rows    - 2D array of row data (all values are stringified)
 * @param options - TableOptions for alignment, footer, compact mode, and max width
 * @returns A string ready to send via `interaction.reply()` or `channel.send()`
 * @example
 * const table = createTableString(
 *   ["Name", "Level", "Score"],
 *   [["Alice", "42", "9,800"], ["Bob", "37", "7,200"]],
 *   { align: ["left", "center", "right"] }
 * );
 * await channel.send(table);
 */
export function createTableString(
  headers: string[],
  rows: (string | number)[][],
  options: TableOptions = {}
): string {
  const {
    align = [],
    footer,
    compact = false,
    maxTableWidth = 150,
  } = options;
	
  // Stringify everything
  const strHeaders = headers.map(String);
  const strRows = rows.map((r) => r.map(String));
  const strFooter = footer?.map(String);

  // Calculate natural column widths (widest content wins)
  const colCount = strHeaders.length;
  const naturalWidths: number[] = strHeaders.map((h, i) => {
    const values = [h, ...strRows.map((r) => r[i] ?? "")];
    if (strFooter) values.push(strFooter[i] ?? "");
    return Math.max(...values.map((v) => v.length));
  });

  // Shrink widths if table would exceed maxTableWidth
  const colWidths = computeColumnWidths(naturalWidths, compact, maxTableWidth);

  const aligns: Array<"left" | "center" | "right"> = Array.from(
    { length: colCount },
    (_, i) => align[i] ?? "left"
  );

  // Build table lines
  const lines: string[] = [];

  lines.push(buildSeparator(colWidths, compact, "top"));
  lines.push(buildRow(strHeaders, colWidths, aligns, compact));
  lines.push(buildSeparator(colWidths, compact, "header"));

  strRows.forEach((row, idx) => {
    const paddedRow = Array.from({ length: colCount }, (_, i) => row[i] ?? "");
    lines.push(buildRow(paddedRow, colWidths, aligns, compact));

    // Add a mid separator between every logical row so wrapped rows are clearly
    // separated from their neighbours.
    if (idx < strRows.length - 1 && maxTableWidth !== Infinity) {
      lines.push(buildSeparator(colWidths, compact, "mid"));
    }
  });

  if (strFooter) {
    lines.push(buildSeparator(colWidths, compact, "mid"));
    lines.push(buildRow(strFooter, colWidths, aligns, compact));
  }

  lines.push(buildSeparator(colWidths, compact, "bottom"));

  return lines.join("\n");
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

/**
 * Renders a simple key→value table (two columns, no headers shown).
 * @param data - An object with string or number values
 * @param options - TableOptions for alignment, footer, compact mode, and max width
 * @returns A string ready to send via `interaction.reply()` or `channel.send()`
 */
export function createInfoTableString(
  data: Record<string, string | number>,
  options: Omit<TableOptions, "align"> = {}
): string {
  const rows = Object.entries(data).map(([k, v]) => [k, String(v)]);
  return createTableString(["Key", "Value"], rows, {
    ...options,
    align: ["left", "right"],
  });
}

/**
 * Renders a leaderboard table with automatic rank numbers.
 * @param headers - Column header strings
 * @param rows - 2D array of row data (all values are stringified)
 * @param options - TableOptions for alignment, footer, compact mode, and max width
 * @returns A string ready to send via `interaction.reply()` or `channel.send()`
 */
export function createLeaderboardString(
  headers: string[],
  rows: (string | number)[][],
  options: TableOptions = {}
): string {
  const medals: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };
  const rankedRows = rows.map((row, i) => [medals[i] ?? `#${i + 1}`, ...row]);
  return createTableString(["Rank", ...headers], rankedRows, {
    align: ["center", ...Array(headers.length).fill("left")],
    ...options,
  });
}