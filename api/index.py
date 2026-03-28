import sys
import os
from fastapi import FastAPI

# Add the project root and backend to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

# Import the FastAPI app from backend/main.py
try:
    from main import app
except ImportError:
    # If the above fails, try importing from the absolute backend package
    from backend.main import app

# Vercel needs the 'app' variable to be exposed
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
