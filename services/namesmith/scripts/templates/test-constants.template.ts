/* eslint-disable @typescript-eslint/no-unused-vars */
export const toTestConstantFile = ({ kebabCaseEntity, pascalCaseEntity, rawEntityName }: Record<string, string>) =>
`export const INVALID_${pascalCaseEntity.toUpperCase()}_ID = 999999999;
`;
