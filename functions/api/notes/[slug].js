export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;
  const { slug } = params;

  function getUserId(request) {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  }

  async function getUserFilter() {
    const token = getUserId(request);
    if (!token) return null;
    const session = await db.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(token).first();
    return session ? session.user_id : null;
  }

  if (request.method === 'GET') {
    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();
    if (!note) {
      return new Response(JSON.stringify({ error: '笔记不存在' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const { title, category, content } = body;
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }

    if (!updates.length) {
      return new Response(JSON.stringify({ error: '没有要更新的字段' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    updates.push("updated_at = datetime('now')");
    params.push(slug);

    const userId = await getUserFilter();
    let sql = `UPDATE notes SET ${updates.join(', ')} WHERE slug = ?`;
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    const result = await db.prepare(sql).bind(...params).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '笔记不存在或无权修改' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'DELETE') {
    const userId = await getUserFilter();
    let sql = 'DELETE FROM notes WHERE slug = ?';
    const params = [slug];
    if (userId) { sql += ' AND user_id = ?'; params.push(userId); }
    const result = await db.prepare(sql).bind(...params).run();
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '笔记不存在' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}
