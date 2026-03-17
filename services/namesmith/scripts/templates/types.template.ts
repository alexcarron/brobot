/* eslint-disable @typescript-eslint/no-unused-vars */
export const toTypesFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName, camelCaseEntity, columnDefinitions, hasDBBoolean, hasStringType }: Record<string, string>) =>
`import { object, number${hasStringType === 'true' ? ', string' : ''}, ExtractDomainType } from "../../../utilities/runtime-types-utils";
import { DBDate${hasDBBoolean === 'true' ? ', DBBoolean' : ''} } from "../utilities/db.utility";

const DB${pascalCaseEntity} = object.asTransformableType('${pascalCaseEntity}', {
${columnDefinitions}
});
export const as${pascalCaseEntity} = DB${pascalCaseEntity}.to${pascalCaseEntity};
export const as${pascalCaseEntity}s = DB${pascalCaseEntity}.to${pascalCaseEntity}s;
export type ${pascalCaseEntity} = ExtractDomainType<typeof DB${pascalCaseEntity}>;

/**
 * TODO: Customize this type to match the properties needed when creating a new ${rawEntityName}.
 * This currently mirrors the full ${pascalCaseEntity} type, but you may want to exclude the 'id' field
 * or add additional properties that are computed/derived.
 * 
 * Example: If 'id' is auto-generated and 'status' has a default, your Definition might be:
 * type ${pascalCaseEntity}Definition = Omit<${pascalCaseEntity}, 'id' | 'status'> & { status?: string };
 */
export type ${pascalCaseEntity}Definition = ${pascalCaseEntity};

export type ${pascalCaseEntity}ID = ${pascalCaseEntity}['id'];
export type ${pascalCaseEntity}Resolvable = 
	| ${pascalCaseEntity}ID
	| { id: ${pascalCaseEntity}ID };
`;
