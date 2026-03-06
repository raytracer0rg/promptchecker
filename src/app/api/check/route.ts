import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { domain, description } = await req.json();

  if (!domain || !description) {
    return NextResponse.json({ error: "domain and description are required" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `以下のウェブサイトについて、実際のユーザーがAIアシスタントに質問しそうなプロンプトを10個生成してください。

サイトURL: ${domain}
サイトの内容・テーマ: ${description}

条件：
- このサイトが回答の中で引用・紹介される可能性が高い質問にすること
- 実際にユーザーが検索・質問する自然な日本語にすること
- サイトのテーマに直接関連する具体的な質問にすること
- ドメイン名を直接含む質問は除外すること

JSON配列のみで返してください（説明文不要）：
["質問1", "質問2", "質問3", "質問4", "質問5", "質問6", "質問7", "質問8", "質問9", "質問10"]`
      }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const match = text.match(/\[[\s\S]*\]/);
    const prompts = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ prompts });
  } catch {
    return NextResponse.json({ error: "parse error" }, { status: 500 });
  }
}
