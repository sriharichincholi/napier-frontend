import logging

from app.core.config import settings

logger = logging.getLogger("napier.db")

supabase_client = None
if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        from supabase import create_client

        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as exc:  # misconfigured URL/key must not stop the API booting
        logger.warning("Supabase disabled: %s", exc)
