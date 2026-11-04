"""Fare cache: in-process L1 + Redis (preferred) or Supabase `fare_cache` L2. TTL 30-60 min."""
import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import settings
from app.core.db import supabase_client

logger = logging.getLogger("napier.cache")


class FareCache:
    def __init__(self, ttl: int, redis_url: str | None, supabase: Any):
        self.ttl = ttl
        self._mem: dict[str, tuple[float, Any]] = {}
        self._supabase = supabase
        self._redis = None
        if redis_url:
            try:
                import redis.asyncio as aioredis

                self._redis = aioredis.from_url(redis_url, decode_responses=True)
            except Exception as exc:
                logger.warning("Redis disabled: %s", exc)

    async def get(self, key: str) -> Any | None:
        hit = self._mem.get(key)
        if hit and hit[0] > time.time():
            return hit[1]
        value = await self._l2_get(key)
        if value is not None:
            self._mem[key] = (time.time() + self.ttl, value)
        return value

    async def set(self, key: str, value: Any) -> None:
        self._mem[key] = (time.time() + self.ttl, value)
        await self._l2_set(key, value)

    async def _l2_get(self, key: str) -> Any | None:
        try:
            if self._redis is not None:
                raw = await self._redis.get(f"napier:{key}")
                return json.loads(raw) if raw else None
            if self._supabase is not None:
                now = datetime.now(timezone.utc).isoformat()

                def query():
                    return (
                        self._supabase.table("fare_cache")
                        .select("payload")
                        .eq("cache_key", key)
                        .gt("expires_at", now)
                        .limit(1)
                        .execute()
                    )

                rows = (await asyncio.to_thread(query)).data
                return rows[0]["payload"] if rows else None
        except Exception as exc:  # cache must never break a request
            logger.warning("cache read failed: %s", exc)
        return None

    async def _l2_set(self, key: str, value: Any) -> None:
        try:
            if self._redis is not None:
                await self._redis.set(f"napier:{key}", json.dumps(value), ex=self.ttl)
            elif self._supabase is not None:
                expires = (datetime.now(timezone.utc) + timedelta(seconds=self.ttl)).isoformat()

                def upsert():
                    return self._supabase.table("fare_cache").upsert(
                        {"cache_key": key, "payload": value, "expires_at": expires}
                    ).execute()

                await asyncio.to_thread(upsert)
        except Exception as exc:
            logger.warning("cache write failed: %s", exc)


fare_cache = FareCache(settings.CACHE_TTL_SECONDS, settings.REDIS_URL, supabase_client)
