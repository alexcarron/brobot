# 📂 `commands/`

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
