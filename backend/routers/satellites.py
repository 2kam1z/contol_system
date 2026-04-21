from fastapi import APIRouter, HTTPException, Query
from starlette import status

from backend.database.db import SessionDep
from backend.services.exporters import export_pdf, export_excel, export_doc, export_html
from backend.services.repository import SatellitesRepository
from backend.schemas.satellite import SSatellitePageOut


router = APIRouter(prefix="/satellites", tags=["satellites"])

_EXPORT_HANDLERS = {
    "pdf": export_pdf,
    "excel": export_excel,
    "doc": export_doc,
    "html": export_html,
}


@router.get("/groups", status_code=status.HTTP_200_OK)
async def get_satellites(
        session: SessionDep,
        parent_id: int,
        limit: int = Query(default=6, ge=1, le=1000),
        offset: int = Query(default=0, ge=0),
    ) -> SSatellitePageOut:
    return await SatellitesRepository.find_satellites(session, parent_id=parent_id, limit=limit, offset=offset)


@router.get("/{id}/export")
async def export_satellite(
    id: int,
    session: SessionDep,
    export_format: str = Query(..., alias="format", description="pdf | excel | doc | html"),
):
    sat = await SatellitesRepository.find_one_satellite(session, id)
    if not sat:
        raise HTTPException(status_code=404, detail="Спутник не найден")

    handler = _EXPORT_HANDLERS.get(export_format.lower())
    if not handler:
        raise HTTPException(status_code=400, detail=f"Неизвестный формат: {export_format}")

    return handler(sat)


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_satellites(
    session: SessionDep,
    query: str = Query(default="", alias="q"),
    parent_id: int = Query(default=148),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> SSatellitePageOut:
    return await SatellitesRepository.find_satellites(session, parent_id=parent_id, query=query, limit=limit, offset=offset)
