import * as CryptoJS from 'crypto-js';

export function encryptData(text: string, secretKey: string): string {
  if (!text || !secretKey) throw new Error("Invalid parameters for encryption");
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

export function decryptData(encryptedPayload: string, secretKey: string): string {
  if (!encryptedPayload || !secretKey) throw new Error("Invalid parameters for decryption");
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPayload, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error("Malformed payload or wrong key");
    return decrypted;
  } catch (e) {
    throw new Error("Malformed payload or wrong key");
  }
}
