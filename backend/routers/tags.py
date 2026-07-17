from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_session
from models import Tag, KnowledgeTagLink

router = APIRouter()

class TagRead(BaseModel):
    id: str
    name: str
    color: str
    count: int
    created_at: datetime

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

@router.get("/", response_model=List[TagRead])
def get_tags(session: Session = Depends(get_session)):
    """Retorna todas as tags e a contagem de itens em que estão sendo usadas."""
    tags = session.exec(select(Tag).order_by(Tag.name)).all()
    result = []
    for tag in tags:
        # Conta quantos links existem para esta tag
        count = len(session.exec(
            select(KnowledgeTagLink).where(KnowledgeTagLink.tag_id == tag.id)
        ).all())
        
        result.append(TagRead(
            id=tag.id,
            name=tag.name,
            color=tag.color,
            count=count,
            created_at=tag.created_at
        ))
    return result

@router.put("/{tag_id}", response_model=TagRead)
def update_tag(tag_id: str, data: TagUpdate, session: Session = Depends(get_session)):
    """Atualiza o nome ou cor de uma tag. Atualizar o nome reflete em todos os itens."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada.")
    
    if data.name is not None:
        # Checa se não tem outra com mesmo nome
        existing = session.exec(select(Tag).where(Tag.name == data.name)).first()
        if existing and existing.id != tag.id:
            raise HTTPException(status_code=400, detail="Já existe outra tag com este nome.")
        tag.name = data.name
        
    if data.color is not None:
        tag.color = data.color
        
    session.add(tag)
    session.commit()
    session.refresh(tag)
    
    count = len(session.exec(
        select(KnowledgeTagLink).where(KnowledgeTagLink.tag_id == tag.id)
    ).all())
    
    return TagRead(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        count=count,
        created_at=tag.created_at
    )
