export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('q');
    let sql = 'SELECT id, title, slug, category, date, tags FROM notes';
    const params = [];
    const conditions = [];

    if (tag) {
      conditions.push('tags LIKE ?');
      params.push(`%"${tag}"%`);
    }
    if (search) {
      conditions.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date DESC';

    const result = await db.prepare(sql).bind(...params).all();
    const notes = result.results.map(n => ({
      ...n,
      tags: JSON.parse(n.tags || '[]'),
    }));

    return new Response(JSON.stringify(notes), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const { title, category, content, tags } = body;
    if (!title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const slug = makeSlug(title) + '-' + Date.now();
    const date = todayStr();
    const tagsJson = JSON.stringify(tags || []);

    await db.prepare(
      'INSERT INTO notes (title, slug, category, date, content, tags) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(title, slug, category || '未分类', date, content || '', tagsJson).run();

    const note = await db.prepare('SELECT * FROM notes WHERE slug = ?').bind(slug).first();
    note.tags = JSON.parse(note.tags || '[]');

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
