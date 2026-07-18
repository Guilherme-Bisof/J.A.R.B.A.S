import httpx
import json
from typing import Dict, Any


OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3:latest" 

async def process_knowledge_with_ollama(text_content: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Envia o texto para o Ollama local e pede que ele classifique o texto 
    estritamente em formato JSON contendo categoria, tags e fatos principais.
    """
    

    truncated_content = text_content[:4000]
    
    system_prompt = """Você é o J.A.R.B.A.S., um motor de inteligência local projetado para ler textos e organizar o conhecimento.
Aja puramente como um analisador de dados. O usuário vai te enviar um texto. Você DEVE extrair as informações e responder EXCLUSIVAMENTE em formato JSON puro, sem nenhum texto extra ao redor.

A estrutura do JSON obrigatória é:
{
    "category": "Nome da Categoria Principal em Inglês (ex: Physics, Programming, History, Finance)",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "facts": [
        "Fato 1: Uma frase curta com o ponto ou curiosidade mais importante do texto",
        "Fato 2: Outra pílula de conhecimento crucial"
    ]
}

Regras:
1. 'category' deve ter apenas 1 palavra se possível.
2. 'tags' deve ter no máximo 5 palavras chave em inglês.
3. 'facts' deve ter no máximo 3 fatos ultra resumidos e impactantes (em português). Se o texto for curto e não tiver fatos profundos, retorne a lista vazia [].
"""

    prompt = f"Leia o texto abaixo e gere o JSON de organização:\n\n{truncated_content}"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system_prompt,
        "format": "json",       # Força o Ollama a cuspir um JSON válido
        "stream": False,
        "options": {
            "temperature": 0.1  # Baixa temperatura para ele ser muito determinístico
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # O texto da resposta está no campo "response"
            response_text = data.get("response", "{}")
            
            # Converte de volta para dict
            result_json = json.loads(response_text)
            
            # Validação básica
            return {
                "category": result_json.get("category", "general"),
                "tags": result_json.get("tags", []),
                "facts": result_json.get("facts", [])
            }
            
        except Exception as e:
            print(f"[Ollama Error] {str(e)}")
            # Fallback seguro caso a IA ou a rede falhe
            return {
                "category": "general",
                "tags": ["ai_processing_failed"],
                "facts": []
            }

async def analyze_knowledge_with_ollama(text_content: str, question: str, model: str = DEFAULT_MODEL) -> str:
    """
    Usa o Ollama para responder a uma pergunta específica baseada estritamente no documento.
    Retorna o texto em linguagem natural.
    """
    
    # Truncar o contexto para evitar OOM
    truncated_content = text_content[:6000]
    
    system_prompt = f"""Você é o Analisador de Conhecimento do J.A.R.B.A.S.
Sua missão é responder à pergunta do usuário baseando-se ÚNICA E EXCLUSIVAMENTE no documento fornecido abaixo.
Se a resposta não estiver no documento, diga que não sabe. Não invente informações.
Seja conciso, direto e formata sua resposta em Markdown.

--- INÍCIO DO DOCUMENTO ---
{truncated_content}
--- FIM DO DOCUMENTO ---
"""

    payload = {
        "model": model,
        "prompt": question,
        "system": system_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Erro: O modelo não retornou uma resposta.")
        except Exception as e:
            print(f"[Ollama Analyzer Error] {str(e)}")
            raise Exception("Falha ao comunicar com o Ollama local.")
