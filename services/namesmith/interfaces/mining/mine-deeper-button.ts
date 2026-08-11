import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { mineOneLayer } from "../../workflows/mine-tokens.workflow";
import { toMineDeeperMessageText } from "./deeper-mine-message";
import { getCollapseTipLine, getDeeperMineTipLine } from "./mining-tip-lines";
import { NOT_A_PLAYER_MINING_MESSAGE, NOT_SESSION_OWNER_MESSAGE, toCollapseMessageText } from "./mining-message-lines";
import { doesUserOwnMiningSessionOfButton, getMiningSessionMessageContentsWithButtons, sendMiningSessionFollowUpMessage } from "./mining-session-buttons";
import { MiningSessionState } from "./mining-session-state";

const MINE_DEEPER_LABEL = `Mine Deeper`;

/**
 * Returns the button definition that mines the player a layer deeper.
 * @param userID - The ID of the player who started the mining session.
 * @param state - The current mining session state.
 * @param styleOverride - Optional override for the button's style.
 * @returns The button definition.
 */
export function getMineDeeperButton(userID: string, state: MiningSessionState, styleOverride?: ButtonStyle): DiscordButtonDefinition {
	return {
		id: `mine-deeper-${userID}`,
		label: MINE_DEEPER_LABEL,
		style: styleOverride ?? ButtonStyle.Primary,
		onButtonPressed: (buttonInteraction) => onMineDeeperButtonPressed(buttonInteraction, userID, state),
	};
}

async function onMineDeeperButtonPressed(
	buttonInteraction: ButtonInteraction, userID: string, state: MiningSessionState
): Promise<void> {
	if (!doesUserOwnMiningSessionOfButton(userID, buttonInteraction))  {
		await replyToInteraction(buttonInteraction, NOT_SESSION_OWNER_MESSAGE);
		return 
	}

	const mineResult = mineOneLayer({
		player: userID,
		currentLayerNumber: state.currentLayer + 1,
		tokensMinedThisSession: state.tokensMinedThisSession,
	});

	if (mineResult.isNotAPlayer()) {
		await sendMiningSessionFollowUpMessage(buttonInteraction, {
			content: NOT_A_PLAYER_MINING_MESSAGE,
			components: [],
		});
		return;
	}

	state.currentLayer += 1;

	if (mineResult.didCollapse) {
		const collapseText = toCollapseMessageText(mineResult.tokensLostFromCollapse!, mineResult.tokensKeptAfterCollapse!);
		const tipLine = getCollapseTipLine(userID, { isAutoMining: false });
		state.tokensMinedThisSession = 0;
		state.charactersFoundThisSession = '';

		await sendMiningSessionFollowUpMessage(buttonInteraction, {
			content: joinLines(collapseText, tipLine),
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

	await sendMiningSessionFollowUpMessage(
		buttonInteraction,
		getMiningSessionMessageContentsWithButtons(userID, state, messageText)
	);
}
