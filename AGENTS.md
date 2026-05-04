# Repository Guidelines

## Project Structure & Module Organization

This repository is a single-process FastAPI app that also serves a static Russian-language dashboard. Root-level HTML files (`index.html`, `radar-rse.html`, `radar-search.html`, etc.) are page entry points. Frontend scripts live in `dist/js/`, styles in `dist/css/`, icons in `dist/bootstrap-icons/` and `icons/`, and images in `img/`.

Backend code is under `backend/`: `main.py` wires the app, `routers/` contains endpoints, `repositories/` database queries, `services/` auth/export helpers, `schemas/` Pydantic DTOs, `models/` SQLAlchemy models, and `database/` engine/session setup.

## Build, Test, and Development Commands

There is no dependency manifest checked in. Use the existing virtual environment if present, or recreate it manually:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy aiomysql python-dotenv reportlab openpyxl python-docx lxml pillow
uvicorn backend.main:app --reload
```

Open pages through FastAPI, for example `http://localhost:8000/radar-rse.html`, so API calls use the same origin. Database settings come from environment variables or `.env`: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`.

## Coding Style & Naming Conventions

Use 4-space indentation for Python and keep modules lowercase. Use typed FastAPI route functions and Pydantic schemas for request/response shapes. Frontend code is vanilla JavaScript; organize page modules as DOM references, helpers, fetch/render functions, event wiring, then initial load. Escape interpolated HTML with `escapeHtml()` before assigning `innerHTML`.

Custom CSS classes should keep the `mk-` prefix. Add page-specific CSS after shared Bootstrap and global styles. When changing `dist/js/*.js`, bump the script query string in the corresponding HTML if caching might hide the change.

## Testing Guidelines

No automated test suite is currently committed. For backend changes, run `uvicorn backend.main:app --reload` and manually verify affected endpoints, such as `/news?limit=5` or `/satellites/search?q=&parent_id=148&limit=12&offset=0`. For frontend changes, verify affected pages at desktop and mobile widths.

If adding tests, place them under `tests/`, name files `test_*.py`, and prefer `pytest` with FastAPI `TestClient` or async HTTP clients for routers and repository behavior.

## Commit & Pull Request Guidelines

Recent history uses short imperative summaries, often in Russian, for example `Убраны лишние файлы` or `remove tracked .DS_Store`. Keep commits focused and describe the visible change or cleanup.

Pull requests should include a concise description, affected pages/endpoints, manual test results, linked issue if available, and screenshots for visual changes. Note database or environment changes explicitly.

## Agent-Specific Instructions

Do not re-add removed Bootstrap variants or unreferenced draft assets unless a page actually uses them. Treat `.venv/`, `.idea/`, `__pycache__/`, and `backend/.env` as local-only artifacts.
