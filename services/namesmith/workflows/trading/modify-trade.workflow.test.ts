import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TRADE_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerRespondedToTradeError, NonTradeRespondedToError, TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError } from "../../utilities/error.utility";
import { modifyTrade } from "./modify-trade.workflow";
import { returnIfNotError } from '../../../../utilities/error-utils';
import { addMockPlayer, editMockPlayer } from "../../mocks/mock-data/mock-players";
import { addMockTrade } from "../../mocks/mock-data/mock-trades";

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
			returnIfNotError(
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
    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: INVALID_PLAYER_ID,
        trade: MOCK_TRADE,
        charactersGiving: "and",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(NonPlayerRespondedToTradeError);
  });

  it('returns a NonTradeRespondedToError if the trade being modified does not exist', () => {
    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: MOCK_RECIPIENT_PLAYER,
        trade: INVALID_TRADE_ID,
        charactersGiving: "and",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(NonTradeRespondedToError);
  });

  it('returns a TradeAlreadyRespondedToError if the trade has already been accepted', () => {
		tradeService.accept(MOCK_TRADE);

    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: MOCK_RECIPIENT_PLAYER,
        trade: MOCK_TRADE,
        charactersGiving: "and",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(TradeAlreadyRespondedToError);
  });

  it('returns a TradeAwaitingDifferentPlayerError if the player modifying the trade is the initiating player but the trade is awaiting the recipient', () => {
    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: MOCK_INITIATING_PLAYER,
        trade: MOCK_TRADE,
        charactersGiving: "and",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(TradeAwaitingDifferentPlayerError);
  });

  it('returns a MissingOfferedCharactersError if the initiating player no longer has the characters they are offering', () => {
    editMockPlayer(db, {
      id: MOCK_INITIATING_PLAYER.id,
      inventory: "",
    });

    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: MOCK_RECIPIENT_PLAYER,
        trade: MOCK_TRADE,
        charactersGiving: "and",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(MissingOfferedCharactersError);
  });

  it('returns a MissingRequestedCharactersError if the initiating player does not have the characters they are offering', () => {
    makeSure(
      modifyTrade({
        ...getNamesmithServices(),
        playerModifying: MOCK_RECIPIENT_PLAYER,
        trade: MOCK_TRADE,
        charactersGiving: "a ton of characters they do not have",
        charactersReceiving: "dove",
      })
    ).isAnInstanceOf(MissingRequestedCharactersError);
  });

	it('returns a MissingRequestedCharactersError if the recipient player no longer has the characters they are requesting', async () => {
		editMockPlayer(db, {
			id: MOCK_RECIPIENT_PLAYER.id,
			inventory: "",
		});
		makeSure(
			await modifyTrade({
				...getNamesmithServices(),
				playerModifying: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
				charactersGiving: "and",
				charactersReceiving: "dove",
			})
		).isAnInstanceOf(MissingRequestedCharactersError);
	});

	it('returns a MissingOfferedCharactersError if the recipient player does not have the characters they are requesting', async () => {
		makeSure(
			await modifyTrade({
				...getNamesmithServices(),
				playerModifying: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
				charactersGiving: "and",
				charactersReceiving: "a ton of characters they do not have",
			})
		).isAnInstanceOf(MissingOfferedCharactersError);
	});
});