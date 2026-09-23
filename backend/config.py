"""
Configuration management using pydantic-settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Groq
    groq_api_key: str = ""
    groq_model_id: str = "openai/gpt-oss-20b"

    chroma_persist_dir: str = "./chroma_db"
    max_tokens: int = 1024
    temperature: float = 0.7
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k_retrieval: int = 5

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
