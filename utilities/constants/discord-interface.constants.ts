import { APIMessageComponentEmoji} from "discord.js";

export type DiscordSelectMenuOption = {
    /**
     * The user-facing name of the option (max 100 chars)
     */
    label: string;

    /**
     * The dev-defined value of the option (max 100 chars)
     */
    value: string;

    /**
     * An additional description of the option (max 100 chars)
     */
    description?: string;

    /**
     * The emoji to display to the left of the option
     */
    emoji?: APIMessageComponentEmoji;

    /**
     * Whether this option should be already-selected by default
     */
    default?: boolean;
}