export type YamlScalar = string | number | boolean | null;
export type YamlValue = YamlScalar | YamlObject | YamlArray;
export interface YamlObject {
  [key: string]: YamlValue;
}
export interface YamlArray extends Array<YamlValue> {}

interface ParsedLine {
  level: number;
  content: string;
}

const parseScalar = (input: string): YamlValue => {
  const value = input.trim();
  if (value === '') return '';
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (value === 'null' || value === 'none') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && value !== '') {
    return numeric;
  }
  return value;
};

const splitKeyValue = (content: string): { key: string; value: YamlValue | undefined } => {
  const separator = content.indexOf(':');
  if (separator < 0) {
    throw new Error(`Invalid mapping entry: ${content}`);
  }
  const key = content.slice(0, separator).trim();
  const rawValue = content.slice(separator + 1).trim();
  if (rawValue === '') {
    return { key, value: undefined };
  }
  return { key, value: parseScalar(rawValue) };
};

const parseAdditionalFields = (
  lines: ParsedLine[],
  index: number,
  level: number,
  target: YamlObject
): number => {
  let currentIndex = index;
  while (currentIndex < lines.length) {
    const line = lines[currentIndex];
    if (line.level < level) break;
    if (line.level > level) {
      throw new Error(`Unexpected indentation at line: ${line.content}`);
    }
    currentIndex += 1;
    const { key, value } = splitKeyValue(line.content);
    if (value === undefined) {
      const childLevel = currentIndex < lines.length ? lines[currentIndex].level : level + 1;
      const block = parseBlock(lines, currentIndex, childLevel);
      target[key] = block.value;
      currentIndex = block.next;
    } else {
      target[key] = value;
    }
  }
  return currentIndex;
};

const parseListItem = (
  lines: ParsedLine[],
  index: number,
  level: number,
  itemContent: string
): { value: YamlValue; next: number } => {
  if (itemContent === '') {
    const childLevel = index < lines.length ? lines[index].level : level + 1;
    return parseBlock(lines, index, childLevel);
  }
  if (itemContent.includes(':')) {
    const { key, value } = splitKeyValue(itemContent);
    const itemObject: YamlObject = {};
    let currentIndex = index;
    if (value === undefined) {
      const childLevel = currentIndex < lines.length ? lines[currentIndex].level : level + 1;
      const nested = parseBlock(lines, currentIndex, childLevel);
      itemObject[key] = nested.value;
      currentIndex = nested.next;
    } else {
      itemObject[key] = value;
    }
    const nextLevel = currentIndex < lines.length ? lines[currentIndex].level : level + 1;
    currentIndex = parseAdditionalFields(lines, currentIndex, nextLevel, itemObject);
    return { value: itemObject, next: currentIndex };
  }
  return { value: parseScalar(itemContent), next: index };
};

const parseBlock = (
  lines: ParsedLine[],
  index: number,
  level: number
): { value: YamlValue; next: number } => {
  const asObject: YamlObject = {};
  const asList: YamlValue[] = [];
  let mode: 'map' | 'list' | null = null;
  let currentIndex = index;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];
    if (line.level < level) break;
    if (line.level > level) {
      throw new Error(`Unexpected indentation at line: ${line.content}`);
    }

    if (line.content.startsWith('- ')) {
      if (mode === null) mode = 'list';
      if (mode !== 'list') throw new Error('Mixed list and mapping in same block');
      currentIndex += 1;
      const itemContent = line.content.slice(2).trim();
      const parsedItem = parseListItem(lines, currentIndex, level, itemContent);
      asList.push(parsedItem.value);
      currentIndex = parsedItem.next;
      continue;
    }

    if (mode === null) mode = 'map';
    if (mode !== 'map') throw new Error('Mixed list and mapping in same block');

    const { key, value } = splitKeyValue(line.content);
    currentIndex += 1;
    if (value === undefined) {
      const childLevel = currentIndex < lines.length ? lines[currentIndex].level : level + 1;
      const nested = parseBlock(lines, currentIndex, childLevel);
      asObject[key] = nested.value;
      currentIndex = nested.next;
    } else {
      asObject[key] = value;
    }
  }

  return { value: mode === 'list' ? asList : asObject, next: currentIndex };
};

export const parseYamlDocument = (raw: string): YamlObject => {
  const lines: ParsedLine[] = [];
  raw.split('\n').forEach((lineRaw) => {
    const trimmed = lineRaw.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const indentSpaces = lineRaw.length - lineRaw.trimStart().length;
    if (indentSpaces % 2 !== 0) {
      throw new Error(`Invalid indentation width: ${lineRaw}`);
    }
    lines.push({
      level: indentSpaces / 2,
      content: trimmed,
    });
  });

  const parsed = parseBlock(lines, 0, 0).value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('YAML root must be an object');
  }
  return parsed as YamlObject;
};
