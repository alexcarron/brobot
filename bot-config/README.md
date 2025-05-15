# 📂 `bot-config/`

Contains configuration files related to Brobot.

* **`config.json`** Stores customizable settings that control Brobot’s behavior:
  * `prefix`: The command prefix used for bot commands (e.g., `<`, `?`)
  * `isOn`: Whether Brobot is currently active
  * `isSleep`: If true, only admins can use Brobot (non-admins are restricted)
  * `blocked_users`: List of user IDs blocked from using Brobot
* **`discord-ids.js`** Stores relevant Discord server, role, channel, category, and user IDs used throughout the code (e.g., admin IDs, allowed role IDs)
