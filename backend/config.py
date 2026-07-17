import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env (se existir)
load_dotenv()

# ─── Configurações de Inteligência Artificial ───────────────────────────────
# Define qual provedor usar. O padrão agora é "ollama" (local-first)
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")

# Se for usar Ollama, onde ele está rodando?
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

# Prompt base do sistema (O "coração" da personalidade do J.A.R.B.A.S.)
SYSTEM_PROMPT = """Você é o J.A.R.B.A.S. — Joint Autonomous Reasoning Brain and Advanced System.
Você é um Sistema Operacional de Inteligência Pessoal e assistente avançado.
Responda de forma concisa, inteligente e em português. Use markdown para formatar suas respostas.
Sempre analise o contexto fornecido antes de responder."""

# ─── Configurações do Banco de Dados ───────────────────────────────────────
# Caminho para o banco de dados SQLite. 
# Note que agora estamos apontando para a pasta "data/" que você criou.
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/jarbas.db")