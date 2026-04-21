from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SNewsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_page: int
    title_content: str | None
    img: str | None
    small_content: str | None
    big_content: str | None
    source: str | None
    dte: datetime

class SNewsPageOut(BaseModel):
    items: list[SNewsOut]
    total: int