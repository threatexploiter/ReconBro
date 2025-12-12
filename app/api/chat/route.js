// app/api/openai/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message } = await req.json();

    // Protect: only server-side code uses the API key
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
    }

    // Example simple text request (adjust to actual OpenAI endpoint + body)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // example — use whichever model you have access to
        messages: [{ role: 'user', content: message }],
        max_tokens: 500,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('openai error', resp.status, t);
      return NextResponse.json({ error: 'OpenAI error' }, { status: 502 });
    }

    const data = await resp.json();
    // extract assistant reply (depends on API response shape)
    const reply = data?.choices?.[0]?.message?.content ?? 'No reply';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
