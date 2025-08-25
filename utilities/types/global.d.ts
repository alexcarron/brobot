/* eslint-disable no-var */
import { Client, Collection, Snowflake } from "discord.js";
import Event from "../../services/discord-events/event";
import { LLPointManager } from "../../services/ll-points/ll-point-manager";
import TextToSpeechHandler from "../../services/text-to-speech/text-to-speech-handler";
import Timer from "../../services/timers/timer";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { GameManager } from "../../services/rapid-discord-mafia/game-manager";
import RapidDiscordMafia from "../../services/rapid-discord-mafia/rapid-discord-mafia";
import { MysteryBoxRepository } from "../../services/namesmith/repositories/mystery-box.repository";
import { PlayerRepository } from "../../services/namesmith/repositories/player.repository";
import { GameStateRepository } from "../../services/namesmith/repositories/game-state.repository";
import { VoteRepository } from "../../services/namesmith/repositories/vote.repository";
import { RecipeRepository } from "../../services/namesmith/repositories/recipe.repository";
import { MysteryBoxService } from "../../services/namesmith/services/mystery-box.service";
import { PlayerService } from "../../services/namesmith/services/player.service";
import { VoteService } from "../../services/namesmith/services/vote.service";
import { RecipeService } from "../../services/namesmith/services/recipe.service";
import { GameStateService } from '../../services/namesmith/services/game-state.service';

declare global {
  var botStatus: {
		isOn: boolean,
		isSleep: boolean,
		isInDevelopmentMode: boolean
		testUsersAndDevelopers: string[],
	};

	var client: Client;
	var cooldowns: Collection<Snowflake, Collection<string, number>>;
	var commands: Collection<string, SlashCommand>;

	var timers: Timer[];
	var tts: TextToSpeechHandler;
	var LLPointManager: LLPointManager;
	var events: Event[];
	var questions: string[];
	var channelsToMessages: Record<string, string[]>;

	var game_manager: GameManager;
	var rapid_discord_mafia: RapidDiscordMafia;

	var namesmith: Partial<{
		mysteryBoxRepository: MysteryBoxRepository,
		characterRepository: CharacterRepository,
		playerRepository: PlayerRepository,
		gameStateRepository: GameStateRepository,
		voteRepository: VoteRepository,
		recipeRepository: RecipeRepository,
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService,
		voteService: VoteService,
		recipeService: RecipeService,
		gameStateService: GameStateService,
	}>
}

export {}