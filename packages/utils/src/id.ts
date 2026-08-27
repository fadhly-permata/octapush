import { randomBytes, randomUUID } from 'crypto';

const HEX = '0123456789abcdef';

/** Generate an 8-char lowercase hex string for user_short_uuid / project_uuid (FSD §4.1). */
export function shortUuid8(): string {
  const bytes = randomBytes(4);
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += HEX[(bytes[i] >> 4) & 0xf];
    out += HEX[bytes[i] & 0xf];
  }
  return out;
}

export function uuid(): string {
  return randomUUID();
}
