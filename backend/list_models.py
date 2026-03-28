import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

XAI_API_KEY = os.getenv("XAI_API_KEY")

if XAI_API_KEY:
    client = OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
    try:
        models = client.models.list()
        print("Available xAI models:")
        for model in models.data:
            print(f"- {model.id}")
    except Exception as e:
        print(f"Error listing xAI models: {e}")
else:
    print("XAI_API_KEY not found")
