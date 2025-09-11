import { InvalidArgumentError } from "../../../utilities/error-utils"
import { hasProperty, isArray, isNumber, isObject, isString } from "../../../utilities/types/type-guards"
import { Trade, TradeStatus, TradeStatuses } from "../types/trade.types"

/**
 * Checks if a given value is a Trade object.
 * @param value - The value to check.
 * @returns If the value is a Trade object.
 */
export function isTrade(value: unknown): value is Trade {
	return (
		isObject(value) &&
		hasProperty(value, "id") &&
		isNumber(value.id) &&
		hasProperty(value, "initiatingPlayer") &&
		isString(value.initiatingPlayer) &&
		hasProperty(value, "recipientPlayer") &&
		isString(value.recipientPlayer) &&
		hasProperty(value, "offeredCharacters") &&
		isString(value.offeredCharacters) &&
		hasProperty(value, "requestedCharacters") &&
		isString(value.requestedCharacters) &&
		hasProperty(value, "status") &&
		isString(value.status) &&
		Object.values(TradeStatuses).includes(value.status as TradeStatus)
	)
}

/**
 * Throws an error if the given value is not a Trade object.
 * @param value - The value to check.
 * @throws {Error} - If the value is not a Trade object.
 */
export function throwIfNotTrade(value: unknown): asserts value is Trade {
	if (!isTrade(value)) throw new InvalidArgumentError(
		`Given value is not a trade: ${value}`
	)
}


/**
 * Checks if a given value is an array of Trade objects.
 * @param value - The value to check.
 * @returns If the value is an array of Trade objects.
 */
function isTrades(value: unknown): value is Trade[] {
	return (
		isArray(value) &&
		value.every(value => isTrade(value))
	)
}

/**
 * Throws an error if the given value is not an array of Trade objects.
 * @param value - The value to check.
 * @throws {Error} - If the value is not an array of Trade objects.
 */
export function throwIfNotTrades(value: unknown): asserts value is Trade[] {
	if (!isTrades(value)) throw new InvalidArgumentError(
		`Given value is not an array of trades: ${value}`
	)
}