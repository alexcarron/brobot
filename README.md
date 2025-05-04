

# Welcome to Brobot

Brobot is a feature-rich Discord.js bot built to enhance the experience of the LL Game Shows! Discord server. It automates game show interactions, provides moderation tools, and offers a wide range of commands and utilities to help contestants participate smoothly in online game shows hosted on Discord.


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



## License

This code is provided for **educational and reference purposes only**.

You **are not permitted** to use the code to host or run your own Discord bot. You may **download** and **view** the code for learning purposes but **cannot** redistribute, modify, or use it to deploy your own bot without permission.

If you have any questions or would like permission for a specific use, please contact me.

## 📁 Project Directory Structure
### `/` Root Directory
Contains the main entry point and all project-level configuration files.
* **`index.js`** The main entry point of Brobot
  * Imports all dependencies
  * Initializes the Discord client
  * Defines global variables
  * Loads all commands and event listeners
  * Initializes all services

* **`LICENSE`** Specifies the licensing terms
* **`package-lock.json`** Ensures consistent dependency versions across installs
* **`package.json`** Contains project metadata and dependencies
* **`README.md`** Provides documentation and a description of the project
* **`token.json`** *(hidden)* Stores sensitive data like bot tokens and API keys


### 📂 `bot-config/`
Contains configuration files related to Brobot.
* **`config.json`** Stores customizable settings that control Brobot’s behavior:
  * `prefix`: The command prefix used for bot commands (e.g., `<`, `?`)
  * `isOn`: Whether Brobot is currently active
  * `isSleep`: If true, only admins can use Brobot (non-admins are restricted)
  * `blocked_users`: List of user IDs blocked from using Brobot
* **`discord-ids.js`** Stores relevant Discord server, role, channel, category, and user IDs used throughout the code (e.g., admin IDs, allowed role IDs)

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

### `data`: Contains all files used for referencing static data
### `modules`: Contains all module files and services (e.g., music, moderation, command management, events, LL Points)
