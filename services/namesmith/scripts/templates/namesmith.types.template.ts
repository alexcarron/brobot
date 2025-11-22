/* eslint-disable @typescript-eslint/no-unused-vars */
export const toNamesmithTypesImport = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity }: Record<string, string>) =>
`import { ${pascalCaseEntity}Service } from "../services/${kebabCaseEntity}.service";`

export const toNamesmithServicesProperty = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity }: Record<string, string>) =>
`	${camelCaseEntity}Service: ${pascalCaseEntity}Service,`