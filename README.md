# promptchecker.jp セットアップ手順

## 必要なもの
- GitHubアカウント（取得済み）
- Vercelアカウント（無料）→ https://vercel.com
- 各AIのAPIキー（後述）

---

## STEP 1: GitHubにアップロード

1. https://github.com/new にアクセス
2. Repository name: `promptchecker` と入力
3. Private を選択（APIキーを守るため）
4. 「Create repository」をクリック
5. 表示されるコマンドでこのフォルダをアップロード

---

## STEP 2: Vercelと繋ぐ

1. https://vercel.com にアクセスしてGitHubでログイン
2. 「Add New Project」→ `promptchecker` リポジトリを選択
3. 「Deploy」をクリック（そのまま）
4. 数分でデプロイ完了

---

## STEP 3: APIキーを設定する

Vercelの管理画面で：
1. プロジェクトを開く
2. Settings → Environment Variables
3. 以下の3つを追加：

| Name | Value | 取得先 |
|------|-------|--------|
| ANTHROPIC_API_KEY | sk-ant-... | https://console.anthropic.com/ |
| OPENAI_API_KEY | sk-... | https://platform.openai.com/api-keys |
| GEMINI_API_KEY | AIza... | https://aistudio.google.com/app/apikey |

4. 追加後、Deploymentタブから「Redeploy」

---

## STEP 4: promptchecker.jpのDNSをVercelに向ける

Vercelの管理画面で：
1. Settings → Domains
2. `promptchecker.jp` を追加
3. 表示されるDNSレコードをドメイン管理画面（お名前.com等）に設定

---

## APIキーの取得方法

### Claude（Anthropic）
1. https://console.anthropic.com/ にアクセス
2. 「API Keys」→「Create Key」
3. 最初は$5のクレジットが無料でもらえます

### ChatGPT（OpenAI）
1. https://platform.openai.com/api-keys にアクセス
2. 「Create new secret key」
3. 最初は$5のクレジットが無料でもらえます（期限あり）

### Gemini（Google）
1. https://aistudio.google.com/app/apikey にアクセス
2. 「APIキーを作成」
3. 完全無料枠があります

---

## 1回の分析コスト目安

10プロンプト × 3AI = 30回のAPI呼び出し
→ 約3〜8円/回（モデルにより変動）
