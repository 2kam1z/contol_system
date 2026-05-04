from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()
load_dotenv("backend/.env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MIN = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

class Settings(BaseSettings):
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    OAUTH_YANDEX_CLIENT_SECRET: str
    OAUTH_YANDEX_CLIENT_ID: str
    OAUTH_YANDEX_REDIRECT_URI: str = "http://localhost:8000/auth/yandex"

    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_NAME: str

    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"))

settings = Settings()
