import os
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from database import get_session
from models import Conversation, Message, KnowledgeItem 
from config import SYSTEM_PROMPT, OLLAMA_BASE_URL, OLLAMA_MODEL
from core.ai.provider import OllamaProvider
from core.processor import extrair_texto 

router = APIRouter()

class SendRequest(BaseModel):
    conversation_id: str
    content: str

class SendResponse(BaseModel):
    user_message: dict
    assistant_message: dict

def buscar_contexto_avancado(session: Session, pergunta: str) -> str:
    contexto_acumulado = ""
    pergunta_limpa = re.sub(r'[^\w\s]', '', pergunta)
    palavras_chave = [p.lower() for p in pergunta_limpa.split() if len(p) > 3]

    if not palavras_chave:
        return ""

    itens = session.exec(select(KnowledgeItem)).all()
    
    for item in itens:
        texto_item = f"{item.title} {item.content}".lower()
        
        # Se o item for um documento físico, lemos o arquivo no disco
        if item.item_type == "document":
            if item.source and os.path.exists(item.source):
                texto_do_arquivo = extrair_texto(item.source)
                if any(palavra in texto_do_arquivo.lower() for palavra in palavras_chave):
                    contexto_acumulado += f"DOCUMENTO [{item.title}]:\nCONTEÚDO: {texto_do_arquivo[:15000]}\n\n"
        
        # Se for nota, memória ou fato, apenas lemos o conteúdo que já está no banco
        else:
            if any(palavra in texto_item for palavra in palavras_chave):
                contexto_acumulado += f"CONHECIMENTO [{item.title}] (Tipo: {item.item_type}):\nCONTEÚDO: {item.content}\n\n"

    return contexto_acumulado

#  ROTAS DO CHAT 

@router.get("/conversations")
def get_conversations(session: Session = Depends(get_session)):
    return session.exec(select(Conversation).order_by(Conversation.updated_at.desc())).all()

@router.post("/conversations")
def create_conversation(title: str = "New Conversation", session: Session = Depends(get_session)):
    conv = Conversation(title=title)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv

@router.get("/conversations/{conv_id}/messages")
def get_messages(conv_id: str, session: Session = Depends(get_session)):
    return session.exec(select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at.asc())).all()

@router.post("/send", response_model=SendResponse)
def send_message(req: SendRequest, session: Session = Depends(get_session)):
    conv = session.get(Conversation, req.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_msg = Message(conversation_id=conv.id, role="user", content=req.content)
    session.add(user_msg)
    session.commit()
    session.refresh(user_msg)

    history = session.exec(select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())).all()
    ai_messages = [{"role": msg.role, "content": msg.content} for msg in history]

    contexto_text = buscar_contexto_avancado(session, req.content)
    
    if contexto_text:
        pergunta_original = ai_messages[-1]["content"]
        pacote_blindado = f"""DOCUMENTOS DE REFERÊNCIA OBRIGATÓRIA:
{contexto_text}
---
INSTRUÇÃO ESTRITA:
Responda à pergunta abaixo usando ÚNICA E EXCLUSIVAMENTE os documentos fornecidos acima. 

PERGUNTA DO USUÁRIO:
{pergunta_original}"""
        
        ai_messages[-1]["content"] = pacote_blindado

    provider = OllamaProvider(base_url=OLLAMA_BASE_URL, model=OLLAMA_MODEL)
    ai_content = provider.generate_chat_response(messages=ai_messages, system_prompt=SYSTEM_PROMPT)

    asst_msg = Message(conversation_id=conv.id, role="assistant", content=ai_content)
    session.add(asst_msg)
    
    if conv.title == "New Conversation":
        conv.title = req.content[:40] + "..."
        session.add(conv)

    session.commit()
    session.refresh(asst_msg)

    return SendResponse(
        user_message={
            "id": user_msg.id, "role": user_msg.role, 
            "content": user_msg.content, "created_at": user_msg.created_at.isoformat()
        },
        assistant_message={
            "id": asst_msg.id, "role": asst_msg.role, 
            "content": asst_msg.content, "created_at": asst_msg.created_at.isoformat()
        }
    )