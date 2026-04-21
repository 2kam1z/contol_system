from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column
from backend.database.db import Model


class PageList(Model):
    __tablename__ = "page_list"

    id_page: Mapped[int] = mapped_column(primary_key=True)
    small_content: Mapped[Optional[str]]
    big_content: Mapped[Optional[str]]
    id_parent: Mapped[int]
    title_content: Mapped[Optional[str]]
    suborder: Mapped[int]
    img: Mapped[Optional[str]]
    is_mil: Mapped[bool]
    is_civ: Mapped[bool]
    is_com: Mapped[bool]
    is_main: Mapped[bool]
    id_tag_1: Mapped[int]
    id_tag_2: Mapped[int]
    id_tag_3: Mapped[int]
    id_tag_4: Mapped[int]
    dte: Mapped[datetime]
    id_pos: Mapped[int]
    source: Mapped[Optional[str]]

class InnerDictinary(Model):
    __tablename__ = "inner_dictinary"

    id_row: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    value: Mapped[str]
    id_parent: Mapped[int]
    id_project: Mapped[int]

class CountryList(Model):
    __tablename__ = "country_list"

    id_row: Mapped[int] = mapped_column(primary_key=True)
    id_type: Mapped[int]
    id_country: Mapped[int]
    id_page: Mapped[int]
