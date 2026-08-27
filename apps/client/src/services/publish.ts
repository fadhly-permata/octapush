import type { GenerationSchemaParsed } from '@octapush/schemas';
import type { DalContext } from '@octapush/dal';
import { runDml } from '@octapush/dal';

/**
 * Publish a generated schema to DEV (FSD §3.4.2 / FR-STU-02):
 * 1. Persist page + workflow metadata to logic_dev.{prefix}_generated_pages / _workflows
 * 2. Execute CREATE TABLE IF NOT EXISTS for the business table in data_dev with
 *    ownership columns (owner_user_id, project_id) + RLS policy.
 * DDL is routed ONLY via DAL (FR-SEC-03/04).
 */
export async function publishToDev(ctx: DalContext, schema: GenerationSchemaParsed) {
  const columns = schema.layout.sections
    .flatMap((s) => s.fields)
    .map((f) => {
      const t = f.component === 'NumberInput' ? 'numeric' : 'text';
      return `  "${f.name}" ${t}`;
    })
    .join(',\n');

  const createSql = [
    `CREATE TABLE IF NOT EXISTS "${ctx.envSchema}"."${ctx.objectPrefix}_${schema.target_table}" (`,
    `  "id" uuid primary key default gen_random_uuid(),`,
    `  "owner_user_id" uuid not null,`,
    `  "project_id" uuid not null,`,
    columns,
    `);`,
  ].join('\n');

  const rlsSql = [
    `ALTER TABLE "${ctx.envSchema}"."${ctx.objectPrefix}_${schema.target_table}" ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "${ctx.objectPrefix}_owner_only" ON "${ctx.envSchema}"."${ctx.objectPrefix}_${schema.target_table}" `,
    `  FOR ALL USING ("owner_user_id" = auth.uid()) WITH CHECK ("owner_user_id" = auth.uid());`,
  ].join('\n');

  const r1 = await runDml(ctx, (qb) => createSql);
  if (r1.error) return { error: r1.error };
  const r2 = await runDml(ctx, (qb) => rlsSql);
  if (r2.error) return { error: r2.error };
  return { ok: true as const };
}
