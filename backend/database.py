from sqlmodel import SQLModel, create_engine, Session
from config import DATABASE_URL
import models 

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

def create_db_and_tables() -> None:
    """
    Função chamada quando o servidor inicia.
    Ela verifica as classes no arquivo models.py e cria as tabelas no SQLite
    se elas ainda não existirem.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Função injetada nas rotas do FastAPI.
    Garante que cada requisição (ex: salvar uma nota) tenha sua própria sessão
    segura com o banco de dados, fechando a conexão automaticamente no final.
    """
    with Session(engine) as session:
        yield session