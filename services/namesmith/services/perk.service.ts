import { isNumber, isString } from "../../../utilities/types/type-guards";
import { PerkRepository } from "../repositories/perk.repository";
import { Perk, PerkResolvable } from "../types/perk.types";
import { Player, PlayerResolvable } from "../types/player.types";
import { PerkNotFoundError } from "../utilities/error.utility";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with perks.
 */
export class PerkService {
	constructor (
		public perkRepository: PerkRepository,
		public playerService: PlayerService,
	) {}

	/**
	 * Resolves a perk ID, perk name, or perk object to a fetched Perk object.
	 * @param perkResolvable - The perk to be resolved.
	 * @throws PerkNotFoundError - If the provided perkResolvable is a string that does not correspond to a perk in the database.
	 * @returns The resolved perk object.
	 */
	resolvePerk(perkResolvable: PerkResolvable) {
		if (isNumber(perkResolvable)) {
			const perkID = perkResolvable;
			return this.perkRepository.getPerkOrThrow(perkID);
		}
		else if (isString(perkResolvable)) {
			const perkName = perkResolvable;
			const maybePerk = this.perkRepository.getPerkByName(perkName);

			if (maybePerk === null)
				throw new PerkNotFoundError(perkName);

			const perk = maybePerk;
			return perk;
		}
		else {
			const perk = perkResolvable;
			return this.perkRepository.getPerkOrThrow(perk.id);
		}
	}

	/**
	 * Resolves a perk ID, perk name, or perk object to a perk ID.
	 * @param perkResolvable - The perk to be resolved.
	 * @returns The resolved perk ID.
	 */
	resolveID(perkResolvable: PerkResolvable): number {
		if (isNumber(perkResolvable)) {
			return perkResolvable;
		}
		else if (isString(perkResolvable)) {
			const perk = this.resolvePerk(perkResolvable);
			return perk.id;
		}
		else {
			return perkResolvable.id;
		}
	}

	/**
	 * Checks if a player has a given perk.
	 * @param perk - The perk to be checked for.
	 * @param player - The player to be checked.
	 * @returns A boolean indicating if the player has the given perk.
	 */
	doesPlayerHave(
		perk: PerkResolvable,
		player: PlayerResolvable,
	): boolean {
		const perkID = this.resolveID(perk);
		const playerID = this.playerService.resolveID(player);

		const playerPerkIDs = this.perkRepository.getPerkIDsOfPlayerID(playerID);
		return playerPerkIDs.includes(perkID);
	}

	/**
	 * Executes a given function if the given player has the given perk.
	 * @param perk - The perk to be checked for.
	 * @param player - The player to be checked.
	 * @param onPlayerHasPerk - The function to be executed if the player has the given perk.
	 * @returns A boolean indicating if the player has the given perk.
	 */
	doIfPlayerHas(
		perk: PerkResolvable,
		player: PlayerResolvable,
		onPlayerHasPerk: (perk: Perk, player: Player) => any,
	): boolean {
		const playerHasPerk = this.doesPlayerHave(perk, player);

		if (playerHasPerk) {
			perk = this.resolvePerk(perk);
			player = this.playerService.resolvePlayer(player);
			onPlayerHasPerk(perk, player);
		}

		return playerHasPerk;
	}

	/**
	 * Adds a perk to a player in the database.
	 * @param perk - The perk to be added to the player.
	 * @param player - The player to have the perk added.
	 */
	giveToPlayer(
		perk: PerkResolvable,
		player: PlayerResolvable,
	): void {
		const perkID = this.resolveID(perk);
		const playerID = this.playerService.resolveID(player);
		this.perkRepository.addPerkIDToPlayer(perkID, playerID);
	}
}