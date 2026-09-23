# 🍳 Chef Granite — Document Q&A RAG Agent for Recipe Generation

An intelligent recipe assistant powered by **IBM Granite (via watsonx.ai)** + **LangChain RAG** + **ChromaDB**.

## 🌟 Features

- **📚 Ingest Recipe Documents** — Upload PDFs, DOCX, TXT, HTML files or paste recipe text
- **💬 Conversational Q&A** — Ask natural language questions about any ingested recipe
- **🌱 Dietary Adaptation** — Automatically adapt recipes for vegan, gluten-free, dairy-free, sugar-free diets
- **👩‍🍳 Step-by-Step Instructions** — Structured cooking steps extracted and displayed beautifully
- **🔄 Ingredient Substitutions** — Smart swap suggestions based on constraints
- **🛒 Shopping List Generation** — Auto-generate a shopping list from any recipe
- **🥗 Nutrition Info** — Extract and display nutritional facts
- **⚡ Demo Mode** — Fully functional UI even without watsonx.ai credentials

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | IBM Granite 13B Chat v2 via watsonx.ai |
| RAG Framework | LangChain + ChromaDB |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 (local) |
| Backend | FastAPI + Python |
| Frontend | React + Vite |

## 🚀 Quick Start

### 1. Backend Setup

```powershell
cd recipe-rag-agent
.\start-backend.ps1
```

Or manually:

```powershell
cd recipe-rag-agent/backend
python -m venv .venv
.venv/Scripts/Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # then edit .env with your credentials
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```powershell
cd recipe-rag-agent
.\start-frontend.ps1
```

Or manually:

```powershell
cd recipe-rag-agent/frontend
npm install
npm run dev
```

### 3. Open the App

Visit **http://localhost:5173** in your browser.

## ⚙️ Configuration

Edit `backend/.env`:

```env
WATSONX_API_KEY=your_ibm_watsonx_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-13b-chat-v2
```

Get credentials at: https://cloud.ibm.com/apidocs/watsonx-ai

## 📁 Project Structure

```
recipe-rag-agent/
├── backend/
│   ├── main.py           # FastAPI app + REST endpoints
│   ├── agent.py          # IBM Granite LLM + response parser
│   ├── rag_pipeline.py   # Document ingestion + ChromaDB retrieval
│   ├── config.py         # Settings via pydantic-settings
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx           # Main app shell
│       ├── api.js            # API client
│       ├── index.css         # Full pastel theme
│       └── components/
│           ├── ChatArea.jsx  # Message bubbles + welcome screen
│           ├── RecipeCard.jsx # Structured recipe output (tabs)
│           ├── Sidebar.jsx   # Document library + quick prompts
│           └── UploadModal.jsx # File/text upload dialog
├── sample_recipes/       # Pre-loaded sample recipes
│   ├── chocolate_cake.txt
│   ├── pasta_primavera.txt
│   ├── chicken_tikka_masala.txt
│   └── avocado_toast.txt
├── start-backend.ps1
└── start-frontend.ps1
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a question, get a structured recipe answer |
| `POST` | `/ingest/file` | Upload a recipe document |
| `POST` | `/ingest/text` | Ingest pasted recipe text |
| `GET`  | `/sources` | List all ingested document sources |
| `DELETE` | `/sources/{name}` | Remove a source from the knowledge base |
| `GET`  | `/health` | Health check + mode status |

## 💡 Example Questions

- *"How do I make a sugar-free version of chocolate cake?"*
- *"Give me a vegan chicken tikka masala recipe"*
- *"What can I substitute for eggs in baking?"*
- *"Create a shopping list for pasta primavera"*
- *"Quick dinner ideas with avocado under 20 minutes"*
- *"What's the calorie count for chocolate cake?"*
