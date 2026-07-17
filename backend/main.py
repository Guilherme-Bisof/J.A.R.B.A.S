from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa as funções do banco de dados
from database import create_db_and_tables

# Importamos todos os roteadores do J.A.R.B.A.S.
from routers import chat, vault, projects, tags, categories, links, documents, intelligence

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Executado quando o servidor inicia. Garante que as tabelas sejam criadas."""
    create_db_and_tables()
    print("J.A.R.B.A.S. Supreme Backend Online. Banco de dados inicializado.")
    yield

# Criação da instância do FastAPI
app = FastAPI(
    title="J.A.R.B.A.S. Supreme API",
    description="Sistema Operacional de Inteligência Pessoal - Local First",
    version="2.0.0",
    lifespan=lifespan,
)

# Configuração de CORS para permitir que o Frontend (React) converse com o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, limitamos às URLs corretas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrando cada Roteador na API
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(vault.router, prefix="/api/vault", tags=["Vault"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(links.router, prefix="/api/vault", tags=["Links"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])

# Rotas futuras / desligadas
# app.include_router(ai_chat.router, prefix="/api/ai", tags=["AI"])


@app.get("/api/health")
def health():
    """Rota de diagnóstico simples para verificar se o sistema está operando."""
    return {"status": "online", "system": "J.A.R.B.A.S. Supreme"}