import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロンプトチェッカー | あなたのサイトはAIに引用されていますか？",
  description: "Claude・ChatGPT・Geminiの3つに実際に質問を投げ、あなたのサイトが引用されるか確認できるAIOチェッカーです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
