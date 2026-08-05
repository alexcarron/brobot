import { makeSure } from "../../../utilities/jest/jest-utils";
import { getTokensEarnedFeedback, toTokenEmojis } from "./player-message.utility";

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
});
