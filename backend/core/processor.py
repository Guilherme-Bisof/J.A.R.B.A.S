import os

def extrair_texto(caminho_arquivo: str):
    """
    Função simples para ler o conteúdo de um arquivo de texto.
    Em breve expandiremos para ler PDFs e Word.
    """
    try:
        if not os.path.exists(caminho_arquivo):
            return "Erro: Arquivo não encontrado."
            
        with open(caminho_arquivo, "r", encoding="utf-8") as file:
            texto = file.read()
            return texto
    except Exception as e:
        return f"Erro ao ler arquivo: {str(e)}"