from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from database import get_session
from models import Document
from core.processor import extrair_texto
from core.ai.provider import OllamaProvider
from config import OLLAMA_BASE_URL, OLLAMA_MODEL

router = APIRouter()

@router.post("/api/ai/consultar-documento/{doc_id}")
def consultar_documento(doc_id: str, pergunta: str, session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado no cofre.")
    
    texto_do_arquivo = extrair_texto(doc.filepath)
    if len(texto_do_arquivo) > 3000:
        texto_do_arquivo = texto_do_arquivo[:3000] + "\n...[truncado]..."
    
    sistema_prompt = f"Você é o J.A.R.B.A.S. Use APENAS este texto para responder: {texto_do_arquivo}"
    
    provider = OllamaProvider(base_url=OLLAMA_BASE_URL, model=OLLAMA_MODEL)
    resposta = provider.generate_chat_response(
        messages=[{"role": "user", "content": pergunta}],
        system_prompt=sistema_prompt
    )
    
    return {"pergunta": pergunta, "resposta": resposta}