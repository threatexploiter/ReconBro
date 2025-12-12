export async function GET(req) {
  return new Response(JSON.stringify({ ok: true, now: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
