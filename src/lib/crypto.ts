import CryptoJS from 'crypto-js';
import { DecryptedSignaturePayload } from '../types';

// The pre-defined admin PIN for decryption
export const ADMIN_PIN = 'sppd2026';

/**
 * Calculates a SHA256 hash of document fields to act as a tamper-proof fingerprint.
 */
export function calculateDocumentHash(data: any): string {
  const serialized = JSON.stringify({
    nomor: data.nomor,
    nama: data.namaPegawai || (data.tugaskanKepada && data.tugaskanKepada[0]?.nama),
    tujuan: data.tempatTujuan,
    tanggalBerangkat: data.tanggalBerangkat,
    tanggalKembali: data.tanggalKembali,
  });
  return CryptoJS.SHA256(serialized).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypts the digital signature payload using a PIN (defaults to admin PIN).
 */
export function encryptSignature(payload: DecryptedSignaturePayload, pin: string = ADMIN_PIN): string {
  const jsonString = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(jsonString, pin).toString();
}

/**
 * Decrypts the digital signature payload using the user-provided PIN.
 * Returns null if decryption fails or PIN is incorrect.
 */
export function decryptSignature(encryptedString: string, pin: string): DecryptedSignaturePayload | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, pin);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;
    
    const payload = JSON.parse(decryptedText) as DecryptedSignaturePayload;
    // Verify that it is a valid signature payload
    if (payload && (payload.type === 'SPPD' || payload.type === 'SPT') && payload.docId) {
      return payload;
    }
    return null;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
