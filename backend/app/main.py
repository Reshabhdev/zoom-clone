from fastapi import FastAPI
from backend.app.routers import auth
from backend.app.database.base import Base
from backend.app.database.session import engine
from fastapi import Depends
from backend.app.database.deps import get_current_user
from backend.app.models.user import User
# CRITICAL: Import your models here so Base.metadata.create_all recognizes them
from backend.app.models.user import User 
from backend.app.models.meeting import Meeting 
from backend.app.routers import meeting
# This command creates tables only if they don't exist
from backend.app.routers import websocket

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone Backend")

# We apply the "/auth" prefix here once to avoid confusion
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(meeting.router, prefix="/meetings", tags=["Meetings"])
app.include_router(websocket.router)
@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/auth/me")
def verify_my_token(current_user: User = Depends(get_current_user)):
    return {
        "status": "Token is valid",
        "user_email": current_user.email,
        "user_id": current_user.id
    }