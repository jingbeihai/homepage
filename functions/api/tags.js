export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;
  const result = await db.prepare('SELECT tags FROM notes').all();
  const tagSet = new Set();
  for (const row of result.results) {
    const tags = JSON.parse(row.tags || '[]');
    for (const t of tags) tagSet.add(t);
  }
  const tags = [...tagSet].sort();

  return new Response(JSON.stringify({ tags }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
