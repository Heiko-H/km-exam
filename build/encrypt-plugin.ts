import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const MODULE_ID = 'virtual:encrypted-data';
const RESOLVED_MODULE_ID = `\0${MODULE_ID}`;
const ITERATIONS = 310_000;
const KEY_LENGTH = 32;

export interface EncryptedPayload {
  salt: string;
  iv: string;
  iterations: number;
  data: string;
}

interface TechniqueInput {
  id?: string;
  level?: number;
  category?: string;
  tags?: string[];
  modification_date?: string;
  title?: string;
  text?: string;
  teaser?: string;
  details?: string;
  translations?: unknown;
}

interface GeneralTaskInput {
  id: string;
  category?: string;
  tags?: string[];
  modification_date?: string;
  title?: string;
  text?: string;
  teaser?: string;
  details?: string;
  translations?: unknown;
}

interface TagInput {
  id?: string;
  title?: string;
  text?: string;
  modification_date?: string;
  translations?: unknown;
}

interface ExaminerInput {
  id?: string;
  name: string;
  email: string;
  shortcode: string;
  country?: string;
  details?: string;
  modification_date?: string;
}

const TRANSLATION_LANGUAGES = ['en', 'fr', 'it', 'es'] as const;

function validateTranslations(item: { translations?: unknown }, label: string, warnings: string[], hasDetails: boolean): void {
  if (item.translations === undefined) {
    warnings.push(`${label}: Übersetzungen fehlen.`);
    return;
  }
  if (typeof item.translations !== 'object' || item.translations === null || Array.isArray(item.translations)) {
    throw new Error(`${label}: translations muss ein Objekt sein.`);
  }
  const translations = item.translations as Record<string, unknown>;
  for (const language of Object.keys(translations)) {
    if (!TRANSLATION_LANGUAGES.includes(language as (typeof TRANSLATION_LANGUAGES)[number])) {
      throw new Error(`${label}: nicht unterstützte Übersetzungssprache „${language}“.`);
    }
  }
  for (const language of TRANSLATION_LANGUAGES) {
    const translation = translations[language];
    if (translation === undefined) {
      warnings.push(`${label}: Übersetzung für ${language} fehlt.`);
      continue;
    }
    if (typeof translation !== 'object' || translation === null || Array.isArray(translation)) {
      throw new Error(`${label}: Übersetzung für ${language} muss ein Objekt sein.`);
    }
    const translatedContent = translation as { title?: unknown; text?: unknown; teaser?: unknown; details?: unknown };
    if (typeof (translatedContent.title ?? translatedContent.text) !== 'string' || String(translatedContent.title ?? translatedContent.text).trim().length === 0) {
      throw new Error(`${label}: Übersetzungstext für ${language} darf nicht leer sein.`);
    }
    if (translatedContent.teaser !== undefined && typeof translatedContent.teaser !== 'string') {
      throw new Error(`${label}: Übersetzungs-Teaser für ${language} muss Text sein.`);
    }
    if (translatedContent.details !== undefined && typeof translatedContent.details !== 'string') {
      throw new Error(`${label}: Übersetzungsdetails für ${language} müssen Text sein.`);
    }
    if (hasDetails && translatedContent.details === undefined) {
      warnings.push(`${label}: Übersetzungsdetails für ${language} fehlen.`);
    }
  }
}

function normalizedDate(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return value;
  return '2026-11-24';
}

function inferTags(text: string): string[] {
  const normalized = text.toLocaleLowerCase('de');
  const tags = new Set<string>();
  if (/pistole|waffe/.test(normalized)) tags.add('pistol');
  if (/messer/.test(normalized)) tags.add('knife');
  if (/schläger|baton/.test(normalized)) tags.add('baton');
  if (/haken|schlag|würg/.test(normalized)) tags.add('strike');
  if (/kick|tritt/.test(normalized)) tags.add('kick');
  if (/boden|mount|grappling/.test(normalized)) tags.add('ground');
  return [...tags];
}

function titleOf(item: { title?: string; text?: string }): string {
  return (item.title ?? item.text ?? '').trim();
}

function uuidFor(value: string): string {
  const hex = createHash('sha256').update(value).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const raw = hex.join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

function validateData(techniques: unknown, generalTasks: unknown, tags: unknown): string[] {
  const warnings: string[] = [];
  if (!Array.isArray(techniques) || techniques.length + (Array.isArray(generalTasks) ? generalTasks.length : 0) === 0) {
    throw new Error('data/techniques.json muss mindestens eine Technik enthalten.');
  }
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  for (const [index, item] of techniques.entries()) {
    const technique = item as TechniqueInput;
    const level = technique?.level ?? Number(technique?.category?.replace('level-', ''));
    const category = technique.category ?? `level-${level}`;
    if (category !== 'general' && category !== 'other' && (!Number.isInteger(level) || level < 1 || level > 5)) {
      throw new Error(`Technik ${index + 1}: category muss Stufe 1–5, Allgemein oder Sonstige sein.`);
    }
    const title = titleOf(technique);
    if (!title) {
      throw new Error(`Technik ${index + 1}: title darf nicht leer sein.`);
    }
    if (technique.details !== undefined && typeof technique.details !== 'string') {
      throw new Error(`Technik ${index + 1}: details muss Text sein.`);
    }
    if (technique.teaser !== undefined && typeof technique.teaser !== 'string') throw new Error(`Technik ${index + 1}: teaser muss Text sein.`);
    validateTranslations(technique, `Technik ${index + 1}`, warnings, technique.details !== undefined);
    const normalizedTitle = title.toLocaleLowerCase('de');
    if (seenTitles.has(normalizedTitle)) throw new Error(`Die Technik „${title}“ ist mehrfach vorhanden.`);
    seenTitles.add(normalizedTitle);
    const id = technique.id ?? uuidFor(`technique:${category}:${title}`);
    if (seenIds.has(id)) throw new Error(`Technik ${index + 1}: id ist doppelt.`);
    seenIds.add(id);
  }

  if (!Array.isArray(generalTasks)) {
    throw new Error('data/general-tasks.json muss eine Liste enthalten.');
  }
  for (const [index, item] of generalTasks.entries()) {
    const task = item as GeneralTaskInput;
    if (!titleOf(task)) throw new Error(`Allgemeine Aufgabe ${index + 1}: title darf nicht leer sein.`);
    if (task.details !== undefined && typeof task.details !== 'string') {
      throw new Error(`Allgemeine Aufgabe ${index + 1}: details muss Text sein.`);
    }
    validateTranslations(task, `Allgemeine Aufgabe ${index + 1}`, warnings, task.details !== undefined);
    const id = task.id ?? uuidFor(`general:${titleOf(task)}`);
    if (seenIds.has(id)) throw new Error(`Allgemeine Aufgabe ${index + 1}: id ist doppelt.`);
    seenIds.add(id);
  }
  if (!Array.isArray(tags)) throw new Error('data/tags.json muss eine Liste enthalten.');
  const tagIds = new Set<string>();
  for (const [index, item] of tags.entries()) {
    const tag = item as TagInput;
    if (!titleOf(tag)) throw new Error(`Tag ${index + 1}: Titel fehlt.`);
    validateTranslations(tag, `Tag ${tag.id}`, warnings, false);
    const id = tag.id ?? uuidFor(`tag:${titleOf(tag)}`);
    if (tagIds.has(id)) throw new Error(`Tag ${index + 1}: id ist doppelt.`);
    tagIds.add(id);
  }
  return warnings;
}

export function encryptAppData(
  password: string,
  techniques: unknown,
  generalTasks: unknown,
  tags: unknown = [],
  examiners: unknown = [],
): EncryptedPayload {
  if (!password || password.trim().length < 12) {
    throw new Error('APP_PASSWORD muss gesetzt sein und mindestens 12 Zeichen enthalten.');
  }
  validateData(techniques, generalTasks, tags);

  const canonicalize = (item: TechniqueInput | GeneralTaskInput, defaultCategory: string) => {
    const title = titleOf(item);
    const category = item.category ?? defaultCategory;
    const level = category.startsWith('level-') ? Number(category.slice(-1)) : undefined;
    const translations = item.translations && typeof item.translations === 'object'
      ? Object.fromEntries(Object.entries(item.translations).map(([language, content]) => {
        const translated = content as { title?: string; text?: string; teaser?: string; details?: string };
        const translatedTitle = translated.title ?? translated.text ?? '';
        return [language, { ...translated, title: translatedTitle, text: translatedTitle }];
      }))
      : undefined;
    return {
      ...item,
      id: item.id ?? uuidFor(`${defaultCategory}:${title}`),
      title,
      text: title,
      teaser: item.teaser ?? '',
      category,
      level,
      tags: item.tags ?? (category.startsWith('level-') ? inferTags(title) : []),
      modification_date: normalizedDate(item.modification_date),
      translations,
    };
  };
  const canonicalTechniques = [
    ...(techniques as TechniqueInput[]).map((item) => canonicalize(item, `level-${item.level ?? 1}`)),
    ...(generalTasks as GeneralTaskInput[]).map((item) => canonicalize(item, 'general')),
  ];
  const canonicalTags = (tags as TagInput[]).map((tag) => {
    const title = titleOf(tag);
    const translations = tag.translations && typeof tag.translations === 'object'
      ? Object.fromEntries(Object.entries(tag.translations).map(([language, content]) => {
        const translated = content as { title?: string; text?: string };
        const translatedTitle = translated.title ?? translated.text ?? '';
        return [language, { title: translatedTitle, text: translatedTitle }];
      }))
      : undefined;
    return { id: tag.id ?? uuidFor(`tag:${title}`), title, text: title, translations, modification_date: normalizedDate(tag.modification_date) };
  });
  const tagIds = new Map<string, string>();
  (tags as TagInput[]).forEach((tag, index) => {
    const canonical = canonicalTags[index];
    if (tag.id) tagIds.set(tag.id, canonical.id);
    tagIds.set(titleOf(tag), canonical.id);
  });
  for (const technique of canonicalTechniques) {
    technique.tags = technique.tags.map((id) => tagIds.get(id) ?? id);
  }
  const defaultExaminers: ExaminerInput[] = [
    { name: 'Peter', email: 'peter@gmail.com', shortcode: 'PE' },
    { name: 'Heiko', email: 'heiko@gmail.com', shortcode: 'HE' },
    { name: 'Kai', email: 'kai@gmail.com', shortcode: 'KA' },
  ];
  const canonicalExaminers = (Array.isArray(examiners) && examiners.length ? examiners as ExaminerInput[] : defaultExaminers).map((examiner) => ({
    ...examiner,
    id: examiner.id ?? uuidFor(`examiner:${examiner.email.toLocaleLowerCase()}`),
    country: examiner.country ?? 'DE',
    details: examiner.details ?? '',
    modification_date: normalizedDate(examiner.modification_date),
  }));
  if (new Set(canonicalExaminers.map((item) => item.email.toLowerCase())).size !== canonicalExaminers.length || new Set(canonicalExaminers.map((item) => item.shortcode.toLowerCase())).size !== canonicalExaminers.length) {
    throw new Error('Prüfer-E-Mail und Kürzel müssen eindeutig sein.');
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify({ techniques: canonicalTechniques, generalTasks: [], tags: canonicalTags, examiners: canonicalExaminers }), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticatedData = Buffer.concat([ciphertext, cipher.getAuthTag()]);

  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    iterations: ITERATIONS,
    data: authenticatedData.toString('base64'),
  };
}

export function encryptedDataPlugin(password: string | undefined, dataDirectory: string): Plugin {
  let encryptedPayload: EncryptedPayload | undefined;

  return {
    name: 'encrypt-exam-data',
    enforce: 'pre',
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_MODULE_ID : undefined;
    },
    buildStart() {
      if (!password) {
        this.error('APP_PASSWORD fehlt. Lege lokal .env.local an oder konfiguriere das GitHub-Secret APP_PASSWORD.');
      }
      try {
        const techniques = JSON.parse(readFileSync(resolve(dataDirectory, 'techniques.json'), 'utf8')) as unknown;
        let generalTasks: unknown = [];
        try {
          generalTasks = JSON.parse(readFileSync(resolve(dataDirectory, 'general-tasks.json'), 'utf8')) as unknown;
        } catch {
          generalTasks = [];
        }
        const tags = JSON.parse(readFileSync(resolve(dataDirectory, 'tags.json'), 'utf8')) as unknown;
        let examiners: unknown = [];
        try {
          examiners = JSON.parse(readFileSync(resolve(dataDirectory, 'examiners.json'), 'utf8')) as unknown;
        } catch {
          examiners = [];
        }
        for (const warning of validateData(techniques, generalTasks, tags)) this.warn(warning);
        encryptedPayload = encryptAppData(password, techniques, generalTasks, tags, examiners);
      } catch (error) {
        this.error(error instanceof Error ? error.message : 'Die Prüfungsdaten konnten nicht verschlüsselt werden.');
      }
    },
    load(id) {
      if (id !== RESOLVED_MODULE_ID) return undefined;
      if (!encryptedPayload) this.error('Verschlüsselte Prüfungsdaten fehlen.');
      return `export const encryptedData = ${JSON.stringify(encryptedPayload)};`;
    },
  };
}