import { logWarning } from "../../../utilities/logging-utils";
import { PUBLISHED_NAME_SLOT_COSTS, MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER } from "../constants/name-publishing.constants";
import { MAX_NAME_LENGTH } from "../constants/player.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { createMockDB } from "../mocks/mock-database";
import { PlayerID, PlayerResolvable } from "../types/player.types";
import { PublishedName, PublishedNameID, PublishedNameResolvable } from "../types/published-name.types";
import { AllPublishedNameSlotsUsedError, NameTooLongError } from "../utilities/error.utility";
import { PlayerRepository } from "../repositories/player.repository";
import { PublishedNameRepository } from "../repositories/published-name.repository";
import { TransactionRunner } from "../database/transaction-runner";
import { PlayerService } from "./player.service";

export class PublishedNameService {
	/**
	 * @param publishedNameRepository - The repository used for accessing published names.
	 * @param playerRepository - The repository used for resolving players and their current names.
	 * @param playerService - The service used to remove a published name's characters from a player's inventory and clear their current name.
	 * @param transactionRunner - Runs several repository operations inside a single database transaction when they must all succeed together.
	 */
	constructor(
		public publishedNameRepository: PublishedNameRepository,
		public playerRepository: PlayerRepository,
		public playerService: PlayerService,
		public transactionRunner: TransactionRunner,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new PublishedNameService(
			PublishedNameRepository.fromDB(db),
			PlayerRepository.fromDB(db),
			PlayerService.fromDB(db),
			TransactionRunner.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return PublishedNameService.fromDB(db);
	}

	/**
	 * Resolves a published name resolvable to a published name ID.
	 * @param publishedNameResolvable - The resolvable to resolve.
	 * @returns The resolved published name ID.
	 */
	resolveID(publishedNameResolvable: PublishedNameResolvable): PublishedNameID {
		return this.publishedNameRepository.resolveID(publishedNameResolvable);
	}

	/**
	 * Resolves a published name resolvable to a published name.
	 * @param publishedNameResolvable - The resolvable to resolve.
	 * @returns The resolved published name.
	 * @throws {PublishedNameNotFoundError} If the published name does not exist.
	 */
	resolvePublishedName(publishedNameResolvable: PublishedNameResolvable): PublishedName {
		return this.publishedNameRepository.resolvePublishedName(publishedNameResolvable);
	}

	private resolvePlayerID(player: PlayerResolvable): PlayerID {
		return this.playerRepository.resolveID(player);
	}

	/**
	 * Returns every published name across all players.
	 * @returns An array of published names.
	 */
	getPublishedNames(): PublishedName[] {
		return this.publishedNameRepository.getPublishedNames();
	}

	/**
	 * Returns the name text of every published name across all players.
	 * @returns An array of published name strings.
	 */
	getAllPublishedNameStrings(): string[] {
		return this.getPublishedNames().map(publishedName => publishedName.name);
	}

	/**
	 * Returns the published names owned by a player, ordered by published name slot.
	 * @param player - The player whose published names are being retrieved.
	 * @returns An array of the player's published names.
	 */
	getPublishedNamesOfPlayer(player: PlayerResolvable): PublishedName[] {
		return this.publishedNameRepository.getPublishedNamesByPlayer(
			this.resolvePlayerID(player)
		);
	}

	/**
	 * Returns the number of published names a player currently has.
	 * @param player - The player whose published names are being counted.
	 * @returns The player's published name count.
	 */
	getNumPublishedNamesOfPlayer(player: PlayerResolvable): number {
		return this.publishedNameRepository.getNumPublishedNamesByPlayer(
			this.resolvePlayerID(player)
		);
	}

	/**
	 * Returns the slot numbers of the used published name slots a player currently occupies.
	 * @param player - The player whose used published name slots are being retrieved.
	 * @returns An array of the slot numbers the player currently occupies.
	 */
	getUsedSlotNumbersOfPlayer(player: PlayerResolvable): number[] {
		return this.getPublishedNamesOfPlayer(player).map(
			publishedName => publishedName.slotNumber
		);
	}

	/**
	 * Returns the slot number of the player's lowest available published name slot, or null if every published name slot is used.
	 * @param player - The player whose lowest available published name slot is being retrieved.
	 * @returns The lowest available slot number, or null if the player is at the published name slot limit.
	 */
	getLowestAvailableSlotNumberOfPlayer(player: PlayerResolvable): number | null {
		const usedSlotNumbers = new Set(this.getUsedSlotNumbersOfPlayer(player));

		for (let slotNumber = 1; slotNumber <= MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER; slotNumber++) {
			if (!usedSlotNumbers.has(slotNumber))
				return slotNumber;
		}

		return null;
	}

	/**
	 * Checks whether a player has a published name.
	 * @param player - The player to check.
	 * @returns True if the player has at least one published name, otherwise false.
	 */
	doesPlayerHaveAPublishedName(player: PlayerResolvable): boolean {
		return this.getNumPublishedNamesOfPlayer(player) > 0;
	}

	/**
	 * Checks whether a player has an available published name slot.
	 * @param player - The player to check.
	 * @returns True if the player can publish another name, otherwise false.
	 */
	doesPlayerHaveAvailableSlot(player: PlayerResolvable): boolean {
		return this.getLowestAvailableSlotNumberOfPlayer(player) !== null;
	}

	/**
	 * Checks whether a player has reached the published name limit (all published name slots are used).
	 * @param player - The player to check.
	 * @returns True if the player has no available published name slot, otherwise false.
	 */
	isPlayerAtPublishedNameLimit(player: PlayerResolvable): boolean {
		return !this.doesPlayerHaveAvailableSlot(player);
	}

	/**
	 * Returns the token cost of the published name occupying a given published name slot.
	 * @param slotNumber - The slot number to look up.
	 * @returns The token cost of that published name slot.
	 */
	getCostOfSlotNumber(slotNumber: number): number {
		return PUBLISHED_NAME_SLOT_COSTS[slotNumber - 1];
	}

	/**
	 * Returns the token cost of the player's next published name.
	 * If the player already bought the next available slot, the cost will be 0.
	 * @param player - The player whose cost of next published name is being retrieved.
	 * @returns The cost of the next published name, or null if the player is at the published name limit.
	 */
	getCostOfNextPublishedNameForPlayer(player: PlayerResolvable): number | null {
		const slotNumber = this.getLowestAvailableSlotNumberOfPlayer(player);
		if (slotNumber === null)
			return null;

		const usedSlotNumbers = this.getUsedSlotNumbersOfPlayer(player);
		const highestUsedSlotNumber = usedSlotNumbers.length === 0 
			? 0
			: Math.max(...usedSlotNumbers);

		if (slotNumber <= highestUsedSlotNumber)
			return 0;

		return this.getCostOfSlotNumber(slotNumber);
	}

	/**
	 * Checks whether a player already has an exact name among their published names.
	 * @param player - The player whose published names are being checked.
	 * @param name - The name to look for.
	 * @returns True if the player already published this exact name, otherwise false.
	 */
	isNamePublishedByPlayer(player: PlayerResolvable, name: string): boolean {
		return this.getPublishedNamesOfPlayer(player).some(
			publishedName => publishedName.name === name
		);
	}

	private validateName(name: string): void {
		if (name.length > MAX_NAME_LENGTH)
			throw new NameTooLongError(name, MAX_NAME_LENGTH);
	}

	/**
	 * Publishes a name for a player into their lowest available published name slot.
	 * Removes the published name's characters from the player's inventory and empties their current name.
	 * @param playerResolvable - The player publishing the name.
	 * @param name - The name to publish. Defaults to the player's current name.
	 * @returns The created published name, or null if there was no name to publish.
	 * @throws {NameTooLongError} If the name exceeds the maximum length.
	 * @throws {AllPublishedNameSlotsUsedError} If the player has reached the published name slot limit.
	 */
	publishNameForPlayer(playerResolvable: PlayerResolvable, name?: string): PublishedName | null {
		const player = this.playerRepository.resolvePlayer(playerResolvable);
		const nameToPublish = name ?? player.currentName;

		if (nameToPublish.length === 0) {
			logWarning(`publishNameForPlayer: player ${player.id} has no name to publish.`);
			return null;
		}

		this.validateName(nameToPublish);

		const slotNumber = this.getLowestAvailableSlotNumberOfPlayer(player.id);
		if (slotNumber === null)
			throw new AllPublishedNameSlotsUsedError(player, MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER);

		const publishedName = this.transactionRunner.runInTransaction(() => {
			const publishedName = this.publishedNameRepository.addPublishedName({
				playerID: player.id,
				name: nameToPublish,
				slotNumber,
			});

			this.playerService.removeCharactersFromInventory(player.id, nameToPublish);
			this.playerService.changeCurrentName(player.id, '');

			return publishedName;
		});

		this.triggerPublishNameEvent(player.id, publishedName, 0);
		return publishedName;
	}

	/**
	 * Deducts the token cost of the player's next published name and publishes the name into their lowest available published name slot.
	 * Removes the published name's characters from the player's inventory and empties their current name.
	 * @param options - The paid publish options.
	 * @param options.player - The player publishing the name.
	 * @param options.name - The name to publish.
	 * @returns The created published name and the tokens spent on it as an object.
	 * @throws {NameTooLongError} If the name exceeds the maximum length.
	 * @throws {AllPublishedNameSlotsUsedError} If the player has reached the published name slot limit.
	 * @throws {NotEnoughTokensError} If the player cannot afford the published name.
	 */
	publishPaidPublishedNameForPlayer(
		{ player: playerResolvable, name }: {
			player: PlayerResolvable;
			name: string;
		}
	): { publishedName: PublishedName; tokensSpent: number } {
		const player = this.playerRepository.resolvePlayer(playerResolvable);

		const slotNumber = this.getLowestAvailableSlotNumberOfPlayer(player.id);
		if (slotNumber === null)
			throw new AllPublishedNameSlotsUsedError(player, MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER);

		this.validateName(name);

		const tokensSpent = this.getCostOfNextPublishedNameForPlayer(player.id) as number;

		const publishedName = this.transactionRunner.runInTransaction(() => {
			this.playerRepository.deductTokens(player.id, tokensSpent);

			const publishedName = this.publishedNameRepository.addPublishedName({
				playerID: player.id,
				name,
				slotNumber,
			});

			this.playerService.removeCharactersFromInventory(player.id, name);
			this.playerService.changeCurrentName(player.id, '');

			return publishedName;
		});

		this.triggerPublishNameEvent(player.id, publishedName, tokensSpent);
		return { publishedName, tokensSpent };
	}

	/**
	 * Force-sets a specific published name slot for a player, overwriting whatever currently occupies that slot. Bypasses token cost and slot-limit checks. Used for developer debug tooling.
	 * @param playerResolvable - The player whose published name slot is being force-set.
	 * @param name - The name to publish into the slot.
	 * @param slotNumber - The published name slot to overwrite.
	 * @returns The created published name.
	 * @throws {NameTooLongError} If the name exceeds the maximum length.
	 */
	forceSetPublishedNameInSlot(playerResolvable: PlayerResolvable, name: string, slotNumber: number): PublishedName {
		const player = this.playerRepository.resolvePlayer(playerResolvable);
		this.validateName(name);

		const existingPublishedNameInSlot = this.getPublishedNamesOfPlayer(player.id).find(
			publishedName => publishedName.slotNumber === slotNumber
		);
		
		if (existingPublishedNameInSlot !== undefined)
			this.publishedNameRepository.removePublishedName(existingPublishedNameInSlot.id);

		const publishedName = this.publishedNameRepository.addPublishedName({
			playerID: player.id,
			name,
			slotNumber,
		});

		this.triggerPublishNameEvent(player.id, publishedName, 0);
		return publishedName;
	}

	/**
	 * Publishes the current name of every player who does not yet have a published name.
	 */
	autoPublishCurrentNames(): void {
		for (const player of this.playerRepository.getPlayers()) {
			if (this.doesPlayerHaveAPublishedName(player.id))
				continue;

			if (player.currentName.length === 0)
				continue;

			this.publishNameForPlayer(player.id);
		}
	}

	/**
	 * Removes a single published name.
	 * @param publishedNameResolvable - The published name to remove.
	 */
	unpublishName(publishedNameResolvable: PublishedNameResolvable): void {
		this.publishedNameRepository.removePublishedName(
			this.resolveID(publishedNameResolvable)
		);
	}

	/**
	 * Removes all published names owned by a player.
	 * @param player - The player whose published names are being removed.
	 */
	removePublishedNamesOfPlayer(player: PlayerResolvable): void {
		this.publishedNameRepository.removePublishedNamesByPlayer(
			this.resolvePlayerID(player)
		);
	}

	/**
	 * Removes all published names, clearing the table.
	 */
	reset(): void {
		this.publishedNameRepository.removePublishedNames();
	}

	private triggerPublishNameEvent(playerID: PlayerID, publishedName: PublishedName, tokensSpent: number): void {
		NamesmithEvents.PublishName.triggerEvent({
			player: this.playerRepository.getPlayerOrThrow(playerID),
			publishedName,
			tokensSpent,
		});
	}
}
