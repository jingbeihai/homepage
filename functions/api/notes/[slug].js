export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;
  const { slug } = params;

  if (request.method === 'GET') {
    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();
    if (!note) {
      return new Response(JSON.stringify({ error: '笔记不存在' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    note.tags = JSON.parse(note.tags || '[]');
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const { title, category, content, tags } = body;
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }

    if (!updates.length) {
      return new Response(JSON.stringify({ error: '没有要更新的字段' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    updates.push("updated_at = datetime('now')");
    params.push(slug);

    await db.prepare(
      `UPDATE notes SET ${updates.join(', ')} WHERE slug = ?`
    ).bind(...params).run();

    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();
    note.tags = JSON.parse(note.tags || '[]');
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'DELETE') {
    const result = await db.prepare('DELETE FROM notes WHERE slug = ?').bind(slug).run();
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
