import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Interviewer API"
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "http://localhost:8000")
    SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "dummy_key")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")

settings = Settings()
