# 📂 `bot-config/`

Contains configuration files related to Brobot.

* **`bot-status.js`** Stores Brobot's current status that determines its overall behavior:
  * `isOn`: Whether Brobot is currently active
  * `isSleep`: If true, only admins can use Brobot (non-admins are restricted)
* **`discord-ids.js`** Stores relevant Discord server, role, channel, category, and user IDs used throughout the code (e.g., admin IDs, allowed role IDs)
* **`token.js`** *(hidden)* Stores sensitive data like bot tokens and API keys
