import { encryptData, decryptData } from '../utils/crypto';

describe('Crypto Functions', () => {
  const SECRET_KEY = "test-secret-key-12345";
  const PLAINTEXT = "HolaMundo123!";

  it('debería encriptar el texto correctamente sin que sea igual al original', () => {
    const encrypted = encryptData(PLAINTEXT, SECRET_KEY);
    
    expect(encrypted).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
    expect(encrypted).not.toBe(PLAINTEXT);
  });

  it('debería desencriptar correctamente el texto encriptado', () => {
    const encrypted = encryptData(PLAINTEXT, SECRET_KEY);
    const decrypted = decryptData(encrypted, SECRET_KEY);
    
    expect(decrypted).toBe(PLAINTEXT);
  });

  it('debería arrojar error si la clave secreta es incorrecta', () => {
    const encrypted = encryptData(PLAINTEXT, SECRET_KEY);
    
    expect(() => {
      decryptData(encrypted, "wrong-key");
    }).toThrow("Malformed payload or wrong key");
  });

  it('debería arrojar error si el texto encriptado es alterado', () => {
    const encrypted = encryptData(PLAINTEXT, SECRET_KEY);
    // Alteramos el payload para simular corrupción
    const corruptedPayload = encrypted.substring(0, encrypted.length - 2) + "==";
    
    expect(() => {
      decryptData(corruptedPayload, SECRET_KEY);
    }).toThrow("Malformed payload or wrong key");
  });
});
