import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(readFileSync(resolve(root, 'data', name), 'utf8'));
const techniques = readJson('techniques.json').map((item) => ({
  ...item,
  id: item.id ?? `technique-${item.level}-${slug(item.text)}`,
  category: item.category ?? `level-${item.level}`,
  tags: item.tags ?? inferTags(item.text),
  modification_date: item.modification_date ?? '2026-11-24',
}));
const tasks = readJson('general-tasks.json').map((item) => ({
  ...item,
  category: 'general',
  tags: item.tags ?? [],
  modification_date: item.modification_date ?? '2026-11-24',
}));
const tags = readJson('tags.json');

function slug(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function inferTags(text) {
  const value = text.toLocaleLowerCase('de');
  const result = [];
  if (/pistole|waffe/.test(value)) result.push('pistol');
  if (/messer/.test(value)) result.push('knife');
  if (/schläger|baton/.test(value)) result.push('baton');
  if (/haken|schlag|würg/.test(value)) result.push('strike');
  if (/kick|tritt/.test(value)) result.push('kick');
  if (/boden|mount|grappling/.test(value)) result.push('ground');
  return result;
}

function sql(value) {
  return value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  return rows.map((row) => `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${row.map(sql).join(', ')});`).join('\n');
}

const statements = [
  'PRAGMA foreign_keys = ON;',
  'BEGIN TRANSACTION;',
  `CREATE TABLE IF NOT EXISTS techniques (id TEXT PRIMARY KEY, category TEXT NOT NULL, text TEXT NOT NULL, details TEXT, modification_date TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS technique_translations (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, language TEXT NOT NULL, text TEXT NOT NULL, details TEXT, PRIMARY KEY (technique_id, language));`,
  `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, text TEXT NOT NULL, modification_date TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS tag_translations (tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, language TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (tag_id, language));`,
  `CREATE TABLE IF NOT EXISTS technique_tags (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (technique_id, tag_id));`,
  `CREATE TABLE IF NOT EXISTS general_exams (id TEXT PRIMARY KEY, name TEXT NOT NULL, level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5), modification_date TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS general_exam_techniques (exam_id TEXT NOT NULL REFERENCES general_exams(id) ON DELETE CASCADE, technique_id TEXT NOT NULL REFERENCES techniques(id), order_index INTEGER NOT NULL, PRIMARY KEY (exam_id, technique_id), UNIQUE (exam_id, order_index));`,
  insert('techniques', ['id', 'category', 'text', 'details', 'modification_date'], [...techniques, ...tasks].map((item) => [item.id, item.category, item.text, item.details, item.modification_date])),
  insert('technique_translations', ['technique_id', 'language', 'text', 'details'], [...techniques, ...tasks].flatMap((item) => Object.entries(item.translations ?? {}).map(([language, content]) => [item.id, language, content.text, content.details]))),
  insert('tags', ['id', 'text', 'modification_date'], tags.map((tag) => [tag.id, tag.text, tag.modification_date])),
  insert('tag_translations', ['tag_id', 'language', 'text'], tags.flatMap((tag) => Object.entries(tag.translations ?? {}).map(([language, content]) => [tag.id, language, content.text]))),
  insert('technique_tags', ['technique_id', 'tag_id'], [...techniques, ...tasks].flatMap((item) => item.tags.map((tagId) => [item.id, tagId]))),
  'COMMIT;',
].filter(Boolean);

const target = resolve(root, 'migrations', '001_initial.sql');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${statements.join('\n\n')}\n`, 'utf8');
console.log(`Wrote ${target}`);