export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const db = env.DB;
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const session = await db.prepare(
    'SELECT u.id, u.username, u.display_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?'
  ).bind(token).first();

  return new Response(JSON.stringify({ user: session || null }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
