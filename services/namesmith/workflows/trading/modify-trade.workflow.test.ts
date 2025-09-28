import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TRADE_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { modifyTrade } from "./modify-trade.workflow";
import { addMockPlayer, editMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockTrade } from "../../mocks/mock-data/mock-trades";
import { returnIfNotFailure } from "../workflow-result-creator";

describe('modifyTrade()', () => {
  let MOCK_INITIATING_PLAYER: Player;
  let MOCK_RECIPIENT_PLAYER: Player;
  let MOCK_TRADE: Trade;

  let db: DatabaseQuerier;
  let tradeService: TradeService;

  beforeEach(() => {
    ({ db, tradeService } = setupMockNamesmith());

    MOCK_INITIATING_PLAYER = addMockPlayer(db, {
      inventory: "Bbbdoevr",
      currentName: "Bobber"
    });
    MOCK_RECIPIENT_PLAYER = addMockPlayer(db, {
      inventory: "Xxxxyzander",
      currentName: "Xander"
    });

    MOCK_TRADE = addMockTrade(db, {
      initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
      recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
      offeredCharacters: "berv",
      requestedCharacters: "Xx",
      status: TradeStatuses.AWAITING_RECIPIENT,
    });
  });

	it('returns the trade, initating player, and recipient player in their current states', () => {
		const { trade, playerModifying, otherPlayer } =
			returnIfNotFailure(
				modifyTrade({
					...getNamesmithServices(),
					playerModifying: MOCK_RECIPIENT_PLAYER,
					trade: MOCK_TRADE,
					charactersGiving: "and",
					charactersReceiving: "dove",
				})
			);

		makeSure(trade).is({
			...MOCK_TRADE,
			offeredCharacters: "dove",
			requestedCharacters: "and",
			status: TradeStatuses.AWAITING_INITIATOR,
		});
		makeSure(otherPlayer).is(MOCK_INITIATING_PLAYER);
		makeSure(playerModifying).is(MOCK_RECIPIENT_PLAYER);
	});

	it('modifies the trade with the new characters and status', () => {
		modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

		const modifiedTrade = tradeService.resolveTrade(MOCK_TRADE.id);
		makeSure(modifiedTrade).is({
			...MOCK_TRADE,
			offeredCharacters: "dove",
			requestedCharacters: "and",
			status: TradeStatuses.AWAITING_INITIATOR,
		});
	});

  it('returns a NonPlayerRespondedToTradeError if the player modifying the trade is not a player', () => {
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: INVALID_PLAYER_ID,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

    makeSure(
      result.isNonPlayerRespondedToTrade()
    ).isTrue();
  });

  it('returns a NonTradeRespondedToError if the trade being modified does not exist', () => {
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: INVALID_TRADE_ID,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

    makeSure(
      result.isNonTradeRespondedTo()
    ).isTrue();
  });

  it('returns a TradeAlreadyRespondedToError if the trade has already been accepted', () => {
		tradeService.accept(MOCK_TRADE);

		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

    makeSure(
      result.isTradeAlreadyRespondedTo()
    ).isTrue();
  });

  it('returns a TradeAwaitingDifferentPlayerError if the player modifying the trade is the initiating player but the trade is awaiting the recipient', () => {
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_INITIATING_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

    makeSure(
      result.isTradeAwaitingDifferentPlayer()
    ).isTrue();
  });

  it('returns a MissingOfferedCharactersError if the initiating player no longer has the characters they are offering', () => {
    editMockPlayer(db, {
      id: MOCK_INITIATING_PLAYER.id,
      inventory: "",
    });

		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

    makeSure(
      result.isPlayerMissingCharacters()
    ).isTrue();
  });

  it('returns a MissingRequestedCharactersError if the initiating player does not have the characters they are offering', () => {
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "a ton of characters they do not have",
			charactersReceiving: "dove",
		});

		makeSure(
			result.isPlayerMissingCharacters()
		).isTrue();
  });

	it('returns a MissingRequestedCharactersError if the recipient player no longer has the characters they are requesting', () => {
		editMockPlayer(db, {
			id: MOCK_RECIPIENT_PLAYER.id,
			inventory: "",
		});
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "dove",
		});

		makeSure(
			result.isPlayerMissingCharacters()
		).isTrue();
	});

	it('returns a MissingOfferedCharactersError if the recipient player does not have the characters they are requesting', () => {
		const result = modifyTrade({
			...getNamesmithServices(),
			playerModifying: MOCK_RECIPIENT_PLAYER,
			trade: MOCK_TRADE,
			charactersGiving: "and",
			charactersReceiving: "a ton of characters they do not have",
		});

		makeSure(
			result.isPlayerMissingCharacters()
		).isTrue();
	});
});