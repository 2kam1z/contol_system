from urllib.parse import urlencode

from backend.core.config import settings


def generate_yandex_oauth_redirect_uri():
    query_params = {
        "client_id": settings.OAUTH_YANDEX_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.OAUTH_YANDEX_REDIRECT_URI,
        "scope": "login:email login:info login:avatar",
    }

    base_url = "https://oauth.yandex.ru/authorize"
    return f"{base_url}?{urlencode(query_params)}"
