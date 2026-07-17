import httpx
import logging

# Configuração simples de log para vermos o erro no terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OllamaProvider:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url
        self.model = model
    
    def generate_chat_response(self, messages, system_prompt):
        # 1. Limpeza básica do prompt (remover espaços extras)
        clean_prompt = system_prompt.strip()
        
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": clean_prompt}] + messages,
            "stream": False
        }

        try:
            logger.info(f"Enviando requisição ao Ollama com modelo: {self.model}")
            response = httpx.post(f"{self.base_url}/api/chat", json=payload, timeout=120.0)
            
            # Se o Ollama der erro, vamos capturar a mensagem dele
            if response.status_code != 200:
                logger.error(f"Erro do Ollama: {response.text}")
                return f"⚠ O Ollama recusou a requisição (Código {response.status_code})"

            data = response.json()
            return data.get("message", {}).get("content", "Sem resposta.")
        except Exception as e:
            logger.exception("Falha na conexão com Ollama")
            return f"⚠ Erro técnico: {str(e)}"