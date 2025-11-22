#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { toServiceFile } from './templates/service.template';
import { toNamesmithServicesProperty, toNamesmithTypesImport } from './templates/namesmith.types.template';

const servicesDirectory = getFilePath('services', 'namesmith', 'services');
const namesmithTypesFile = getFilePath('services', 'namesmith', 'types', 'namesmith.types.ts');

function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function toIdentifierSegments(string: string): string[] {
  if (string.trim() === "")
		return [];

	// Remove non-alphanumeric characters (Keep whitespace, hyphens, and underscores)
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

function getFilePath(...segments: string[]): string {
	const filePath = path.join(...segments);
	if (!fs.existsSync(filePath)) {
		console.error('File not found at', filePath);
		process.exit(1);
	}

	return filePath;
}

function writeToFile(filePath: string, content: string | string[]): void {
	content = Array.isArray(content)
		? content.join('\n')
		: content;

	fs.writeFileSync(filePath, content, 'utf8');
	console.log(`✔ Modified ${filePath}`);
}

function getLines(filePath: string): string[] {
	return fs.readFileSync(filePath, 'utf8').split('\n');
}


function insertLine(
	{toInsert, lines, startsWith, numLines, where, when}: {
		lines: string[],
		toInsert: string,
		numLines?: number
		where: 'above' | 'below'
		when: 'first' | 'last'
		startsWith: string,
	}
): string[] {
	numLines = numLines ?? 1;

	let insertIndex: number | null = null;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];

		if (line.startsWith(startsWith)) {
			insertIndex = index;

			if (when === 'first') {
				break;
			}
		}
	}

	if (insertIndex === null) {
		if (where === 'above')
			lines.unshift(toInsert);
		else
			lines.push(toInsert);
	}
	else {
		if (where === 'above') {
			const index = insertIndex - numLines + 1;
			lines.splice(index, 0, toInsert);
		}
		else {
			const index = insertIndex + numLines;
			lines.splice(index, 0, toInsert);
		}

	}

	return lines;
}

const rawEntityName = process.argv.slice(2).join(' ').trim();
if (!rawEntityName || rawEntityName.length === 0) {
  console.error('An entity name was not provided. Usage: npm run create-service <entity name>');
  process.exit(1);
}

const kebabCaseEntity = toKebabCase(rawEntityName);
const camelCaseEntity = toCamelCase(rawEntityName);
const pascalCaseEntity = toPascalCase(rawEntityName);
const serviceFile = path.join(servicesDirectory, `${kebabCaseEntity}.service.ts`);
const entityNames = { kebabCaseEntity, camelCaseEntity, pascalCaseEntity, rawEntityName };

writeToFile(serviceFile, toServiceFile(entityNames));





let namesmithTypesLines = getLines(namesmithTypesFile);
namesmithTypesLines = insertLine({
	lines: namesmithTypesLines,
	toInsert: toNamesmithTypesImport(entityNames),
	where: 'below',
	when: 'last',
	startsWith: 'import ',
});

namesmithTypesLines = insertLine({
	lines: namesmithTypesLines,
	toInsert: toNamesmithServicesProperty(entityNames),
	numLines: 6,
	where: 'above',
	when: 'last',
	startsWith: 'export type NamesmithServices',
});

writeToFile(namesmithTypesFile, namesmithTypesLines);

console.log('\nDone.');
