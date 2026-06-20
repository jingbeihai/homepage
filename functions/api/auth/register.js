export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const db = env.DB;
  const { username, password, display_name } = await request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) {
    return new Response(JSON.stringify({ error: '用户名已存在' }), {
      status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const result = await db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  ).bind(username, passwordHash, display_name || username).run();

  const token = crypto.randomUUID();
  await db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(result.meta.last_row_id, token).run();

  const user = await db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').bind(result.meta.last_row_id).first();

  return new Response(JSON.stringify({ user, token }), {
    status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
