/* eslint-disable no-var */
import { Client, Collection, Snowflake } from "discord.js";
import Event from "../../services/discord-events/event";
import { LLPointManager } from "../../services/ll-points/ll-point-manager";
import TextToSpeechHandler from "../../services/text-to-speech/text-to-speech-handler";
import Timer from "../../services/timers/timer";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { GameManager } from "../../services/rapid-discord-mafia/game-manager";
import RapidDiscordMafia from "../../services/rapid-discord-mafia/rapid-discord-mafia";
import { NamesmithDependencies } from "../../services/namesmith/types/namesmith.types";

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

	var namesmith: Partial<NamesmithDependencies>
}

export {}