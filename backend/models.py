from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

# Função auxiliar para gerar IDs únicos automaticamente
def new_id() -> str:
    return str(uuid.uuid4())

#  Projetos
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

#  O Cofre Universal 
class KnowledgeItem(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    title: str = Field(index=True)
    content: str = "" # Serve para o texto da nota, da memória ou o texto extraído do PDF
    
    #  Tipagem e Classificação 
    item_type: str = Field(index=True) # Tipos suportados: "memory", "note", "document", "fact"
    category_id: Optional[str] = Field(default=None, foreign_key="category.id")
    
    #  Metadados Específicos 
    source: str = "manual" # Se for documento, guardamos o filepath aqui (ex: vault/documents/file.pdf). 
    importance: int = 5    # Herdado de Memory (escala de 1-10)
    
    #  Relacionamentos
    project_id: Optional[str] = Field(default=None, foreign_key="project.id")
    
    #  Auditoria de Tempo
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

#  Categorias 
class Category(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True, unique=True)
    color: str = "#4B5563"
    created_at: datetime = Field(default_factory=datetime.utcnow)

#  Tags
class Tag(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True, unique=True)
    color: str = "#8B5CF6"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeTagLink(SQLModel, table=True):
    knowledge_id: str = Field(foreign_key="knowledgeitem.id", primary_key=True)
    tag_id: str = Field(foreign_key="tag.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

#  Sistema de Links estilo Obsidian 
class KnowledgeLink(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    from_id: str = Field(foreign_key="knowledgeitem.id", index=True)
    to_id: str = Field(foreign_key="knowledgeitem.id", index=True)
    link_type: str = "reference" # Tipos: related, child, parent, reference
    created_at: datetime = Field(default_factory=datetime.utcnow)

#  Chat 
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