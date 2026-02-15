from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..core.websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            # Wait for messages from a participant (Offer, Answer, or ICE Candidate)
            data = await websocket.receive_json()
            
            # Relay that message to everyone else in the same room
            await manager.broadcast_to_room(data, room_id, sender=websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        # Notify others that someone left
        await manager.broadcast_to_room(
            {"type": "user-left", "message": "A participant has left the call"},
            room_id,
            sender=websocket
        )