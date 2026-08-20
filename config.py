"""
Central configuration for the Day 1 RAG starter kit.
Edit these values to match your team's setup — everything else
in this repo reads from here, so you only need to change it in one place.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "clinical_guidelines"

# --- Chunking ---
# Values are in approximate tokens. The splitter uses a rough
# 4-characters-per-token estimate to convert these to character counts.
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50

# --- Embeddings ---
# "local"  -> free, runs on your machine, lightweight, no API key needed (default)
# "openai" -> higher quality, requires OPENAI_API_KEY in .env
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local")
LOCAL_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

# --- Retrieval ---
TOP_K = 8

# --- Generation (optional — only used if OPENAI_API_KEY is set) ---
OPENAI_CHAT_MODEL = "gpt-4o-mini"
