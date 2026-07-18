import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime

from database import get_session
from models import KnowledgeItem, Tag, KnowledgeTagLink, Category
from routers.vault import _sync_tags, _sync_category, _serialize

router = APIRouter()

VAULT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vault", "documents")
os.makedirs(VAULT_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".html", ".css"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

def _extract_text(filepath: str, extension: str) -> str:
    """Extrai texto de um arquivo baseado na sua extensão."""
    if extension == ".pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
            return text.strip() if text.strip() else "(PDF sem texto extraível)"
        except Exception as e:
            return f"(Erro ao extrair PDF: {str(e)})"
    else:
        # Para TXT, MD, CSV, código-fonte, etc.
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            with open(filepath, "r", encoding="latin-1") as f:
                return f.read()

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    tags: str = Form(""),
    session: Session = Depends(get_session)
):
    """Faz upload de um documento, extrai o texto e salva no Cofre como KnowledgeItem."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")
    
    # Validar extensão
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Extensão '{ext}' não suportada. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Salvar arquivo no disco
    safe_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(VAULT_DIR, safe_name)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extrair texto
    extracted_text = _extract_text(filepath, ext)
    
    # Encontrar ou criar a categoria
    cat_id = _sync_category(session, category)
    
    # Criar o KnowledgeItem do tipo "document"
    item = KnowledgeItem(
        title=file.filename,
        content=extracted_text,
        item_type="document",
        category_id=cat_id,
        source=f"vault/documents/{safe_name}",
        importance=5,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # Sincronizar tags
    if tags:
        _sync_tags(session, item.id, tags)
    
    return _serialize(session, item)

@router.get("/list")
def list_documents(session: Session = Depends(get_session)):
    """Lista todos os documentos do cofre."""
    items = session.exec(
        select(KnowledgeItem)
        .where(KnowledgeItem.item_type == "document")
        .order_by(KnowledgeItem.updated_at.desc())
    ).all()
    return [_serialize(session, item) for item in items]

@router.delete("/{item_id}")
def delete_document(item_id: str, session: Session = Depends(get_session)):
    """Deleta um documento e seu arquivo físico do cofre."""
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")
    if item.item_type != "document":
        raise HTTPException(status_code=400, detail="Este item não é um documento.")
    
    # Deletar arquivo físico (se existir)
    if item.source and item.source.startswith("vault/"):
        full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), item.source)
        if os.path.exists(full_path):
            os.remove(full_path)
    
    # Deletar links de tags
    links = session.exec(select(KnowledgeTagLink).where(KnowledgeTagLink.knowledge_id == item_id)).all()
    for link in links:
        session.delete(link)
    
    session.delete(item)
    session.commit()
    return {"message": "Documento removido do cofre com sucesso."}
