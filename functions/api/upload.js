export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  if (!env.R2) {
    return new Response(JSON.stringify({ error: 'R2 未绑定' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) {
    return new Response(JSON.stringify({ error: '未选择文件' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const ext = file.name.split('.').pop() || 'bin';
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `/api/upload/${key}`;

  return new Response(JSON.stringify({ url, key, name: file.name }), {
    status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
