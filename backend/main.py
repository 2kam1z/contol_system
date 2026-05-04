from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from backend.routers.satellites import router as satellites_router
from backend.routers.news import router as news_router
from backend.routers.oauth import router as oauth_router


app = FastAPI(title="Система контроля процессов — API")

app.include_router(satellites_router)
app.include_router(news_router)
app.include_router(oauth_router)

app.mount("/", StaticFiles(directory=".", html=True), name="static")
