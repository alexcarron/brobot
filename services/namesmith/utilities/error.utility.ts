/**
 * Error thrown when an SQL query is used incorrectly
 */
export class QueryUsageError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'QueryUsageError';
	}
}