# リアルタイムテトリス (Realtime Tetris)

リアルタイム対戦が可能なテトリスゲームです。1人プレイと2人対戦の両方をサポートしています。

## 技術スタック

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: React
- **ビルドツール**: Vite
- **状態管理**: ReactのuseState/useReducer等（Redux等は未使用）
- **通信**: [socket.io-client](https://socket.io/docs/v4/client-api/)（WebSocketベースのリアルタイム通信）
- **UI/スタイル**: CSS Modules, Tailwind CSS（`frontend/tailwind.config.js` 参照）
- **音楽・効果音**: HTML5 Audio API
- **主な依存ライブラリ**: 
  - react, react-dom
  - socket.io-client
  - vite
  - tailwindcss
  - その他は`frontend/package.json`参照

### バックエンド
- **言語**: Python 3.12
- **フレームワーク**: FastAPI
- **WebSocket**: FastAPIのWebSocketサポート
- **ASGIサーバ**: Uvicorn
- **依存管理**: poetry または pip（`backend/requirements.txt`）
- **主な依存ライブラリ**:
  - fastapi
  - uvicorn
  - python-socketio
  - その他は`backend/requirements.txt`参照
- **デプロイ**: Fly.io

## フォルダ構成

```
tetris-game/
├── frontend/             # フロントエンドのコード
│   ├── public/           # 静的ファイル（音楽、画像など）
│   ├── src/              # ソースコード（Reactコンポーネント、hooks、libなど）
│   │   ├── App.tsx       # メインのゲームロジック
│   │   ├── App.css       # スタイル
│   │   └── main.tsx      # エントリーポイント
│   ├── package.json      # 依存関係
│   └── vite.config.ts    # Vite設定
│
├── backend/              # バックエンドのコード
│   ├── app/              # アプリケーションコード（FastAPI本体）
│   │   └── main.py       # FastAPIアプリケーション
│   └── requirements.txt  # Pythonの依存関係
│   └── tests/            # バックエンドのテストコード（pytest等で実行可能）
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

# 開発サーバーの起動（デフォルト: http://localhost:3000）
npm run dev
```

### バックエンド

```bash
# バックエンドディレクトリに移動
cd tetris-game/backend

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動（デフォルト: http://localhost:8000）
uvicorn app.main:app --reload
```

- **WebSocket通信**: サーバ・クライアント両方を同時に起動して動作確認してください。
- **CORS**: 開発時はCORS設定に注意（FastAPI側で許可設定済み）。

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

## コーディング規約・推奨ツール
- **エディタ**: VS Code推奨。TypeScript, Python拡張を導入。
- **Lint/Format**: ESLint, Prettier（フロントエンド）、blackやflake8（バックエンド）
- **コミットメッセージ**: 日本語/英語どちらでも可。分かりやすく記述。
- **その他**: 必要に応じて`README.md`や各種設定ファイルを参照。

## 開発Tips・補足
- ルームマスター: 部屋を作成した最初のプレイヤーがルームマスターになります。
- WebSocket通信: フロントエンドとバックエンド間のリアルタイム通信にはWebSocket（socket.io, FastAPI WebSockets）を使用。
- 音楽と効果音: ゲーム内の音楽と効果音はHTML5 Audioを使用。
- ポート: デフォルトでフロントエンドは3000番、バックエンドは8000番で起動。
- テスト: バックエンドはpytest等でテスト可能。

### 【トラブルシューティング】ViteサーバーにChromeからアクセスできない問題

**症状**: VSCodeのシンプルブラウザーでは動作するが、ChromeでlocalHost:5173にアクセスすると接続できない

**原因**: Viteサーバーがデフォルトで`::1`（IPv6のlocalhost）でのみリッスンしており、IPv4のlocalhostからのアクセスを受け付けていない

**解決策**: `vite.config.ts`に以下の設定を追加
```typescript
export default defineConfig({
  // ...existing config...
  server: {
    host: '0.0.0.0',  // すべてのネットワークインターフェースでリッスン
    port: 5173,       // ポート番号を明示的に指定
  },
})
```

**設定変更後の手順**:
1. 既存のViteサーバーを停止（`Ctrl+C`またはプロセスをkill）
2. `npm run dev`で再起動
3. Chromeで`http://localhost:5173`にアクセス

**確認方法**: `netstat -an | grep 5173`でViteサーバーがIPv4（`0.0.0.0:5173`）でリッスンしていることを確認

## 参考
- [React公式ドキュメント](https://ja.react.dev/)
- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/ja/)
- [Socket.io公式ドキュメント](https://socket.io/docs/v4/)

## Devinについて
このゲームは[Devin](https://devin.ai/)を用いて日本語チャットを30分間行うことで０から作成されたテトリスゲームです。
8.96ACUs(22ドル=3,000円)を消化して作成されました。お財布が痛いです。
作成時間はだいたい30分でした。
続きはGithub Copilot Agentで作ってみようと思っています（2025/05/26時点ではCopilot AgentはPreview版）

## Github Copilot Chat(Agentモード)について
Agentが追加するコミットは下記Git設定をして、Agentがコミットしたことを後からわかるようにする。
`git config user.name "Copilot Agent" && git config user.email "copilot-agent@example.com"`

---

## 【初心者向け】Fly.ioでのバックエンドデプロイ・設定のポイント

### Fly.ioとは？
- 世界中にアプリを簡単に公開できるクラウドサービスです。
- Dockerイメージを使ってPython（FastAPIなど）アプリをデプロイできます。

### バックエンド（FastAPI）をFly.ioで動かすための注意点
- **必ず0.0.0.0:8000でリッスンすること！**
    - Fly.ioは外部からのリクエストを`0.0.0.0:8000`で受け付けるアプリにしかルーティングしません。
    - DockerfileのCMDや起動コマンドで`--host 0.0.0.0 --port 8000`を指定してください。
    - 例: `CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`

### fly.tomlの設定例
```toml
[http_service]
  internal_port = 8000  # ← FastAPIのリッスンポートと一致させる
```

### デプロイ時のよくあるトラブル
- Fly.ioの警告「The app is not listening on the expected address...」が出た場合は、
  - CMDや起動コマンドを再確認（`--host 0.0.0.0 --port 8000`が必須）
  - fly.tomlの`internal_port`が8000になっているか確認
- アクセスがないと自動でマシンがスリープします（fly.tomlの`auto_stop_machines`設定）。

### フロントエンドとの連携
- フロントエンドのAPIリクエスト先（.envの`VITE_BACKEND_URL`など）が、Fly.ioで公開したバックエンドURL（例: `https://tetris-multiplayer-app.fly.dev`）になっているか確認しましょう。

---

困ったときは公式ドキュメントや`fly logs`コマンドでログを確認すると原因特定がしやすいです。