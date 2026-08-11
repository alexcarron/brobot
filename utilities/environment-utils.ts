/**
 * Selects a value based on the current environment mode.
 * @param environmentToValue - An object containing values for both development and production environments.
 * @param environmentToValue.development - The value to use in development mode.
 * @param environmentToValue.production - The value to use in production mode.
 * @returns The value corresponding to the current environment mode.
 * @example
 * const username = chooseByEnv({
 *   development: "test-user",
 *   production: "jsmith2002",
 * });
 */
export function chooseByEnv<DevReturnType, ProdReturnType>(
	environmentToValue: {
		development: DevReturnType;
		production: ProdReturnType;
	}
): DevReturnType | ProdReturnType {
	type Environment = keyof typeof environmentToValue;
	const isInDevelopmentEnv =
		global.botStatus?.isInDevelopmentMode;

	const environment: Environment =
		isInDevelopmentEnv
			? "development"
			: "production";

	return environmentToValue[environment];
}
