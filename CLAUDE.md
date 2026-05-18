# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Python)

```bash
# Install dependencies
uv sync

# Run server (local development, single-user)
python3 src/khoj/main.py --anonymous-mode

# Run all tests
uv run pytest

# Run a single test file
uv run pytest tests/test_agents.py

# Run a single test function
uv run pytest tests/test_agents.py::test_create_default_agent

# Run tests excluding LLM evaluation tests (faster)
uv run pytest -m "not chatquality"

# Run tests in parallel
uv run pytest -n auto

# Format code
ruff format src/khoj

# Lint and auto-fix
ruff check src/khoj --fix

# Type checking
mypy src/khoj

# Database migrations
python3 src/khoj/manage.py makemigrations
python3 src/khoj/manage.py migrate
```

### Frontend (Next.js)

```bash
cd src/interface/web

bun run dev      # Start dev server
bun run build    # Production build
bun run export   # Static export (used in packaging)
bun run lint     # ESLint check
```

### Docker

```bash
docker-compose up   # Starts PostgreSQL, SearxNG, Terrarium alongside the app
```

## Architecture

Khoj is a personal AI application ("AI second brain") with semantic search, chat, agents, and document processing. It runs as a single server combining FastAPI and Django.

### Backend Framework: FastAPI + Django hybrid

- **FastAPI** handles all HTTP/WebSocket routes
- **Django** provides ORM, admin interface, and migrations
- The two are wired together in `src/khoj/configure.py` and initialized in `src/khoj/main.py`
- Django settings live in `src/khoj/app/settings.py`
- Default server port: **42110**

### Key Source Directories

```
src/khoj/
├── routers/          # FastAPI route handlers (api_chat.py, api_content.py, api_agents.py, etc.)
├── processor/
│   ├── content/      # Document parsers: PDF (PyMuPDF), Markdown, DOCX, Org-mode, Notion, GitHub
│   ├── conversation/ # LLM prompt construction, response parsing, tool dispatch
│   ├── tools/        # Agent tools: web search, code execution, file reading
│   ├── image/        # Image generation
│   ├── speech/       # STT/TTS (Whisper)
│   └── operator/     # Computer-use / environment automation
├── database/
│   ├── models/       # Django ORM models: User, Entry, Agent, Conversation, FileObject, etc.
│   └── adapters/     # Database query functions (no raw SQL; use adapters)
├── search_type/      # Semantic search via pgvector embeddings
├── utils/            # helpers.py (large utility module), state.py, config.py
└── manage.py         # Django management entrypoint
```

### Client Interfaces

```
src/interface/
├── web/       # Next.js 15 SPA (primary UI) — TypeScript, React 18, Tailwind CSS, shadcn-ui
├── desktop/   # Electron wrapper around the web UI
├── obsidian/  # Obsidian plugin
├── emacs/     # Emacs Lisp mode
└── android/   # Android app
```

### Data Flow

1. Client (web/desktop/mobile) sends request via REST or WebSocket
2. FastAPI router authenticates and dispatches to processor
3. Processor calls LLM (OpenAI / Anthropic / Gemini / local) and uses tools (search, code exec, etc.)
4. Django ORM adapters handle all database reads/writes (PostgreSQL + pgvector)
5. Streaming response returned to client (SSE/WebSocket for chat)

### LLM Integration

Multiple providers supported via a unified abstraction in `processor/conversation/`:
- OpenAI (GPT-4o, etc.)
- Anthropic (Claude)
- Google Gemini
- Local models via OpenAI-compatible APIs

Model configuration is stored in the `ChatModel` database table and selected per-user/agent.

### Search & Embeddings

- Documents are chunked and embedded using Sentence Transformers, stored as vectors in PostgreSQL via `pgvector`
- Semantic search is handled in `search_type/text_search.py`
- Cross-encoder reranking is applied for result quality

### Testing Notes

- Tests use `pytest-django`; the Django settings module is set in `pytest.ini`
- `tests/conftest.py` provides fixtures: FastAPI `TestClient`, database setup, default users and chat models
- `tests/helpers.py` has factory helpers: `UserFactory`, `ChatModelFactory`, `AgentFactory`, `FileObjectFactory`
- Test data (markdown, PDFs, images) lives in `tests/data/`
- Mark database tests with `@pytest.mark.django_db` when needed
- The `chatquality` mark is for LLM evaluation tests that require external API calls — exclude with `-m "not chatquality"` for fast local runs

### Pre-commit Hooks

Configured in `.pre-commit-config.yaml`: ruff format + check (pre-commit), mypy (pre-push). CI runs the same checks.
