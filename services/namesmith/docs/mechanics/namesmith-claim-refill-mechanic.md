# Namesmith Claim Refill Mechanic
A command on cooldown used to give yourself a decent amount of tokens periodically by just waiting
# How Often
Every 2 hours to encourage 4-6 mini sessions a day
- Refills do not accumulate or stack
# How Much Reward
Variable reward with a minimum of 50 tokens and expected value of 70 tokens
- Enough to buy 2 of the cheapest mystery box possible (~25 tokens)
- Enough to not feel like mining is much easier
- Not enough to make completing quests feel useless
# Tracking Refills
Every player has a field "lastClaimedRefillTime" which can be null or a timestamp
- When attempting to refill, check to make sure it was null or more than two hours go
# Possible Responses
## Success
**+52 Tokens**
🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙

-# You now have 1,134 tokens
-# Claim your next refill of tokens `in 2 hours`
## Failure
You’ve already claimed your refill!
Next refill available `in 1 hour 23 minutes`
In the meantime, you can mine tokens with `/mine` or complete tasks for extra rewards.

