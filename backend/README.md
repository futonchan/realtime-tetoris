# Realtime Tetris Backend

このディレクトリはリアルタイムテトリスゲームのバックエンド（FastAPI + WebSocket）です。

## 概要
- Python 3.12
- FastAPI
- Uvicorn
- Poetry で依存管理

## 開発・起動方法

```bash
# 依存関係のインストール
poetry install

# サーバー起動
poetry run uvicorn app.main:app --reload
```

## デプロイ
Fly.io などのクラウドサービスにデプロイ可能です。

---

## 【初心者向け】Fly.ioデプロイとバックエンド設定のポイント

### 1. Fly.ioとは？
- グローバルにアプリを簡単にデプロイできるクラウドサービスです。
- Dockerイメージを使ってPython（FastAPIなど）アプリを公開できます。

### 2. バックエンド（FastAPI）をFly.ioで動かすための注意点
- **必ず0.0.0.0:8000でリッスンすること！**
    - Fly.ioは外部からのリクエストを`0.0.0.0:8000`で受け付けるアプリにしかルーティングしません。
    - DockerfileのCMDや起動コマンドで`--host 0.0.0.0 --port 8000`を指定してください。
    - 例: `CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`

### 3. fly.tomlの設定例
```toml
[http_service]
  internal_port = 8000  # ← ここがFastAPIのリッスンポートと一致している必要あり
```

### 4. デプロイ時のよくあるトラブル
- Fly.ioの警告「The app is not listening on the expected address...」が出た場合は、
  - CMDや起動コマンドを再確認（`--host 0.0.0.0 --port 8000`が必須）
  - fly.tomlの`internal_port`が8000になっているか確認
- アクセスがないと自動でマシンがスリープします（fly.tomlの`auto_stop_machines`設定）。

### 5. フロントエンドとの連携
- フロントエンドのAPIリクエスト先（.envの`VITE_BACKEND_URL`など）が、Fly.ioで公開したバックエンドURL（例: `https://tetris-multiplayer-app.fly.dev`）になっているか確認しましょう。

---

困ったときは公式ドキュメントや`fly logs`コマンドでログを確認すると原因特定がしやすいです。

詳細はプロジェクトルートの README.md も参照してください。
