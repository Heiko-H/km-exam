import type { EncryptedPayload } from '../../build/encrypt-plugin';
import type { ExamData } from './types';

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function deriveEncryptionKey(password: string, payload: EncryptedPayload): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: decodeBase64(payload.salt),
      iterations: payload.iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt'],
  );
}

export async function decryptWithKey(key: CryptoKey, payload: EncryptedPayload): Promise<ExamData> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.data),
  );
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as ExamData;
  if (!Array.isArray(parsed.techniques) || !Array.isArray(parsed.generalTasks)) {
    throw new Error('Die entschlüsselten Prüfungsdaten haben ein ungültiges Format.');
  }
  return parsed;
}

export async function unlockData(password: string, payload: EncryptedPayload): Promise<{ data: ExamData; key: CryptoKey }> {
  const key = await deriveEncryptionKey(password, payload);
  const data = await decryptWithKey(key, payload);
  return { data, key };
}

export async function exportKey(key: CryptoKey): Promise<string> {
  return encodeBase64(await crypto.subtle.exportKey('raw', key));
}

export async function importSessionKey(encodedKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', decodeBase64(encodedKey), { name: 'AES-GCM' }, true, ['decrypt']);
}