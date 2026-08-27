import { createHash } from 'crypto';

export const PREFIX_SEPARATOR = '_';

/**
 * Build the canonical object prefix `{user_short_uuid}_{project_uuid}`.
 * Both inputs MUST be lowercase 8-char hex per FSD §4.1 / BRD §6.1.
 */
export function buildObjectPrefix(userShortUuid: string, projectUuid: string): string {
  return `${userShortUuid}${PREFIX_SEPARATOR}${projectUuid}`;
}

/**
 * Prepend the project object prefix to a logical DB object name.
 * e.g. ("u1a2b3c4", "p9f8e7d6", "tbl_penjualan")
 *   => "u1a2b3c4_p9f8e7d6_tbl_penjualan"
 */
export function qualifyObject(prefix: string, objectName: string): string {
  return `${prefix}${PREFIX_SEPARATOR}${objectName}`;
}

/**
 * PostgreSQL identifier max = 63 chars. Prefix `{usr8}_{prj8}_` = 17 chars,
 * so object name MUST be <= 46 chars (FSD §3.1.5 rule 6, R2).
 * If exceeded, apply deterministic hash-truncate to keep uniqueness.
 */
export const MAX_PREFIX_LEN = 17;
export const MAX_OBJECT_NAME_LEN = 46;
export const MAX_IDENTIFIER_LEN = 63;

export function validateObjectName(objectName: string): void {
  if (objectName.length > MAX_OBJECT_NAME_LEN) {
    throw new Error(
      `Object name "${objectName}" (${objectName.length}) exceeds ${MAX_OBJECT_NAME_LEN} char limit`,
    );
  }
  if (!/^[a-z0-9_]+$/.test(objectName)) {
    throw new Error(`Object name "${objectName}" must be lowercase alphanumeric/underscore`);
  }
}

export function hashTruncateObjectName(objectName: string): string {
  const hash = createHash('sha1').update(objectName).digest('hex').slice(0, 8);
  const keep = objectName.slice(0, MAX_OBJECT_NAME_LEN - hash.length - 1);
  return `${keep}_${hash}`;
}

export function safeQualify(prefix: string, objectName: string): string {
  const trimmed = objectName.length > MAX_OBJECT_NAME_LEN ? hashTruncateObjectName(objectName) : objectName;
  validateObjectName(trimmed);
  const full = qualifyObject(prefix, trimmed);
  if (full.length > MAX_IDENTIFIER_LEN) {
    throw new Error(`Qualified identifier "${full}" exceeds ${MAX_IDENTIFIER_LEN} chars`);
  }
  return full;
}

/**
 * Verify a qualified object name actually belongs to the active prefix.
 * Used by DAL/SQL Guard to reject cross-tenant references (FR-SEC-05, FSD §3.1.5).
 */
export function belongsToPrefix(qualifiedObject: string, prefix: string): boolean {
  return qualifiedObject === prefix || qualifiedObject.startsWith(`${prefix}${PREFIX_SEPARATOR}`);
}
