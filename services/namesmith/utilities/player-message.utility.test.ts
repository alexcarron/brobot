import { makeSure } from "../../../utilities/jest/jest-utils";
import { getTokensEarnedFeedback, toBacktickedCharacterList, toDisplayedName, toDisplayOrderedCharacters, toTokenEmojis } from "./player-message.utility";

describe('player-message.utility', () => {
	describe('getTokensEarnedFeedback()', () => {
		it('should return a string with the correct number of emojis', () => {
			makeSure(getTokensEarnedFeedback(0)).is('**+0 Tokens**');
			makeSure(getTokensEarnedFeedback(1)).is('**+1 Token**\n🪙');
			makeSure(getTokensEarnedFeedback(10)).is('**+10 Tokens**\n🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙');
			makeSure(getTokensEarnedFeedback(500)).is('**+500 Tokens**\n' + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(501)).is('**+501 Tokens**\n' + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(510)).is('**+510 Tokens**\n💰' + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(1000)).is('**+1,000 Tokens**\n' + '💰'.repeat(50) + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(3000)).is('**+3,000 Tokens**\n' + '💰'.repeat(250) + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(3001)).is('**+3,001 Tokens**\n' + '💰'.repeat(250) + '🪙'.repeat(500));
			makeSure(getTokensEarnedFeedback(10000)).is('**+10,000 Tokens**\n' + '💰'.repeat(250) + '🪙'.repeat(500));
		});

		it('should never return a string that is 2,000 length or longer', () => {
			makeSure(getTokensEarnedFeedback(Number.MAX_SAFE_INTEGER).length).isLessThan(2000);
		});

		it('has line break by default', () => {
			makeSure(getTokensEarnedFeedback(1)).is('**+1 Token**\n🪙');
		});

		it('does not have line break if set to true in options', () => {
			makeSure(
				getTokensEarnedFeedback(1, { isOneLine: true })
			).is('**+1 Token** 🪙')
		});

		it('does have line break if set to false in options', () => {
			makeSure(
				getTokensEarnedFeedback(1, { isOneLine: false })
			).is('**+1 Token**\n🪙')
		});
	});

	describe('getTokensInEmojis()', () => {
		it('should return a string with the correct number of money bag emojis', () => {
			makeSure(toTokenEmojis(0)).is('');
			makeSure(toTokenEmojis(1)).is('🪙');
			makeSure(toTokenEmojis(10)).is('' + '🪙'.repeat(10));
			makeSure(toTokenEmojis(500)).is('' + '🪙'.repeat(500));
			makeSure(toTokenEmojis(501)).is('' + '🪙'.repeat(500));
			makeSure(toTokenEmojis(520)).is('' + '💰'.repeat(2) + '🪙'.repeat(500));
			makeSure(toTokenEmojis(1000)).is('' + '💰'.repeat(50) + '🪙'.repeat(500));
			makeSure(toTokenEmojis(3000)).is('' + '💰'.repeat(250) + '🪙'.repeat(500));
			makeSure(toTokenEmojis(3001)).is('' + '💰'.repeat(250) + '🪙'.repeat(500));
			makeSure(toTokenEmojis(10000)).is('' + '💰'.repeat(250) + '🪙'.repeat(500));
		});

		it('should never return a string that is 2,000 length or longer', () => {
			makeSure(toTokenEmojis(Number.MAX_SAFE_INTEGER).length).isLessThan(2000);
		});
	});

	describe('toBacktickedCharacterList()', () => {
		it('should wrap each character in backticks and join with a comma by default', () => {
			makeSure(toBacktickedCharacterList(['a', 'b', 'c'])).is('`a`, `b`, `c`');
		});

		it('should split a string argument into individual characters', () => {
			makeSure(toBacktickedCharacterList('abc')).is('`a`, `b`, `c`');
		});

		it('should keep multi-codepoint characters intact when splitting a string argument', () => {
			makeSure(toBacktickedCharacterList('a👨‍👩‍👧‍👦b')).is('`a`, `👨‍👩‍👧‍👦`, `b`');
		});

		it('should join with the given separator', () => {
			makeSure(toBacktickedCharacterList(['a', 'b', 'c'], ' ')).is('`a` `b` `c`');
		});

		it('should escape backticks within a character', () => {
			makeSure(toBacktickedCharacterList(['`'])).is('`\\``');
		});

		it('should return an empty string for an empty list', () => {
			makeSure(toBacktickedCharacterList([])).is('');
		});
	});

	describe('toDisplayOrderedCharacters()', () => {
		it('should order letters first, then numbers, then spaces, then everything else alphabetically', () => {
			makeSure(toDisplayOrderedCharacters("4b!!3 c6a#")).is("abc346` `!!#");
		});

		it('should split a string argument into individual characters', () => {
			makeSure(toDisplayOrderedCharacters("cba")).is("abc");
		});

		it('should accept an array of characters', () => {
			makeSure(toDisplayOrderedCharacters(["c", "b", "a"])).is("abc");
		});

		it('should keep multi-codepoint characters intact when sorting', () => {
			makeSure(toDisplayOrderedCharacters("b👨‍👩‍👧‍👦a")).is("ab👨‍👩‍👧‍👦");
		});

		it('should not mutate an array argument', () => {
			const characters = ["c", "b", "a"];
			toDisplayOrderedCharacters(characters);
			makeSure(characters).is(["c", "b", "a"]);
		});

		it('should backtick-wrap a space surrounded by non-whitespace characters', () => {
			makeSure(toDisplayOrderedCharacters("a !")).is("a` `!");
		});

		it('should backtick-wrap a leading space with nothing before it', () => {
			makeSure(toDisplayOrderedCharacters(" !")).is("` `!");
		});

		it('should backtick-wrap a trailing space with nothing after it', () => {
			makeSure(toDisplayOrderedCharacters("a ")).is("a` `");
		});

		it('should wrap a run of consecutive spaces in a single code span instead of one per character', () => {
			makeSure(toDisplayOrderedCharacters("a  b")).is("ab`  `");
			makeSure(toDisplayOrderedCharacters("a  b")).is("ab`  `");
		});

		it('should handle end of long string of characters', () => {
			makeSure(toDisplayOrderedCharacters("aabcdddfffhhjjjkkkklsss122334 ")).is("aabcdddfffhhjjjkkkklsss122334` `");
		});
	});

	describe('toDisplayedName()', () => {
		it('should bold a normal name', () => {
			makeSure(toDisplayedName("Bob")).is("**Bob**");
		});

		it('should return a placeholder for an empty name', () => {
			makeSure(toDisplayedName("")).is("*[No name]*");
		});

		it('should preserve whitespace as-is', () => {
			makeSure(toDisplayedName("Bob  Smith")).is("**Bob  Smith**");
			makeSure(toDisplayedName(" Bob ")).is("** Bob **");
			makeSure(toDisplayedName("   ")).is("**   **");
		});

		it('should preserve markdown characters other than asterisks as-is', () => {
			makeSure(toDisplayedName("`Bob`")).is("**`Bob`**");
		});

		it('should escape a literal asterisk within a name so it cannot break out of the bold span', () => {
			makeSure(toDisplayedName("Bo*b")).is("**Bo\\*b**");
		});

		it('should escape multiple asterisks within a name', () => {
			makeSure(toDisplayedName("*Bob*")).is("**\\*Bob\\***");
		});
	});
});
