import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => {
  const path = resolve(root, 'data', name);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
};
const techniques = readJson('techniques.json');
const tags = readJson('tags.json');
const examiners = readJson('examiners.json');

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  return rows.map((row) => `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${row.map(sql).join(', ')});`).join('\n');
}

const statements = [
  'PRAGMA foreign_keys = ON;',
  'BEGIN TRANSACTION;',
  'CREATE TABLE IF NOT EXISTS techniques (id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, teaser TEXT, details_html TEXT, modification_date TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS technique_translations (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, language TEXT NOT NULL, title TEXT NOT NULL, teaser TEXT, details_html TEXT, PRIMARY KEY (technique_id, language));',
  'CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, title TEXT NOT NULL, modification_date TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS tag_translations (tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, language TEXT NOT NULL, title TEXT NOT NULL, PRIMARY KEY (tag_id, language));',
  'CREATE TABLE IF NOT EXISTS technique_tags (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (technique_id, tag_id));',
  'CREATE TABLE IF NOT EXISTS examiners (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, shortcode TEXT NOT NULL UNIQUE, country TEXT NOT NULL, details TEXT, password_hash TEXT, modification_date TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS exam_events (id TEXT PRIMARY KEY, location TEXT NOT NULL, exam_date TEXT NOT NULL, start_time TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, details TEXT, created_by TEXT NOT NULL REFERENCES examiners(id), modification_date TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS exam_event_examiners (event_id TEXT NOT NULL REFERENCES exam_events(id) ON DELETE CASCADE, examiner_id TEXT NOT NULL REFERENCES examiners(id), PRIMARY KEY (event_id, examiner_id));',
  "CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES exam_events(id) ON DELETE CASCADE, name TEXT NOT NULL, level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5), kind TEXT NOT NULL CHECK (kind IN ('general', 'random')), seed_number INTEGER, modification_date TEXT NOT NULL);",
  'CREATE TABLE IF NOT EXISTS exam_techniques (exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE, technique_id TEXT NOT NULL REFERENCES techniques(id), order_index INTEGER NOT NULL, PRIMARY KEY (exam_id, technique_id), UNIQUE (exam_id, order_index));',
  'CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES exam_events(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT, examiner_id TEXT REFERENCES examiners(id), cancelled INTEGER NOT NULL DEFAULT 0);',
  'CREATE TABLE IF NOT EXISTS candidate_levels (candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE, level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5), PRIMARY KEY (candidate_id, level));',
  'CREATE TABLE IF NOT EXISTS evaluations (exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE, examiner_id TEXT NOT NULL REFERENCES examiners(id), passed INTEGER, general_note TEXT, PRIMARY KEY (exam_id, candidate_id, examiner_id));',
  'CREATE TABLE IF NOT EXISTS task_evaluations (exam_id TEXT NOT NULL, candidate_id TEXT NOT NULL, examiner_id TEXT NOT NULL, technique_id TEXT NOT NULL REFERENCES techniques(id), passed INTEGER NOT NULL DEFAULT 0, repeated INTEGER NOT NULL DEFAULT 0, note TEXT, rating_technique INTEGER, rating_reflexes INTEGER, rating_conditioning INTEGER, rating_stability INTEGER, PRIMARY KEY (exam_id, candidate_id, examiner_id, technique_id), FOREIGN KEY (exam_id, candidate_id, examiner_id) REFERENCES evaluations(exam_id, candidate_id, examiner_id) ON DELETE CASCADE);',
  insert('techniques', ['id', 'category', 'title', 'teaser', 'details_html', 'modification_date'], techniques.map((item) => [item.id, item.category, item.title, item.teaser, item.details, item.modification_date])),
  insert('technique_translations', ['technique_id', 'language', 'title', 'teaser', 'details_html'], techniques.flatMap((item) => Object.entries(item.translations ?? {}).map(([language, content]) => [item.id, language, content.title, content.teaser, content.details]))),
  insert('tags', ['id', 'title', 'modification_date'], tags.map((tag) => [tag.id, tag.title, tag.modification_date])),
  insert('tag_translations', ['tag_id', 'language', 'title'], tags.flatMap((tag) => Object.entries(tag.translations ?? {}).map(([language, content]) => [tag.id, language, content.title]))),
  insert('technique_tags', ['technique_id', 'tag_id'], techniques.flatMap((item) => (item.tags ?? []).map((tagId) => [item.id, tagId]))),
  insert('examiners', ['id', 'name', 'email', 'shortcode', 'country', 'details', 'modification_date'], examiners.map((item) => [item.id, item.name, item.email, item.shortcode, item.country, item.details, item.modification_date])),
  'COMMIT;',
].filter(Boolean);

const target = resolve(root, 'migrations', '001_initial.sql');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${statements.join('\n\n')}\n`, 'utf8');
console.log(`Wrote ${target}`);
