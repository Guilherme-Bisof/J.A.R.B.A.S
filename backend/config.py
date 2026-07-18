import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env 
load_dotenv()

# Define qual provedor usar.
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")

# Se for usar Ollama
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

# Prompt base do sistema 
SYSTEM_PROMPT = """Você é o J.A.R.B.A.S. — Joint Autonomous Reasoning Brain and Advanced System.
Você é um Sistema Operacional de Inteligência Pessoal e assistente avançado.
Responda de forma concisa, inteligente e em português. Use markdown para formatar suas respostas.
Sempre analise o contexto fornecido antes de responder."""

# Caminho para o banco de dados SQLite. 
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/jarbas.db")