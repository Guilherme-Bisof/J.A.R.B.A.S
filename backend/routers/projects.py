from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from database import get_session
from models import Project

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    status: str = "active"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

@router.get("/")
def get_projects(session: Session = Depends(get_session)):
    """Lista todos os projetos cadastrados."""
    return session.exec(select(Project).order_by(Project.updated_at.desc())).all()

@router.post("/")
def create_project(data: ProjectCreate, session: Session = Depends(get_session)):
    """Cria um novo projeto."""
    project = Project(**data.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.patch("/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, session: Session = Depends(get_session)):
    """Atualiza as informações de um projeto (ex: mudar status para 'archived')."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
        
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(project_id: str, session: Session = Depends(get_session)):
    """Deleta o projeto do banco de dados."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    session.delete(project)
    session.commit()
    return {"ok": True}