from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

# Função auxiliar para gerar IDs únicos automaticamente
def new_id() -> str:
    return str(uuid.uuid4())

# ─── Projetos (Organização Superior) ──────────────────────────────────────────
class Project(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    status: str = "active" # active, archived, planned
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectRead(SQLModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime

# ─── KnowledgeItem (O Cofre Universal - FASE 1) ───────────────────────────────
# Esta é a nova super tabela. Ela substitui Memory, Note, Document e Knowledge.
class KnowledgeItem(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    title: str = Field(index=True)
    content: str = "" # Serve para o texto da nota, da memória ou o texto extraído do PDF
    
    # 1. Tipagem e Classificação (O Segredo da Unificação)
    item_type: str = Field(index=True) # Tipos suportados: "memory", "note", "document", "fact"
    category_id: Optional[str] = Field(default=None, foreign_key="category.id")
    # O campo "tags" original foi removido em favor do sistema relacional (FASE 1 - Item 2)
    
    # 2. Metadados Específicos (Herdados das antigas tabelas)
    source: str = "manual" # Se for documento, guardamos o filepath aqui (ex: vault/documents/file.pdf). 
    importance: int = 5    # Herdado de Memory (escala de 1-10)
    
    # 3. Relacionamentos
    project_id: Optional[str] = Field(default=None, foreign_key="project.id")
    
    # 4. Auditoria de Tempo
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ─── Categorias (Sistema Relacional - FASE 1 Item 3) ──────────────────────────
class Category(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True, unique=True)
    color: str = "#4B5563"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ─── Tags (Sistema Relacional - FASE 1 Item 2) ────────────────────────────────
class Tag(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True, unique=True)
    color: str = "#8B5CF6"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeTagLink(SQLModel, table=True):
    knowledge_id: str = Field(foreign_key="knowledgeitem.id", primary_key=True)
    tag_id: str = Field(foreign_key="tag.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ─── KnowledgeLink (Sistema de Links estilo Obsidian - FASE 1) ────────────────
# Esta tabela permite ligar um KnowledgeItem a outro (Ex: "Albert Einstein" -> "Física")
class KnowledgeLink(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    from_id: str = Field(foreign_key="knowledgeitem.id", index=True)
    to_id: str = Field(foreign_key="knowledgeitem.id", index=True)
    link_type: str = "reference" # Tipos: related, child, parent, reference
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ─── Chat / Interação (Mantido da V1) ─────────────────────────────────────────
class Conversation(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    title: str = "New Conversation"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    conversation_id: str = Field(index=True, foreign_key="conversation.id")
    role: str  # "user" | "assistant" | "system"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)