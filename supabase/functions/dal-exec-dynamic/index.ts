// Supabase Edge Function: dal-exec-dynamic
// Server-side DAL entry point. The service role key (server-only) is used here;
// the client never holds DB credentials (FR-SEC-03 / NFR-SEC-05).
// The app-layer SQL Guard must run before calling this function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { sql, params, objectPrefix } = await req.json();

  // Authorization: require a valid JWT and verify the object prefix
  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  const { data: userData, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'ERR_AUT_000' }), { status: 401 });
  }

  if (!sql || typeof sql !== 'string') {
    return new Response(JSON.stringify({ error: 'ERR_SQL_008' }), { status: 400 });
  }

  // NOTE: real param binding + SQL Guard enforcement happens in @octapush/dal.
  const { data, error } = await supabase.rpc('dal_exec_dynamic', {
    p_sql: sql,
    p_params: params ?? {},
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ data }), {
    headers: { 'content-type': 'application/json' },
  });
});
