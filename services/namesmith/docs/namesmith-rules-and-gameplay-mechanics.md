# Namesmith Rules and Gameplay Mechanics

Don't want to read the rules? Instantly get started by running `/mine-tokens` in #mine-tokens.

## Objective
In Namesmith, your goal is to create the most liked, clever, or creative name possible using the limited set of characters you receive from mystery boxes, crafting, trades, roles, perks, and quests. Your name will be judged by all other players at the end of the month, and the player whose name receives the most votes wins 100 LL Points! Each game also has a theme that is announced when the game starts which you should try to have your name relate to.

# Things You Have
1. **Inventory**: All of the different characters (letters, numbers, symbols, etc.) that you currently own. This can hold an infinite number of characters. (Use `/see-inventory` to see your own or a given player's current inventory)
2. **Name**: Your currently displayed name that can published to be "locked in". It must be 32 characters or less. You can pick and choose which characters from your inventory you want in your name. (Use `/see-current-name` to see your own or a given player's current name)
3. **Published Names**: Up to four names you've locked in that will each be displayed as a separate, anonymous entry when it's time to vote for the best name. Once a name fills a slot, it's permanent and can't be edited or unpublished.
4. **Tokens**: The currency you can use to buy mystery boxes to earn characters from. (Use `/see-tokens` to see the amount of tokens you or a given player has)
5. **Perks**: Permanent effects that stay with you for the entire game to give you strategic benefits. Twice a week, you can pick a perk out of three shown to keep. (Use `/see-perks` to see your own or a given player's perks)
6. **A Role**: A permanent label and set of perks you choose at the start of the game and keep for the entire game. (Use `/see-role` to see your own or a given player's role)

# Earning Tokens
1. **Mining Tokens**: You can run `/mine-tokens` in #mine-tokens to start a mining session anytime. Your first mine is always safe and gives you 1-2 tokens on average. After that, you choose to mine one layer deeper for a chance at more tokens and a small chance of mining a random character. The deeper you go, the better the rewards, but also the higher the chance the mine collapses and you lose most of what you mined that session. After the first mine, you can resurface at anytime to keep all the tokens you mined so far safe. You can also let Brobot auto-mine for you, mining one layer deeper every few seconds until you stop it or the mine collapses.
2. **Claiming Refills**: You can run `/claim-refill` in #claim-refill every 2 hours to earn a decent amount of tokens periodically. It typically awards 50-100 tokens, but can vary wildly. You can also turn on refill reminders to get a direct message when your next refill is ready, using the toggle button on your refill reply or the `/toggle-refill-reminders` command.
3. **Complete Quests**: You can complete quests listed in #daily-quests and #weekly-quests to receive rewards, which can include tokens, characters, mystery boxes, or perks. Once you complete all daily quests, you will unlock hidden quests in #hidden-quests which give you larger rewards

# Getting Characters
1. **Buying Mystery Box**: You can run `/buy-mystery-box` in #buy-mystery-boxes to purchase a mystery box of your choice using tokens. Buying a box immediately opens it and gives you a random character from its contents. There are different box types available like Letters, Vowels, Numbers, etc, and you can open as many mystery boxes as you want at once.
2. **Trading Characters**: You can run `/trade` in #trade-characters to initiate a trade with another player, allowing you to exchange characters. If the recipient accepts your trade, you will exchange the characters listed in the trade request. They may also modify the trade to change which characters are exchanged or decline it.
3. **Crafting Characters**: You can run `/craft-characters` in #craft-characters to use a given recipe to convert characters you own into new characters. Crafting recipes often use Utility Characters which represent actions like Rotate, Flip, Shift, etc. to achieve the desired character(s). You can recieve these from the Recipe Utilities mystery box.

# Creating Your Name
1. **Rearrange Your Name**: You can run `/rearrange-name` anywhere to change your current name. You may use any characters you have in your inventory.
2. **Publish Your Name**: You can run `/publish-name` anywhere to publish your current name into your next available published name slot, locking it in as one of the names shown during voting. Once published, a name is permanent and can't be edited or unpublished. You can hold up to 4 published names at once. Your 1st is free, but your 2nd, 3rd, and 4th cost 250, 500, and 1000 tokens respectively. Publishing removes the published name's characters from your inventory, so your current name becomes empty afterward and you'll need to earn or craft new characters to build your next one.

# Roles and Perks
1. **Picking a Perk**: Twice a week, new perks will be displayed in #pick-a-perk that you can choose from. During that time, you can press one of the buttons to pick the perk of the ones shown you want to gain permanently. You cannot switch perks or choose more than one.
2. **Choosing a Role**: At the start of the game, roles you can choose from will be displayed in #choose-a-role. Each role will offer a fixed set of perks that you will have for the entire game. You can press one of the buttons to choose one of the roles to have permanently. You cannot switch roles or choose more than one.

# Quests
1. **Daily Quests**: Every day, 2-3 new quests are randomly chosen and shown in #daily-quests. These are short, fun challenges you can complete every day for quick rewards
2. **Hidden Quests**: Every day, 1-2 new quests are randomly hidden in #hidden-quests. You must complete all quests listed in #daily-quests to see these hidden quests. They work the same as daily quests, but give you larger rewards for completing them.
3. **Weekly Quests**: Every week, 3-4 weekly quests are randomly chosen and shown in #weekly-quests. They are harder and take much longer than daily quests, but give much more rewards.

# Voting and Results
1. **Vote for a Name**: At the end of the game, the `#names-to-vote-on` channel will appear with every published name, listed anonymously as separate entries. You can press the buttons shown to vote for your top 3 favorite names, awarding your first place vote three points, your second place vote two points, and your third place vote one point.
2. **Seeing Results**: After the time to vote is up, the `#the-results` channel will appear and slowly reveal the placement of each name, starting with last place and ending with the name that got the most points in first.
3. **Seeing Previous Games**: After results are shown, the `#name-archive` channel will have a new message sent in it showing the results for this game, including everyone's placements, names, and the theme for the game.