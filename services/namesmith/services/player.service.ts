import { PlayerRepository } from "../repositories/player.repository";
import { attempt, ignoreError, InvalidArgumentError } from "../../../utilities/error-utils";
import { PlayerAlreadyExistsError, NameTooLongError } from "../utilities/error.utility";
import { Inventory, Player, PlayerID, PlayerResolvable } from '../types/player.types';
import { removeCharactersAsGivenFromEnd, removeMissingCharacters } from "../../../utilities/string-manipulation-utils";
import { areCharactersInString, getCharacterCounts, getCharacters } from "../../../utilities/string-checks-utils";
import { sortCharactersForDisplay, toDisplayOrderedCharacters } from "../utilities/player-message.utility";
import { REFILL_COOLDOWN_DURATION } from "../constants/claim-refill.constants";
import { addDuration, OLDEST_DATE } from "../../../utilities/date-time-utils";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { MAX_NAME_LENGTH } from "../constants/naming.constants";
import { TransactionRunner } from "../database/transaction-runner";

/**
 * Provides methods for interacting with players.
 */
export class PlayerService {
	/**
	 * Constructs a new PlayerService instance.
	 * @param playerRepository - The repository used for accessing players.
	 * @param transactionRunner - Runs several repository operations inside a single database transaction when they must all succeed together.
	 */
	constructor(
		public playerRepository: PlayerRepository,
		public transactionRunner: TransactionRunner,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new PlayerService(
			PlayerRepository.fromDB(db),
			TransactionRunner.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return PlayerService.fromDB(db);
	}

	/**
	 * Resolves a player from the given resolvable.
	 * @param playerResolvable - The player resolvable to resolve.
	 * @returns The resolved player object.
	 * @throws {PlayerNotFoundError} If the player resolvable is invalid or the player is not found.
	 */
	resolvePlayer(playerResolvable: PlayerResolvable): Player {
		return this.playerRepository.resolvePlayer(playerResolvable);
	}

	/**
	 * Resolves a player resolvable to a player ID.
	 * @param playerResolvable - The player resolvable to resolve.
	 * @returns The resolved player ID.
	 * @throws {PlayerNotFoundError} If the player resolvable is invalid or the player is not found.
	 */
	resolveID(playerResolvable: PlayerResolvable): PlayerID {
		return this.playerRepository.resolveID(playerResolvable);
	}

	/**
	 * Returns a list of all player in the game.
	 * @returns An array every player.
	 */
	getPlayers(): Player[] {
		return this.playerRepository.getPlayers();
	}

	/**
	 * Retrieves the number of players in the game.
	 * @returns The number of players.
	 */
	getPlayerCount(): number {
		return this.playerRepository.getPlayerCount();
	}

	/**
	 * Retrieves all players with the given name.
	 * @param name - The name to search for.
	 * @returns An array of players with the given name.
	 */
	getPlayersByName(name: string): Player[] {
		return this.playerRepository.getPlayersByCurrentName(name);
	}

	/**
	 * Determines if a player with the given resolvable exists.
	 * @param playerResolvable - The player resolvable to check for existence.
	 * @returns True if a player with the given resolvable exists, false otherwise.
	 */
	isPlayer(playerResolvable: PlayerResolvable): boolean {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.doesPlayerExist(playerID);
	}

	/**
	 * Determines if two players are the same based on their IDs.
	 * @param player1 - The first player to compare.
	 * @param player2 - The second player to compare.
	 * @returns True if the two players are the same, false otherwise.
	 */
	areSamePlayers(player1: PlayerResolvable, player2: PlayerResolvable): boolean {
		const player1ID = this.resolveID(player1);
		const player2ID = this.resolveID(player2);
		return player1ID === player2ID;
	}

	/**
	 * Retrieves the inventory of a player.
	 * @param playerResolvable - The player resolvable whose inventory is being retrieved.
	 * @returns The inventory of the player.
	 */
	getInventory(playerResolvable: PlayerResolvable): Inventory {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getInventory(playerID);
	}

	/**
	 * Retrieves the inventory of a player, sorted alphabetically with letters first, then numbers, then spaces.
	 * @param playerResolvable - The player resolvable whose inventory is being retrieved.
	 * @returns The sorted inventory of the player.
	 */
	getDisplayedInventory(playerResolvable: PlayerResolvable): string {
		const inventory = this.getInventory(playerResolvable);
		return toDisplayOrderedCharacters(inventory);
	}

	/**
	 * Retrieves the characters in a player's inventory that are not present in a given name, in the same sorted display order as getDisplayedInventory.
	 * @param playerResolvable - The player resolvable whose inventory is being checked.
	 * @param name - The name whose characters should be excluded from the result.
	 * @returns The inventory characters not used in the given name, in display order.
	 */
	getUnusedInventoryCharacters(playerResolvable: PlayerResolvable, name: string): string[] {
		const inventory = this.getInventory(playerResolvable);
		const sortedInventoryCharacters = sortCharactersForDisplay(inventory);
		const nameCharacterCounts = getCharacterCounts(getCharacters(name));

		const unusedCharacters: string[] = [];
		for (const character of sortedInventoryCharacters) {
			const remainingCount = nameCharacterCounts.get(character) ?? 0;
			if (remainingCount > 0) {
				nameCharacterCounts.set(character, remainingCount - 1);
			}
			else {
				unusedCharacters.push(character);
			}
		}
		return unusedCharacters;
	}

	/**
	 * Retrieves the current name of a player.
	 * @param playerResolvable - The player resolvable whose current name is being retrieved.
	 * @returns The current name of the player.
	 */
	getCurrentName(playerResolvable: PlayerResolvable): string {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getCurrentName(playerID);
	}

	/**
	 * Changes the current name of a player.
	 * - Should not be called in succession, as it will result in a race condition.
	 * - Only call after all changes to the current name have been made.
	 * @param playerResolvable - The player resolvable whose current name is being changed.
	 * @param  newName - The new name to assign to the player.
	 * @throws {NameTooLongError} If the new name is too long.
	 */
	changeCurrentName(
		playerResolvable: PlayerResolvable,
		newName: string
	) {
		const playerID = this.resolveID(playerResolvable);
		const oldName = this.getCurrentName(playerResolvable);

		if (newName.length > MAX_NAME_LENGTH)
			throw new NameTooLongError(newName, MAX_NAME_LENGTH);

		this.playerRepository.changeCurrentName(playerID, newName);

		NamesmithEvents.ChangeName.triggerEvent({
			playerID, oldName, newName
		});
	}

	/**
	 * Adds a character to the end of the current name of a player.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param playerResolvable - The player whose name to add a character to.
	 * @param character - The character to add to the current name.
	 * @throws {NameTooLongError} If the new name is too long.
	 */
	private addCharacterToName(
		playerResolvable: PlayerResolvable,
		character: string
	): void {
		const currentName = this.getCurrentName(playerResolvable);
		const newName = currentName + character;
		this.changeCurrentName(playerResolvable, newName);
	}

	/**
	 * Adds characters to the end of the current name of a player.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param playerResolvable - The player whose name to add characters to.
	 * @param characters - The character(s) to add to the current name.
	 * @throws {NameTooLongError} If the new name is too long.
	 */
	private addCharactersToName(
		playerResolvable: PlayerResolvable,
		characters: string | string[]
	): void {
		const currentName = this.getCurrentName(playerResolvable);
		const newName = currentName + characters;
		this.changeCurrentName(playerResolvable, newName);
	}

	/**
	 * Removes characters from the current name of a player, from the end of the string.
	 * If the characters to remove exceed the length of the current name, the current name is cleared.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param playerResolvable - The player resolvable whose name to remove characters from.
	 * @returns The new current name of the player.
	 */
	private removeMissingCharactersFromName(
		playerResolvable: PlayerResolvable
	): string {
		const currentName = this.getCurrentName(playerResolvable);
		const inventory = this.getInventory(playerResolvable);
		const fixedName = removeMissingCharacters(currentName, inventory);

		this.changeCurrentName(playerResolvable, fixedName);
		return fixedName;
	}

	/**
	 * Checks if the player has a specific set of characters in their inventory.
	 * @param playerResolvable - The player to check.
	 * @param characters - The characters to check for. If an array, they are joined together with no separator.
	 * @returns True if the player has all the characters in their inventory, false otherwise.
	 */
	hasCharacters(
		playerResolvable: PlayerResolvable,
		characters: string | string[]
	): boolean {
		characters = typeof characters === "string"
			? characters
			: characters.join("");

		const player = this.resolvePlayer(playerResolvable);
		return areCharactersInString(characters, player.inventory);
	}

	/**
	 * Adds a single character to the inventory of a player.
	 * @param playerResolvable - The player to add the character to.
	 * @param character - The character to add to the player's inventory.
	 */
	private addCharacterToInventory(
		playerResolvable: PlayerResolvable,
		character: string
	): void {
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.addCharacterToInventory(playerID, character);
	}

	/**
	 * Adds characters to the inventory of a player.
	 * @param playerResolvable - The player resolvable whose inventory to add characters to.
	 * @param characters - The characters to add to the inventory.
	 * If `characters` is an array, it is joined together with no separator.
	 * @returns The new inventory of the player.
	 */
	private addCharactersToInventory(
		playerResolvable: PlayerResolvable,
		characters: string | string[]
	): string {
		characters = typeof characters === "string" ?
			characters :
			characters.join("");

		const currentInventory = this.getInventory(playerResolvable);
		const newInventory = currentInventory + characters;

		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setInventory(playerID, newInventory);
		return newInventory;
	}

	/**
	 * Removes characters from the inventory of a player, from the end of the string.
	 * If the characters to remove exceed the length of the inventory, the inventory is cleared.
	 * @param playerResolvable - The player resolvable whose inventory to remove characters from.
	 * @param characters - The characters to remove from the inventory.
	 * @returns The new inventory of the player.
	 */
	removeCharactersFromInventory(
		playerResolvable: PlayerResolvable,
		characters: string | string[]
	): string {
		const inventory = this.getInventory(playerResolvable);
		const newInventory = removeCharactersAsGivenFromEnd(inventory, characters);
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setInventory(playerID, newInventory);
		return newInventory;
	}

	/**
	 * Gives a character to a player, adding it to their inventory and name if possible.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param player - The player whose name is being modified.
	 * @param character - The character to give to the player.
	 */
	giveCharacter(
		player: PlayerResolvable,
		character: string
	): void {
		this.addCharacterToInventory(player, character);

		attempt(() => this.addCharacterToName(player, character))
			// Don't update name if it is at max length
			.ignoreError(NameTooLongError)
			.execute();
	}

	/**
	 * Gives characters to a player, adding them to their inventory and name if possible.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param player - The player whose name is being modified.
	 * @param characters - The characters to give to the player.
	 */
	giveCharacters(
		player: PlayerResolvable,
		characters: string | string[]
	): void {
		this.addCharactersToInventory(player, characters);

		attempt(() => this.addCharactersToName(player, characters))
			// Don't update name if it is at max length
			.ignoreError(NameTooLongError)
			.execute();
	}

	/**
	 * Removes characters from the inventory and current name of a player.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param player - The player resolvable whose inventory and name to remove characters from.
	 * @param characters - The characters to remove from the inventory and name.
	 * If `characters` is an array, it is joined together with no separator.
	 */
	removeCharacters(
		player: PlayerResolvable,
		characters: string | string[]
	): void {
		this.removeCharactersFromInventory(player, characters);
		this.removeMissingCharactersFromName(player);
	}

	/**
	 * Removes characters from the inventory and current name of a player, and adds other characters to the inventory and name.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param player - The player resolvable whose inventory and name to modify.
	 * @param parameters - An object containing
	 * @param parameters.charactersRemoving - The characters to remove from the inventory and name.
	 * @param parameters.charactersGiving - The characters to add to the inventory and name.
	 * If `charactersRemoving` or `charactersGiving` is an array, it is joined together with no separator.
	 */
	giveAndTakeCharacters(
		player: PlayerResolvable,
		{ charactersRemoving, charactersGiving }: {
			charactersRemoving: string | string[],
			charactersGiving: string | string[]
		}
	): void {
		this.removeCharactersFromInventory(player, charactersRemoving);
		const currentName = this.getCurrentName(player);
		const inventory = this.getInventory(player);
		const nameWithRemovedCharacters = removeMissingCharacters(currentName, inventory);

		this.addCharactersToInventory(player, charactersGiving);
		const newName = nameWithRemovedCharacters + charactersGiving;

		ignoreError(() => this.changeCurrentName(player, newName));
	}

	/**
	 * Removes characters from a player's inventory and name, and gives them tokens in exchange, as a single atomic transaction.
	 * @param playerResolvable - The player resolvable whose characters and tokens are being modified.
	 * @param parameters - An object containing
	 * @param parameters.charactersTaken - The characters to remove from the inventory and name.
	 * @param parameters.tokensGiven - The number of tokens to give in exchange.
	 * @returns The player's new inventory and token count after the exchange.
	 */
	takeCharactersAndGiveTokens(
		playerResolvable: PlayerResolvable,
		{ charactersTaken, tokensGiven }: {
			charactersTaken: string | string[],
			tokensGiven: number,
		}
	): { newInventory: string, newTokenCount: number } {
		return this.transactionRunner.runInTransaction(() => {
			this.removeCharacters(playerResolvable, charactersTaken);
			const newTokenCount = this.giveTokens(playerResolvable, tokensGiven);
			const newInventory = this.getInventory(playerResolvable);
			return { newInventory, newTokenCount };
		});
	}

	/**
	 * Gives characters to a player's inventory and name, and takes tokens from them in exchange, as a single atomic transaction.
	 * @param playerResolvable - The player resolvable whose characters and tokens are being modified.
	 * @param parameters - An object containing
	 * @param parameters.charactersGiven - The characters to add to the inventory and name.
	 * @param parameters.tokensTaken - The number of tokens to take in exchange.
	 * @returns The player's new inventory and token count after the exchange.
	 */
	giveCharactersAndTakeTokens(
		playerResolvable: PlayerResolvable,
		{ charactersGiven, tokensTaken }: {
			charactersGiven: string | string[],
			tokensTaken: number,
		}
	): { newInventory: string, newTokenCount: number } {
		return this.transactionRunner.runInTransaction(() => {
			this.giveCharacters(playerResolvable, charactersGiven);
			this.takeTokens(playerResolvable, tokensTaken);
			const newInventory = this.getInventory(playerResolvable);
			const newTokenCount = this.getTokens(playerResolvable);
			return { newInventory, newTokenCount };
		});
	}

	/**
	 * Transfers characters from one player to another, removing them from the first player's inventory and name, and adding them to the second player's inventory and name if possible.
	 * - Do not call as a part of a larger change to the same player's name. This will result in a race condition.
	 * @param fromPlayer - The player whose characters are being transferred.
	 * @param toPlayer - The player whose characters are being transferred to.
	 * @param characters - The characters to transfer from one player to another.
	 */
	transferCharacters(
		fromPlayer: PlayerResolvable,
		toPlayer: PlayerResolvable,
		characters: string | string[]
	): void {
		this.removeCharacters(fromPlayer, characters);
		this.giveCharacters(toPlayer, characters);
	}

	/**
	 * Sets the inventory of a player.
	 * @param playerResolvable - The player resolvable whose inventory is being set.
	 * @param inventory - The new inventory of the player.
	 * If `inventory` is an array, it is joined together with no separator.
	 */
	setInventory(
		playerResolvable: PlayerResolvable,
		inventory: string | string[]
	) {
		inventory = typeof inventory === "string"
			? inventory :
			inventory.join("");

		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setInventory(playerID, inventory);
	}

	/**
	 * Adds tokens to a player's token count.
	 * @param playerResolvable - The player resolvable whose tokens are being increased.
	 * @param tokens - The number of tokens to add to the player's count.
	 * @throws {InvalidArgumentError} - If the number of tokens is negative.
	 * @returns The number of tokens the player now has.
	 */
	giveTokens(playerResolvable: PlayerResolvable, tokens: number): number {
		const playerID = this.resolveID(playerResolvable);

		if (tokens < 0)
			throw new InvalidArgumentError(`giveTokens: tokens must be a non-negative number, but got ${tokens}.`);

		const currentTokens = this.playerRepository.getTokens(playerID);
		const newTokens = currentTokens + tokens;
		this.playerRepository.setTokens(playerID, newTokens);
		return newTokens;
	}

	/**
	 * Takes tokens from a player's token count.
	 * @param playerResolvable - The player resolvable whose tokens are being decreased.
	 * @param tokens - The number of tokens to take from the player's count.
	 * @throws {InvalidArgumentError} - If the number of tokens is negative.
	 */
	takeTokens(playerResolvable: PlayerResolvable, tokens: number) {
		const playerID = this.resolveID(playerResolvable);

		if (tokens < 0)
			throw new InvalidArgumentError(`takeTokens: tokens must be a non-negative number, but got ${tokens}.`);

		const currentTokens = this.playerRepository.getTokens(playerID);
		const newTokens = currentTokens - tokens;
		this.playerRepository.setTokens(playerID, newTokens);
	}

	/**
	 * Checks if a player has a certain number of tokens.
	 * @param playerResolvable - The player resolvable to check.
	 * @param tokens - The number of tokens to check for.
	 * @returns True if the player has at least the number of tokens specified, false otherwise.
	 */
	hasTokens(playerResolvable: PlayerResolvable, tokens: number): boolean {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getTokens(playerID) >= tokens;
	}

	/**
	 * Retrieves the number of tokens a player has.
	 * @param playerResolvable - The player resolvable whose tokens are being retrieved.
	 * @returns The number of tokens the player has.
	 */
	getTokens(playerResolvable: PlayerResolvable): number {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getTokens(playerID);
	}

	/**
	 * Sets the last time a player claimed a refill.
	 * @param playerResolvable - The player resolvable whose last refill time is being set.
	 * @param time - The last time the player claimed a refill.
	 */
	setLastRefillTime(playerResolvable: PlayerResolvable, time: Date) {
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setLastClaimedRefillTime(playerID, time);
	}

	/**
	 * Checks if a player is eligible to claim a token refill.
	 * @param playerResolvable - The player resolvable to check.
	 * @returns True if the player is eligible to claim a token refill, false otherwise.
	 */
	canRefill(playerResolvable: PlayerResolvable): boolean {
		const playerID = this.resolveID(playerResolvable);
		const lastRefillTime = this.playerRepository.getLastClaimedRefillTime(playerID);

		if (lastRefillTime === null)
			return true;

		const now = new Date(Date.now());
		const nextAvailableRefillTime = this.getNextAvailableRefillTime(playerResolvable);
		return now >= nextAvailableRefillTime;
	}

	getNextAvailableRefillTime(playerResolvable: PlayerResolvable): Date {
		const playerID = this.resolveID(playerResolvable);
		const lastRefillTime = this.playerRepository.getLastClaimedRefillTime(playerID);

		if (lastRefillTime === null)
			return OLDEST_DATE;

		return addDuration(lastRefillTime, REFILL_COOLDOWN_DURATION);
	}

	getLastClaimedRefillTime(playerResolvable: PlayerResolvable): Date | null {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getLastClaimedRefillTime(playerID);
	}

	setLastClaimedRefillTime(
		playerResolvable: PlayerResolvable,
		lastClaimedRefillTime: Date,
	) {
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setLastClaimedRefillTime(playerID, lastClaimedRefillTime);
	}

	/**
	 * Adds a new player to the game.
	 * @param playerResolvable - The player resolvable to add to the game.
	 * @throws {Error} - If the player already exists in the game.
	 */
	addNewPlayer(playerResolvable: PlayerResolvable): void {
		const playerID = this.resolveID(playerResolvable);

		if (typeof playerID !== "string")
			throw new InvalidArgumentError(`addNewPlayer: playerID must be a string, but got ${playerID}.`);

		if (this.playerRepository.doesPlayerExist(playerID))
			throw new PlayerAlreadyExistsError(playerID);

		this.playerRepository.createPlayer(playerID);
	}
	setHasPickedPerk(playerResolvable: PlayerResolvable, hasPickedPerk: boolean) {
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setHasPickedPerk(playerID, hasPickedPerk);
	}

	hasPickedPerk(playerResolvable: PlayerResolvable): boolean {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getHasPickedPerk(playerID);
	}

	resetAllHasPickedPerk() {
		this.playerRepository.resetAllHasPickedPerk();
	}

	hasRefillReminderEnabled(playerResolvable: PlayerResolvable): boolean {
		const playerID = this.resolveID(playerResolvable);
		return this.playerRepository.getRefillReminderEnabled(playerID);
	}

	setRefillReminderEnabled(playerResolvable: PlayerResolvable, enabled: boolean) {
		const playerID = this.resolveID(playerResolvable);
		this.playerRepository.setRefillReminderEnabled(playerID, enabled);
	}

	getPlayerIDsWithRefillReminderEnabled(): PlayerID[] {
		return this.playerRepository.getPlayerIDsWithRefillReminderEnabled();
	}

	/**
	 * Checks if the current name of a player contains a given substring.
	 * Case is ignored.
	 * @param playerResolvable - The player resolvable to check the name of.
	 * @param nameSubstring - The substring to check for in the player's name.
	 * @returns true if the player's name contains the substring, false otherwise.
	 */
	doesNameContain(playerResolvable: PlayerResolvable, nameSubstring: string): boolean {
		if (nameSubstring === '') 
			throw new InvalidArgumentError('Expected nameSubstring argument of doesNameContain() method to be a non-empty string, but it was empty.');

		const currentName = this.getCurrentName(playerResolvable);
		return currentName.toLowerCase().includes(nameSubstring.toLowerCase());
	}

	/**
	 * Checks if the current name of a player contains any of the given substrings.
	 * Case is ignored.
	 * @param playerResolvable - The player resolvable to check the name of.
	 * @param nameSubstrings - The substrings to check for in the player's name.
	 * @returns true if the player's name contains any of the given substrings, false otherwise.
	 */
	doesNameContainAny(playerResolvable: PlayerResolvable, nameSubstrings: string[]): boolean {
		for (const nameSubstring of nameSubstrings)
			if (this.doesNameContain(playerResolvable, nameSubstring))
				return true;
			
		return false;
	}

	/**
	 * Removes all the players from the game, leaving none left
	 */
	reset() {
		this.playerRepository.removePlayers();
	}
}