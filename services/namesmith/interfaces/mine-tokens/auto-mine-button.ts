import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { wait } from "../../../../utilities/realtime-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { AUTO_MINE_INTERVAL_SECONDS } from "../../constants/mine-tokens.constants";
import { mineOneLayer } from "../../workflows/mine-tokens.workflow";
import { toAutoMineStoppedMessageText } from "./auto-mine-message";
import { toMineDeeperMessageText } from "./deeper-mine-message";
import { getAutoMineStoppedTipLine, getCollapseTipLine, getDeeperMineTipLine } from "./mining-tip-lines";
import { doesUserOwnMiningSessionOfButton, getMiningSessionMessageContentsWithButtons, sendMiningSessionFollowUpMessage } from "./mining-session-buttons";
import { MiningSessionState } from "./mining-session-state";
import { AutoMineState, getStopButton } from "./stop-auto-mine-button";
import { NOT_SESSION_OWNER_FEEDBACK, toCollapseMessageText } from "./mining-message-lines";
import { AUTO_MINE_BUTTON_LABEL } from "./mining-button-labels";

/**
 * Returns the button definition that starts auto-mining on the player's behalf.
 * @param userID - The ID of the player who started the mining session.
 * @param state - The current mining session state.
 * @returns The button definition.
 */
export function getAutoMineButton(userID: string, state: MiningSessionState): DiscordButtonDefinition {
	return {
		id: `mine-auto-${userID}`,
		label: AUTO_MINE_BUTTON_LABEL,
		style: ButtonStyle.Secondary,
		onButtonPressed: (buttonInteraction) => onAutoMineButtonPressed(buttonInteraction, userID, state),
	};
}

async function onAutoMineButtonPressed(
	buttonInteraction: ButtonInteraction, userID: string, state: MiningSessionState
): Promise<void> {
	if (!doesUserOwnMiningSessionOfButton(userID, buttonInteraction)) {
		await replyToInteraction(buttonInteraction, NOT_SESSION_OWNER_FEEDBACK);
		return 
	}

	const autoMineState: AutoMineState = { isStopped: false, resolveWaitIntervalEarly: () => {} };

	await buttonInteraction.deferUpdate();

	await autoMineAndSendMineMessages(buttonInteraction, userID, state, autoMineState);
}

async function autoMineAndSendMineMessages(
	buttonInteraction: ButtonInteraction, userID: string, state: MiningSessionState, autoMineState: AutoMineState
): Promise<void> {
	while (!autoMineState.isStopped) {
		const mineResult = mineOneLayer({
			player: userID,
			miningSessionID: state.sessionID,
			currentLayerNumber: state.currentLayer + 1,
			tokensMinedThisSession: state.tokensMinedThisSession,
		});

		if (mineResult.isNotAPlayer()) return;

		state.currentLayer += 1;

		if (mineResult.didCollapse) {
			state.tokensMinedThisSession = 0;
			state.charactersFoundThisSession = '';

			const tipLine = getCollapseTipLine(userID, { isAutoMining: true });
			await sendMiningSessionFollowUpMessage(buttonInteraction, {
				content: joinLines(
					toCollapseMessageText(mineResult.tokensLostFromCollapse!, mineResult.tokensKeptAfterCollapse!),
					tipLine,
				),
				components: [],
			});
			return;
		}

		state.tokensMinedThisSession += mineResult.tokensGained;
		state.collapseChanceNextLayer = mineResult.collapseChanceNextLayer;
		if (mineResult.characterDiscovered !== null) {
			state.charactersFoundThisSession += mineResult.characterDiscovered;
		}

		const tipLine = getDeeperMineTipLine(userID, { characterDiscovered: mineResult.characterDiscovered });
		const messageText = joinLines(
			toMineDeeperMessageText({
				state,
				tokensGained: mineResult.tokensGained,
				characterDiscovered: mineResult.characterDiscovered,
				hasMineBonusPerk: mineResult.hasMineBonusPerk,
			}),
			tipLine,
		);

		const autoMiningButtons = new DiscordButtons({
			promptText: messageText,
			buttons: [getStopButton(userID, autoMineState)],
		});

		await sendMiningSessionFollowUpMessage(buttonInteraction, autoMiningButtons.getMessageContents());

		if (autoMineState.isStopped) break;

		await new Promise<void>((resolve) => {
			// Stores the Promise's resolve in the state so the stop button can call it once it is pressed
			autoMineState.resolveWaitIntervalEarly = resolve;

			void wait({ seconds: AUTO_MINE_INTERVAL_SECONDS }).then(resolve);
		});
	}

	const stoppedTipLine = getAutoMineStoppedTipLine(userID);
	await sendMiningSessionFollowUpMessage(
		buttonInteraction,
		getMiningSessionMessageContentsWithButtons(
			userID,
			state,
			joinLines(toAutoMineStoppedMessageText(state), stoppedTipLine)
		)
	);
}
