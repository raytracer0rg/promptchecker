"use client";
import { useState } from "react";

type AIResult = { answer: string; cited: boolean };
type PromptResult = {
  prompt: string;
  claude: AIResult;
  gpt: AIResult;
  gemini: AIResult;
};
type FinalResult = {
  domain: string;
  results: PromptResult[];
};

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  }
}

const AI_LABELS = [
  { key: "claude",  label: "Claude",   color: "#e8a87c" },
  { key: "gpt",     label: "ChatGPT",  color: "#74c69d" },
  { key: "gemini",  label: "Gemini",   color: "#74b3ce" },
] as const;

export default function Home() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageText, setStageText] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    const trimUrl = url.trim();
    const trimDesc = description.trim();
    if (!trimUrl || !trimDesc) return;

    setLoading(true);
    setResult(null);
    setError("");
    setProgress(0);

    const domain = extractDomain(trimUrl);

    try {
      // Step1: プロンプト生成
      setStageText("関連プロンプトを生成中...");
      const genRes = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimUrl, description: trimDesc }),
      });
      const genData = await genRes.json();
      const prompts: string[] = genData.prompts || [];
      if (prompts.length === 0) throw new Error("プロンプト生成失敗");

      // Step2: 各プロンプトを3AIに並列で投げる
      const results: PromptResult[] = [];
      for (let i = 0; i < prompts.length; i++) {
        setStageText(`「${prompts[i].slice(0, 20)}...」を確認中`);
        setProgress(Math.round(((i) / prompts.length) * 100));

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompts[i], domain }),
        });
        const data = await res.json();
        results.push({ prompt: prompts[i], ...data });
      }

      setProgress(100);
      setResult({ domain, results });
    } catch {
      setError("分析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
      setStageText("");
    }
  };

  // 集計
  const citedCount = (key: "claude" | "gpt" | "gemini") =>
    result?.results.filter(r => r[key].cited).length ?? 0;

  return (
    <main style={{
      minHeight: "100vh", background: "#f7f6f2",
      fontFamily: "'Noto Sans JP', sans-serif", padding: "48px 20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 2px #1a1a1a; }
        button:hover:not(:disabled) { opacity: 0.85; }
        button:active:not(:disabled) { transform: scale(0.98); }
        .fade { animation: fadeUp 0.5s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        textarea { resize: vertical; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-block", background: "#1a1a1a", color: "#f7f6f2",
            fontSize: 10, letterSpacing: 3, padding: "4px 12px", borderRadius: 2,
            marginBottom: 16, fontFamily: "'DM Mono', monospace",
          }}>
            AIO CHECKER — promptchecker.jp
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4, marginBottom: 8 }}>
            あなたのサイトは<br />AIに引用されていますか？
          </h1>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7 }}>
            Claude・ChatGPT・Gemini の3つに実際に質問を投げ、あなたのサイトが引用されるか確認します。
          </p>
        </div>

        {/* 入力フォーム */}
        {!result && (
          <div style={{
            background: "#fff", border: "1.5px solid #1a1a1a",
            borderRadius: 12, padding: 24, marginBottom: 16,
          }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 8 }}>
                チェックしたいURL
              </label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8,
                  padding: "11px 14px", fontSize: 14,
                  fontFamily: "'DM Mono', monospace", color: "#1a1a1a", background: "#fafafa",
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 8 }}>
                サイトのテーマ・内容
                <span style={{ color: "#bbb", marginLeft: 8 }}>（具体的に書くほど精度が上がります）</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="例：AIO（AI最適化）・LLMO・GEO対策の情報を発信する日本語メディア。企業サイトがClaudeやChatGPTなどのAIに引用されるための方法を解説している。"
                rows={4}
                style={{
                  width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8,
                  padding: "11px 14px", fontSize: 14, color: "#1a1a1a", background: "#fafafa",
                  lineHeight: 1.7, fontFamily: "'Noto Sans JP', sans-serif",
                }}
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url.trim() || !description.trim()}
              style={{
                width: "100%", border: "none", borderRadius: 8, padding: "14px",
                fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                background: loading || !url.trim() || !description.trim() ? "#e0e0e0" : "#1a1a1a",
                color: loading || !url.trim() || !description.trim() ? "#999" : "#f7f6f2",
              }}
            >
              {loading ? "確認中..." : "3つのAIで一斉チェック →"}
            </button>
          </div>
        )}

        {/* プログレス */}
        {loading && (
          <div style={{
            background: "#fff", border: "1.5px solid #e0e0e0",
            borderRadius: 12, padding: 24, marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>{stageText}</div>
            <div style={{ background: "#f0f0f0", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                width: `${progress}%`, height: "100%", background: "#1a1a1a",
                borderRadius: 99, transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#bbb", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>
              {progress}%
            </div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div style={{
            background: "#fff0f0", border: "1px solid #fca5a5",
            borderRadius: 10, padding: 16, color: "#dc2626", fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* 結果 */}
        {result && (
          <div className="fade">

            {/* AI別スコア */}
            <div style={{
              background: "#1a1a1a", borderRadius: 12, padding: 24,
              marginBottom: 16, display: "flex",
            }}>
              {AI_LABELS.map((ai, i) => (
                <div key={ai.key} style={{
                  flex: 1, textAlign: "center", position: "relative",
                }}>
                  {i > 0 && <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: 1, background: "#333" }} />}
                  <div style={{ fontSize: 11, color: ai.color, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
                    {ai.label}
                  </div>
                  <div style={{
                    fontSize: 40, fontWeight: 700, color: "#f7f6f2",
                    fontFamily: "'DM Mono', monospace", lineHeight: 1,
                  }}>
                    {citedCount(ai.key)}
                    <span style={{ fontSize: 16, color: "#555" }}>/10</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                    {Math.round((citedCount(ai.key) / (result.results.length || 1)) * 100)}%
                  </div>
                </div>
              ))}
            </div>

            {/* プロンプト別結果 */}
            {result.results.map((item, i) => {
              const anyCited = item.claude.cited || item.gpt.cited || item.gemini.cited;
              return (
                <div key={i} style={{
                  background: "#fff",
                  border: `1.5px solid ${anyCited ? "#1a1a1a" : "#e0e0e0"}`,
                  borderRadius: 12, padding: 20, marginBottom: 12,
                }}>
                  {/* プロンプト */}
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.6, marginBottom: 14 }}>
                    「{item.prompt}」
                  </div>

                  {/* AI別結果 */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {AI_LABELS.map(ai => (
                      <div key={ai.key} style={{
                        flex: 1,
                        background: item[ai.key].cited ? ai.color + "18" : "#f5f5f5",
                        border: `1px solid ${item[ai.key].cited ? ai.color + "66" : "#e0e0e0"}`,
                        borderRadius: 8, padding: "8px 10px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 11, color: item[ai.key].cited ? ai.color : "#bbb", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                          {ai.label}
                        </div>
                        <div style={{ fontSize: 18 }}>
                          {item[ai.key].cited ? "✓" : "✗"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 引用があった場合の回答抜粋 */}
                  {anyCited && (
                    <div style={{ marginTop: 12 }}>
                      {AI_LABELS.filter(ai => item[ai.key].cited).map(ai => (
                        <div key={ai.key} style={{
                          background: "#f7f6f2", borderRadius: 8, padding: "8px 12px",
                          marginBottom: 6, borderLeft: `3px solid ${ai.color}`,
                          fontSize: 12, color: "#666", lineHeight: 1.7,
                        }}>
                          <span style={{ color: ai.color, fontFamily: "'DM Mono', monospace", fontSize: 11, marginRight: 6 }}>
                            {ai.label}
                          </span>
                          {item[ai.key].answer}{item[ai.key].answer.length >= 200 ? "…" : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* リセット */}
            <button
              onClick={() => { setResult(null); setUrl(""); setDescription(""); }}
              style={{
                width: "100%", background: "transparent", border: "1.5px solid #1a1a1a",
                borderRadius: 8, padding: "12px", fontSize: 14, color: "#1a1a1a",
                fontWeight: 500, cursor: "pointer", marginBottom: 16, transition: "all 0.15s",
              }}
            >
              別のURLをチェックする
            </button>

            <div style={{ textAlign: "center", color: "#bbb", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
              ※ 各AIの学習データに基づく実測結果です
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
