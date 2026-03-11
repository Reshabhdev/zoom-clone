from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from backend.app.routers import auth
    from backend.app.database.base import Base
    from backend.app.database.session import engine
    from backend.app.database.deps import get_current_user
    from backend.app.models.user import User
    from backend.app.models.meeting import Meeting 
    from backend.app.routers import meeting
    from backend.app.routers import websocket
    from backend.app.core.config import settings
    
    logger.info("✓ All imports successful")
    logger.info(f"Database URL configured: {bool(settings.DATABASE_URL)}")
    
except Exception as e:
    logger.error(f"✗ Import error: {e}")
    raise

from alembic.config import Config
from alembic import command
import os

# This command creates tables only if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database tables created/verified")
    
    # Run Alembic migrations automatically
    logger.info("Running database migrations...")
    current_dir = os.path.dirname(os.path.abspath(__file__)) # this is backend/app
    backend_dir = os.path.dirname(current_dir) # this is backend
    
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
    alembic_script_location = os.path.join(backend_dir, "alembic")
    
    # Optional: check if paths exist and log them to help debug in production
    if not os.path.exists(alembic_script_location):
        logger.warning(f"Alembic script location not found at {alembic_script_location}")
    
    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("script_location", alembic_script_location)
    command.upgrade(alembic_cfg, "head")
    logger.info("✓ Database migrations completed successfully")

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
        "http://localhost:8000",
        "http://127.0.0.1:8000",
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