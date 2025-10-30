import { isNumber, isString } from "../../../utilities/types/type-guards";
import { PerkRepository } from "../repositories/perk.repository";
import { RoleRepository } from "../repositories/role.repository";
import { Perk, PerkResolvable } from "../types/perk.types";
import { Player, PlayerResolvable } from "../types/player.types";
import { NotEnoughPerksError, PerkNotFoundError } from "../utilities/error.utility";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with perks.
 */
export class PerkService {
	constructor (
		public perkRepository: PerkRepository,
		public roleRepoistory: RoleRepository,
		public playerService: PlayerService,
	) {}

	/**
	 * Resolves a perk ID, perk name, or perk object to a fetched Perk object.
	 * @param perkResolvable - The perk to be resolved.
	 * @throws PerkNotFoundError - If the provided perkResolvable is a string that does not correspond to a perk in the database.
	 * @returns The resolved perk object.
	 */
	resolvePerk(perkResolvable: PerkResolvable): Perk {
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
	 * Checks if a perk with the given ID exists in the database.
	 * @param perkResolvable - The perk to be checked for.
	 * @returns A boolean indicating if the perk exists in the database.
	 */
	isPerk(perkResolvable: PerkResolvable): boolean {
		try {
			const perkID = this.resolveID(perkResolvable);
			return this.perkRepository.getPerkByID(perkID) !== null;
		}
		catch {
			return false;
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

		const roleID = this.roleRepoistory.getRoleIDOfPlayerID(playerID);

		if (roleID !== null) {
			const rolePerkIDs = this.perkRepository.getPerkIDsOfRoleID(roleID);

			playerPerkIDs.push(...rolePerkIDs);
		}

		return playerPerkIDs.includes(perkID);
	}

	/**
	 * Executes a given function if the given player has the given perk.
	 * @param perkResolvable - The perk to be checked for.
	 * @param playerResolvable - The player to be checked.
	 * @param onPlayerHasPerk - The function to be executed if the player has the given perk.
	 * @returns A boolean indicating if the player has the given perk.
	 */
	doIfPlayerHas(
		perkResolvable: PerkResolvable,
		playerResolvable: PlayerResolvable,
		onPlayerHasPerk: (perk: Perk, player: Player) => any,
	): boolean {
		const playerHasPerk = this.doesPlayerHave(perkResolvable, playerResolvable);

		if (playerHasPerk) {
			const perk = this.resolvePerk(perkResolvable);
			const resolvedPlayer = this.playerService.resolvePlayer(playerResolvable);
			onPlayerHasPerk(perk, resolvedPlayer);
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

	/**
	 * Removes a perk from a player if the player has the perk.
	 * @param perk - The perk to be removed from the player.
	 * @param player - The player to have the perk removed.
	 * @returns A boolean indicating if the player had the given perk.
	 */
	removeIfPlayerHas(
		perk: PerkResolvable,
		player: PlayerResolvable,
	): boolean {
		return this.doIfPlayerHas(perk, player, (perk, player) => {
			this.perkRepository.removePerkIDFromPlayer(perk.id, player.id);
		});
	}

	/**
	 * Retrieves three random perks that have not been offered yet.
	 * If there are no more perks to be offered, it will reset the wasOffered flag for all perks.
	 * @returns An array of three perk objects that have not been offered yet.
	 */
	offerThreeRandomNewPerks(): [Perk, Perk, Perk] {
		const threeRandomPerks: Perk[] = [];
		let availablePerks = this.perkRepository.getPerksNotYetOffered();
		this.perkRepository.unsetAllPerksAsCurrentlyOffered();

		for (let numPerk = 1; numPerk <= 3; numPerk++) {
			if (availablePerks.length === 0)
				throw new NotEnoughPerksError();

			const randomIndex = Math.floor(Math.random() * availablePerks.length);
			const offeredPerk = availablePerks[randomIndex];
			this.perkRepository.setWasOffered(offeredPerk.id, true);
			this.perkRepository.setPerkAsCurrentlyOffered(offeredPerk.id);
			threeRandomPerks.push({
				...offeredPerk,
				wasOffered: true,
			});

			availablePerks.splice(randomIndex, 1);

			if (availablePerks.length === 0) {
				this.perkRepository.setWasOfferedForAllPerks(false);
				availablePerks = this.perkRepository.getPerksNotYetOffered();
				availablePerks = availablePerks.filter(possiblePerk =>
					!threeRandomPerks.some(chosenPerk =>
						chosenPerk.id === possiblePerk.id
					),
				);
			}
		}

		return threeRandomPerks as [Perk, Perk, Perk];
	}

	/**
	 * Retrieves a list of perks that are currently offered.
	 * @returns An array of perk objects that are currently offered.
	 */
	getCurrentlyOfferedPerks(): Perk[] {
		return this.perkRepository.getCurrentlyOfferedPerks();
	}

	/**
	 * Resets the wasOffered flag for all perks to false.
	 * This is useful for when you want to start a new game or session.
	 */
	reset(): void {
		this.perkRepository.setWasOfferedForAllPerks(false);
	}
}