from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from .routers import auth
    from .database.base import Base
    from .database.session import engine
    from .database.deps import get_current_user
    from .models.user import User
    from .models.meeting import Meeting 
    from .routers import meeting
    from .routers import websocket
    from .core.config import settings
    
    logger.info("✓ All imports successful")
    logger.info(f"Database URL configured: {bool(settings.DATABASE_URL)}")
    
except Exception as e:
    logger.error(f"✗ Import error: {e}")
    raise

# This command creates tables only if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created/verified")
except Exception as e:
    logger.error(f"✗ Database initialization error: {e}")
    raise

app = FastAPI(title="Zoom Clone Backend")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://zoom-clone-nu-drab.vercel.app",
        "https://zoom-clone-*.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

logger.info("✓ CORS middleware configured")

# We apply the "/auth" prefix here once to avoid confusion
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(meeting.router, prefix="/meetings", tags=["Meetings"])
app.include_router(websocket.router)

@app.get("/")
def root():
    return {"status": "Backend running"}