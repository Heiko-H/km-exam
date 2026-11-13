import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
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
  level: number;
  text: string;
  details?: string;
}

interface GeneralTaskInput {
  id: string;
  text: string;
  details?: string;
}

function validateData(techniques: unknown, generalTasks: unknown): void {
  if (!Array.isArray(techniques) || techniques.length === 0) {
    throw new Error('data/techniques.json muss mindestens eine Technik enthalten.');
  }
  const seenTexts = new Set<string>();
  for (const [index, item] of techniques.entries()) {
    const technique = item as TechniqueInput;
    if (!Number.isInteger(technique?.level) || technique.level < 1 || technique.level > 5) {
      throw new Error(`Technik ${index + 1}: level muss eine ganze Zahl von 1 bis 5 sein.`);
    }
    if (typeof technique.text !== 'string' || technique.text.trim().length === 0) {
      throw new Error(`Technik ${index + 1}: text darf nicht leer sein.`);
    }
    if (technique.details !== undefined && typeof technique.details !== 'string') {
      throw new Error(`Technik ${index + 1}: details muss Text sein.`);
    }
    const normalizedText = technique.text.trim().toLocaleLowerCase('de');
    if (seenTexts.has(normalizedText)) {
      throw new Error(`Die Technik „${technique.text}“ ist mehrfach vorhanden.`);
    }
    seenTexts.add(normalizedText);
  }

  if (!Array.isArray(generalTasks)) {
    throw new Error('data/general-tasks.json muss eine Liste enthalten.');
  }
  const seenIds = new Set<string>();
  for (const [index, item] of generalTasks.entries()) {
    const task = item as GeneralTaskInput;
    if (typeof task?.id !== 'string' || task.id.trim().length === 0 || seenIds.has(task.id)) {
      throw new Error(`Allgemeine Aufgabe ${index + 1}: id fehlt oder ist doppelt.`);
    }
    if (typeof task.text !== 'string' || task.text.trim().length === 0) {
      throw new Error(`Allgemeine Aufgabe ${index + 1}: text darf nicht leer sein.`);
    }
    if (task.details !== undefined && typeof task.details !== 'string') {
      throw new Error(`Allgemeine Aufgabe ${index + 1}: details muss Text sein.`);
    }
    seenIds.add(task.id);
  }
}

export function encryptAppData(
  password: string,
  techniques: unknown,
  generalTasks: unknown,
): EncryptedPayload {
  if (!password || password.trim().length < 12) {
    throw new Error('APP_PASSWORD muss gesetzt sein und mindestens 12 Zeichen enthalten.');
  }
  validateData(techniques, generalTasks);

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify({ techniques, generalTasks }), 'utf8');
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
        const generalTasks = JSON.parse(readFileSync(resolve(dataDirectory, 'general-tasks.json'), 'utf8')) as unknown;
        encryptedPayload = encryptAppData(password, techniques, generalTasks);
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