from typing import Annotated

from fastapi import APIRouter, Body, Request
from fastapi.responses import RedirectResponse
import aiohttp

from backend.core.config import settings
from backend.services.oauth_yandex import generate_yandex_oauth_redirect_uri

router = APIRouter(prefix="/auth", tags=["oauth"])


@router.get("/yandex/url")
def get_yandex_oauth_redirect_url():
    uri = generate_yandex_oauth_redirect_uri()
    return RedirectResponse(url=uri, status_code=302)


@router.get("/yandex")
def yandex_oauth_page(request: Request):
    query = request.url.query
    callback_url = "/yandex-callback.html"

    if query:
        callback_url = f"{callback_url}?{query}"

    return RedirectResponse(url=callback_url, status_code=302)


@router.post("/yandex/callback")
async def handle_code(
        code: Annotated[str, Body(embed=True)]
):
    yandex_token_url = "https://oauth.yandex.ru/token"
    async with aiohttp.ClientSession() as session, session.post(url=yandex_token_url, data={
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.OAUTH_YANDEX_CLIENT_ID,
        "client_secret": settings.OAUTH_YANDEX_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_YANDEX_REDIRECT_URI,
    },
    ssl=False) as response:
        res = await response.json()
   #     id_token = res["id_token"]
    #    user_data = jwt.decode(
     #       id_token,
      #      algorithms=["RS256"],
        #    options={"verify_signature": False},
       # )

    #return {
     #   "user": user_data
    #}
    print(res)
