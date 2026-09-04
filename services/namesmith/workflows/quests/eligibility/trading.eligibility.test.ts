import { addMinutes } from "../../../../../utilities/date-time-utils";
import { makeSure } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPlayer } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../../mocks/mock-data/mock-recipes';
import { addMockTrade, forcePlayerToAcceptNewTrade, forcePlayerToAcceptTrade, forcePlayerToDeclineNewTrade, forcePlayerToDeclineTrade, forcePlayerToInitiateTrade, forcePlayerToModifyNewTrade } from '../../../mocks/mock-data/mock-trades';
import { setupMockNamesmith } from "../../../mocks/mock-setup";
import { Player } from "../../../types/player.types";
import { Recipe } from '../../../types/recipe.types';
import { TradeStatuses } from "../../../types/trade.types";
import { completeQuest } from "../complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;

  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		
    ({ db } = setupMockNamesmith(START_OF_WEEK));
    SOME_PLAYER = addMockPlayer(db, {});
    addMockQuest(db, {
			name: FREEBIE_QUEST_NAME + getRandomUUID()
		});

		FIVE_DIFFERENT_RECIPES = [];
		for (let i = 0; i < 5; i++) {
			FIVE_DIFFERENT_RECIPES[i] = addMockRecipe(db);
		}

		THREE_DIFFERENT_PLAYERS = [];
		FIVE_DIFFERENT_PLAYERS = [];
		SEVEN_DIFFERENT_PLAYERS = [];
		for (let i = 0; i < 7; i++) {
			if (i < 3) {
				THREE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
			}

			if (i < 5) {
				FIVE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
			}

			SEVEN_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
		}

		SOME_OTHER_PLAYER = THREE_DIFFERENT_PLAYERS[0];
  });

  describe('completeQuest()', () => {
			describe('Trade Diplomat', () => {
				it('returns success for Trade Diplomat quest if player\'s trade were accepted by 3 different players', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToAcceptNewTrade(otherPlayer, {
							initiatingPlayer: SOME_PLAYER,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isFailure()
					).isFalse();
				});

				it('returns NotEnoughTradesMade failure for Trade Diplomat quest if player\'s trades were not yet accepted', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToInitiateTrade(SOME_PLAYER, {
							recipientPlayer: otherPlayer,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				});

				it('returns NotEnoughTradesMade failure for Trade Diplomat quest if player accepted trades but did not have trades they created accepted', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToAcceptNewTrade(SOME_PLAYER, {
							initiatingPlayer: otherPlayer,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				});
			})

			describe('Great Deal Quest', () => {
				it('returns a success if the player traded one character for ten in return', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '0123456789'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player traded one character for 3 in return at least once', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: 'b'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '123'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'abc',
						requestedCharacters: 'def'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player traded one character for only 2 in return', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: 'b'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '12'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'abc',
						requestedCharacters: 'def'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Scam Quest', () => {
				it('returns a success if the player accepted a trade where they give away one character and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player has their trade accepted where they give away one character and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SOME_OTHER_PLAYER,
						offeredCharacters: "1",
						requestedCharacters: "12345"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player accepted a trade where they give away one character and recieve four', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "1234",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player accepted a trade where they give away two characters and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "12"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Seal The Deal', () => {
				it('returns a success if the player accepted a trade before', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEAL_THE_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player did not accept a trade before', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEAL_THE_DEAL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Rejecting Profit', () => {
				it('returns a success if the player declined a trade where they would\'ve recieved six characters for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "123456",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player declined a trade where they would\'ve recieved five characters for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player declined a trade where they would\'ve recieved one character for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "1",
						requestedCharacters: "12345"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Final Offer Quest', () => {
				it('returns success when player has modified a trade today that was accepted by another player', () => {
					const modifyResult = forcePlayerToModifyNewTrade(SOME_PLAYER, {
						charactersGiving: "abc",
						charactersReceiving: "def"
					});

					forcePlayerToAcceptTrade(modifyResult.trade.initiatingPlayer, modifyResult.trade);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has modified a trade today that was declined by another player', () => {
					const modifyResult = forcePlayerToModifyNewTrade(SOME_PLAYER, {
						charactersGiving: "abc",
						charactersReceiving: "def"
					});

					forcePlayerToDeclineTrade(modifyResult.trade.initiatingPlayer, modifyResult.trade);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has not modified a trade today that was accepted by another player', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

		describe('Chaotic Trade Quest', () => {
			it('returns success when player gave 1 character and received 20 characters in a trade', () => {
				forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '01234567890123456789'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player gave 1 character and received more than 20 characters in a trade', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'x',
					requestedCharacters: 'abcdefghijklmnopqrstuvwxyz'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player was the recipient who gave 1 character and received 20 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: 'a'
				});
				forcePlayerToAcceptTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player had multiple trades and one meets criteria', () => {
				const trade1 = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade1);

				const trade2 = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'x',
					requestedCharacters: '01234567890123456789'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade2);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player gave 1 character but only received 19 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '0123456789012345678'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player gave 2 characters and received 20 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'ab',
					requestedCharacters: '01234567890123456789'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player gave 1 character and received 20 characters but trade was never accepted', () => {
				addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '01234567890123456789'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not been involved in any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Wide Diplomat Quest', () => {
			it('returns success when 5 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when more than 5 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 7; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SEVEN_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(SEVEN_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when 5 players accepted multiple trades each', () => {
				for (let i = 0; i < 5; i++) {
					for (let j = 0; j < 3; j++) {
						const trade = addMockTrade(db, {
							initiatingPlayer: SOME_PLAYER,
							recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
						});
						forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
					}
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when only 4 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the same player accepted multiple trades', () => {
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SOME_OTHER_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player created trades but none were accepted', () => {
				for (let i = 0; i < 5; i++) {
					forcePlayerToInitiateTrade(SOME_PLAYER, {
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					})
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not created any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Chain Five Quest', () => {
			it('returns success when player accepted 5 distinct trades from 5 different players', () => {
				jest.useRealTimers();
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player accepted more than 5 distinct trades from different players', () => {
				for (let i = 0; i < 7; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SEVEN_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player accepted 5 trades but from only 4 different players', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const trade = addMockTrade(db, {
					initiatingPlayer: FIVE_DIFFERENT_PLAYERS[0],
					recipientPlayer: SOME_PLAYER
				});
				forcePlayerToAcceptTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player accepted only 4 distinct trades from 5 different players', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not accepted any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Pity Pass Quest', () => {
			it('returns success when player declined a trade where they would receive 20 more characters than they give', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player declined a trade where they would receive more than 20 more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abcdefghijklmnopqrstuvwxyz',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player was the initiator declining their own trade', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: '',
					requestedCharacters: '01234567890123456789',
					status: TradeStatuses.AWAITING_INITIATOR,
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player declined multiple trades and one meets criteria', () => {
				const trade1 = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade1);

				const trade2 = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade2);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player declined a trade with only 19 more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '0123456789012345678',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player declined a trade with equal characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player declined a trade where they would give more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: 'abcdefghij'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not declined any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});
	});});