import asyncio

from app.core.cache import FareCache


def test_memory_cache_roundtrip_and_expiry():
    async def run():
        c = FareCache(ttl=1800, redis_url=None, supabase=None)
        assert await c.get("k") is None
        await c.set("k", [1, 2])
        assert await c.get("k") == [1, 2]
        c._mem["k"] = (0.0, [1, 2])  # force expiry
        assert await c.get("k") is None

    asyncio.run(run())
