import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SYSTEM_PROMPT = `
You are a JSON-only assistant for an automated recon system.

Your role is ONLY to decide whether to start recon.

Output exactly one JSON object.

Schema:
{
  "action": "none | start_recon",
  "targets": ["array of URLs or domains"],
  "confirm": "short human-friendly confirmation message"
}

Rules:
- If the user provides one or more URLs or domains, set action = "start_recon" and include them in targets.
- Accept multiple URLs separated by spaces or newlines.
- If the user greets, return action = "none" with a greeting.
- If input is unclear, return action = "none" and ask for clarification.

Important:
- Do not decide platform.
- Do not scrape.
- Do not explain.
- Output ONLY valid JSON.
`;

async function callOpenAI(userMessage) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      temperature: 0
    })
  });

  const json = await res.json();
  return json.choices[0].message.content;
}
export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ ok: false });
    }

    const aiText = await callOpenAI(message);
    const clean = aiText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.action !== "start_recon") {
      return NextResponse.json({
        ok: true,
        reply: parsed.confirm || "Okay."
      });
    }

    const targets = Array.isArray(parsed.targets)
      ? parsed.targets
          .map(t => t.trim())
          .filter(t => t.startsWith("http"))
      : [];

    if (!targets.length) {
      return NextResponse.json({
        ok: true,
        reply: "Please provide valid program URLs (starting with http/https)."
      });
    }

    await fetch(new URL("/api/scrape", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: targets })
    });

    return NextResponse.json({
      ok: true,
      reply: "🛠️ Scope scraping started. Results will appear in output folders."
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      ok: false,
      reply: "Failed to start recon."
    });
  }
}
