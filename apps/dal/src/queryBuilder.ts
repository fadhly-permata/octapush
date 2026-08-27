import type { DalContext } from './client';
import { safeQualify } from '@octapush/utils';
import { AppError } from '@octapush/types';

export type DmlVerb = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * QueryBuilderService (FSD §3.1.5 rule 2):
 * All DDL/DML MUST pass through here. Business table references are
 * automatically qualified with the active project prefix + environment schema.
 *
 * e.g. "SELECT * FROM tbl_penjualan"
 *   -> 'data_dev"."u1a2b3c4_p9f8e7d6_tbl_penjualan'
 */
export class QueryBuilder {
  constructor(private ctx: DalContext) {}

  /** Resolve a logical table name to its fully-qualified, prefixed identifier. */
  qualify(objectName: string): string {
    const schema = this.ctx.envSchema;
    const bare = safeQualify(this.ctx.objectPrefix, objectName);
    return `${schema}.${bare}`;
  }

  select(columns: string, fromLogical: string, where = ''): string {
    const from = this.qualify(fromLogical);
    const w = where ? ` WHERE ${where}` : '';
    return `SELECT ${columns} FROM ${from}${w}`;
  }

  insertInto(fromLogical: string, columns: string, values: string): string {
    const into = this.qualify(fromLogical);
    return `INSERT INTO ${into} (${columns}) VALUES (${values})`;
  }

  update(fromLogical: string, set: string, where = ''): string {
    const into = this.qualify(fromLogical);
    const w = where ? ` WHERE ${where}` : '';
    return `UPDATE ${into} SET ${set}${w}`;
  }

  deleteFrom(fromLogical: string, where = ''): string {
    const from = this.qualify(fromLogical);
    const w = where ? ` WHERE ${where}` : '';
    return `DELETE FROM ${from}${w}`;
  }
}

export function queryBuilder(ctx: DalContext): QueryBuilder {
  return new QueryBuilder(ctx);
}

export function notImplemented(verb: DmlVerb): never {
  throw new AppError({ code: 'ERR_DAL_002', message: `verb not implemented: ${verb}` });
}
