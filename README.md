# リアルタイムテトリス (Realtime Tetris)

リアルタイム対戦が可能なテトリスゲームです。1人プレイと2人対戦の両方をサポートしています。

## 技術スタック

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: React
- **ビルドツール**: Vite
- **通信**: Socket.io-client

### バックエンド
- **言語**: Python
- **フレームワーク**: FastAPI
- **WebSocket**: FastAPI WebSockets
- **デプロイ**: Fly.io

## フォルダ構成

```
tetris-game/
├── frontend/             # フロントエンドのコード
│   ├── public/           # 静的ファイル（音楽、画像など）
│   ├── src/              # ソースコード
│   │   ├── App.tsx       # メインのゲームロジック
│   │   ├── App.css       # スタイル
│   │   └── main.tsx      # エントリーポイント
│   ├── package.json      # 依存関係
│   └── vite.config.ts    # Vite設定
│
├── backend/              # バックエンドのコード
│   ├── app/              # アプリケーションコード
│   │   └── main.py       # FastAPIアプリケーション
│   └── requirements.txt  # Pythonの依存関係
│
└── README.md             # このファイル
```

## 機能

- **スタート画面**: 「ひとりで」、「ふたりで」、「設定」のオプション
- **1人用テトリス**: 標準的なテトリスゲームプレイ
- **2人対戦モード**:
  - プレイヤー名入力（最大20文字、日本語対応）
  - 部屋一覧表示
  - 部屋作成（作成者がルームマスターになる）
  - ロビー画面（全員がREADYするとルームマスターがゲーム開始可能）
  - リアルタイム対戦
- **設定画面**: BGMとSEの音量調整

## ローカル開発環境のセットアップ

### フロントエンド

```bash
# フロントエンドディレクトリに移動
cd tetris-game/frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### バックエンド

```bash
# バックエンドディレクトリに移動
cd tetris-game/backend

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn app.main:app --reload
```

## デプロイ先

- **フロントエンド**: https://tetris-multiplayer-app-5a534qjj.devinapps.com
- **バックエンド**: https://app-ytrdzbgw.fly.dev

## ゲームプレイ方法

### 1人プレイ
1. スタート画面で「ひとりで」を選択
2. 矢印キーで移動、上矢印で回転、スペースでハードドロップ

### 2人対戦
1. スタート画面で「ふたりで」を選択
2. プレイヤー名を入力してOKボタンをクリック
3. 部屋を作成するか、既存の部屋に参加
4. ロビーでREADYボタンをクリック
5. 全員がREADYになったら、ルームマスターがGAME STARTボタンをクリック
6. 対戦開始！

## 開発者向け情報

- ルームマスター: 部屋を作成した最初のプレイヤーがルームマスターになります
- WebSocket通信: フロントエンドとバックエンド間のリアルタイム通信にはWebSocketを使用
- 音楽と効果音: ゲーム内の音楽と効果音はHTML5 Audioを使用

## Devinについて
このゲームは[Devin](https://devin.ai/)を用いて日本語チャットを30分間行うことで０から作成されたテトリスゲームです。
8.96ACUs(22ドル=3,000円)を消化して作成されました。お財布が痛いです。
作成時間はだいたい30分でした。
続きはGithub Copilot Agentで作ってみようと思っています（2025/05/26時点ではCopilot AgentはPreview版）