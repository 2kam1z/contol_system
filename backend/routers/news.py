from fastapi import APIRouter, Query, HTTPException
from starlette import status

from backend.database.db import SessionDep
from backend.repositories.repository import NewsRepository
from backend.schemas.news import SNewsPageOut, SNewsOut

router = APIRouter(prefix="/news", tags=["News"])

@router.get('', status_code=status.HTTP_200_OK)
async def get_news(
    session: SessionDep,
    limit: int = Query(default=5, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SNewsPageOut:
    return await NewsRepository.find_news(session, limit=limit, offset=offset)

@router.get('/{id}', status_code=status.HTTP_200_OK)
async def get_one_news(
        id: int,
        session: SessionDep,
) -> SNewsOut:
    news = await NewsRepository.find_one_news(session, id)
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена")
    return news