import { NextRequest, NextResponse } from "next/server";

// Claudeに投げる
async function askClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ChatGPTに投げる
async function askChatGPT(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Geminiに投げる
async function askGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600 }
      })
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function isMentioned(text: string, domain: string): boolean {
  const lower = text.toLowerCase();
  const d = domain.toLowerCase();
  return lower.includes(d) || lower.includes("www." + d);
}

export async function POST(req: NextRequest) {
  const { prompt, domain } = await req.json();
  if (!prompt || !domain) {
    return NextResponse.json({ error: "prompt and domain are required" }, { status: 400 });
  }

  // 3つのAIに並列で投げる
  const [claudeAnswer, gptAnswer, geminiAnswer] = await Promise.allSettled([
    askClaude(prompt),
    askChatGPT(prompt),
    askGemini(prompt),
  ]);

  const claude = claudeAnswer.status === "fulfilled" ? claudeAnswer.value : "";
  const gpt = gptAnswer.status === "fulfilled" ? gptAnswer.value : "";
  const gemini = geminiAnswer.status === "fulfilled" ? geminiAnswer.value : "";

  return NextResponse.json({
    claude: { answer: claude.slice(0, 200), cited: isMentioned(claude, domain) },
    gpt:    { answer: gpt.slice(0, 200),    cited: isMentioned(gpt, domain) },
    gemini: { answer: gemini.slice(0, 200), cited: isMentioned(gemini, domain) },
  });
}
