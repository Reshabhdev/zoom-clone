from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os


# Get absolute path to project root (.env file location)
# config.py is at: /path/to/backend/app/core/config.py
# so going up 3 levels gives us the project root
config_dir = os.path.dirname(os.path.abspath(__file__))  # backend/app/core
app_dir = os.path.dirname(config_dir)  # backend/app  
backend_dir = os.path.dirname(app_dir)  # backend
project_root = os.path.dirname(backend_dir)  # project root

env_file = os.path.join(project_root, ".env")


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""
    CLERK_FRONTEND_API: str = ""

    model_config = ConfigDict(env_file=env_file, extra="allow")


settings = Settings()
