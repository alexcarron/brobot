class PropertyNotFoundError extends Error {
	constructor(propertyName, objName, message="") {
			super(`Property "${propertyName}" not found on object "${objName}": ${message}`);
			this.name = "PropertyNotFoundError";
			this.propertyName = propertyName;
			this.objName = objName;
	}
}

module.exports = PropertyNotFoundError;