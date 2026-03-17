/* eslint-disable @typescript-eslint/no-unused-vars */
export const toErrorClassesFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, idTypeName }: Record<string, string>) =>
`
/**
 * Error thrown when a requested ${rawEntityName} is not found.
 */
export class ${pascalCaseEntity}NotFoundError extends ResourceNotFoundError {
	declare relevantData: { ${kebabCaseEntity}ID: ${idTypeName} }
	constructor(${kebabCaseEntity}ID: ${idTypeName}) {
		super({
			message: \`${pascalCaseEntity} with ID \${${kebabCaseEntity}ID} not found.\`,
			relevantData: { ${kebabCaseEntity}ID }
		})
	}
}

/**
 * Error thrown when attempting to create a ${rawEntityName} that already exists.
 */
export class ${pascalCaseEntity}AlreadyExistsError extends ResourceAlreadyExistsError {
	declare relevantData: {
		${kebabCaseEntity}ID?: ${idTypeName}
	}
	constructor(${kebabCaseEntity}ID: ${idTypeName}) {
		super({
			message: \`Cannot add ${rawEntityName}. ${pascalCaseEntity} with ID \${${kebabCaseEntity}ID} already exists.\`,
			relevantData: { ${kebabCaseEntity}ID }
		})
	}
}
`;
