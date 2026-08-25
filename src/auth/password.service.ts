import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Parámetros scrypt (OWASP). N=2^15, r=8, p=1, clave de 64 bytes.
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
// maxmem explícito: 128*N*r = 32 MiB; OpenSSL por defecto lo rechaza al límite.
const SCRYPT_MAXMEM = 128 * SCRYPT_N * SCRYPT_R * 2;

function scryptDerive(
  password: string,
  salt: Buffer,
  keylen: number,
  N: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, { N, r, p, maxmem: SCRYPT_MAXMEM }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

/**
 * Gestión de contraseñas.
 *
 * Formatos soportados al verificar:
 *  - `scrypt:<saltHex>:<hashHex>`  → hash KDF de Node (formato actual)
 *  - `<saltHex>:<sha256Hex>`       → formato legacy `utils/cripto.ts` del frontend (SHA-256)
 *  - base64 (sin `:`)              → formato legacy antiguo (`btoa`)
 *
 * El formato scrypt no usa dependencias nativas (a diferencia de argon2/bcrypt),
 * por lo que funciona en cualquier plataforma.
 */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await scryptDerive(password, salt, SCRYPT_KEYLEN, SCRYPT_N, SCRYPT_R, SCRYPT_P);
    return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  async verify(password: string, almacenada: string): Promise<boolean> {
    if (almacenada.startsWith('scrypt:')) {
      const [, saltHex, hashHex] = almacenada.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const esperado = Buffer.from(hashHex, 'hex');
      const derivado = await scryptDerive(
        password,
        salt,
        esperado.length,
        SCRYPT_N,
        SCRYPT_R,
        SCRYPT_P,
      );
      return esperado.length === derivado.length && timingSafeEqual(esperado, derivado);
    }

    // Formatos legacy del frontend.
    if (almacenada.includes(':')) {
      const separador = almacenada.indexOf(':');
      const salt = almacenada.slice(0, separador);
      const hash = almacenada.slice(separador + 1);
      const calculado = createHash('sha256').update(`${salt}:${password}`).digest('hex');
      return hash === calculado;
    }

    // base64 legacy: `btoa(password)`.
    try {
      return Buffer.from(almacenada, 'base64').toString('utf8') === password;
    } catch {
      return false;
    }
  }

  /** True si la clave almacenada usa el formato legacy (SHA-256 o base64) y conviene re-hashearla. */
  esLegacy(almacenada: string): boolean {
    return !almacenada.startsWith('scrypt:');
  }
}
