from pydantic import BaseModel, ConfigDict

class SSatelliteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_page: int
    title_content: str | None
    img: str | None
    small_content: str | None
    big_content: str | None
    source: str | None
    country: list[str]
    is_civ: bool
    is_com: bool

class SSatellitePageOut(BaseModel):
    items: list[SSatelliteOut]
    total: int

