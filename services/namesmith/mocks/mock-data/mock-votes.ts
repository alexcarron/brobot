import { DatabaseQuerier } from "../../database/database-querier";
import { Vote, VoteDefinition } from "../../types/vote.types";
import { addMockPlayer } from "./mock-players";
import { VoteRepository } from "../../repositories/vote.repository";
import { getRandomNumericUUID } from "../../../../utilities/random-utils";
import { PlayerService } from "../../services/player.service";
import { PlayerResolvable } from "../../types/player.types";

/**
 * Adds a vote to the database with the given properties.
 * @param db - The in-memory database.
 * @param voteDefintion - The vote data to add.
 * @param voteDefintion.voter - The user or player who voted.
 * @param voteDefintion.playerVotedFor - The player voted for.
 * @returns The vote object that was added.
 */
export const addMockVote = (
	db: DatabaseQuerier,
	voteDefintion: Partial<VoteDefinition> = {}
): Vote => {
	const playerService = PlayerService.fromDB(db);
	const voteRepository = VoteRepository.fromDB(db);

	let {
		votedFirstPlayer = null,
		votedSecondPlayer = null,
		votedThirdPlayer = null,
	} = voteDefintion;

	const {
		voter = getRandomNumericUUID(),
	} = voteDefintion;

	const ensurePlayerExists = (player: PlayerResolvable | null) => {
		if (player !== null) {
			const playerID = playerService.resolveID(player);
			if (!playerService.isPlayer(playerID)) {
				return addMockPlayer(db, { id: playerID });
			}
		}
		return player;
	};

	votedFirstPlayer = ensurePlayerExists(votedFirstPlayer);
	votedSecondPlayer = ensurePlayerExists(votedSecondPlayer);
	votedThirdPlayer = ensurePlayerExists(votedThirdPlayer);

	return voteRepository.addVote({
		voter,
		votedFirstPlayer,
		votedSecondPlayer,
		votedThirdPlayer,
	});
};