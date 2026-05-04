from sqlalchemy.orm import Mapped, mapped_column

from backend.database.db import Model


class Users(Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]
    password: Mapped[str]
