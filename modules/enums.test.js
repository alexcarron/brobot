const Enums = require("./enums");

describe('toOrdinal function tests', () => {
	it('Should return "1st" for input 1', () => {
			expect(Enums.Announcements.CongratulateWinners(["Mafia", "Town"], ["Bob", "Sally", "Joe"])).toStrictEqual(
				[
					`_ _\n**Mafia**, **Town **won!`,
					`Congratulations** Bob**, **Sally**, **Joe**!`
				]
			);
	});
});