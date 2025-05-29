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

# Socket.IO integration with FastAPI
socket_app = socketio.ASGIApp(sio, app)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[WebSocket, str]] = {}
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.game_states: Dict[str, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str, player_name: str):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
            
        if room_id in self.active_connections and len(self.active_connections[room_id]) >= 2:
            await websocket.send_text(json.dumps({"type": "error", "message": "Room is full"}))
            await websocket.close()
            return False
            
        self.active_connections[room_id][websocket] = player_name
        
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "id": room_id,
                "name": f"Room {room_id}",
                "players": [],
                "ready_players": set(),
                "game_in_progress": False,
                "room_master": player_name
            }
            
        self.rooms[room_id]["players"].append(player_name)
        
        await self.broadcast_room_update(room_id)
        
        return True
        
    async def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            player_name = self.active_connections[room_id][websocket]
            del self.active_connections[room_id][websocket]
            
            if room_id in self.rooms:
                if player_name in self.rooms[room_id]["players"]:
                    self.rooms[room_id]["players"].remove(player_name)
                if player_name in self.rooms[room_id]["ready_players"]:
                    self.rooms[room_id]["ready_players"].remove(player_name)
                
                if not self.rooms[room_id]["players"]:
                    del self.rooms[room_id]
                    if room_id in self.game_states:
                        del self.game_states[room_id]
                    if room_id in self.active_connections and not self.active_connections[room_id]:
                        del self.active_connections[room_id]
                else:
                    await self.broadcast_room_update(room_id)
                    
                    if self.rooms[room_id]["game_in_progress"]:
                        self.rooms[room_id]["game_in_progress"] = False
                        await self.broadcast_to_room(room_id, {
                            "type": "game_ended",
                            "reason": "player_disconnected",
                            "player": player_name
                        })
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(json.dumps(message))
                
    async def broadcast_room_update(self, room_id: str):
        if room_id in self.rooms:
            room_info = self.rooms[room_id].copy()
            room_info["ready_players"] = list(room_info["ready_players"])
            await self.broadcast_to_room(room_id, {
                "type": "room_update",
                "room": room_info
            })
            
    async def set_player_ready(self, websocket: WebSocket, room_id: str, is_ready: bool):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            player_name = self.active_connections[room_id][websocket]
            
            if room_id in self.rooms:
                if is_ready and player_name not in self.rooms[room_id]["ready_players"]:
                    self.rooms[room_id]["ready_players"].add(player_name)
                elif not is_ready and player_name in self.rooms[room_id]["ready_players"]:
                    self.rooms[room_id]["ready_players"].remove(player_name)
                
                await self.broadcast_room_update(room_id)
                
    
    async def start_game(self, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id]["game_in_progress"] = True
            
            self.game_states[room_id] = {
                "players": {},
                "current_piece_sequence": self._generate_piece_sequence(),
                "started_at": asyncio.get_event_loop().time()
            }
            
            for player in self.rooms[room_id]["players"]:
                self.game_states[room_id]["players"][player] = {
                    "board": [[0 for _ in range(10)] for _ in range(20)],
                    "score": 0,
                    "lines_cleared": 0,
                    "current_piece": None,
                    "next_piece": None,
                    "piece_index": 0
                }
            
            await self.broadcast_to_room(room_id, {
                "type": "game_started",
                "game_state": self.game_states[room_id],
                "players": self.rooms[room_id]["players"]
            })
    
    def _generate_piece_sequence(self):
        pieces = ["I", "O", "T", "S", "Z", "J", "L"]
        sequence = []
        
        for _ in range(14):  # 7 pieces * 14 = 98 pieces
            bag = pieces.copy()
            random.shuffle(bag)
            sequence.extend(bag)
            
        return sequence
    
    async def update_game_state(self, websocket: WebSocket, room_id: str, update: dict):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            player_name = self.active_connections[room_id][websocket]
            
            if room_id in self.game_states and player_name in self.game_states[room_id]["players"]:
                if update["type"] == "board_update":
                    self.game_states[room_id]["players"][player_name]["board"] = update["board"]
                elif update["type"] == "score_update":
                    self.game_states[room_id]["players"][player_name]["score"] = update["score"]
                elif update["type"] == "lines_cleared":
                    self.game_states[room_id]["players"][player_name]["lines_cleared"] = update["lines_cleared"]
                    
                    if update["lines_cleared"] > 1:
                        garbage_lines = update["lines_cleared"] - 1
                        for opponent_ws, opponent_name in self.active_connections[room_id].items():
                            if opponent_name != player_name:
                                await opponent_ws.send_text(json.dumps({
                                    "type": "receive_garbage",
                                    "lines": garbage_lines
                                }))
                
                await self.broadcast_to_room(room_id, {
                    "type": "game_state_update",
                    "player": player_name,
                    "update": update
                })
    
    async def room_master_start_game(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            player_name = self.active_connections[room_id][websocket]
            
            if room_id in self.rooms:
                if self.rooms[room_id]["room_master"] != player_name:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Only room master can start game"}))
                    return
                
                if len(self.rooms[room_id]["ready_players"]) == len(self.rooms[room_id]["players"]) and len(self.rooms[room_id]["players"]) == 2:
                    await self.start_game(room_id)
                else:
                    await websocket.send_text(json.dumps({"type": "error", "message": "All players must be ready"}))
    
    async def game_over(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            player_name = self.active_connections[room_id][websocket]
            
            if room_id in self.rooms:
                self.rooms[room_id]["game_in_progress"] = False
                
                winner = None
                if room_id in self.game_states:
                    players = list(self.game_states[room_id]["players"].keys())
                    if len(players) > 1:
                        winner = players[1] if players[0] == player_name else players[0]
                
                await self.broadcast_to_room(room_id, {
                    "type": "game_over",
                    "loser": player_name,
                    "winner": winner
                })
                
                self.rooms[room_id]["ready_players"] = set()
                await self.broadcast_room_update(room_id)

manager = ConnectionManager()

class RoomInfo(BaseModel):
    id: str
    name: str
    players: List[str]
    game_in_progress: bool

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
    
    manager.rooms[room.id] = {
        "id": room.id,
        "name": room.name,
        "players": [],
        "ready_players": set(),
        "game_in_progress": False,
        "room_master": ""  # Will be set when the first player joins
    }
    
    return {"status": "success", "room": manager.rooms[room.id]}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_name: str = "Anonymous"):
    connection_successful = await manager.connect(websocket, room_id, player_name)
    
    if not connection_successful:
        return
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "player_ready":
                await manager.set_player_ready(websocket, room_id, message["ready"])
            elif message["type"] == "room_master_start_game":
                await manager.room_master_start_game(websocket, room_id)
            elif message["type"] == "game_state_update":
                await manager.update_game_state(websocket, room_id, message["update"])
            elif message["type"] == "game_over":
                await manager.game_over(websocket, room_id)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id)
