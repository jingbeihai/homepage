export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'GET') {
    const db = env.DB;
    const result = await db.prepare('SELECT tags FROM notes').all();
    const tagSet = new Set();
    result.results.forEach(row => {
      try {
        JSON.parse(row.tags || '[]').forEach(t => tagSet.add(t));
      } catch(e) {}
    });
    const tags = [...tagSet].sort();
    const counts = {};
    result.results.forEach(row => {
      try {
        JSON.parse(row.tags || '[]').forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      } catch(e) {}
    });
    return new Response(JSON.stringify({ tags, counts }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
