import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
You are a JSON-only assistant for an automated recon system.

Your job is ONLY to extract URLs or domains provided by the user.

Output exactly ONE JSON object.

Schema:
{
  "action": "none | start_recon",
  "targets": ["array of URLs"],
  "confirm": "short confirmation message"
}

Rules:
- If the user provides one or more URLs, set action = "start_recon"
- Extract ALL URLs (space or newline separated)
- Do NOT scrape
- Do NOT run recon
- Do NOT explain
- Output ONLY valid JSON
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

    if (parsed.action !== "start_recon" || !parsed.targets?.length) {
      return NextResponse.json({
        ok: true,
        reply: parsed.confirm || "Waiting for targets."
      });
    }

    // ✅ CORRECT KEY: targets
    await fetch(new URL("/api/scrape", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targets: parsed.targets
      })
    });

    return NextResponse.json({
      ok: true,
      reply: "Scope scraping started. Results will appear in output folders."
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      ok: false,
      reply: "Failed to start scraping."
    });
  }
}
