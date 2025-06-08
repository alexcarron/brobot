# 📂 `bot-config/`

Contains configuration files related to setting up and using Brobot.

* **`bot-status.js`** Stores Brobot's current status that determines its overall behavior:
  * `isOn`: Whether Brobot is currently active
  * `isSleep`: If true, only admins can use Brobot (non-admins are restricted)
* **`discord-ids.js`** Stores relevant Discord server, role, channel, category, and user IDs used throughout the code (e.g.,
 admin IDs, allowed role IDs)
* **`on-ready.js`** Handles setting up services and global variables when the client is ready to start running
* **`setup-client.js`** Sets up the Discord client in the global scope with necessary intents and partials
* **`setup-commands.js`** Handles storing all commands from the `/commands` directory in memory and registering them through Discord's API.
* **`token.js`** *(hidden)* Stores sensitive data like bot tokens and API keys