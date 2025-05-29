# Socket.IO版のFastAPIバックエンド
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio
from typing import Dict, List, Optional, Set, Any
import json
import random
import asyncio
from pydantic import BaseModel

# Socket.IO server setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Socket.IO integration with FastAPI
socket_app = socketio.ASGIApp(sio, app)

# Game state management
class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.game_states: Dict[str, Dict[str, Any]] = {}
        self.player_sessions: Dict[str, str] = {}  # session_id -> room_id
        
    def create_room(self, room_id: str, room_name: str):
        self.rooms[room_id] = {
            "id": room_id,
            "name": room_name,
            "players": [],
            "ready_players": set(),
            "game_in_progress": False,
            "room_master": None
        }
        
    def join_room(self, room_id: str, player_name: str, session_id: str):
        if room_id not in self.rooms:
            return False, "Room does not exist"
            
        room = self.rooms[room_id]
        if len(room["players"]) >= 2:
            return False, "Room is full"
            
        if player_name in room["players"]:
            return False, "Player name already taken"
            
        room["players"].append(player_name)
        if room["room_master"] is None:
            room["room_master"] = player_name
            
        self.player_sessions[session_id] = room_id
        return True, "Joined successfully"
        
    def leave_room(self, session_id: str):
        if session_id not in self.player_sessions:
            return
            
        room_id = self.player_sessions[session_id]
        if room_id not in self.rooms:
            return
            
        room = self.rooms[room_id]
        # Find player name by session_id (この部分は実装を簡略化)
        del self.player_sessions[session_id]
        
    def set_player_ready(self, room_id: str, player_name: str, is_ready: bool):
        if room_id not in self.rooms:
            return False
            
        room = self.rooms[room_id]
        if is_ready:
            room["ready_players"].add(player_name)
        else:
            room["ready_players"].discard(player_name)
            
        return True

manager = GameManager()

class RoomInfo(BaseModel):
    id: str
    name: str
    players: List[str]
    game_in_progress: bool

# REST API endpoints
@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/rooms")
async def get_rooms():
    rooms = []
    for room_id, room in manager.rooms.items():
        rooms.append({
            "id": room_id,
            "name": room["name"],
            "players": room["players"],
            "game_in_progress": room["game_in_progress"],
            "room_master": room.get("room_master", "")
        })
    return rooms

@app.post("/api/rooms")
async def create_room(room: RoomInfo):
    if room.id in manager.rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    
    manager.create_room(room.id, room.name)
    return {"status": "success", "room": manager.rooms[room.id]}

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    
@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    manager.leave_room(sid)

@sio.event
async def join_room(sid, data):
    room_id = data.get('room_id')
    player_name = data.get('player_name', 'Anonymous')
    
    success, message = manager.join_room(room_id, player_name, sid)
    
    if success:
        await sio.enter_room(sid, room_id)
        room_data = manager.rooms[room_id].copy()
        room_data["ready_players"] = list(room_data["ready_players"])
        
        await sio.emit('room_update', {
            "type": "room_update",
            "room": room_data
        }, room=room_id)
    else:
        await sio.emit('error', {
            "type": "error",
            "message": message
        }, room=sid)

@sio.event
async def player_ready(sid, data):
    if sid not in manager.player_sessions:
        return
        
    room_id = manager.player_sessions[sid]
    is_ready = data.get('ready', False)
    
    # プレイヤー名を取得（簡略化のため、ここでは実装を省略）
    player_name = "Player"  # 実際にはセッションからプレイヤー名を取得
    
    if manager.set_player_ready(room_id, player_name, is_ready):
        room_data = manager.rooms[room_id].copy()
        room_data["ready_players"] = list(room_data["ready_players"])
        
        await sio.emit('room_update', {
            "type": "room_update", 
            "room": room_data
        }, room=room_id)

@sio.event
async def start_game(sid, data):
    if sid not in manager.player_sessions:
        return
        
    room_id = manager.player_sessions[sid]
    room = manager.rooms[room_id]
    
    # ルームマスターチェックとゲーム開始条件チェック（簡略化）
    if len(room["ready_players"]) == len(room["players"]) and len(room["players"]) == 2:
        room["game_in_progress"] = True
        
        await sio.emit('game_started', {
            "type": "game_started",
            "players": room["players"]
        }, room=room_id)

# アプリケーションのエントリーポイント
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="127.0.0.1", port=8000)
