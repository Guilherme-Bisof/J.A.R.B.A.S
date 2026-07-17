import webview
import threading
import time
import os

# Função para garantir que o servidor backend esteja rodando (opcional, mas recomendada)
# Por enquanto, apenas apontaremos para o seu servidor frontend (Vite/React)
# que está rodando em localhost:5173
URL_FRONTEND = 'http://localhost:5173'

def start_gui():
    # Cria a janela nativa do Windows
    # title: O nome que aparecerá no topo da janela
    # url: Onde o pywebview deve buscar o conteúdo (seu React)
    # width/height: Tamanho inicial da janela
    window = webview.create_window(
        title='J.A.R.B.A.S. Supreme', 
        url=URL_FRONTEND, 
        width=1200, 
        height=800,
        resizable=True
    )
    
    # Inicia a janela
    webview.start()

if __name__ == '__main__':
    print("Iniciando o J.A.R.B.A.S. em modo nativo...")
    start_gui()