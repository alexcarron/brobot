# Welcome to Brobot

Brobot is a feature-rich Discord.js bot built to enhance the experience of the LL Game Shows! Discord server. It automates game show interactions, provides moderation tools, and offers a wide range of commands and utilities to help contestants participate smoothly in online game shows hosted on Discord.

## Table of Contents

* **[Terminology](#terminology)**
* **[Key Features](#key-features)**
* **[Setup Instructions](#setup-instructions)**
* **[Project File Structure](#project-file-structure)**
* **[License](#license)**

## Terminology

Here are some key terms used in this project:

### Discord API

The Discord API allows developers to interact programmatically with Discord's platform, enabling bots to perform actions such as sending messages, banning users, or modifying server settings.

### Bot Token

A unique, secret string of characters that authenticates your bot with the Discord API. The token is required to run the bot and authorize it to take actions on Discord.

### Discord.js

A powerful JavaScript library that simplifies interaction with the Discord API, providing a set of easy-to-use functions for bot development.

### Client

The `Client` is an object that represents the bot itself and manages the connection between the bot and Discord's servers, handling events and interactions.

### Intents

Discord Intents are flags that indicate which events a bot is interested in receiving from Discord. They help optimize performance by allowing the bot to only receive the events it needs. For example, if your bot only needs to respond to messages, you can enable the `GUILD_MESSAGES` intent while leaving others disabled.

### Slash Commands

Slash commands are a way to interact with Discord bots directly through chat. They are easy-to-use, intuitive commands that start with a forward slash (/) followed by the command name (e.g., /ping). After typing the slash, Discord will automatically suggest available commands from the bot, helping users navigate bot features without needing to remember specific command syntax.

### Rapid Discord Mafia

A fast-paced social deduction game played on Discord, where each player is assigned a role belonging to a faction (such as Town, Mafia, or Neutral). Each player's objective is to fulfill the goal specified on their role card, which usually involves eliminating all other factions.

### LL Points

LL Points are virtual points earned by participating in the LL Game Show! community. You can accumulate these points by achieving specific milestones or participating in events. LL Points can be redeemed for various perks and grant special access to exclusive features within the community.

### GitHub JSON Storage

Persistent storage for the bot is managed through a private GitHub repository called `brobot-databases`. This odd storage solution is used for both convenience and avoiding costs, as it allows the bot to maintain data between restarts without incurring additional expenses. The data is stored in JSON files, which are updated and accessed as needed.

## Key Features

### LL Game Shows Specific Features

* Start and schedule events with announcements
* Manage LL Points:
  * Give, claim, or reward LL Points
  * Add or remove viewers from the LL Points leaderboard
  * View the leaderboard or personal point balance
* Update a viewer's LL Tier based on their points
* Increase community engagement
  * Send a random discussion question on command
  * Post daily discussion topics in different channels

### Music Playback

* Play a specific song
* Pause, resume, skip, or stop music
* View the current song or full queue
* Loop or shuffle the queue

### Text-to-Speech in Voice Chat

* Send text-to-speech messages
* Transcribe messages from the VC chat
* Adjust TTS speed or volume

### Rapid Discord Mafia (Game System)

* Game Setup & Participation:
  * Join or leave the game
  * Rename yourself
  * Choose your role color
* Game Management:
  * Save, load, or reset the game
  * View roles or role information
  * Manually control game phases (sign-ups, day/night, voting)
* Gameplay Actions:
  * Write a death note or last will
  * Vote for another player
  * Whisper to another player
  * Smite an inactive player
  * Report bugs or issues
  * Run a command as another player (for testing/debugging)

### Fun and Games

* Ask Brobot a question (AI-powered responses)
* Make someone your valentine and gift them LL Points

### Utility

* Start a countdown timer
* Force Brobot to:
  * DM a user a custom message
  * React to a message with a chosen emoji
  * Send a custom message to a specific channel

### Admin Tools

* Purge messages in a channel
* Delete all channels in a category
* Mute all members in a voice call

## Setup Instructions

### 1. Install Prerequisites

* **[Download and install Git](https://git-scm.com/downloads)**

* **[Download and install Node.js](https://nodejs.org/en/download/)**

### 2. Clone and Configure the Repository

1. **Clone the repository**: `git clone https://github.com/alexcarron/brobot.git`
2. **Change into the repository directory**: `cd brobot`
3. **Create a new file to store your tokens**: `touch bot-config/token.js`

### 3. Configure Your Bot Tokens

In `bot-config/token.js`, add the following JSON object to the `module.exports`:

```javascript
module.exports = {
  "discord_token": "YOUR_DISCORD_TOKEN_HERE",
  "github_token": "YOUR_GITHUB_TOKEN_HERE"
};
```

**Token Requirements:**

* `discord_token`: Replace with the authentication token for your Discord bot.
* `github_token`: Replace with a GitHub personal access token that has read/write access to a created `brobot-database` repository.

### 4. Install Dependencies and Start the Bot

* Install dependencies: `npm install`
* Start the bot: `npm run start`


## Project File Structure

### `/` Root Directory

Contains the main entry point and all project-level configuration files.

* **`index.js`** The main entry point of Brobot
  * Imports all dependencies
  * Initializes the Discord client
  * Defines global variables
  * Loads all commands and event listeners
  * Initializes all services
  * Optionally registers commands (`--deploy`, `--deploy-all`)
* **`build.js`** Registers BroBot’s slash commands with Discord. Use only when adding, removing, or updating commands, as deployment time is unreliable.
* **`LICENSE`** Specifies the licensing terms
* **`package-lock.json`** Ensures consistent dependency versions across installs
* **`package.json`** Contains project metadata and dependencies
* **`README.md`** Provides documentation and a description of the project

### 📂 `bot-config/`

Contains configuration files related to Brobot.

* **`bot-status.js`** Stores Brobot's current status that determines its overall behavior:
  * `isOn`: Whether Brobot is currently active
  * `isSleep`: If true, only admins can use Brobot (non-admins are restricted)
* **`discord-ids.js`** Stores relevant Discord server, role, channel, category, and user IDs used throughout the code (e.g.,
 admin IDs, allowed role IDs)
* **`on-ready.js`** Handles setting up services and global variables when the client is ready to start running
* **`setup-client.js`** Sets up the Discord client in the global scope with necessary intents and partials
* **`setup-commands.js`** Handles storing all commands from the `/commands` directory in memory and registering them through Discord's API.
* **`token.js`** *(hidden)* Stores sensitive data like bot tokens and API keys

### 📂 `commands/`

Contains all command definition files.

* **`admin/`** Commands that can only be executed by moderators, admins, or Brobot's owner
  * **`discord-interactions/`** Commands for performing specific Discord actions (e.g., send a message, join VC)
  * **`discord-moderation/`** Commands for moderation or admin-only Discord actions (e.g., deleting channels, muting members)
  * **`bot-config/`** Bot-owner-only commands for configuring Brobot
* **`voice-channel/`** Commands for voice channels features
  * **`text-to-speech/`** Commands for using text-to-speech in a voice channel
  * **`music-player/`** Commands for controlling music playback in the voice channel
* **`server-interaction/`** Commands for creating events and interactions on the server
  * **`discussion-prompts/`** Commands for sending and adding discussion prompts
  * **`events/`** Commands for creating and running game show events
* **`rapid-discord-mafia/`** Commands for playing and managing the Rapid Discord Mafia game
* **`ll-points/`** Commands for using and managing all LL Point Leaderboard functionality
* **`fun/`** Fun, non-utility commands to entertain users

### 📂 `event-listeners/`

Contains logic for responding to various Discord events (e.g., message activity, commands, user interactions).

* **`event-listener-setup.js`** Contains functions for initializing all event listeners
* **`on-button-pressed.js`** Handles button click interactions
* **`on-dm-received.js`** Handles incoming direct messages
* **`on-normal-message-sent.js`** Handles regular messages sent in server channels
* **`on-slash-command-autocomplete.js`** Handles autocomplete interactions for slash command options
* **`on-slash-command-executed.js`** Handles execution of slash (/) commands
* **`on-user-joins-server.js`** Handles new user joining the server

### 📂 `services/`

Contains core services, modules, and models for Brobot's features.

* **`command-creation/`** Utilities and models for creating, registering, and managing bot commands to simplify the command setup process
* **`discord-events/`** Manages scheduling and handling of Discord events, including reminders and announcements
* **`discussion-prompts/`** Handles recurring messages with random discussion prompts
* **`ll-points/`** Manages LL Point Leaderboard logic
* **`rapid-discord-mafia/`** Manages game logic for Rapid Discord Mafia, including players, roles, actions, and phases
* **`text-to-speech/`** Manages text-to-speech functionality in voice channels
* **`timer/`** Manages storing, tracking, and recalling persistent timers

### 📂 `utilities/`

Contains helper functions and reusable utilities for general functionality across Brobot.

* **`data-structure-utils.js`** Functions for working with JavaScript objects and arrays
* **`date-time-utils.js`** Functions for time and date formatting, parsing, and calculations
* **`discord-fetch-utils.js`** Functions for fetching Discord.js objects
* **`discord-action-utils.js`** Functions for performing actions in Discord
* **`github-json-storage-utils.js`** Functions for managing persistant JSON data storage on GitHub
* **`logging-utils.js`** Functions for custom logging and error reporting
* **`realtime-utils.js`** Functions for handling real-time timing operations (e.g. waiting, scheduling)
* **`text-formatting-utils.js`** Functions for manipulating and formatting text

## License

This code is provided for **educational and reference purposes only**.

You **are not permitted** to use the code to host or run your own Discord bot. You may **download** and **view** the code for learning purposes but **cannot** redistribute, modify, or use it to deploy your own bot without permission.

If you have any questions or would like permission for a specific use, please contact me first.