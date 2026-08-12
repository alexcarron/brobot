import { publishName } from "./publish-name.workflow";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { PublishedNameService } from "../services/published-name.service";
import { INVALID_PLAYER_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { Player } from "../types/player.types";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { addMockPlayer, forcePlayerToChangeName } from "../mocks/mock-data/mock-players";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { getLatestActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { ActivityTypes } from "../types/activity-log.types";
import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER, PUBLISHED_NAME_SLOT_COSTS } from "../constants/publish-name.constants";

describe('publish-name.workflow', () => {
	let playerService: PlayerService;
	let publishedNameService: PublishedNameService;
	let db: DatabaseQuerier;

	let NAMED_PLAYER: Player;

	beforeEach(() => {
		setupMockNamesmith();
		({ playerService, publishedNameService } = getNamesmithServices());
		db = playerService.playerRepository.db;

		NAMED_PLAYER = addMockPlayer(db, { currentName: 'Namey', tokens: 9999 });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('publishName()', () => {
		it('fails with notAPlayer when the user is not a player', () => {
			const result = publishName({ player: INVALID_PLAYER_ID });
			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('fails with currentNameEmpty when the player has no current name', () => {
			const emptyPlayer = addMockPlayer(db, { currentName: '', tokens: 9999 });
			const result = publishName({ player: emptyPlayer.id });
			makeSure(result.isCurrentNameEmpty()).isTrue();
		});

		it('fails with nameAlreadyPublished when the same current name is already an entry', () => {
			returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));

			forcePlayerToChangeName(NAMED_PLAYER.id, 'Namey');
			const result = publishName({ player: NAMED_PLAYER.id });
			makeSure(result.isNameAlreadyPublished()).isTrue();
		});

		it('fails with atPublishedNameLimit once all published name slots are used', () => {
			for (let slotNumber = 1; slotNumber <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slotNumber++) {
				forcePlayerToChangeName(NAMED_PLAYER.id, `Name ${slotNumber}`);
				returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));
			}

			forcePlayerToChangeName(NAMED_PLAYER.id, 'One Too Many');
			const result = publishName({ player: NAMED_PLAYER.id });
			makeSure(result.isAtPublishedNameLimit()).isTrue();
		});

		it('fails with cannotAffordPublishedName and leaves tokens and published names unchanged', () => {
			const secondPublishedNameCost = PUBLISHED_NAME_SLOT_COSTS[1];
			const brokePlayer = addMockPlayer(db, { currentName: 'First', tokens: secondPublishedNameCost - 1 });

			returnIfNotFailure(publishName({ player: brokePlayer.id }));

			forcePlayerToChangeName(brokePlayer.id, 'Second');
			const result = publishName({ player: brokePlayer.id });

			makeSure(result.isCannotAffordPublishedName()).isTrue();
			makeSure(playerService.getTokens(brokePlayer.id)).is(secondPublishedNameCost - 1);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(brokePlayer.id)).is(1);
		});

		it('publishes the first published name for free and reports the outcome', () => {
			const result = returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));

			makeSure(result.slotNumber).is(1);
			makeSure(result.tokensSpent).is(0);
			makeSure(result.tokensRemaining).is(NAMED_PLAYER.tokens);
			makeSure(publishedNameService.getPublishedNamesOfPlayer(NAMED_PLAYER.id)[0].name).is('Namey');
			makeSure(playerService.getCurrentName(NAMED_PLAYER.id)).is('');
			makeSure(playerService.getInventory(NAMED_PLAYER.id)).is('');
		});

		it('deducts exactly the published name cost and creates the published name for a paid published name', () => {
			returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));

			forcePlayerToChangeName(NAMED_PLAYER.id, 'Second');
			const result = returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));

			const secondPublishedNameCost = PUBLISHED_NAME_SLOT_COSTS[1];
			makeSure(result.slotNumber).is(2);
			makeSure(result.tokensSpent).is(secondPublishedNameCost);
			makeSure(result.tokensRemaining).is(NAMED_PLAYER.tokens - secondPublishedNameCost);
			makeSure(playerService.getTokens(NAMED_PLAYER.id)).is(NAMED_PLAYER.tokens - secondPublishedNameCost);
			makeSure(publishedNameService.getNumPublishedNamesOfPlayer(NAMED_PLAYER.id)).is(2);
		});

		it('records a publishName activity log on success', () => {
			returnIfNotFailure(publishName({ player: NAMED_PLAYER.id }));

			const activityLog = getLatestActivityLog(db);
			makeSure(activityLog.player.id).is(NAMED_PLAYER.id);
			makeSure(activityLog.type).is(ActivityTypes.PUBLISH_NAME);
		});
	});
});
