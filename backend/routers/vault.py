from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_session
from models import KnowledgeItem, Tag, KnowledgeTagLink, Category

router = APIRouter()

class VaultItemCreate(BaseModel):
    title: str
    content: str = ""
    item_type: str = "note"
    category: str = "general"
    tags: str = ""
    source: str = "manual"
    importance: int = 5
    project_id: Optional[str] = None

class VaultItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    item_type: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    source: Optional[str] = None
    importance: Optional[int] = None
    project_id: Optional[str] = None

class VaultItemRead(BaseModel):
    id: str
    title: str
    content: str
    item_type: str
    category: str
    source: str
    importance: int
    project_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    tags: str

def _sync_tags(session: Session, knowledge_id: str, tags_str: str):
    # 1. Deletar links antigos
    links = session.exec(select(KnowledgeTagLink).where(KnowledgeTagLink.knowledge_id == knowledge_id)).all()
    for link in links:
        session.delete(link)
    session.commit()

    if not tags_str:
        return

    # 2. Criar novos links e novas tags se não existirem
    tag_names = [t.strip().lower() for t in tags_str.split(",") if t.strip()]
    for name in tag_names:
        tag = session.exec(select(Tag).where(Tag.name == name)).first()
        if not tag:
            tag = Tag(name=name)
            session.add(tag)
            session.commit()
            session.refresh(tag)
        
        link = KnowledgeTagLink(knowledge_id=knowledge_id, tag_id=tag.id)
        session.add(link)
    session.commit()

def _get_tags_str(session: Session, knowledge_id: str) -> str:
    tags = session.exec(
        select(Tag).join(KnowledgeTagLink).where(KnowledgeTagLink.knowledge_id == knowledge_id)
    ).all()
    return ", ".join([t.name for t in tags])

def _get_category_str(session: Session, category_id: Optional[str]) -> str:
    if not category_id:
        return "general"
    cat = session.get(Category, category_id)
    return cat.name if cat else "general"

def _sync_category(session: Session, category_name: str) -> str:
    if not category_name:
        category_name = "general"
    
    cat_name_lower = category_name.strip().lower()
    cat = session.exec(select(Category).where(Category.name == cat_name_lower)).first()
    if not cat:
        cat = Category(name=cat_name_lower)
        session.add(cat)
        session.commit()
        session.refresh(cat)
    return cat.id

def _serialize(session: Session, item: KnowledgeItem) -> VaultItemRead:
    tags_str = _get_tags_str(session, item.id)
    cat_str = _get_category_str(session, item.category_id)
    return VaultItemRead(**item.model_dump(), tags=tags_str, category=cat_str)

@router.get("/", response_model=List[VaultItemRead])
def get_vault_items(
    item_type: Optional[str] = None,
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(KnowledgeItem)
    if item_type:
        query = query.where(KnowledgeItem.item_type == item_type)
    if category:
        # Precisamos achar o id da categoria primeiro
        cat = session.exec(select(Category).where(Category.name == category.strip().lower())).first()
        if cat:
            query = query.where(KnowledgeItem.category_id == cat.id)
        else:
            # Se a categoria não existe, não tem itens
            return []
    
    query = query.order_by(KnowledgeItem.updated_at.desc())
    items = session.exec(query).all()
    
    return [_serialize(session, item) for item in items]

@router.get("/{item_id}", response_model=VaultItemRead)
def get_vault_item(item_id: str, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado no cofre.")
    return _serialize(session, item)

@router.post("/", response_model=VaultItemRead)
def create_vault_item(item_data: VaultItemCreate, session: Session = Depends(get_session)):
    # 1. Encontrar ou criar a categoria
    cat_id = _sync_category(session, item_data.category)
    
    # 2. Criar item sem os campos extras
    item_dict = item_data.model_dump(exclude={"tags", "category"})
    item = KnowledgeItem(**item_dict, category_id=cat_id)
    
    session.add(item)
    session.commit()
    session.refresh(item)
    
    _sync_tags(session, item.id, item_data.tags)
    return _serialize(session, item)

@router.patch("/{item_id}", response_model=VaultItemRead)
def update_vault_item(item_id: str, item_data: VaultItemUpdate, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado no cofre.")
    
    # Se mandou nova categoria
    if item_data.category is not None:
        cat_id = _sync_category(session, item_data.category)
        item.category_id = cat_id
        
    update_data = item_data.model_dump(exclude_unset=True, exclude={"tags", "category"})
    for key, val in update_data.items():
        setattr(item, key, val)
        
    session.add(item)
    session.commit()
    session.refresh(item)
    
    if item_data.tags is not None:
        _sync_tags(session, item.id, item_data.tags)
        
    return _serialize(session, item)

@router.delete("/{item_id}")
def delete_vault_item(item_id: str, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado no cofre.")
    
    # Deletar links de tags primeiro
    links = session.exec(select(KnowledgeTagLink).where(KnowledgeTagLink.knowledge_id == item_id)).all()
    for link in links:
        session.delete(link)
        
    session.delete(item)
    session.commit()
    return {"message": "Item removido do cofre com sucesso."}
