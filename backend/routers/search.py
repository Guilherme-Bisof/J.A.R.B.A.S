from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List

from database import get_session
from models import Note, Memory, NoteRead, MemoryRead

router = APIRouter()


class SearchResults(BaseModel):
    notes: List[NoteRead]
    memories: List[MemoryRead]
    total: int


@router.get("/", response_model=SearchResults)
def search(q: str, session: Session = Depends(get_session)):
    term = q.lower().strip()
    if not term:
        return SearchResults(notes=[], memories=[], total=0)

    all_notes = session.exec(select(Note)).all()
    all_mems = session.exec(select(Memory)).all()

    matched_notes = [
        n for n in all_notes
        if term in n.title.lower()
        or term in (n.content or "").lower()
        or term in (n.tags or "").lower()
        or term in (n.category or "").lower()
    ]
    matched_mems = [
        m for m in all_mems
        if term in m.key.lower()
        or term in m.value.lower()
        or term in (m.category or "").lower()
    ]

    return SearchResults(
        notes=matched_notes,
        memories=matched_mems,
        total=len(matched_notes) + len(matched_mems),
    )