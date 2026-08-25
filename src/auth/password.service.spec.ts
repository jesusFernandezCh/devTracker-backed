import { createHash, randomBytes } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();
    service = module.get(PasswordService);
  });

  it('hasea y verifica una clave con scrypt', async () => {
    const hash = await service.hash('secreto123');
    expect(hash.startsWith('scrypt:')).toBe(true);
    await expect(service.verify('secreto123', hash)).resolves.toBe(true);
    await expect(service.verify('otra-clave', hash)).resolves.toBe(false);
  });

  it('genera un hash distinto por cada llamada (salt aleatorio)', async () => {
    const a = await service.hash('clave');
    const b = await service.hash('clave');
    expect(a).not.toBe(b);
  });

  it('verifica claves legacy `salt:hash` (SHA-256 del frontend)', async () => {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(`${salt}:clave123`).digest('hex');
    const almacenada = `${salt}:${hash}`;
    await expect(service.verify('clave123', almacenada)).resolves.toBe(true);
    await expect(service.verify('mal', almacenada)).resolves.toBe(false);
    expect(service.esLegacy(almacenada)).toBe(true);
  });

  it('verifica claves legacy base64 (btoa del frontend)', async () => {
    const almacenada = Buffer.from('clave123').toString('base64');
    await expect(service.verify('clave123', almacenada)).resolves.toBe(true);
    await expect(service.esLegacy(almacenada)).toBe(true);
  });

  it('detecta claves modernas como no legacy', async () => {
    const hash = await service.hash('clave');
    expect(service.esLegacy(hash)).toBe(false);
  });
});
