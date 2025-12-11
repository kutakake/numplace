# ナンプレ懸賞サイト

VueとFastifyで作られた、毎日挑戦できる数独（ナンプレ）懸賞サイト

## 📋 機能

- 📧 メールアドレス登録
- 🎯 毎日自動生成される数独問題
- 🎮 仮想テンキー付きインタラクティブグリッド
- ✅ ルールベース回答検証（複数解対応）
- 🎟️ 応募口数管理
- 🔐 パスワード付き管理者画面

## 🚀 クイックスタート

### 一括起動（推奨）

```bash
# 初回のみ：全ての依存関係をインストール
npm run install:all

# フロントエンドとバックエンドを同時に起動
npm start
```

アクセス：
- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3000
- 管理者画面: http://localhost:5173/#admin

### 個別起動

#### バックエンド
```bash
cd backend
npm install  # 初回のみ
npm start
```

#### フロントエンド
```bash
cd frontend
npm install  # 初回のみ
npm run dev
```

## ⚙️ 設定

### バックエンド設定

`backend/.env` ファイルで管理者パスワードを設定：

```bash
ADMIN_PASSWORD=your_secure_password
```

### フロントエンド設定

`frontend/.env` ファイルでAPI URLを設定：

```bash
# ローカル開発
VITE_API_URL=http://localhost:3000

# 本番環境（サーバーのIPまたはドメインに変更）
VITE_API_URL=http://your-server-ip:3000
```

## 📦 本番環境デプロイ

### フロントエンドのビルド

```bash
npm run build:frontend
# または
cd frontend && npm run build
```

ビルドされたファイルは `frontend/dist` に生成されます。

### 本番環境での起動

```bash
# バックエンド（PM2推奨）
cd backend
pm2 start server.js --name numplace-backend

# フロントエンド（Nginx推奨）
# frontend/dist をNginxで配信
```

## 🔐 管理者ログイン

デフォルトパスワード: `admin123`

管理者画面で以下を確認できます：
- 総ユーザー数
- 総応募口数
- ユーザー一覧
- 統計情報

## 📝 利用可能なコマンド

```bash
# フロントエンド + バックエンド同時起動
npm start

# 全ての依存関係をインストール
npm run install:all

# フロントエンドをビルド
npm run build:frontend

# バックエンドのみ起動
npm run start:backend

# フロントエンドのみ起動
npm run start:frontend
```

## 🛠️ 技術スタック

- **フロントエンド**: Vue 3, Vite
- **バックエンド**: Fastify, Node.js
- **スケジューラー**: node-cron
- **データ保存**: JSON ファイル

## 📂 プロジェクト構造

```
numplace/
├── backend/              # Fastifyバックエンド
│   ├── server.js        # メインサーバー
│   ├── sudoku.js        # 数独生成・検証
│   ├── scheduler.js     # 毎日の問題生成
│   └── data/            # JSONデータ
├── frontend/            # Vueフロントエンド
│   └── src/
│       ├── components/  # Vueコンポーネント
│       └── config.js    # API設定
└── package.json         # ルート設定
```

## 💡 開発のヒント

- 開発時はホットリロードが有効です
- API URLは環境変数で管理されています
- 数独の難易度は `backend/scheduler.js` で変更可能

## 📄 ライセンス

MIT
