from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
# Notice how all of these now start with 'backend.app'
from backend.app.routers import auth
from backend.app.database.base import Base
from backend.app.database.session import engine
from backend.app.database.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.meeting import Meeting 
from backend.app.routers import meeting
from backend.app.routers import websocket

# This command creates tables only if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone Backend")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://zoom-clone-nu-drab.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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