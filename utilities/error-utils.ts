/**
 * Error thrown when a given argument is invalid.
 */
export class InvalidArgumentError extends TypeError {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}

/**
 * Error thrown when something required for a particular operation to run is not initialized properly
 */
export class InitializationError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'InitializationError';
	}
}

/**
 * Base class for errors related to resource operations.
 */
export class ResourceError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "ResourceError";
	}
}

/**
 * Error thrown when a resource is not found.
 */
export class ResourceNotFoundError extends ResourceError {
  constructor(message?: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

/**
 * Error thrown when an operation fails due to a conflicting resource state.
 */
export class ResourceConflictError extends ResourceError {
	constructor(message?: string) {
		super(message);
		this.name = "ResourceConflictError";
	}
}
