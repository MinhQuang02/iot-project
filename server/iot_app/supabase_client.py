import os
from supabase import create_client, Client
from django.conf import settings

_supabase_client: Client = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        _supabase_client = create_client(url, key)
    return _supabase_client
