const { isPlayer } = require("./player.utility");

describe('player.utility', () => {
	describe('isPlayer()', () => {
		it('should return true if the value is an object with the expected properties of a player', () => {
			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				publishedName: "Published Name",
				tokens: 10,
				role: "Role",
				inventory: "Inventory",
			})).toBe(true);
		});

		it('should return false if the value is undefined', () => {
			expect(isPlayer(undefined)).toBe(false);
		});

		it('should return false if the value is null', () => {
			expect(isPlayer(null)).toBe(false);
		});

		it('should return false if the value is a string', () => {
			expect(isPlayer("player-id")).toBe(false);
		});

		it('should return false if the value is an empty object', () => {
			expect(isPlayer({})).toBe(false);
		});

		it('should return false if the value is an object with a missing property', () => {
			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				publishedName: "Published Name",
				tokens: 10,
				role: "Role",
			})).toBe(false);

			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				publishedName: "Published Name",
				tokens: 10,
				inventory: "Inventory",
			})).toBe(false);

			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				publishedName: "Published Name",
				role: "Role",
				inventory: "Inventory",
			})).toBe(false);

			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				tokens: 10,
				role: "Role",
				inventory: "Inventory",
			})).toBe(false);

			expect(isPlayer({
				id: "player-id",
				publishedName: "Published Name",
				tokens: 10,
				role: "Role",
				inventory: "Inventory",
			})).toBe(false);

			expect(isPlayer({
				currentName: "Current Name",
				publishedName: "Published Name",
				tokens: 10,
				role: "Role",
				inventory: "Inventory",
			})).toBe(false);
		});

		it('should return false if the value is an object with invalid property types', () => {
			expect(isPlayer({
				id: "player-id",
				currentName: "Current Name",
				publishedName: "Published Name",
				tokens: "10",
				role: "Role",
				inventory: "Inventory",
			})).toBe(false);
		})
	});
});