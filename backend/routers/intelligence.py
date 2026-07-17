from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List

from database import get_session
from models import KnowledgeItem, KnowledgeLink, KnowledgeTagLink
from routers.vault import _sync_category, _sync_tags, _serialize
from core.ollama import process_knowledge_with_ollama, analyze_knowledge_with_ollama

router = APIRouter()

class AnalyzeRequest(BaseModel):
    question: str

@router.post("/process/{item_id}")
async def process_item(item_id: str, session: Session = Depends(get_session)):
    """
    Roda o motor de inteligência no item, usando Ollama local para ler o texto, 
    extrair categorias, tags e criar pílulas de conhecimento (fatos) linkadas.
    """
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado no cofre.")
    
    # Previne processamento vazio
    if not item.content or len(item.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="O texto é muito curto para ser processado.")
    
    # 1. Enviar para a IA local (Ollama)
    ai_result = await process_knowledge_with_ollama(item.content)
    
    # 2. Atualizar a Categoria do Documento
    new_cat_id = _sync_category(session, ai_result["category"])
    item.category_id = new_cat_id
    
    # 3. Atualizar as Tags do Documento (Sem perder as antigas)
    new_tags = ai_result["tags"]
    if new_tags:
        tags_str = ", ".join(new_tags)
        _sync_tags(session, item.id, tags_str)
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # 4. Criar pílulas de Fatos (KnowledgeLink)
    # Sincroniza e vincula as tags
    _sync_tags(session, item, ai_result.get("tags", []))
    
    facts_created = 0
    # Cria novas notas (child) baseadas nos fatos extraídos
    for fact in ai_result.get("facts", []):
        fact_item = KnowledgeItem(
            title="Fato Extraído",
            content=fact,
            item_type="fact",
            source="JARBAS Intelligence",
            importance=item.importance
        )
        session.add(fact_item)
        session.flush() # obtemos ID
        
        # Link como child do item original
        link = KnowledgeLink(from_id=item.id, to_id=fact_item.id, link_type="child")
        session.add(link)
        facts_created += 1

    session.commit()
    session.refresh(item)
    
    # Após processar e sincronizar as novas tags, roda o motor de relacionamento para conectar a teia
    _run_global_relationships(session)

    # Retorna o item atualizado com as novas propriedades
    return {
        "message": "Processamento concluído com sucesso",
        "facts_created": facts_created,
        "item": _serialize(session, item)
    }

@router.post("/analyze/{item_id}")
async def analyze_item(item_id: str, req: AnalyzeRequest, session: Session = Depends(get_session)):
    """
    Roda o motor de inteligência no item para responder a uma pergunta específica.
    """
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado no cofre.")
    
    if not item.content or len(item.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="O texto é muito curto para ser analisado.")
    
    try:
        answer = await analyze_knowledge_with_ollama(item.content, req.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _run_global_relationships(session: Session) -> int:
    items = session.exec(select(KnowledgeItem)).all()
    tag_links = session.exec(select(KnowledgeTagLink)).all()
    existing_links = session.exec(select(KnowledgeLink)).all()
    
    # Mapa de item_id -> set de tag_ids
    item_tags = {item.id: set() for item in items}
    for tl in tag_links:
        if tl.knowledge_id in item_tags:
            item_tags[tl.knowledge_id].add(tl.tag_id)
            
    # Conjunto de links existentes para busca rápida
    linked_pairs = set()
    for link in existing_links:
        pair = tuple(sorted([link.from_id, link.to_id]))
        linked_pairs.add(pair)
        
    new_links_count = 0
    
    # Comparar todos com todos na RAM
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            item_a = items[i]
            item_b = items[j]
            
            pair = tuple(sorted([item_a.id, item_b.id]))
            if pair in linked_pairs:
                continue
                
            tags_a = item_tags.get(item_a.id, set())
            tags_b = item_tags.get(item_b.id, set())
            
            shared_tags = len(tags_a.intersection(tags_b))
            same_category = (item_a.category_id == item_b.category_id) and (item_a.category_id is not None)
            
            if shared_tags > 0 or same_category:
                new_link = KnowledgeLink(from_id=item_a.id, to_id=item_b.id, link_type="related")
                session.add(new_link)
                linked_pairs.add(pair)
                new_links_count += 1
                
    session.commit()
    return new_links_count

@router.post("/relationships/global")
async def global_relationships(session: Session = Depends(get_session)):
    """
    Roda o Relationship Engine em todo o cofre via botão manual.
    """
    new_links_count = _run_global_relationships(session)
    return {"message": "Motor de Relacionamento concluído", "new_connections": new_links_count}

