/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:encrypted-data' {
  import type { EncryptedPayload } from '../build/encrypt-plugin';

  export const encryptedData: EncryptedPayload;
}