interface EncryptedValue {
  iv: string;
  data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) result[index] = binary.charCodeAt(index);
  return result;
}

export async function saveSecureValue<T>(storageKey: string, value: T, key: CryptoKey): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const record: EncryptedValue = { iv: toBase64(iv), data: toBase64(new Uint8Array(encrypted)) };
  localStorage.setItem(storageKey, JSON.stringify(record));
}

export async function loadSecureValue<T>(storageKey: string, key: CryptoKey): Promise<T | null> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const record = JSON.parse(raw) as EncryptedValue;
    if (typeof record.iv !== 'string' || typeof record.data !== 'string') return null;
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(record.iv) }, key, fromBase64(record.data));
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    return null;
  }
}

export function removeSecureValue(storageKey: string): void {
  localStorage.removeItem(storageKey);
}