# AI記事自動生成システム

GeminiでテーマをAI生成 → Claudeで記事をAI生成 → Notionに保存 → コピペ投稿するだけ！

```
テーマ自動生成(Gemini) → 記事自動生成(Claude) → Notion保存 → あなたがnoteに投稿
      ↑_________________________毎日自動実行(Vercel Cron)_________________________↑
```

---

## フォルダ構成

```
ai-note-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-theme/route.ts   # テーマ生成API
│   │   │   ├── generate-article/route.ts # 記事生成API
│   │   │   ├── cron/route.ts             # Vercel Cron エンドポイント
│   │   │   └── articles/
│   │   │       ├── route.ts              # 記事一覧API
│   │   │       └── [id]/route.ts         # 記事詳細API
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # メイン画面
│   │   └── page.module.css
│   ├── components/
│   │   ├── Header.tsx / .module.css
│   │   ├── ArticleCard.tsx / .module.css
│   │   ├── ArticleDetail.tsx / .module.css
│   │   └── Toast.tsx / .module.css
│   └── lib/
│       ├── notion.ts   # Notion API ラッパー
│       ├── gemini.ts   # Gemini テーマ生成
│       └── claude.ts   # Claude 記事生成
├── .env.local          # ← 自分で作成（Gitに入れない！）
├── .env.local.example  # 環境変数テンプレート
├── vercel.json         # Vercel Cron 設定（毎日JST10時）
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## セットアップ手順

### ステップ1：プロジェクトのセットアップ

```bash
# プロジェクトフォルダに移動
cd ai-note-generator

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local
```

---

### ステップ2：Notion のセットアップ

#### 2-1. Notion インテグレーションを作成

1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」をクリック
3. 名前：`AI記事ジェネレーター`（任意）
4. 「送信」→ **シークレットキー** をコピー → `.env.local` の `NOTION_API_KEY` に貼り付け

#### 2-2. Notion データベースを作成

Notion で新しいデータベース（テーブル）を作成し、以下のプロパティを追加：

| プロパティ名 | 種類 | 備考 |
|------------|------|------|
| タイトル | タイトル | デフォルトで存在 |
| ステータス | セレクト | 選択肢：`未作成`・`生成済`・`投稿済` |
| 本文 | テキスト | |
| タイトル案 | テキスト | |
| 作成日 | 日付 | |

#### 2-3. インテグレーションをデータベースに接続

1. データベースのページを開く
2. 右上の「...」→「接続先」→ 作成したインテグレーションを選択

#### 2-4. データベース ID を取得

データベースの URL から ID を取得：
```
https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      この32文字がデータベースID
```
→ `.env.local` の `NOTION_DATABASE_ID` に貼り付け

---

### ステップ3：Gemini API キーの取得

1. https://aistudio.google.com/app/apikey にアクセス（Google アカウントでログイン）
2. 「APIキーを作成」をクリック
3. キーをコピー → `.env.local` の `GEMINI_API_KEY` に貼り付け

> 無料枠で十分使えます（1日50リクエスト程度）

---

### ステップ4：Anthropic（Claude）API キーの取得

1. https://console.anthropic.com にアクセス
2. 「API Keys」→ 「Create Key」
3. キーをコピー → `.env.local` の `ANTHROPIC_API_KEY` に貼り付け

---

### ステップ5：環境変数を設定

`.env.local` を以下のように記入：

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=my-secret-2024  # 任意の文字列（英数字推奨）
```

---

### ステップ6：ローカルで動作確認

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

**動作確認手順：**
1. ヘッダーの「テーマ生成」をクリック → Notionにテーマが追加されることを確認
2. 「記事生成」をクリック → 1〜2分待つ → 記事が生成されることを確認
3. 記事一覧から記事を選択 → 本文が表示されることを確認
4. 「本文をコピー」をクリック → クリップボードにコピーされることを確認

---

## Vercel へのデプロイ手順

### 1. GitHub にプッシュ

```bash
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/ai-note-generator.git
git push -u origin main
```

### 2. Vercel でデプロイ

1. https://vercel.com にアクセス（GitHub アカウントでログイン）
2. 「New Project」→ GitHub リポジトリを選択
3. 「Deploy」をクリック

### 3. 環境変数を Vercel に設定

Vercel のプロジェクト設定 → 「Environment Variables」で以下を追加：

```
NOTION_API_KEY        = secret_xxx...
NOTION_DATABASE_ID    = xxx...
GEMINI_API_KEY        = AIzaSy...
ANTHROPIC_API_KEY     = sk-ant-...
CRON_SECRET           = my-secret-2024
```

### 4. Vercel Cron の確認

デプロイ後、Vercel のダッシュボード → 「Cron Jobs」タブで  
`/api/cron` が毎日 01:00 UTC（JST 10:00）に設定されていることを確認。

> **注意：** Vercel Cron は **Vercel Pro プラン** が必要です。
> 無料プランの場合は、手動で「テーマ生成」→「記事生成」ボタンを押してください。

---

## 毎日の使い方フロー

```
毎朝10時（自動）
  ↓ Vercel Cron が /api/cron を実行
  ↓ Gemini がテーマを生成 → Notion に保存
  ↓ Claude が記事を生成 → Notion に保存

あなたがやること（5分以内）
  1. ブラウザで http://あなたのドメイン.vercel.app を開く
  2. 生成済の記事を選ぶ
  3. タイトル案から好きなタイトルをコピー
  4. 「本文をコピー」ボタンをクリック
  5. note の投稿画面に貼り付けて投稿！
```

---

## API エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|--------------|--------|------|
| `GET  /api/articles` | GET | 記事一覧取得 |
| `GET  /api/articles/:id` | GET | 記事詳細取得 |
| `POST /api/generate-theme` | POST | テーマ生成（Gemini） |
| `POST /api/generate-article` | POST | 記事生成（Claude） |
| `GET  /api/cron` | GET | 毎日の自動実行 |

---

## トラブルシューティング

### 「記事が取得できない」
→ Notion インテグレーションがデータベースに接続されているか確認

### 「テーマが生成されない」
→ GEMINI_API_KEY が正しいか確認。Google AI Studio で有効化されているか確認

### 「記事が生成されない」
→ ANTHROPIC_API_KEY が正しいか確認。残高があるか確認（https://console.anthropic.com）

### 「Notion に保存されない」  
→ NOTION_DATABASE_ID のプロパティ名が正確か確認（日本語のプロパティ名は完全一致が必要）

### 文字数が足りない
→ Notion の rich_text は1ブロック2000字制限があるため、本システムでは自動分割して保存しています
