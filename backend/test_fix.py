import os
import logging
from dotenv import load_dotenv
from embeddings import generate_rag_answer

# Setup logging to see what's happening
logging.basicConfig(level=logging.INFO)
load_dotenv()

def test_rag():
    query = "What is the difference between CPU and CUDA?"
    context = "CPUs are general purpose processors. CUDA is a parallel computing platform by NVIDIA for GPUs."
    
    print("\n--- Testing RAG Answer Generation ---")
    answer = generate_rag_answer(query, context)
    print(f"\nAI ANSWER:\n{answer}\n")
    
    if "sorry" in answer.lower() and "trouble" in answer.lower():
        print("❌ Test Failed: AI could not generate an answer.")
    else:
        print("✅ Test Passed: AI generated an answer successfully.")

if __name__ == "__main__":
    test_rag()
