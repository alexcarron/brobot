import { TipRepository } from "../repositories/tip.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { PlayerResolvable } from "../types/player.types";
import { MAX_TIP_VIEW_COUNT } from "../constants/tips.constants";
import { Tip, TipKey, TipResolvable } from "../types/tip.types";

/**
 * Provides methods for deciding whether a player should see a tip and recording that a tip was shown.
 */
export class TipService {
	constructor(
		public tipRepository: TipRepository,
		public playerRepository: PlayerRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new TipService(
			TipRepository.fromDB(db),
			PlayerRepository.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return TipService.fromDB(db);
	}

	/**
	 * Resolves a tip resolvable to a fetched tip object.
	 * @param tipResolvable - The tip to resolve. Can be a key or a tip object.
	 * @returns The resolved tip object.
	 * @throws {TipNotFoundError} If the tip does not exist.
	 */
	resolveTip(tipResolvable: TipResolvable): Tip {
		return this.tipRepository.resolveTip(tipResolvable);
	}

	/**
	 * Resolves a tip resolvable to a tip key.
	 * @param tipResolvable - The tip to resolve. Can be a key or a tip object.
	 * @returns The resolved tip key.
	 */
	resolveKey(tipResolvable: TipResolvable): TipKey {
		return this.tipRepository.resolveKey(tipResolvable);
	}

	/**
	 * Determines whether a player should be shown a given tip right now.
	 * @param playerResolvable - The player to check.
	 * @param tipResolvable - The tip to check.
	 * @returns True if the player has been shown the tip fewer than the maximum allowed times.
	 */
	shouldPlayerSeeTip(playerResolvable: PlayerResolvable, tipResolvable: TipResolvable): boolean {
		const playerID = this.playerRepository.resolveID(playerResolvable);
		const tipKey = this.tipRepository.resolveKey(tipResolvable);

		return this.tipRepository.getViewCount(playerID, tipKey) < MAX_TIP_VIEW_COUNT;
	}

	/**
	 * Records that a tip was just shown to a player.
	 * @param playerResolvable - The player who was shown the tip.
	 * @param tipResolvable - The tip that was shown.
	 */
	incrementTipViewCountForPlayer(playerResolvable: PlayerResolvable, tipResolvable: TipResolvable): void {
		const playerID = this.playerRepository.resolveID(playerResolvable);
		const tipKey = this.tipRepository.resolveKey(tipResolvable);

		this.tipRepository.incrementViewCount(playerID, tipKey);
	}

	/**
	 * Returns a tip's message and marks it as viewed if the player should still see it.
	 * Only increments the tip's view count when a message is actually returned.
	 * @param playerResolvable - The player who may be shown the tip.
	 * @param tipResolvable - The tip that may be shown.
	 * @returns The tip's message, or null if the player shouldn't see it.
	 */
	getAndViewTipIfPlayerShouldSeeIt(playerResolvable: PlayerResolvable, tipResolvable: TipResolvable): string | null {
		if (!this.shouldPlayerSeeTip(playerResolvable, tipResolvable))
			return null;

		const tip = this.resolveTip(tipResolvable);
		this.incrementTipViewCountForPlayer(playerResolvable, tipResolvable);

		return tip.message;
	}

	/**
	 * Tries each tip in priority order and returns the message of and marks as viewed the first one the player should still see.
	 * @param playerResolvable - The player who may be shown a tip.
	 * @param tipsInPriorityOrder - The tips to try, in priority order.
	 * @returns The first applicable tip's message, or null if none apply.
	 */
	getAndViewFirstTipPlayerShouldSee(playerResolvable: PlayerResolvable, tipsInPriorityOrder: TipResolvable[]): string | null {
		for (const tipResolvable of tipsInPriorityOrder) {
			const message = this.getAndViewTipIfPlayerShouldSeeIt(playerResolvable, tipResolvable);

			if (message !== null)
				return message;
		}

		return null;
	}
}
