from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_session
from models import Category, KnowledgeItem

router = APIRouter()

class CategoryRead(BaseModel):
    id: str
    name: str
    color: str
    count: int
    created_at: datetime

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

@router.get("/", response_model=List[CategoryRead])
def get_categories(session: Session = Depends(get_session)):
    """Retorna todas as categorias e a contagem de itens em que estão sendo usadas."""
    categories = session.exec(select(Category).order_by(Category.name)).all()
    result = []
    for cat in categories:
        count = len(session.exec(
            select(KnowledgeItem).where(KnowledgeItem.category_id == cat.id)
        ).all())
        
        result.append(CategoryRead(
            id=cat.id,
            name=cat.name,
            color=cat.color,
            count=count,
            created_at=cat.created_at
        ))
    return result

@router.put("/{cat_id}", response_model=CategoryRead)
def update_category(cat_id: str, data: CategoryUpdate, session: Session = Depends(get_session)):
    """Atualiza o nome ou cor de uma categoria. Atualizar o nome reflete em todos os itens."""
    cat = session.get(Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    
    if data.name is not None:
        existing = session.exec(select(Category).where(Category.name == data.name)).first()
        if existing and existing.id != cat.id:
            raise HTTPException(status_code=400, detail="Já existe outra categoria com este nome.")
        cat.name = data.name
        
    if data.color is not None:
        cat.color = data.color
        
    session.add(cat)
    session.commit()
    session.refresh(cat)
    
    count = len(session.exec(
        select(KnowledgeItem).where(KnowledgeItem.category_id == cat.id)
    ).all())
    
    return CategoryRead(
        id=cat.id,
        name=cat.name,
        color=cat.color,
        count=count,
        created_at=cat.created_at
    )
