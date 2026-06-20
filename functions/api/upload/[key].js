export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const { key } = params;
  const fullKey = 'uploads/' + key;

  if (!env.R2) {
    return new Response('R2 not bound', { status: 500 });
  }

  const object = await env.R2.get(fullKey);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}
