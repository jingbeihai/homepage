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
  const { username, password } = await request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (user.password_hash !== passwordHash) {
    return new Response(JSON.stringify({ error: '密码错误' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const token = crypto.randomUUID();
  await db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(user.id, token).run();

  return new Response(JSON.stringify({
    user: { id: user.id, username: user.username, display_name: user.display_name },
    token,
  }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
