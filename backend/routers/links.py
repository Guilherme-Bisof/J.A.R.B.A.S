from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_session
from models import KnowledgeLink, KnowledgeItem

router = APIRouter()

class LinkCreate(BaseModel):
    from_id: str
    to_id: str
    link_type: str = "reference"  # related, child, parent, reference

class LinkRead(BaseModel):
    id: str
    from_id: str
    to_id: str
    link_type: str
    created_at: datetime
    # Dados resumidos do item vinculado
    linked_title: str
    linked_type: str

@router.get("/{item_id}/links", response_model=List[LinkRead])
def get_item_links(item_id: str, session: Session = Depends(get_session)):
    """Retorna todos os links de um KnowledgeItem (tanto de saída quanto de entrada)."""
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    
    # Busca links onde o item é origem OU destino (bidirecional)
    links = session.exec(
        select(KnowledgeLink).where(
            or_(KnowledgeLink.from_id == item_id, KnowledgeLink.to_id == item_id)
        )
    ).all()
    
    result = []
    for link in links:
        # Determinar qual é o item "do outro lado" do link
        other_id = link.to_id if link.from_id == item_id else link.from_id
        other_item = session.get(KnowledgeItem, other_id)
        
        result.append(LinkRead(
            id=link.id,
            from_id=link.from_id,
            to_id=link.to_id,
            link_type=link.link_type,
            created_at=link.created_at,
            linked_title=other_item.title if other_item else "(Item removido)",
            linked_type=other_item.item_type if other_item else "unknown"
        ))
    return result

@router.post("/links", response_model=LinkRead)
def create_link(data: LinkCreate, session: Session = Depends(get_session)):
    """Cria um link entre dois KnowledgeItems."""
    # Validar que ambos os itens existem
    from_item = session.get(KnowledgeItem, data.from_id)
    if not from_item:
        raise HTTPException(status_code=404, detail="Item de origem não encontrado.")
    
    to_item = session.get(KnowledgeItem, data.to_id)
    if not to_item:
        raise HTTPException(status_code=404, detail="Item de destino não encontrado.")
    
    if data.from_id == data.to_id:
        raise HTTPException(status_code=400, detail="Não é possível criar um link de um item para ele mesmo.")
    
    # Verificar se esse link já existe (evitar duplicatas)
    existing = session.exec(
        select(KnowledgeLink).where(
            KnowledgeLink.from_id == data.from_id,
            KnowledgeLink.to_id == data.to_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Esse link já existe.")
    
    link = KnowledgeLink(
        from_id=data.from_id,
        to_id=data.to_id,
        link_type=data.link_type
    )
    session.add(link)
    session.commit()
    session.refresh(link)
    
    return LinkRead(
        id=link.id,
        from_id=link.from_id,
        to_id=link.to_id,
        link_type=link.link_type,
        created_at=link.created_at,
        linked_title=to_item.title,
        linked_type=to_item.item_type
    )

@router.delete("/links/{link_id}")
def delete_link(link_id: str, session: Session = Depends(get_session)):
    """Remove um link entre dois KnowledgeItems."""
    link = session.get(KnowledgeLink, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado.")
    
    session.delete(link)
    session.commit()
    return {"message": "Link removido com sucesso."}
