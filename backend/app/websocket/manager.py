import json
from typing import Dict, List
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # Map execution_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        self.active_connections[execution_id].append(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: str):
        if execution_id in self.active_connections:
            if websocket in self.active_connections[execution_id]:
                self.active_connections[execution_id].remove(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def broadcast_event(self, execution_id: str, event_data: dict):
        if execution_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[execution_id]:
                try:
                    await connection.send_text(json.dumps(event_data))
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead, execution_id)

ws_manager = WebSocketManager()
