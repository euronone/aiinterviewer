"""Database connection management — Supabase PostgreSQL."""
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
import asyncpg
import redis.asyncio as redis

# Supabase client (for Auth & Storage)
_supabase_client: Optional[Client] = None

# Async PostgreSQL pool (for raw SQL with pgvector)
_pg_pool: Optional[asyncpg.Pool] = None

# Redis client (for caching & session state)
_redis_client: Optional[redis.Redis] = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_client


async def get_pg_pool() -> asyncpg.Pool:
    global _pg_pool
    if _pg_pool is None:
        # Supabase PostgreSQL connection string
        db_url = settings.SUPABASE_URL.replace("https://", "postgresql://postgres:")
        _pg_pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=5,
            max_size=20,
            command_timeout=60,
        )
    return _pg_pool


async def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def init_db():
    """Initialize database connections on startup."""
    get_supabase()
    await get_redis()
    # Note: pg_pool is initialized lazily on first use


async def close_db():
    """Close all database connections."""
    global _pg_pool, _redis_client
    if _pg_pool:
        await _pg_pool.close()
    if _redis_client:
        await _redis_client.close()
