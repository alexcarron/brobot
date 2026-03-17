#!/usr/bin/env node

/**
 * Repository Generator Script
 * 
 * Creates all necessary files for a new repository pattern in the Namesmith service.
 * 
 * Prerequisites:
 * - Table must be defined in schema.sql as: CREATE TABLE IF NOT EXISTS {table_name} (...)
 * - All templates must exist in ./templates/ directory
 * 
 * Usage:
 *   npm run create-repo <entity-name> [--plural <plural-name>]
 * 
 * Examples:
 *   npm run create-repo day
 *   npm run create-repo quest --plural quests
 *   npm run create-repo player
 * 
 * Generated Files:
 *   - repositories/{kebab}.repository.ts
 *   - repositories/{kebab}.repository.test.ts
 *   - mocks/mock-data/mock-{plural}.ts
 *   - types/{kebab}.types.ts
 *   - Updated: utilities/error.utility.ts (appends error classes)
 *   - Updated: constants/test.constants.ts (appends test ID constant)
 */

import fs from 'fs';
import path from 'path';
import { toRepositoryFile } from './templates/repository.template';
import { toRepositoryTestFile } from './templates/repository-test.template';
import { toMockDataFile } from './templates/mock-data.template';
import { toTypesFile } from './templates/types.template';
import { toErrorClassesFile } from './templates/error-classes.template';
import { toTestConstantFile } from './templates/test-constants.template';

/* ————— File Path Utilities ————— */

function getFilePath(...segments: string[]): string {
	const filePath = path.join(...segments);
	if (!fs.existsSync(filePath)) {
		console.error('✗ Error: File not found at', filePath);
		process.exit(1);
	}
	return filePath;
}

function getDirectoryPath(...segments: string[]): string {
	const dirPath = path.join(...segments);
	if (!fs.existsSync(dirPath)) {
		console.error('✗ Error: Directory not found at', dirPath);
		process.exit(1);
	}
	return dirPath;
}

function writeToFile(filePath: string, content: string): void {
	fs.writeFileSync(filePath, content, 'utf8');
	console.log(`✔ Created ${filePath}`);
}

/* ————— Name Transformation Utilities ————— */

function capitalizeFirstLetter(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function toIdentifierSegments(string: string): string[] {
	if (string.trim() === "") return [];

	// Remove non-alphanumeric characters (keep whitespace, hyphens, underscores)
	string = string.replace(/[^a-zA-Z0-9\s-_.]/g, "");

	// Replace underscores, hyphens, and other separators with spaces
	const normalizedString = string
		.replace(/[._-]+/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

	const words = normalizedString
		.trim()
		.toLowerCase()
		.split(/\s+/);

	if (words.length === 0) {
		return [];
	}

	return words;
}

function toCamelCase(string: string): string {
	const words = toIdentifierSegments(string);

	if (words.length === 0) {
		return "";
	}

	const [firstWord, ...remainingWords] = words;

	const camelCasedResult = [
		firstWord,
		...remainingWords.map(word =>
			capitalizeFirstLetter(word)
		),
	].join("");

	return camelCasedResult;
}

function toPascalCase(string: string): string {
	return capitalizeFirstLetter(toCamelCase(string));
}

function toKebabCase(string: string): string {
	const words = toIdentifierSegments(string);

	if (words.length === 0) {
		return "";
	}

	return words.join("-");
}

/* ————— Schema.sql Parsing ————— */

interface ParsedColumn {
	name: string;
	sqlType: string;
	notNull: boolean;
	isPrimaryKey: boolean;
	isForeignKey: boolean;
}

interface ParsedSchema {
	tableName: string;
	columns: ParsedColumn[];
}

function parseSchemaSQL(schemaContent: string, kebabCaseTableName: string): ParsedSchema {
	// Find the CREATE TABLE statement for the entity
	const tableNameUpper = kebabCaseTableName.toUpperCase();
	
	const createTableRegex = new RegExp(
		`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${tableNameUpper}\\s*\\(([\\s\\S]*?)\\);`,
		'i'
	);

	const match = schemaContent.match(createTableRegex);
	if (!match) {
		console.error(`✗ Error: No table definition found in schema.sql for table '${kebabCaseTableName}'`);
		process.exit(1);
	}

	const tableDefinition = match[1];
	const lines = tableDefinition.split('\n');
	const columns: ParsedColumn[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('PRIMARY KEY') || trimmed.startsWith('FOREIGN KEY') || trimmed.startsWith('UNIQUE') || trimmed.startsWith('CHECK')) {
			continue;
		}

		// Parse column definition: columnName TYPE [NOT NULL] [PRIMARY KEY] [REFERENCES ...]
		const columnRegex = /^(\w+)\s+(\w+)(?:\s+(NOT\s+NULL))?(?:\s+(PRIMARY\s+KEY))?(?:\s+(AUTOINCREMENT))?(?:\s+REFERENCES)?/i;
		const columnMatch = trimmed.match(columnRegex);

		if (columnMatch) {
			const [, columnName, sqlType, notNullClause, primaryKeyClause] = columnMatch;
			const isForeignKey = /REFERENCES/i.test(trimmed);

			columns.push({
				name: columnName,
				sqlType: sqlType.toUpperCase(),
				notNull: !!notNullClause,
				isPrimaryKey: !!primaryKeyClause,
				isForeignKey,
			});
		}
	}

	if (columns.length === 0) {
		console.error(`✗ Error: Could not parse any columns from table '${kebabCaseTableName}' in schema.sql`);
		process.exit(1);
	}

	return {
		tableName: kebabCaseTableName,
		columns,
	};
}

/* ————— TypeScript Type Generation from SQL ————— */

function sqlTypeToRuntimeType(sqlType: string, columnName: string): string {
	const lowerType = sqlType.toLowerCase();
	const lowerName = columnName.toLowerCase();

	if (lowerType === 'integer') {
		return 'number';
	} else if (lowerType === 'number') {
		// Only use DBDate if the column name contains 'time'
		if (lowerName.includes('time')) {
			return 'DBDate';
		}
		return 'number';
	} else if (lowerType === 'boolean') {
		return 'DBBoolean';
	} else if (lowerType === 'text') {
		return 'string';
	}

	// Default fallback
	return 'unknown';
}

function needsStringImport(columns: ParsedColumn[]): boolean {
	return columns.some(col => col.sqlType.toUpperCase() === 'TEXT');
}

/* ————— Column Definition Generators ————— */

function generateColumnDefinitions(columns: ParsedColumn[]): string {
	return columns
		.map(col => `  ${col.name}: ${sqlTypeToRuntimeType(col.sqlType, col.name)},`)
		.join('\n');
}

function generateInsertedFieldsDefinitions(columns: ParsedColumn[]): string {
	const nonIdColumns = columns.filter(col => !col.isPrimaryKey);

	return nonIdColumns
		.map(col => {
			const camelName = toCamelCase(col.name);
			const sqlType = col.sqlType.toUpperCase();

			if (sqlType === 'NUMBER' && col.name.toLowerCase().includes('time')) {
				return `			${camelName}: DBDate.fromDomain(${camelName}),`;
			} else if (sqlType === 'BOOLEAN') {
				return `			${camelName}: DBBoolean.fromDomain(${camelName}),`;
			}

			return `			${camelName}: ${camelName},`;
		})
		.join('\n');
}

function generateMockDefaults(columns: ParsedColumn[]): string {
	const nonIdColumns = columns.filter(col => !col.isPrimaryKey);

	return nonIdColumns
		.map(col => {
			const camelName = toCamelCase(col.name);
			const sqlType = col.sqlType.toUpperCase();

			if (sqlType === 'NUMBER' && col.name.toLowerCase().includes('time')) {
				return `		${camelName} = new Date(),`;
			} else if (sqlType === 'BOOLEAN') {
				return `		${camelName} = false,`;
			} else if (sqlType === 'INTEGER') {
				return `		${camelName} = 0,`;
			} else if (sqlType === 'TEXT') {
				return `		${camelName} = '',`;
			}

			return `		${camelName} = null,`;
		})
		.join('\n');
}

function generateMockPassthrough(columns: ParsedColumn[]): string {
	const nonIdColumns = columns.filter(col => !col.isPrimaryKey);

	return nonIdColumns
		.map(col => {
			const camelName = toCamelCase(col.name);
			return `		${camelName},`;
		})
		.join('\n');
}

function generateExtractedParamsDefinitions(columns: ParsedColumn[]): string {
	const nonIdColumns = columns.filter(col => !col.isPrimaryKey);

	return nonIdColumns
		.map(col => {
			const camelName = toCamelCase(col.name);
			return `		${camelName},`;
		})
		.join('\n');
}

function hasDBBoolean(columns: ParsedColumn[]): boolean {
	return columns.some(col => col.sqlType.toUpperCase() === 'BOOLEAN');
}

/* ————— Collision Detection ————— */

function checkForCollisions(kebabCaseEntity: string, pascalCaseEntity: string, pluralName: string) {
	const repositoriesDir = getDirectoryPath('services', 'namesmith', 'repositories');
	const typesDir = getDirectoryPath('services', 'namesmith', 'types');
	const mocksDir = getDirectoryPath('services', 'namesmith', 'mocks', 'mock-data');
	const errorUtilPath = getFilePath('services', 'namesmith', 'utilities', 'error.utility.ts');

	const repositoryPath = path.join(repositoriesDir, `${kebabCaseEntity}.repository.ts`);
	const testPath = path.join(repositoriesDir, `${kebabCaseEntity}.repository.test.ts`);
	const typesPath = path.join(typesDir, `${kebabCaseEntity}.types.ts`);
	const mockPath = path.join(mocksDir, `mock-${pluralName}.ts`);

	const collisions: string[] = [];

	if (fs.existsSync(repositoryPath)) {
		collisions.push(repositoryPath);
	}
	if (fs.existsSync(testPath)) {
		collisions.push(testPath);
	}
	if (fs.existsSync(typesPath)) {
		collisions.push(typesPath);
	}
	if (fs.existsSync(mockPath)) {
		collisions.push(mockPath);
	}

	// Check for existing error classes
	const errorUtilContent = fs.readFileSync(errorUtilPath, 'utf8');
	if (new RegExp(`class ${pascalCaseEntity}NotFoundError`, 'i').test(errorUtilContent)) {
		collisions.push(`${errorUtilPath} (${pascalCaseEntity}NotFoundError already exists)`);
	}
	if (new RegExp(`class ${pascalCaseEntity}AlreadyExistsError`, 'i').test(errorUtilContent)) {
		collisions.push(`${errorUtilPath} (${pascalCaseEntity}AlreadyExistsError already exists)`);
	}

	// Check test constants
	const testConstantsPath = getFilePath('services', 'namesmith', 'constants', 'test.constants.ts');
	const testConstantsContent = fs.readFileSync(testConstantsPath, 'utf8');
	if (new RegExp(`INVALID_${pascalCaseEntity.toUpperCase()}_ID`, 'i').test(testConstantsContent)) {
		collisions.push(`${testConstantsPath} (INVALID_${pascalCaseEntity.toUpperCase()}_ID already exists)`);
	}

	if (collisions.length > 0) {
		console.error('\n✗ Error: Name collision detected. The following file(s) already exist:');
		collisions.forEach(col => console.error(`   - ${col}`));
		console.error('\nPlease delete or rename these files before creating the repository.');
		process.exit(1);
	}
}

/* ————— Main Script Execution ————— */

const rawEntityName = process.argv.slice(2).find(arg => !arg.startsWith('--'))?.trim() ?? '';

if (!rawEntityName || rawEntityName.length === 0) {
	console.error('✗ Error: An entity name was not provided.');
	console.error('Usage: npm run create-repo <entity-name> [--plural <plural-name>]');
	console.error('Example: npm run create-repo day');
	process.exit(1);
}

// Parse --plural flag
let pluralName = `${toKebabCase(rawEntityName)}s`;
const pluralIndex = process.argv.indexOf('--plural');
if (pluralIndex !== -1 && pluralIndex + 1 < process.argv.length) {
	pluralName = process.argv[pluralIndex + 1];
}

const kebabCaseEntity = toKebabCase(rawEntityName);
const camelCaseEntity = toCamelCase(rawEntityName);
const pascalCaseEntity = toPascalCase(rawEntityName);

// Validate name
if (!kebabCaseEntity) {
	console.error('✗ Error: Invalid entity name. Only alphanumeric characters, hyphens, underscores, and spaces are allowed.');
	process.exit(1);
}

// Parse schema
const schemaPath = getFilePath('services', 'namesmith', 'database', 'queries', 'schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const parsedSchema = parseSchemaSQL(schemaContent, kebabCaseEntity);

// Check collisions before proceeding
checkForCollisions(kebabCaseEntity, pascalCaseEntity, pluralName);

// Generate context for templates
const columnDefinitions = generateColumnDefinitions(parsedSchema.columns);
const insertedFieldsDefinitions = generateInsertedFieldsDefinitions(parsedSchema.columns);
const extractedParamsDefinitions = generateExtractedParamsDefinitions(parsedSchema.columns);
const mockDefaults = generateMockDefaults(parsedSchema.columns);
const mockPassthrough = generateMockPassthrough(parsedSchema.columns);
const invalidIDConstant = `INVALID_${pascalCaseEntity.toUpperCase()}_ID`;
const usesDBBoolean = hasDBBoolean(parsedSchema.columns);
const usesStringType = needsStringImport(parsedSchema.columns);

const templateContext = {
	kebabCaseEntity,
	camelCaseEntity,
	pascalCaseEntity,
	rawEntityName,
	columnDefinitions,
	insertedFieldsDefinitions,
	extractedParamsDefinitions,
	mockDefaults,
	mockPassthrough,
	invalidIDConstant,
	pluralName,
	idTypeName: `${pascalCaseEntity}ID`,
	hasDBBoolean: usesDBBoolean ? 'true' : 'false',
	hasStringType: usesStringType ? 'true' : 'false',
};

console.log(`\n📦 Creating repository for: ${rawEntityName}\n`);

// Phase A: Create new files
const repositoriesDir = getDirectoryPath('services', 'namesmith', 'repositories');
const repositoryPath = path.join(repositoriesDir, `${kebabCaseEntity}.repository.ts`);
writeToFile(repositoryPath, toRepositoryFile(templateContext));

const testPath = path.join(repositoriesDir, `${kebabCaseEntity}.repository.test.ts`);
writeToFile(testPath, toRepositoryTestFile(templateContext));

const typesDir = getDirectoryPath('services', 'namesmith', 'types');
const typesPath = path.join(typesDir, `${kebabCaseEntity}.types.ts`);
writeToFile(typesPath, toTypesFile(templateContext));

const mocksDir = getDirectoryPath('services', 'namesmith', 'mocks', 'mock-data');
const mockPath = path.join(mocksDir, `mock-${pluralName}.ts`);
writeToFile(mockPath, toMockDataFile(templateContext));

// Phase B: Update error.utility.ts
const errorUtilPath = getFilePath('services', 'namesmith', 'utilities', 'error.utility.ts');
let errorUtilContent = fs.readFileSync(errorUtilPath, 'utf8');

// Find insertion point: after the last ResourceAlreadyExistsError subclass
const alreadyExistsMatches = Array.from(errorUtilContent.matchAll(/export class \w+AlreadyExistsError extends ResourceAlreadyExistsError/g));
if (alreadyExistsMatches.length === 0) {
	console.error('✗ Error: Could not find ResourceAlreadyExistsError in error.utility.ts');
	process.exit(1);
}

const lastMatch = alreadyExistsMatches[alreadyExistsMatches.length - 1];
const insertPosition = errorUtilContent.indexOf('\n}', lastMatch.index! + lastMatch[0].length) + 2;

errorUtilContent =
	errorUtilContent.slice(0, insertPosition) +
	'\n' +
	toErrorClassesFile(templateContext) +
	'\n' +
	errorUtilContent.slice(insertPosition);

fs.writeFileSync(errorUtilPath, errorUtilContent, 'utf8');
console.log(`✔ Updated ${errorUtilPath}`);

// Phase C: Update test.constants.ts
const testConstantsPath = getFilePath('services', 'namesmith', 'constants', 'test.constants.ts');
let testConstantsContent = fs.readFileSync(testConstantsPath, 'utf8');

// Find the last export statement before the final newline
const lines = testConstantsContent.split('\n');
let insertLineIndex = lines.length - 1;

// Find the last line with content (skip trailing empty lines)
while (insertLineIndex >= 0 && (!lines[insertLineIndex].trim() || lines[insertLineIndex].trim() === '')) {
	insertLineIndex--;
}

// Insert the new constant
const newConstant = toTestConstantFile(templateContext).trim();
lines.splice(insertLineIndex + 1, 0, newConstant);
testConstantsContent = lines.join('\n');

fs.writeFileSync(testConstantsPath, testConstantsContent, 'utf8');
console.log(`✔ Updated ${testConstantsPath}`);

console.log(`\n✓ Repository '${rawEntityName}' created successfully!\n`);
console.log(`Next steps:`);
console.log(`  1. Customize the ${pascalCaseEntity}Definition type in ${kebabCaseEntity}.types.ts`);
console.log(`  2. Customize mock defaults in mock-${pluralName}.ts if needed`);
console.log(`  3. Run: npm test -- repositories/${kebabCaseEntity}.repository.test.ts`);
console.log(`  4. Add service layer if needed: npm run create-service ${rawEntityName}\n`);
