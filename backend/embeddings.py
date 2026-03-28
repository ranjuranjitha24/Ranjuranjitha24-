import os
import logging
import google.generativeai as genai
from typing import List, Dict, Any
from openai import OpenAI

logger = logging.getLogger("backend.embeddings")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
XAI_API_KEY = os.getenv("XAI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def chunk_text(text: str, chunk_size=500, overlap=50) -> List[str]:
    """Maintain chunking for 768-D Gemini vectors."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def get_gemini_embedding(text: str, task_type: str = "retrieval_document") -> List[float]:
    """Generates a 768-dimensional vector using Gemini gemini-embedding-001."""
    if not GEMINI_API_KEY:
        logger.error("Error: GEMINI_API_KEY not found in .env")
        return []
    
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type=task_type
        )
        # Use full 3072D vectors (gemini-embedding-001 is NOT Matryoshka-sliceable).
        return result['embedding']
    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}", exc_info=True)
        return []

def embed_document(text_content: str) -> List[Dict[str, Any]]:
    """Chunks internal documents and assigns Gemini semantic vectors."""
    chunks = chunk_text(text_content)
    result = []
    for chunk in chunks:
        embedding = get_gemini_embedding(chunk, task_type="retrieval_document")
        if embedding: # Only add if embedding was successful
            result.append({
                "chunk_text": chunk,
                "embedding": embedding
            })
    return result

def generate_query_embedding(query: str) -> List[float]:
    """Fast semantic vector generation for user searches."""
    return get_gemini_embedding(query, task_type="retrieval_query")

def generate_rag_answer(query: str, context: str) -> str:
    """Uses Grok (xAI) if key is present, otherwise falls back to Gemini models with failover."""
    
    system_prompt = f"""
    You are an expert Personal Tutor specialized in helping students prepare for exams.
    
    INSTRUCTIONS:
    1. Contextual Accuracy: Use ONLY the provided context to answer. If the information is not there, say you don't know based on the documents.
    2. Format: Adhere STRICTLY to the user's requested format (e.g., 'pointwise', '5 marks', 'one line', 'tricks').
    3. Memory Tricks: Always include a '💡 Memory Trick' for technical concepts.
    
    CONTEXT:
    {context}
    """
    
    user_prompt = f"USER QUERY: {query}\n\nFollow all formatting instructions."

    # 1. Try xAI (Grok) - Updated with valid frontier model names
    if XAI_API_KEY and XAI_API_KEY != "your_xai_key_here":
        # Using grok-2-1212 (standard) and grok-2-mini (faster)
        for model_name in ["grok-2-1212", "grok-2-mini", "grok-beta"]:
            try:
                logger.info(f"🧠 Attempting Grok ({model_name})...")
                client = OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"Grok {model_name} failed: {str(e)}")

    # 2. Try Gemini Models - Updated Fallback sequence
    if GEMINI_API_KEY:
        # Sequence: 2.0-flash (frontier), 1.5-flash (stable), 1.5-pro (high reasoning)
        for model_name in ["models/gemini-2.0-flash", "models/gemini-1.5-flash", "models/gemini-1.5-pro"]:
            try:
                logger.info(f"🧠 Attempting Gemini ({model_name})...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(system_prompt + "\n\n" + user_prompt)
                return response.text
            except Exception as e:
                logger.warning(f"Gemini {model_name} failed: {str(e)}")

    return "I'm sorry, I'm having trouble connecting to all AI models. Please check your API keys or try again later."
