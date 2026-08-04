# Discord.js v14 Interaction Elements Reference

## Entry Points (How a user actually starts an interaction)

**Slash Command**: A user types a forward slash followed by a command name.

**User Context Menu**: A user right clicks on another user and picks a command from the menu that appears. The command then runs with that target user as the input.

**Message Context Menu**: A user right clicks on a message and picks a command from the menu that appears. The command runs with that message as the target.

## Slash Commands

A slash command is what a user types after the forward slash. As they type, Discord shows a live list of matching commands, and once they pick one, Discord shows them the options for that command right there in the input box, so they can fill things in before ever sending anything.

**Name**: Lowercase, 1-32 characters, dashes or underscores only, no spaces.

**Description**: A short line shown under the name while the user is browsing the command list.

**Options**: Work like arguments to the command. Each option becomes its own separate input for the user to fill in, and Discord shows a different kind of input control depending on what type of option it is.

**Subcommands**: Lets a command branch into different modes (e.g. `/info user`, `/info server`). The user picks one of those first before seeing the more specific options that go with it.

**Subcommand Groups**: An extra level of nesting on top of subcommands (e.g. `/economy shop buy`, `/economy shop sell`)

Here are the option types you can give a command, and what the user actually sees for each one:

- **String**: A plain text box to type into, unless choices or autocomplete are set, in which case it turns into a dropdown instead. Can have a minimum and maximum length.
- **Integer**: Whole numbers only, with an optional minimum and maximum value.
- **Number**: Any number.
- **Boolean**: A simple true or false toggle.
- **User**: A search and pick field for a member of the server.
- **Role**: A search and pick field for a role in the server.
- **Channel**: A search and pick field for a channel, which can be restricted to only certain channel types.
- **Mentionable**: A combined picker that lets someone choose either a user or a role from the same field.
- **Attachment**: Prompts the user to upload a file along with their command.

**Choices**: A fixed list of up to twenty five options on a string, integer, or number option. Once set, the user can only pick from that list and can no longer type in anything freely. Each choice has a name that gets shown to the user and a separate value that your bot actually receives, so the label someone sees does not have to match the underlying value.

**Autocomplete**: Dynamic suggestions your bot generates live as the user types, useful when you have more options than the twenty five choice limit allows, or when the list of valid options changes over time. You can use choices or autocomplete on an option, but not both at once, and either way the user still ends up picking a single value in the end.

**Required options**: Must be listed before optional ones. Discord will not let the user submit the command until every required option has something filled in, while optional ones can just be left blank.

You also have some control over who can even see a command in the first place:

- **Default Member Permissions**: Hide the command from members who lack a certain permission, though server admins can still see it.
- **Contexts**: Restrict where the command can be used, such as only inside a server, only in direct messages, or only in group direct messages.
- **Integration Types**: Decide whether the command is installed at the server level or at the individual user level. A user installed command actually follows that person around and works in any server or DM they are in, not just the servers where the bot itself has been added.
- **NSFW Flag**: Limits the command to age restricted channels.
- **Localization**: Translated names and descriptions for different locales, so Discord automatically shows the right version based on each user's own language setting.

## Context Menu Commands

A context menu command shows up when a user right clicks on either a user or a message, depending on which type you set it up as. Unlike a slash command, it does not have any options at all, because the user or message being clicked on is the input itself. These work well for quick one click actions, like reporting a message or pulling up someone's profile, where there is nothing else you really need to ask the user.

## Buttons

A button is something a user clicks on directly within an existing message.

**Style**: Primary, secondary, success, or danger, each shown as a different color, or link style, which just opens a URL in the browser without sending anything back to your bot.

**Label and Emoji**: Either or both, to show what the button does.

**Disabled State**: The button still shows up but cannot be clicked.

You can fit up to five buttons in a single row, and up to five rows in a message, so twenty five buttons total if you really wanted that many. Buttons work well for things like confirming or canceling an action, toggling a setting, or moving between pages in something like a paginated list.

## Select Menus

A select menu is a dropdown that a user clicks to open, then picks one or more options from inside it.

- **String Select**: You define the list of up to twenty five options yourself, each with its own label, optional description, and optional emoji.
- **User Select**: A live searchable list of members in the server.
- **Role Select**: A live searchable list of roles.
- **Channel Select**: A searchable list of channels, which can be limited to only certain channel types.
- **Mentionable Select**: Combines users and roles into one searchable list.

Select menus can allow picking more than one option at a time if you set a minimum and maximum number of values. One thing to keep in mind is that a select menu takes up an entire action row on its own, so you cannot put buttons in the same row as a select menu. Select menus tend to work better than buttons when there are more options than would comfortably fit as separate buttons, when you want the user to pick multiple things at once, or when you want them choosing an actual member, role, or channel without having to type anything themselves.

## Modals

A modal is a popup form that collects text from the user across one or more fields. This is really the only way to get freeform, multi field text input from someone, since slash command options and buttons cannot do that on their own.

A modal can have up to five text input fields, and each one can be either:

- **Short**: A single line input for something brief.
- **Paragraph**: A longer multi line input for something like feedback or a description.

Each field can be marked required or optional, can have a minimum and maximum length, and can be pre filled with a default value if you want to give the user something to start from.

The one restriction to remember is that a modal can only be opened in direct response to a command, a button, or a select menu interaction. You cannot open a modal out of nowhere, and you cannot open a modal from within another modal. Modals are the right choice whenever you need a longer or more structured piece of text from someone that would not make sense as a single slash command option.

## How the Bot Responds to Interactions

- **Normal Reply**: A direct response to whatever interaction the user triggered.
- **Ephemeral Reply**: Only the person who triggered the interaction can see it. Useful for error messages, personal results, or confirmations you do not want cluttering up the channel for everyone else.
- **Deferred Response**: Acknowledges the interaction right away and lets you send the real content a bit later. Needed because Discord will otherwise time out an interaction that takes longer than a few seconds to respond to.
- **Update**: Edits the original message in place instead of sending a brand new one. This is what you would use for something like a multi step wizard or a paginated embed, where clicking a button should just change what is already on screen.
- **Follow Up Message**: Sent after your initial response, and can be public or ephemeral. Handy for multi step flows where you need to keep talking to the user after the first reply.

## Displaying Information

### Embeds

An embed can have a title, a description, a set of fields shown side by side or stacked, an image, a thumbnail, a color running down the side, a footer, and a timestamp. They work well for showing structured information like a profile, a set of stats, or a summary.

### Components V2

A newer set of layout components which gives you more flexibility than an embed does:

- **Text Display**: A block of static markdown text, up to four thousand characters.
- **Section**: Groups together one to three text display blocks alongside a single accessory, either a small thumbnail image or a button.
- **Thumbnail**: The small image used inside a section.
- **Media Gallery**: A grid of up to ten images or videos, where each item can have its own alt text or be marked as a spoiler.
- **File**: Displays an attachment directly as part of the layout.
- **Separator**: A visual divider you can place between other components, with some control over its spacing.
- **Container**: Wraps a group of these components together inside a bordered box with an optional accent color running down the side. It ends up looking a bit like an embed but with far more flexibility in what goes inside it.

### Action Rows

The containers that hold your interactive components underneath a message. A message can have up to five action rows, and each row can hold either up to five buttons or a single select menu, but never both together.

### Attachments

Sent directly, covering things like images, log files, or exported data such as JSON, CSV, or PDF files.

### Polls

Native to Discord, and handle vote tallying and display for you automatically. You can choose whether to allow people to vote for more than one option.

## Other Bot Interactions

- **Reactions**: Emojis you can add to a message. They work well for something simple like a quick vote, or anywhere you just need a lightweight, read only kind of interaction.
- **Threads**: Spin off a separate conversation attached to a message, either visible to everyone or private. Useful for things like support tickets or keeping a specific discussion contained instead of cluttering the main channel.
- **Direct Messages**: Lets your bot talk to a user one on one, privately. Good for multi step conversations, anything involving personal or sensitive information, or general notifications you do not want posted publicly.
- **Webhooks**: Posts a message under a custom name and avatar separate from your bot's own identity. Commonly used for announcements, logging, or connecting other services into a channel.
- **Voice Channels and Embedded Activities**: Their own separate systems entirely, built for voice based or embedded app experiences. They do not really fit into the normal message and interaction flow that everything else here follows.

## Limitations

- An action row can only hold five buttons or a single select menu, never a mix of the two.
- A select menu itself can only have up to twenty five options.
- A modal can only have up to five text input fields, and can only be opened as a direct response to a command, button, or select menu interaction, never on its own.
- Ephemeral messages cannot have components that persist for other users to interact with later, since only the original user can even see them.
- Embeds and components v2 cannot be combined on the same message.
- A media gallery tops out at ten items, and a section can only hold up to three text displays plus its one accessory.