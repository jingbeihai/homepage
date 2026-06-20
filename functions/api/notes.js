function getUserId(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const token = getUserId(request);
    let sql = 'SELECT id, title, slug, category, date FROM notes';
    const params = [];
    const conditions = [];

    if (token) {
      const session = await db.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(token).first();
      if (session) {
        conditions.push('user_id = ?');
        params.push(session.user_id);
      }
    }

    if (search) {
      conditions.push('(title LIKE ? OR content LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date DESC';

    const result = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(result.results), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const { title, category, content } = body;
    if (!title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let userId = 1;
    const token = getUserId(request);
    if (token) {
      const session = await db.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(token).first();
      if (session) userId = session.user_id;
    }

    const slug = makeSlug(title) + '-' + Date.now();
    const date = todayStr();

    await db.prepare(
      'INSERT INTO notes (user_id, title, slug, category, date, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, title, slug, category || '未分类', date, content || '').run();

    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();

    return new Response(JSON.stringify(note), {
      status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'note';
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
