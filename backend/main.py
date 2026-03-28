import os
import sys
import io
import json
import hashlib
import logging
from dotenv import load_dotenv

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Configure File-Based Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("backend")

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio

# 1M RPS Extensions
import redis.asyncio as redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from auth import get_current_user
from embeddings import embed_document, generate_query_embedding, generate_rag_answer
from file_parser import parse_file
from transcribe import is_media_file, transcribe_media

# ---------------------
# Supabase & Redis Clients
# ---------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

supabase = None
supabase_admin = None

if SUPABASE_URL and SUPABASE_KEY:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Connected to Supabase (Anon)!")

if SUPABASE_URL and SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_KEY != "your_service_role_secret":
    from supabase import create_client
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("Connected to Supabase (Service Role)!")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# ---------------------
# FastAPI App
# ---------------------
app = FastAPI(title="1M RPS RAG Architecture")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------
# Models
# ---------------------
class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

class DocumentRef(BaseModel):
    id: str
    title: str
    source_type: str = "text"
    similarity: float = 0.0
    created_at: Optional[str] = None
    metadata: Optional[dict] = None

class SearchResponse(BaseModel):
    answer: str
    citations: List[DocumentRef]
    cached: bool = False

# ---------------------
# Asynchronous Background Worker
# ---------------------
async def process_file_worker(user_id: str, filename: str, file_bytes: bytes, source_type: str):
    """
    Background worker that extracts text, embeds into xAI, and saves to DB.
    This prevents the main event loop from blocking, scaling to massive RPS.
    """
    try:
        logger.info(f"🚀 Started processing {filename} for user {user_id}")
        if source_type in ("audio", "video"):
            logger.info(f"🎙️ Background transcribing {filename}...")
            text_content = await asyncio.to_thread(transcribe_media, file_bytes, filename)
        else:
            logger.info(f"📄 Background parsing {filename}...")
            text_content = await asyncio.to_thread(parse_file, filename, file_bytes)

        if not text_content or not text_content.strip():
            logger.warning(f"⚠️ No text extracted from {filename}")
            return

        logger.info(f"🧠 Generating Gemini embeddings for {filename}... (Text length: {len(text_content)})")
        chunks = await asyncio.to_thread(embed_document, text_content)

        if not chunks:
            logger.error(f"❌ Failed to generate any valid embeddings for {filename}")
            return

        logger.info(f"💾 Inserting {len(chunks)} chunks into Supabase for {filename}...")
        for i, chunk in enumerate(chunks):
            record = {
                "user_id": user_id,
                "title": filename if i == 0 else f"{filename} (chunk {i+1})",
                "content": chunk["chunk_text"],
                "source_type": source_type,
                "embedding": chunk["embedding"],
                "metadata": json.dumps({"original_filename": filename, "chunk_index": i, "total_chunks": len(chunks)})
            }
            client = supabase_admin if supabase_admin else supabase
            await asyncio.to_thread(client.table("documents").insert(record).execute)

        logger.info(f"✅ Successfully processed and stored {len(chunks)} chunks for {filename}")

    except Exception as e:
        logger.error(f"❌ Background processing failed for {filename}: {str(e)}", exc_info=True)


# ---------------------
# Endpoints
# ---------------------

@app.post("/api/upload")
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Returns 202 Accepted instantly. Processes file asynchronously in the background.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    user = get_current_user(request)
    file_bytes = await file.read()
    filename = file.filename or "untitled"
    
    # Fast mime check
    if is_media_file(filename):
        ext = filename.lower().rsplit(".", 1)[-1]
        source_type = "audio" if ext in {"mp3", "wav", "m4a", "ogg", "flac"} else "video"
    else:
        source_type = filename.lower().rsplit(".", 1)[-1] if "." in filename else "text"

    # Push to async queue (simulating Celery/Kafka at scale)
    background_tasks.add_task(process_file_worker, user["id"], filename, file_bytes, source_type)

    return {
        "message": f"'{filename}' accepted for processing.",
        "status": "processing",
        "title": filename,
        "source_type": source_type
    }


@app.post("/api/search", response_model=SearchResponse)
@limiter.limit("100/minute")
async def search_knowledge_base(request: Request, q: SearchQuery):
    """
    Vector similarity search using semantic Redis caching.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    user = get_current_user(request)
    
    # 1. Check Redis Cache
    cache_key = f"search:{user['id']}:{hashlib.md5(q.query.encode()).hexdigest()}"
    try:
        cached_result = await redis_client.get(cache_key)
        if cached_result:
            data = json.loads(cached_result)
            return SearchResponse(answer=data["answer"], citations=data["citations"], cached=True)
    except Exception:
        pass # Ignore redis errors if unconfigured

    # 2. Generate embedding (Threaded)
    query_embedding = await asyncio.to_thread(generate_query_embedding, q.query)

    if not query_embedding:
        return SearchResponse(answer="I'm sorry, I encountered an error generating a semantic vector for your query. Please try again later.", citations=[])

    # 3. Suppabase Search (Use admin client to bypass RLS issues)
    client = supabase_admin if supabase_admin else supabase
    results = await asyncio.to_thread(
        client.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_threshold": 0.5,
            "match_count": q.top_k,
            "p_user_id": user["id"]
        }).execute
    )

    if not getattr(results, "data", []):
        logger.warning(f"🔍 No documents matched threshold (0.5) for query: '{q.query}' (User: {user['id']})")
        return SearchResponse(answer=f"I couldn't find any relevant documents for '{q.query}'.", citations=[])

    matched_docs = results.data
    logger.info(f"✅ Found {len(matched_docs)} relevant match(es) for query: '{q.query}' (User: {user['id']})")
    
    # Pre-process context for generation
    context_text = "\n\n---\n\n".join([doc["content"] for doc in matched_docs])
    
    # 4. Generate AI Answer based on context AND user instructions/query
    logger.info(f"✨ Generating AI response for user {user['id']}...")
    ai_answer = await asyncio.to_thread(generate_rag_answer, q.query, context_text)
    
    citations = []
    seen_titles = set()
    for doc in matched_docs:
        title = doc.get("title", "Untitled")
        base_title = title.split(" (chunk")[0]
        if base_title not in seen_titles:
            seen_titles.add(base_title)
            citations.append(DocumentRef(
                id=doc["id"],
                title=base_title,
                source_type=doc.get("source_type", "text"),
                similarity=round(doc.get("similarity", 0), 3),
                created_at=doc.get("created_at"),
                metadata=doc.get("metadata")
            ))

    response_data = {"answer": ai_answer, "citations": [c.model_dump() for c in citations]}
    
    # 4. Save to Redis (expire in 5 mins)
    try:
        await redis_client.setex(cache_key, 300, json.dumps(response_data))
    except Exception:
        pass

    return SearchResponse(answer=ai_answer, citations=citations, cached=False)

@app.get("/api/documents")
@limiter.limit("60/minute")
async def list_documents(request: Request):
    user = get_current_user(request)
    result = await asyncio.to_thread(
        supabase.table("documents").select("id, title, source_type, created_at, metadata").eq("user_id", user["id"]).order("created_at", desc=True).execute
    )
    docs_map = {}
    for row in getattr(result, "data", []):
        meta = json.loads(row.get("metadata", "{}")) if isinstance(row.get("metadata"), str) else row.get("metadata", {})
        original = meta.get("original_filename", row["title"])
        if original not in docs_map:
            docs_map[original] = {"id": row["id"], "title": original, "source_type": row.get("source_type", "text"), "chunk_count": 1}
        else:
            docs_map[original]["chunk_count"] += 1
    return list(docs_map.values())

@app.delete("/api/documents/{doc_title}")
@limiter.limit("20/minute")
async def delete_document(request: Request, doc_title: str):
    user = get_current_user(request)
    await asyncio.to_thread(supabase.table("documents").delete().eq("user_id", user["id"]).like("title", f"%{doc_title}%").execute)
    return {"message": "Deleted"}

@app.get("/api/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    return {"status": "1M RPS Architecture Running (Async Workers, Redis Caching, SlowAPI)"}

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
