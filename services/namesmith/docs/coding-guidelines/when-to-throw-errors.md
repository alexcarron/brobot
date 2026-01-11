# When to Throw Errors
1. You reach a situation where you cannot reasonably continue because an assumption has been violated
2. The function cannot fufill the
	1. Input it expects
	2. The output in gaurantees
	3. The side effects it garuntees
3. Silently failing or returning a sentinel value would let the caller proceed in a meaningless or unsafe way
4. You need to immediately abort the current operation
# When NOT to Throw Errors
1. The situation is part of normal business logic or domain flow
2. It can be handled locally in a predictable way
3. You’re controlling flow in expected conditions
4. You’re inside hot paths / performance-sensitive code