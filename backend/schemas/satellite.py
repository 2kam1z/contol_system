from pydantic import BaseModel, ConfigDict

class SSatelliteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_page: int
    title_content: str | None
    img: str | None
    small_content: str | None
    big_content: str | None
    country: list[str]
    mass: str | None
    frequency_range: str | None = None
    resolution: str | None = None
    radiometric_sensitivity: str | None = None

class SSatellitePageOut(BaseModel):
    items: list[SSatelliteOut]
    total: int
