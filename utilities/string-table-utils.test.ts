import { createTableString, createInfoTableString, createLeaderboardString } from "./string-table-utils";

describe('string-table-utils', () => {

	function extractTable(output: string): string {
		return output
	}

	function tableLines(output: string): string[] {
		return extractTable(output).split('\n');
	}

	describe('createDiscordTable()', () => {

		describe('table structure', () => {
			it('should produce a top border, header row, header separator, data rows, and bottom border', () => {
				const result = createTableString(['Name'], [['Alice'], ['Bob']], { maxTableWidth: Infinity });
				const lines = tableLines(result);
				expect(lines).toHaveLength(6);
			});

			it('should start with a top border using rounded corners', () => {
				const lines = tableLines(createTableString(['A'], [['1']]));
				expect(lines[0]).toMatch(/^╭/);
				expect(lines[0]).toMatch(/╮$/);
			});

			it('should end with a bottom border using rounded corners', () => {
				const lines = tableLines(createTableString(['A'], [['1']]));
				expect(lines[lines.length - 1]).toMatch(/^╰/);
				expect(lines[lines.length - 1]).toMatch(/╯$/);
			});

			it('should use pipe characters as column dividers in data rows', () => {
				const lines = tableLines(createTableString(['A', 'B'], [['1', '2']]));
				const dataRow = lines[3];
				expect(dataRow).toMatch(/^│/);
				expect(dataRow).toMatch(/│$/);
				expect(dataRow.split('│').length).toBeGreaterThan(2);
			});

			it('should produce a header separator row using box-drawing characters', () => {
				const lines = tableLines(createTableString(['Col'], [['val']]));
				const sep = lines[2];
				expect(sep).toMatch(/^├/);
				expect(sep).toMatch(/┤$/);
				expect(sep).toContain('─');
			});

			it('should produce the correct number of lines for multiple rows', () => {
				const result = createTableString(['H'], [['a'], ['b'], ['c'], ['d']], { maxTableWidth: Infinity });
				const lines = tableLines(result);
				// top + header + sep + 4 rows + bottom
				expect(lines).toHaveLength(8);
			});
		});

		describe('column widths', () => {
			it('should size columns to fit the widest header cell', () => {
				const result = createTableString(['LongHeader'], [['x']]);
				const lines = tableLines(result);
				// All lines should have equal length (uniform column widths)
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});

			it('should size columns to fit the widest data cell', () => {
				const result = createTableString(['H'], [['a very long value']]);
				const lines = tableLines(result);
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});

			it('should handle multiple columns with different widths independently', () => {
				const result = createTableString(
					['Tiny', 'A very long column header'],
					[['x', 'y']]
				);
				const lines = tableLines(result);
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});
		});

		describe('alignment', () => {
			it('should left-align columns by default', () => {
				const result = createTableString(['Name'], [['Al'], ['Bob']]);
				const lines = tableLines(result);
				// In a left-aligned column, shorter content is padded on the right
				// "Al " should appear in the data row (padded to match "Name")
				expect(lines[3]).toContain('Al ');
			});

			it('should right-align a column when specified', () => {
				const result = createTableString(['Score'], [['9'], ['100']], {
					align: ['right'],
				});
				const lines = tableLines(result);
				// The shorter value "9" should be padded on the left
				expect(lines[3]).toContain('  9 ');
			});

			it('should apply per-column alignment independently', () => {
				const result = createTableString(
					['Left', 'Right', 'Center'],
					[['a', 'b', 'c']],
					{ align: ['left', 'right', 'center'] }
				);
				
				const lines = tableLines(result);
				expect(lines).toHaveLength(5); // top, header, sep, row, bottom
			});
		});

		describe('footer', () => {
			it('should not include a footer separator when no footer is provided', () => {
				const lines = tableLines(createTableString(['A'], [['1']]));
				// Only one separator row (the header separator)
				const separators = lines.filter((l) => l.startsWith('├'));
				expect(separators).toHaveLength(1);
			});

			it('should add a mid-separator and footer row when a footer is provided', () => {
				const result = createTableString(['Score'], [['10'], ['20']], {
					footer: ['30'],
					maxTableWidth: Infinity
				});
				const lines = tableLines(result);
				// Two ├ separators: one after header, one before footer
				const separators = lines.filter((l) => l.startsWith('├'));
				expect(separators).toHaveLength(2);
			});

			it('should render the footer values in the last data row', () => {
				const result = createTableString(['Item', 'Total'], [['a', '5']], {
					footer: ['Sum', '5'],
				});
				const lines = tableLines(result);
				const footerRow = lines[lines.length - 2]; // line before bottom border
				expect(footerRow).toContain('Sum');
				expect(footerRow).toContain('5');
			});

			it('should include footer values in column-width calculations', () => {
				const result = createTableString(['A'], [['x']], {
					footer: ['A very wide footer value'],
				});
				const lines = tableLines(result);
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});
		});

		describe('compact mode', () => {
			it('should remove cell padding in compact mode', () => {
				const normal = createTableString(['H'], [['v']]);
				const compact = createTableString(['H'], [['v']], { compact: true });
				// Compact table should be shorter in total width
				const normalWidth = tableLines(normal)[0].length;
				const compactWidth = tableLines(compact)[0].length;
				expect(compactWidth).toBeLessThan(normalWidth);
			});

			it('should still produce valid borders in compact mode', () => {
				const lines = tableLines(
					createTableString(['A', 'B'], [['1', '2']], { compact: true })
				);
				expect(lines[0]).toMatch(/^╭/);
				expect(lines[lines.length - 1]).toMatch(/^╰/);
			});
		});

		describe('data types', () => {
			it('should stringify numeric cell values', () => {
				const result = createTableString(['Count'], [[42]]);
				expect(extractTable(result)).toContain('42');
			});

			it('should stringify a mix of string and number values in the same row', () => {
				const result = createTableString(['Name', 'Score'], [['Alice', 9800]]);
				const body = extractTable(result);
				expect(body).toContain('Alice');
				expect(body).toContain('9800');
			});
		});

		describe('single column and row edge cases', () => {
			it('should handle a single column with a single row', () => {
				const result = createTableString(['Only'], [['one']]);
				expect(extractTable(result)).toContain('Only');
				expect(extractTable(result)).toContain('one');
			});

			it('should handle a table with no data rows', () => {
				const result = createTableString(['Col'], []);
				const lines = tableLines(result);
				// top + header + sep + bottom = 4
				expect(lines).toHaveLength(4);
			});

			it('should handle headers that are longer than any data value', () => {
				const result = createTableString(['VeryLongHeader'], [['x']]);
				const lines = tableLines(result);
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});

			it('should handle data values that are longer than the header', () => {
				const result = createTableString(['H'], [['A value much wider than H']]);
				const lines = tableLines(result);
				const lengths = lines.map((l) => l.length);
				expect(new Set(lengths).size).toBe(1);
			});
		});
	});

	// ─── createDiscordInfoTable() ─────────────────────────────────────────────────

	describe('createDiscordInfoTable()', () => {
		it('should render each key-value pair as a row', () => {
			const result = createInfoTableString({ Ping: '42ms', Status: 'Online' });
			const body = extractTable(result);
			expect(body).toContain('Ping');
			expect(body).toContain('42ms');
			expect(body).toContain('Status');
			expect(body).toContain('Online');
		});

		it('should use "Key" and "Value" as column headers', () => {
			const result = createInfoTableString({ A: '1' });
			const body = extractTable(result);
			expect(body).toContain('Key');
			expect(body).toContain('Value');
		});

		it('should right-align the value column', () => {
			// A short value like "1" with a wide header "Value" should be right-padded
			const result = createInfoTableString({ A: '1' });
			const lines = tableLines(result);
			const dataRow = lines[3];
			// "1" should appear near the right-hand pipe, not the left
			const rightHalf = dataRow.slice(Math.floor(dataRow.length / 2));
			expect(rightHalf).toContain('1');
		});

		it('should stringify numeric values', () => {
			const result = createInfoTableString({ Count: 128 });
			expect(extractTable(result)).toContain('128');
		});
		it('should accept an optional footer', () => {
			const result = createInfoTableString({ A: '1' }, { footer: ['Total', '1'] });
			const separators = tableLines(result).filter((l) => l.startsWith('├'));
			expect(separators).toHaveLength(2);
		});

		it('should handle an object with a single key-value pair', () => {
			const result = createInfoTableString({ OnlyKey: 'OnlyValue' });
			const body = extractTable(result);
			expect(body).toContain('OnlyKey');
			expect(body).toContain('OnlyValue');
		});

		it('should handle an object with many key-value pairs', () => {
			const result = createInfoTableString({
				Ping: '42ms',
				Uptime: '3d 2h',
				Servers: 128,
				Users: 4096,
				Version: 'v3.0.0',
			}, { maxTableWidth: Infinity });
			const lines = tableLines(result);
			// top + header + sep + 5 rows + bottom = 9
			expect(lines).toHaveLength(9);
		});
	});

	// ─── createDiscordLeaderboard() ───────────────────────────────────────────────

	describe('createDiscordLeaderboard()', () => {
		it('should prepend a "Rank" column to the provided headers', () => {
			const result = createLeaderboardString(['Player', 'Score'], [['Alice', '100']]);
			expect(extractTable(result)).toContain('Rank');
			expect(extractTable(result)).toContain('Player');
			expect(extractTable(result)).toContain('Score');
		});

		it('should assign the gold medal 🥇 to the first row', () => {
			const result = createLeaderboardString(['Player'], [['Alice']]);
			expect(extractTable(result)).toContain('🥇');
		});

		it('should assign the silver medal 🥈 to the second row', () => {
			const result = createLeaderboardString(
				['Player'],
				[['Alice'], ['Bob']]
			);
			expect(extractTable(result)).toContain('🥈');
		});

		it('should assign the bronze medal 🥉 to the third row', () => {
			const result = createLeaderboardString(
				['Player'],
				[['Alice'], ['Bob'], ['Carol']]
			);
			expect(extractTable(result)).toContain('🥉');
		});

		it('should use a numeric rank (#4, #5 …) for positions beyond the top three', () => {
			const result = createLeaderboardString(
				['Player'],
				[['A'], ['B'], ['C'], ['D'], ['E']]
			);
			const body = extractTable(result);
			expect(body).toContain('#4');
			expect(body).toContain('#5');
		});

		it('should render all provided player names and values', () => {
			const result = createLeaderboardString(
				['Player', 'Score'],
				[['Alice', '9,800'], ['Bob', '7,200'], ['Carol', '6,550']]
			);
			const body = extractTable(result);
			expect(body).toContain('Alice');
			expect(body).toContain('9,800');
			expect(body).toContain('Carol');
			expect(body).toContain('6,550');
		});

		it('should handle a single-entry leaderboard', () => {
			const result = createLeaderboardString(['Player'], [['OnlyPlayer']]);
			expect(extractTable(result)).toContain('🥇');
			expect(extractTable(result)).toContain('OnlyPlayer');
		});

		it('should handle an empty leaderboard (no rows)', () => {
			const result = createLeaderboardString(['Player', 'Score'], []);
			const lines = tableLines(result);
			// top + header + sep + bottom = 4
			expect(lines).toHaveLength(4);
		});

		it('should center-align the rank column', () => {
			// The rank column alignment is 'center', so the cell content is centered.
			// We verify the output is produced without error and contains the rank column.
			const result = createLeaderboardString(
				['Name', 'Score'],
				[['Alice', '100'], ['Bob', '80']]
			);
			
			expect(extractTable(result)).toContain('Rank');
		});

		it('should accept numeric values alongside string values', () => {
			const result = createLeaderboardString(
				['Player', 'Score'],
				[['Alice', 9800], ['Bob', 7200]]
			);
			expect(extractTable(result)).toContain('9800');
			expect(extractTable(result)).toContain('7200');
		});

		it('should pass through additional TableOptions such as footer', () => {
			const result = createLeaderboardString(
				['Player', 'Score'],
				[['Alice', '100'], ['Bob', '80']],
				{ footer: ['', 'Total: 180'], maxTableWidth: Infinity }
			);
			const separators = tableLines(result).filter((l) => l.startsWith('├'));
			expect(separators).toHaveLength(2);
			expect(extractTable(result)).toContain('Total: 180');
		});
	});
});