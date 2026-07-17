# J.A.R.B.A.S. — Joint Autonomous Reasoning Brain and Advanced System

## About the project

A local-first full stack application that works as a **personal intelligence system**, unifying knowledge management, notes, memories, and documents into a single Vault with automatic classification powered by a local LLM.

The project simulates the workflow of an intelligent personal assistant: the user stores different types of information, and the system uses a locally running LLM (Ollama) to categorize content, extract key facts, and create connections between items — building an interlinked knowledge web inspired by tools like Obsidian.

## Features

- **Unified Vault** — centralized storage of notes, memories, documents, and facts under a single structure (`KnowledgeItem`)
- **Context-aware AI Chat** — conversation with a local LLM that automatically retrieves relevant Vault documents to ground its responses (simplified RAG)
- **Document upload & text extraction** — file upload (PDF, TXT, MD, CSV, source code) with automatic text extraction
- **Intelligence engine** — item processing via Ollama for automatic extraction of category, tags, and knowledge pills (facts)
- **Document analysis** — targeted questions against a specific document, with answers based exclusively on its content
- **Relational link system** — bidirectional connections between Vault items (reference, related, parent/child), with an automatic relationship engine based on shared tags and categories
- **Project management** — organize Vault items by project with status tracking
- **Tags & categories** — full relational system with dedicated tables and automatic sync
- **SPA interface with sidebar navigation** — dashboard, chat, notes, memories, projects, knowledge base, and document upload
- **Native desktop mode** — runs as a windowed application via PyWebView

## Tech stack

**Backend**
- Language: Python
- Framework: FastAPI
- ORM: SQLModel (SQLAlchemy + Pydantic)
- Database: SQLite
- ASGI Server: Uvicorn
- AI Integration: Ollama (local LLM — Llama 3)
- HTTP Client: HTTPX
- PDF Extraction: PyPDF2
- Configuration: python-dotenv

**Frontend**
- Language: TypeScript
- Library: React 18
- Bundler: Vite
- State Management: Zustand
- HTTP Client: Axios
- Routing: React Router DOM v6
- Icons: Lucide React
- Styling: Tailwind CSS
- Date Utility: date-fns

**Desktop**
- PyWebView (native Windows window pointing to the React frontend)

**Tools**
- Git / GitHub
- npm / pip

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) installed and running locally with the `llama3` model

### 1. Clone the repository

```bash
git clone https://github.com/Guilherme-Bisof/J.A.R.B.A.S.git
cd J.A.R.B.A.S
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder (optional — default values work out of the box):

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
DATABASE_URL=sqlite:///./jarbas.db
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Ollama (local AI)

Make sure Ollama is running and the model is downloaded:

```bash
ollama run llama3
```

### 5. Desktop mode (optional)

From the project root:

```bash
pip install pywebview
python main_gui.py
```

## Project structure

```
J.A.R.B.A.S/
├── backend/
│   ├── main.py              # API entry point, router registration and CORS
│   ├── models.py            # SQLModel models (KnowledgeItem, Project, Tag, etc.)
│   ├── database.py          # SQLite engine and session management
│   ├── config.py            # Environment variables and system prompt
│   ├── requirements.txt
│   ├── core/
│   │   ├── ai/provider.py   # OllamaProvider class (LLM chat)
│   │   ├── ollama.py        # Processing and analysis functions via Ollama
│   │   └── processor.py     # File text extraction
│   ├── routers/
│   │   ├── vault.py         # Unified Vault CRUD (KnowledgeItem)
│   │   ├── chat.py          # Conversations and context-aware message handling
│   │   ├── documents.py     # Upload, text extraction and document management
│   │   ├── intelligence.py  # AI engine (processing, analysis, relationships)
│   │   ├── projects.py      # Project CRUD
│   │   ├── tags.py          # Tag CRUD
│   │   ├── categories.py    # Category CRUD
│   │   ├── links.py         # Bidirectional links between Vault items
│   │   └── search.py        # Global search
│   └── vault/documents/     # Physical storage for uploaded files
│
├── frontend/
│   └── src/
│       ├── App.tsx           # Main layout with sidebar and routes
│       ├── api/client.ts     # HTTP communication layer with the backend
│       ├── store/useStore.ts # Global application state (Zustand)
│       ├── types/index.ts    # TypeScript type definitions
│       └── views/            # Application pages
│           ├── Dashboard.tsx
│           ├── Chat.tsx
│           ├── Notes.tsx
│           ├── Memory.tsx
│           ├── Projects.tsx
│           ├── Knowledge.tsx
│           └── UploadManager.tsx
│
└── main_gui.py               # Desktop launcher via PyWebView
```

## What this project demonstrates

- Building a full stack application with a React frontend + Python backend working together
- REST API architecture organized by domain (separate routers per resource)
- Relational data modeling with junction tables (many-to-many between items and tags)
- Integration with a local LLM (Ollama) for natural language processing
- Contextual search to feed AI responses (simplified RAG pattern)
- File upload with text extraction (PDF, TXT, source code)
- Frontend state management with Zustand and defensive data validation
- Clear separation between data layer (models), business logic (routers/core), and interface (views)
- Environment-based configuration with sensible defaults

## Future improvements

- Implement semantic search with embeddings (replacing keyword-based search)
- Add user authentication
- Implement automated tests (backend and frontend)
- Create AI response streaming (SSE) for real-time feedback in chat
- Add a graph visualization for Vault item connections
- Support additional document formats (DOCX, XLSX)
- Customize Swagger/OpenAPI documentation
- Implement pagination and advanced filters on list endpoints
