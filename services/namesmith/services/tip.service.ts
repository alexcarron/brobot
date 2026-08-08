import { TipRepository } from "../repositories/tip.repository";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { PlayerID } from "../types/player.types";
import { MAX_TIP_VIEW_COUNT } from "../constants/tips.constants";
import { TipKey } from "../types/tip.types";

/**
 * Provides methods for deciding whether a player should see a tip and recording that a tip was shown.
 */
export class TipService {
	constructor(
		public tipRepository: TipRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new TipService(
			TipRepository.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return TipService.fromDB(db);
	}

	/**
	 * Determines whether a player should be shown a given tip right now.
	 * @param playerID - The ID of the player.
	 * @param tipKey - The tip to check.
	 * @returns True if the player has been shown the tip fewer than the maximum allowed times.
	 */
	shouldPlayerSeeTip(playerID: PlayerID, tipKey: TipKey): boolean {
		return this.tipRepository.getViewCount(playerID, tipKey) < MAX_TIP_VIEW_COUNT;
	}

	/**
	 * Records that a tip was just shown to a player.
	 * @param playerID - The ID of the player.
	 * @param tipKey - The tip that was shown.
	 */
	incrementTipViewCountForPlayer(playerID: PlayerID, tipKey: TipKey): void {
		this.tipRepository.incrementViewCount(playerID, tipKey);
	}
}
