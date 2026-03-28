import os
from fastapi import Request, HTTPException
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Create a local client for auth verification
auth_client = None
if SUPABASE_URL and SUPABASE_KEY:
    auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_current_user(request: Request) -> dict:
    """
    Extract and verify the Supabase JWT from the Authorization header
    using the official Supabase Auth client.
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split("Bearer ")[1]

    if not auth_client:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        # Validate token and retrieve user securely via Supabase
        user_resp = auth_client.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return {
            "id": user_resp.user.id,
            "email": user_resp.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
